/**
 * Gerenciador e Orquestrador de Monitoramento Judicial Multi-Provedores
 *
 * Responsável por:
 * 1. Coordenar provedores (DataJud CNJ, Comunica PJe/DJEN, Provedor Comercial).
 * 2. Rotina de verificação: detectar novas movimentações, persistir, criar Interação na timeline
 *    e notificar o responsável interno.
 * 3. Analisar palavras-chave periciais e gerar sugestões com confirmação humana obrigatória.
 * 4. Monitorar OABs cadastradas e nome da Dra. Karine para capturar nomeações.
 */

import {
  TribunalProvider,
  ProcessoConsultaResult,
  MovimentacaoJudicial,
  ComunicacaoJudicial,
  VarreduraResultado,
  OabMonitorada,
  NomeMonitorado,
} from './types';
import { DataJudProvider } from './datajudProvider';
import { ComunicaPjeProvider } from './comunicaPjeProvider';
import { ProvedorComercialProvider } from './provedorComercial';
import {
  processoRepository,
  movimentacaoJudicialRepository,
  comunicacaoJudicialRepository,
  oabMonitoradaRepository,
  nomeMonitoradoRepository,
  interacaoRepository,
  notificacaoRepository,
  tarefaRepository,
  auditLogRepository,
} from '../../services';
import { toIsoDate, calcularPrazoDiasUteis } from '../../utils/calculadoraPrazos';
import { MarcoCpc } from '../../types';

export class TribunaisManager {
  private providers: TribunalProvider[] = [];

  constructor() {
    this.providers = [
      new DataJudProvider(),
      new ComunicaPjeProvider(),
      new ProvedorComercialProvider(),
    ];
  }

  getProviders(): TribunalProvider[] {
    return this.providers;
  }

  getProvider(id: string): TribunalProvider | undefined {
    return this.providers.find((p) => p.id === id);
  }

  /**
   * Busca dados consolidados de um processo pelo número CNJ
   */
  async buscarProcesso(numeroCNJ: string): Promise<ProcessoConsultaResult | null> {
    const datajud = this.providers.find((p) => p.id === 'datajud_cnj');
    if (datajud) {
      try {
        const res = await datajud.buscarProcesso(numeroCNJ);
        if (res && res.sucesso) return res;
      } catch (err) {
        console.warn('DataJud falhou, tentando provedores secundários:', err);
      }
    }

    for (const provider of this.providers) {
      if (provider.id !== 'datajud_cnj') {
        const res = await provider.buscarProcesso(numeroCNJ);
        if (res) return res;
      }
    }

    return null;
  }

  /**
   * Lista movimentações unificadas de todos os provedores habilitados
   */
  async listarMovimentacoes(numeroCNJ: string, desde?: string): Promise<MovimentacaoJudicial[]> {
    const map = new Map<string, MovimentacaoJudicial>();

    for (const provider of this.providers) {
      try {
        const movs = await provider.listarMovimentacoes(numeroCNJ, desde);
        for (const m of movs) {
          // Deduplica por data e título
          const chave = `${m.dataHora.slice(0, 10)}_${m.titulo.toLowerCase().trim()}`;
          if (!map.has(chave)) {
            map.set(chave, m);
          }
        }
      } catch (err) {
        console.error(`Erro ao listar movimentações em ${provider.nome}:`, err);
      }
    }

    const resultado = Array.from(map.values());
    resultado.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    return resultado;
  }

  /**
   * Lista comunicações/publicações no DJEN e PJe
   */
  async listarComunicacoes(
    filtro: { oab?: { numero: string; uf: string }; nome?: string; tribunal?: string },
    desde?: string
  ): Promise<ComunicacaoJudicial[]> {
    const todas: ComunicacaoJudicial[] = [];

    for (const provider of this.providers) {
      try {
        const coms = await provider.listarComunicacoes(filtro, desde);
        todas.push(...coms);
      } catch (err) {
        console.error(`Erro ao listar comunicações em ${provider.nome}:`, err);
      }
    }

    todas.sort(
      (a, b) =>
        new Date(b.dataDisponibilizacao).getTime() - new Date(a.dataDisponibilizacao).getTime()
    );
    return todas;
  }

  /**
   * ROTINA DE VERIFICAÇÃO DE UM PROCESSO ESPECÍFICO (Ficha do Processo -> "Atualizar agora")
   * 1. Consulta provedores para buscar movimentações atualizadas.
   * 2. Compara com as movimentações já salvas localmente.
   * 3. Salva novas movimentações no repositório.
   * 4. Para cada nova movimentação:
   *    - Cria Interação na linha do tempo do processo.
   *    - Notifica o responsável interno.
   *    - Se detectar palavras-chave ("nomeio", "perito", "laudo", etc.):
   *      Cria sugestão de marco e TAREFA de confirmação humana.
   *      NUNCA altera o prazo sem confirmação humana!
   */
  async verificarMovimentacoesProcesso(processoId: string): Promise<{
    novasMovimentacoes: MovimentacaoJudicial[];
    totalExistentes: number;
    sugestoesGeradas: number;
  }> {
    const processo = await processoRepository.getById(processoId);
    if (!processo) {
      throw new Error(`Processo ID ${processoId} não encontrado.`);
    }

    // 1. Busca movimentações externas dos provedores
    const movsExternas = await this.listarMovimentacoes(processo.numeroCnj);

    // 2. Busca movimentações já gravadas no banco
    const movsLocais = await movimentacaoJudicialRepository.getByNumeroCnj(processo.numeroCnj);
    const titulosDatasLocais = new Set(
      movsLocais.map((m) => `${m.dataHora.slice(0, 10)}_${m.titulo.toLowerCase().trim()}`)
    );

    const novasMovimentacoes: MovimentacaoJudicial[] = [];
    let sugestoesGeradas = 0;

    for (const mov of movsExternas) {
      const chave = `${mov.dataHora.slice(0, 10)}_${mov.titulo.toLowerCase().trim()}`;
      if (!titulosDatasLocais.has(chave)) {
        // Nova movimentação identificada!
        mov.processoId = processo.id;
        mov.lido = false;
        mov.notificadoAoResponsavel = false;

        // Se tem sugestão de marco, vincula tarefa de confirmação humana
        if (mov.sugestaoMarco && !mov.sugestaoMarco.descartado && !mov.sugestaoMarco.confirmadoPeloUsuario) {
          sugestoesGeradas++;

          // Cria tarefa para confirmação humana do responsável
          const tarefaCriada = await tarefaRepository.create({
            titulo: `[Confirmação Pendente] Marco CPC: ${mov.sugestaoMarco.nomeMarco}`,
            descricao: `O monitoramento DataJud/PJe identificou termo pericial ("${mov.sugestaoMarco.palavraChaveGatilho}") no processo nº ${processo.numeroCnj}.\n\nSugestão: ${mov.sugestaoMarco.motivo}\nPrazo sugerido: ${mov.sugestaoMarco.prazoDiasUteis} dias úteis (${mov.sugestaoMarco.artigoCpc}).\n\nIMPORTANTE: Apenas confirme se o despacho judicial já estiver publicado e os prazos tiverem iniciado.`,
            prioridade: 'Alta',
            status: 'A Fazer',
            dataLimite: toIsoDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
            responsavelId: processo.responsavelId || 'user_karine',
            processoId: processo.id,
          });

          mov.sugestaoMarco.tarefaGeradaId = tarefaCriada.id;
        }

        // Salva movimentação no repositório
        const movSalva = await movimentacaoJudicialRepository.create(mov);
        novasMovimentacoes.push(movSalva);

        // Cria Interação na Linha do Tempo do Processo
        await interacaoRepository.create({
          tipo: 'Andamento Processual',
          dataHora: mov.dataHora,
          usuarioId: 'sistema_tribunais',
          usuarioNome: `Robô DataJud / ${mov.fonte}`,
          processoId: processo.id,
          titulo: `Andamento Judicial: ${mov.titulo}`,
          descricao: `[${mov.fonte}] ${mov.descricao}\n${mov.conteudoCompleto || ''}`,
          statusEnvio: 'Entregue',
        });

        // Notifica o responsável
        await notificacaoRepository.create({
          titulo: `Novo Andamento no Processo ${processo.numeroCnj}`,
          mensagem: `${mov.titulo}: ${mov.descricao.slice(0, 120)}...`,
          tipo: mov.sugestaoMarco ? 'prazo' : 'sistema',
          link: `/processos?id=${processo.id}`,
          lida: false,
          dataHora: new Date().toISOString(),
        });
      }
    }

    // Atualiza data da última verificação no processo
    await processoRepository.update(processo.id, {
      ultimaVerificacaoTribunal: new Date().toISOString(),
      movimentacoesNaoLidas: (processo.movimentacoesNaoLidas || 0) + novasMovimentacoes.length,
    });

    // Registra auditoria
    await auditLogRepository.logAccess({
      acao: 'Sincronização de Andamentos Judiciais',
      entidade: 'Processo',
      entidadeId: processo.id,
      detalhes: `Verificação manual de andamentos do processo nº ${processo.numeroCnj}. Encontradas ${novasMovimentacoes.length} novas movimentações.`,
      isDadoSensivelSaude: false,
    });

    return {
      novasMovimentacoes,
      totalExistentes: movsLocais.length + novasMovimentacoes.length,
      sugestoesGeradas,
    };
  }

  /**
   * CONFIRMAÇÃO HUMANA DA SUGESTÃO DE MARCO PERICIAL
   * Regra: "Nunca alterar prazo sem confirmação."
   */
  async responderSugestaoMarco(
    processoId: string,
    movimentacaoId: string,
    aceitar: boolean,
    dataIntimacaoCustomizada?: string
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    const processo = await processoRepository.getById(processoId);
    const mov = await movimentacaoJudicialRepository.getById(movimentacaoId);

    if (!processo || !mov || !mov.sugestaoMarco) {
      throw new Error('Processo ou sugestão de movimentação não encontrada.');
    }

    const agora = new Date().toISOString();

    if (!aceitar) {
      // Usuário rejeitou a sugestão
      mov.sugestaoMarco.descartado = true;
      mov.sugestaoMarco.dataDecisaoUsuario = agora;
      await movimentacaoJudicialRepository.update(mov.id, { sugestaoMarco: mov.sugestaoMarco });

      if (mov.sugestaoMarco.tarefaGeradaId) {
        await tarefaRepository.update(mov.sugestaoMarco.tarefaGeradaId, {
          status: 'Concluída',
          descricao: `Sugestão de marco pericial rejeitada manualmente pelo usuário em ${toIsoDate(new Date())}.`,
        });
      }

      await auditLogRepository.logAccess({
        acao: 'Rejeição de Sugestão de Marco Pericial',
        entidade: 'Processo',
        entidadeId: processo.id,
        detalhes: `Usuário descartou sugestão de marco "${mov.sugestaoMarco.nomeMarco}" para a movimentação ${mov.id}.`,
        isDadoSensivelSaude: false,
      });

      return {
        sucesso: true,
        mensagem: 'Sugestão descartada com sucesso. Nenhum prazo foi alterado.',
      };
    }

    // Usuário confirmou e aceitou a sugestão!
    const dataBase = dataIntimacaoCustomizada || mov.dataHora.slice(0, 10);
    const resultadoCalculo = calcularPrazoDiasUteis(
      dataBase,
      mov.sugestaoMarco.prazoDiasUteis,
      processo.comarca
    );

    const novoMarco: MarcoCpc = {
      id: `marco_${Date.now()}`,
      tipo: mov.sugestaoMarco.tipoMarco,
      nome: mov.sugestaoMarco.nomeMarco,
      artigoCpc: mov.sugestaoMarco.artigoCpc,
      prazoDiasUteis: mov.sugestaoMarco.prazoDiasUteis,
      dataInicio: resultadoCalculo.dataPrimeiroDiaUtil,
      dataLimite: resultadoCalculo.dataVencimento,
      status: 'Em Andamento',
      observacoes: `Marco confirmado pelo usuário a partir de movimentação judicial de ${mov.dataHora.slice(0, 10)}.`,
    };

    const marcosAtualizados = [...(processo.marcosCpc || [])];
    const indexExistente = marcosAtualizados.findIndex((m) => m.tipo === novoMarco.tipo);
    if (indexExistente >= 0) {
      marcosAtualizados[indexExistente] = { ...marcosAtualizados[indexExistente], ...novoMarco };
    } else {
      marcosAtualizados.push(novoMarco);
    }

    // Atualiza o processo com o novo marco e prazo
    await processoRepository.update(processo.id, {
      marcosCpc: marcosAtualizados,
      proximaDataImportante: `${resultadoCalculo.dataVencimento}T23:59:00Z`,
    });

    // Atualiza a movimentação
    mov.sugestaoMarco.confirmadoPeloUsuario = true;
    mov.sugestaoMarco.dataDecisaoUsuario = agora;
    await movimentacaoJudicialRepository.update(mov.id, { sugestaoMarco: mov.sugestaoMarco });

    // Cria/atualiza a tarefa definitiva de cumprimento do prazo
    await tarefaRepository.create({
      titulo: `Cumprir Prazo Pericial: ${novoMarco.nome} [${novoMarco.artigoCpc}]`,
      descricao: `Prazo fatal calculado pelo CPC (${novoMarco.prazoDiasUteis} dias úteis).\nProcesso: ${processo.numeroCnj} (${processo.vara} - ${processo.comarca}).\nVencimento: ${resultadoCalculo.dataVencimento}.`,
      dataLimite: resultadoCalculo.dataVencimento,
      prioridade: 'Urgente / Prazo Fatal',
      status: 'A Fazer',
      responsavelId: processo.responsavelId || 'user_karine',
      processoId: processo.id,
    });

    await auditLogRepository.logAccess({
      acao: 'Confirmação e Aplicação de Marco Pericial',
      entidade: 'Processo',
      entidadeId: processo.id,
      detalhes: `Usuário confirmou o marco "${novoMarco.nome}". Prazo fatal de ${novoMarco.prazoDiasUteis} dias úteis calculado para ${resultadoCalculo.dataVencimento}.`,
      isDadoSensivelSaude: false,
    });

    return {
      sucesso: true,
      mensagem: `Marco "${novoMarco.nome}" aplicado com sucesso! Prazo fatal registrado para ${resultadoCalculo.dataVencimento}.`,
    };
  }

  /**
   * EXECUTA UMA VARREDURA GERAL
   * - Percorre todos os processos cadastrados para novas movimentações
   * - Percorre todas as OABs monitoradas no Comunica PJe / DJEN
   * - Percorre o nome da Dra. Karine para identificar novas nomeações
   */
  async executarVarreduraGeral(): Promise<VarreduraResultado> {
    const inicio = new Date().toISOString();
    const erros: string[] = [];
    const todasNovasMovs: MovimentacaoJudicial[] = [];
    const todasNovasComs: ComunicacaoJudicial[] = [];
    let totalSugestoes = 0;

    const [processos, oabs, nomes] = await Promise.all([
      processoRepository.getAll(),
      oabMonitoradaRepository.getAll(),
      nomeMonitoradoRepository.getAll(),
    ]);

    // 1. Varredura de Processos no DataJud
    for (const proc of processos) {
      try {
        const res = await this.verificarMovimentacoesProcesso(proc.id);
        todasNovasMovs.push(...res.novasMovimentacoes);
        totalSugestoes += res.sugestoesGeradas;
      } catch (err: any) {
        erros.push(`Falha no processo ${proc.numeroCnj}: ${err.message}`);
      }
    }

    // 2. Varredura de OABs Parceiras
    for (const oab of oabs.filter((o) => o.ativo && o.autorizacaoObtida)) {
      try {
        const coms = await this.listarComunicacoes({
          oab: { numero: oab.numero, uf: oab.uf },
        });

        for (const c of coms) {
          const jaExiste = await comunicacaoJudicialRepository.getById(c.id);
          if (!jaExiste) {
            const salva = await comunicacaoJudicialRepository.create(c);
            todasNovasComs.push(salva);
          }
        }

        await oabMonitoradaRepository.update(oab.id, {
          ultimaVerificacao: new Date().toISOString(),
          totalCapturas: oab.totalCapturas + coms.length,
        });
      } catch (err: any) {
        erros.push(`Falha na OAB ${oab.numero}/${oab.uf}: ${err.message}`);
      }
    }

    // 3. Varredura do Nome da Dra. Karine para Captura de Nomeações
    for (const n of nomes.filter((item) => item.ativo)) {
      try {
        const comsNome = await this.listarComunicacoes({ nome: n.nome });
        let novasNomeacoesDetectadas = 0;

        for (const c of comsNome) {
          const jaExiste = await comunicacaoJudicialRepository.getById(c.id);
          if (!jaExiste) {
            const salva = await comunicacaoJudicialRepository.create(c);
            todasNovasComs.push(salva);
            if (c.sugestaoNomeacao) {
              novasNomeacoesDetectadas++;
            }
          }
        }

        await nomeMonitoradoRepository.update(n.id, {
          ultimaVerificacao: new Date().toISOString(),
          totalNomeacoesDetectadas: n.totalNomeacoesDetectadas + novasNomeacoesDetectadas,
        });
      } catch (err: any) {
        erros.push(`Falha no nome monitorado ${n.nome}: ${err.message}`);
      }
    }

    const fim = new Date().toISOString();

    return {
      dataHoraInicio: inicio,
      dataHoraFim: fim,
      totalProcessosVerificados: processos.length,
      totalOabsVerificadas: oabs.filter((o) => o.ativo).length,
      novasMovimentacoes: todasNovasMovs,
      novasComunicacoes: todasNovasComs,
      sugestoesMarcosGeradas: totalSugestoes,
      erros,
    };
  }
}

export const tribunaisManager = new TribunaisManager();
