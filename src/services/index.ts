import {
  Escritorio,
  Advogado,
  Periciando,
  Lead,
  Processo,
  Pericia,
  Nomeacao,
  Cobranca,
  Despesa,
  Tarefa,
  Compromisso,
  Documento,
  Notificacao,
  AuditLog,
  Usuario,
  Papel,
  StatusFunilLead,
  Funil,
  Oportunidade,
  Interacao,
  OrdemDeServico,
  FeriadoLocal,
  MovimentacaoJudicial,
  ComunicacaoJudicial,
  OabMonitorada,
  NomeMonitorado,
  Servico,
  ModeloContrato,
  Proposta,
  Contrato,
} from '../types';
import {
  ILeadRepository,
  IEscritorioRepository,
  IAdvogadoRepository,
  IPericiandoRepository,
  IProcessoRepository,
  IPericiaRepository,
  INomeacaoRepository,
  ICobrancaRepository,
  IDespesaRepository,
  ITarefaRepository,
  ICompromissoRepository,
  IDocumentoRepository,
  INotificacaoRepository,
  IAuditLogRepository,
  IPapelRepository,
  IUsuarioRepository,
  IInteracaoRepository,
  IOportunidadeRepository,
  IFunilRepository,
  IOrdemDeServicoRepository,
  IFeriadoLocalRepository,
  IMovimentacaoJudicialRepository,
  IComunicacaoJudicialRepository,
  IOabMonitoradaRepository,
  INomeMonitoradoRepository,
  IServicoRepository,
  IModeloContratoRepository,
  IPropostaRepository,
  IContratoRepository,
  IRepository,
} from './types';
import { LocalStorageRepository } from './localStorage/localStorageRepository';
import {
  initialUsuarios,
  initialPapeis,
  initialEscritorios,
  initialAdvogados,
  initialPericiandos,
  initialLeads,
  initialProcessos,
  initialPericias,
  initialNomeacoes,
  initialCobrancas,
  initialDespesas,
  initialTarefas,
  initialCompromissos,
  initialDocumentos,
  initialNotificacoes,
  initialAuditLogs,
  initialFunis,
  initialOportunidades,
  initialInteracoes,
  initialOrdensDeServico,
  initialFeriadosLocais,
  initialMovimentacoesJudiciais,
  initialComunicacoesJudiciais,
  initialOabsMonitoradas,
  initialNomesMonitorados,
  initialServicos,
  initialModelosContrato,
  initialPropostas,
  initialContratos,
} from './localStorage/seedData';
import { authService } from './authService';

// Repositório de Auditoria com log de acessos sensíveis
class AuditLogLocalStorageRepository extends LocalStorageRepository<AuditLog> implements IAuditLogRepository {
  async logAccess(entry: Omit<AuditLog, 'id' | 'dataHora' | 'usuarioId' | 'usuarioNome' | 'usuarioPapel'> & {
    usuarioId?: string;
    usuarioNome?: string;
    usuarioPapel?: string;
  }): Promise<AuditLog> {
    const user = authService.getCurrentUser();
    return this.create({
      ...entry,
      usuarioId: entry.usuarioId || user.id,
      usuarioNome: entry.usuarioNome || user.nome,
      usuarioPapel: entry.usuarioPapel || user.papelNome,
      dataHora: new Date().toISOString(),
    });
  }
}

export const auditLogRepository: IAuditLogRepository = new AuditLogLocalStorageRepository('audit_logs', initialAuditLogs);
export const papelRepository: IPapelRepository = new LocalStorageRepository<Papel>('papeis', initialPapeis);
export const usuarioRepository: IUsuarioRepository = new LocalStorageRepository<Usuario>('usuarios', initialUsuarios);

// Repositórios específicos com bloqueio na camada de serviço (não apenas na tela)
class LeadLocalStorageRepository extends LocalStorageRepository<Lead> implements ILeadRepository {
  async getAll(): Promise<Lead[]> {
    authService.assertPermission('leads', 'ver');
    const items = await super.getAll();
    if (authService.isOwnRecordsOnly()) {
      const user = authService.getCurrentUser();
      return items.filter((l) => l.responsavelId === user.id);
    }
    return items;
  }

  async getByStatus(status: StatusFunilLead): Promise<Lead[]> {
    authService.assertPermission('leads', 'ver');
    const items = await this.getAll();
    return items.filter((l) => l.statusFunil === status);
  }

  async create(item: Omit<Lead, 'id'> & { id?: string }): Promise<Lead> {
    authService.assertPermission('leads', 'criar');
    const res = await super.create(item);
    auditLogRepository.logAccess({
      acao: 'Criação de Lead',
      entidade: 'Lead',
      entidadeId: res.id,
      detalhes: `Lead "${res.nome}" criado no funil (${res.statusFunil}).`,
      isDadoSensivelSaude: false,
    });
    return res;
  }

  async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    authService.assertPermission('leads', 'editar');
    const res = await super.update(id, updates);
    auditLogRepository.logAccess({
      acao: 'Atualização de Lead',
      entidade: 'Lead',
      entidadeId: id,
      detalhes: `Lead "${res.nome}" atualizado.`,
      isDadoSensivelSaude: false,
    });
    return res;
  }

  async delete(id: string): Promise<boolean> {
    authService.assertPermission('leads', 'excluir');
    return super.delete(id);
  }
}

class AdvogadoLocalStorageRepository extends LocalStorageRepository<Advogado> implements IAdvogadoRepository {
  async getAll(): Promise<Advogado[]> {
    authService.assertPermission('contatos', 'ver');
    return super.getAll();
  }

  async getByEscritorio(escritorioId: string): Promise<Advogado[]> {
    authService.assertPermission('contatos', 'ver');
    return this.find((a) => a.escritorioId === escritorioId);
  }
}

class PericiandoLocalStorageRepository extends LocalStorageRepository<Periciando> implements IPericiandoRepository {
  async getAll(): Promise<Periciando[]> {
    authService.assertPermission('contatos', 'ver');
    const items = await super.getAll();
    const canAccessHealth = authService.canAccessSensitiveHealthData();

    if (!canAccessHealth) {
      // Bloqueio / Anonimização de dados de saúde na camada de serviço (LGPD Art. 11)
      return items.map((p) => ({
        ...p,
        dadosSaude: {
          patologias: ['[ACESSO RESTRITO - LGPD Art. 11: Requer perfil médico ou perita titular]'],
          historicoClinico: '[ACESSO RESTRITO - LGPD Art. 11: Histórico clínico e ocupacional bloqueado]',
          medicamentosEmUso: '[RESTRITO]',
          restricoesFisicas: '[RESTRITO]',
          cid10Principais: ['***'],
          consentimentoLgpdColetado: p.dadosSaude.consentimentoLgpdColetado,
          observacoesRestritas: undefined,
        },
      }));
    }

    return items;
  }

  async getById(id: string): Promise<Periciando | null> {
    authService.assertPermission('contatos', 'ver');
    const p = await super.getById(id);
    if (!p) return null;

    const canAccessHealth = authService.canAccessSensitiveHealthData();

    if (canAccessHealth) {
      // Registra no Log de Auditoria o acesso legítimo a dados sensíveis de saúde
      auditLogRepository.logAccess({
        acao: 'Acesso a Dados Sensíveis de Saúde (LGPD Art. 11)',
        entidade: 'Periciando',
        entidadeId: p.id,
        detalhes: `Prontuário e diagnósticos médicos de ${p.nome} (CPF: ${p.cpf}) acessados.`,
        isDadoSensivelSaude: true,
      });
      return p;
    }

    // Se não tiver permissão de saúde, devolve objeto anonimizado
    return {
      ...p,
      dadosSaude: {
        patologias: ['[ACESSO RESTRITO - LGPD Art. 11]'],
        historicoClinico: '[ACESSO RESTRITO - LGPD Art. 11: Histórico clínico restrito à médica perita]',
        medicamentosEmUso: '[RESTRITO]',
        restricoesFisicas: '[RESTRITO]',
        cid10Principais: ['***'],
        consentimentoLgpdColetado: p.dadosSaude.consentimentoLgpdColetado,
      },
    };
  }

  async buscarPorCpf(cpf: string): Promise<Periciando | null> {
    const clean = cpf.replace(/\D/g, '');
    const items = await this.getAll();
    return items.find((p) => p.cpf.replace(/\D/g, '') === clean) || null;
  }
}

class ProcessoLocalStorageRepository extends LocalStorageRepository<Processo> implements IProcessoRepository {
  async getAll(): Promise<Processo[]> {
    authService.assertPermission('processos', 'ver');
    const items = await super.getAll();
    if (authService.isOwnRecordsOnly()) {
      const user = authService.getCurrentUser();
      // Assistente Técnico / Médico colaborador vê apenas os processos onde atua
      return items.filter((p) => p.peritoJuizoNome?.includes(user.nome) || p.modalidadeAtuacao === 'Assistente Técnica');
    }
    return items;
  }

  async buscarPorNumeroCnj(numeroCnj: string): Promise<Processo | null> {
    authService.assertPermission('processos', 'ver');
    const clean = numeroCnj.replace(/\D/g, '');
    const items = await this.getAll();
    return items.find((p) => p.numeroCnj.replace(/\D/g, '') === clean) || null;
  }

  async create(item: Omit<Processo, 'id'> & { id?: string }): Promise<Processo> {
    authService.assertPermission('processos', 'criar');
    const res = await super.create(item);
    auditLogRepository.logAccess({
      acao: 'Criação de Processo Judicial',
      entidade: 'Processo',
      entidadeId: res.id,
      detalhes: `Processo nº ${res.numeroCnj} (${res.tribunal}) cadastrado.`,
      isDadoSensivelSaude: false,
    });
    return res;
  }

  async update(id: string, updates: Partial<Processo>): Promise<Processo> {
    authService.assertPermission('processos', 'editar');
    return super.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    authService.assertPermission('processos', 'excluir');
    return super.delete(id);
  }
}

class PericiaLocalStorageRepository extends LocalStorageRepository<Pericia> implements IPericiaRepository {
  async getAll(): Promise<Pericia[]> {
    authService.assertPermission('processos', 'ver');
    return super.getAll();
  }

  async getProximasPericias(dias: number = 30): Promise<Pericia[]> {
    authService.assertPermission('processos', 'ver');
    const now = new Date();
    const limit = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);
    const items = await this.getAll();
    return items.filter((p) => {
      const dt = new Date(p.dataHora);
      return dt >= now && dt <= limit;
    });
  }
}

class CobrancaLocalStorageRepository extends LocalStorageRepository<Cobranca> implements ICobrancaRepository {
  async getAll(): Promise<Cobranca[]> {
    authService.assertPermission('financeiro', 'ver');
    return super.getAll();
  }

  async create(item: Omit<Cobranca, 'id'> & { id?: string }): Promise<Cobranca> {
    authService.assertPermission('financeiro', 'criar');
    const res = await super.create(item);
    auditLogRepository.logAccess({
      acao: 'Emissão de Cobrança',
      entidade: 'Cobranca',
      entidadeId: res.id,
      detalhes: `Cobrança de R$ ${res.valor.toFixed(2)} gerada para ${res.devedorNome}.`,
      isDadoSensivelSaude: false,
    });
    return res;
  }

  async update(id: string, updates: Partial<Cobranca>): Promise<Cobranca> {
    authService.assertPermission('financeiro', 'editar');
    return super.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    authService.assertPermission('financeiro', 'excluir');
    return super.delete(id);
  }
}

class InteracaoLocalStorageRepository extends LocalStorageRepository<Interacao> implements IInteracaoRepository {
  async getByContato(tipo: 'escritorio' | 'advogado' | 'periciando' | 'lead', id: string): Promise<Interacao[]> {
    const all = await this.getAll();
    return all.filter((i) => {
      if (tipo === 'escritorio') return i.escritorioId === id;
      if (tipo === 'advogado') return i.advogadoId === id;
      if (tipo === 'periciando') return i.periciandoId === id;
      if (tipo === 'lead') return i.leadId === id;
      return false;
    }).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }

  async create(item: Omit<Interacao, 'id'> & { id?: string }): Promise<Interacao> {
    const res = await super.create(item);
    auditLogRepository.logAccess({
      acao: `Registro de Interação (${res.tipo})`,
      entidade: 'Interacao',
      entidadeId: res.id,
      detalhes: `${res.tipo}: ${res.titulo || res.descricao.slice(0, 60)}`,
      isDadoSensivelSaude: false,
    });
    return res;
  }
}

class OrdemDeServicoLocalStorageRepository extends LocalStorageRepository<OrdemDeServico> implements IOrdemDeServicoRepository {
  async getByProcesso(processoId: string): Promise<OrdemDeServico[]> {
    return this.find((o) => o.processoId === processoId);
  }
}

class FeriadoLocalLocalStorageRepository extends LocalStorageRepository<FeriadoLocal> implements IFeriadoLocalRepository {
  async getByComarca(comarca: string): Promise<FeriadoLocal[]> {
    const c = comarca.toLowerCase().trim();
    return this.find((f) => f.comarca.toLowerCase().includes(c) || c.includes(f.comarca.toLowerCase()));
  }
}

class MovimentacaoJudicialLocalStorageRepository extends LocalStorageRepository<MovimentacaoJudicial> implements IMovimentacaoJudicialRepository {
  async getByProcesso(processoId: string): Promise<MovimentacaoJudicial[]> {
    const list = await this.find((m) => m.processoId === processoId);
    return list.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }

  async getByNumeroCnj(numeroCnj: string): Promise<MovimentacaoJudicial[]> {
    const cnjLimpo = numeroCnj.replace(/\D/g, '');
    const list = await this.find((m) => m.numeroCnj.replace(/\D/g, '') === cnjLimpo);
    return list.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }
}

class ComunicacaoJudicialLocalStorageRepository extends LocalStorageRepository<ComunicacaoJudicial> implements IComunicacaoJudicialRepository {
  async getByProcesso(processoId: string): Promise<ComunicacaoJudicial[]> {
    const list = await this.find((c) => c.processoId === processoId);
    return list.sort((a, b) => new Date(b.dataDisponibilizacao).getTime() - new Date(a.dataDisponibilizacao).getTime());
  }

  async getByOab(numero: string, uf: string): Promise<ComunicacaoJudicial[]> {
    const numLimpo = numero.replace(/\D/g, '');
    const ufNorm = uf.toUpperCase().trim();
    const list = await this.find(
      (c) =>
        Boolean(c.oabNumero && c.oabNumero.replace(/\D/g, '') === numLimpo) &&
        Boolean(c.oabUf && c.oabUf.toUpperCase().trim() === ufNorm)
    );
    return list.sort((a, b) => new Date(b.dataDisponibilizacao).getTime() - new Date(a.dataDisponibilizacao).getTime());
  }
}

// Repositório de Documentos com controle LGPD de Saúde e Log de Auditoria
class DocumentoLocalStorageRepository extends LocalStorageRepository<Documento> implements IDocumentoRepository {
  async getAll(): Promise<Documento[]> {
    const all = await super.getAll();
    const canAccessHealth = authService.canAccessSensitiveHealthData();
    if (!canAccessHealth) {
      // Documentos marcados como dado sensível de saúde só aparecem para quem tem permissão
      return all.filter((d) => !d.sensivelSaude);
    }
    return all;
  }

  async getById(id: string): Promise<Documento | null> {
    const doc = await super.getById(id);
    if (!doc) return null;
    const canAccessHealth = authService.canAccessSensitiveHealthData();

    if (doc.sensivelSaude) {
      if (!canAccessHealth) {
        return null; // Acesso negado pela LGPD Art. 11
      }
      // Registra no Log de Auditoria o acesso ao documento sensível
      auditLogRepository.logAccess({
        acao: 'Acesso a Documento com Dado Sensível de Saúde (LGPD Art. 11)',
        entidade: 'Documento',
        entidadeId: doc.id,
        detalhes: `Acesso e visualização do documento "${doc.nomeArquivo}" (${doc.tipo}) referente ao processo ${doc.processoNumero || doc.processoId || 'Geral'}.`,
        isDadoSensivelSaude: true,
      });
    }

    return doc;
  }
}

// Repositório de Propostas com fluxo de aceite gerando Contrato e Oportunidade Ganha
class PropostaLocalStorageRepository extends LocalStorageRepository<Proposta> implements IPropostaRepository {
  async getByStatus(status: Proposta['status']): Promise<Proposta[]> {
    return this.find((p) => p.status === status);
  }

  async aprovarProposta(propostaId: string): Promise<{ proposta: Proposta; contrato: Contrato }> {
    const prop = await this.getById(propostaId);
    if (!prop) throw new Error('Proposta não encontrada');

    // 1. Atualiza oportunidade vinculada para Ganha
    if (prop.oportunidadeId) {
      try {
        const oport = await oportunidadeRepository.getById(prop.oportunidadeId);
        if (oport) {
          await oportunidadeRepository.update(prop.oportunidadeId, {
            status: 'Ganha',
            fase: 'Fechado / Ganho',
            dataFechamento: new Date().toISOString().split('T')[0],
          });
        }
      } catch (err) {
        console.error('Erro ao atualizar oportunidade vinculada:', err);
      }
    }

    // 2. Localiza modelo de contrato padrão
    const modelos = await modeloContratoRepository.getAll();
    const modelo = modelos.find((m) => m.padrao) || modelos[0];

    const dataHojeFormatada = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
    const servicosFormatados = prop.itens
      .map(
        (it) =>
          `• ${it.descricao}: R$ ${it.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Prazo: ${it.prazoDiasUteis || 5} dias úteis)`
      )
      .join('\n');

    let corpoContrato = modelo ? modelo.corpo : '';
    corpoContrato = corpoContrato
      .replace(/{{escritorio\.razao_social}}/g, prop.escritorioNome || 'Contratante')
      .replace(/{{advogado\.nome}}/g, prop.advogadoNome || 'Patrono da Causa')
      .replace(/{{advogado\.oab}}/g, prop.advogadoOab || 'OAB Não Informada')
      .replace(/{{processo\.numero}}/g, prop.processoNumero || 'Não Vinculado')
      .replace(/{{servicos}}/g, servicosFormatados)
      .replace(/{{valor_total}}/g, `R$ ${prop.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .replace(/{{parcelas}}/g, String(prop.parcelas || 1))
      .replace(/{{data}}/g, dataHojeFormatada);

    // 3. Gera Contrato automaticamente
    const novoContrato = await contratoRepository.create({
      numeroContrato: `CTR-${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`,
      propostaId: prop.id,
      oportunidadeId: prop.oportunidadeId,
      processoId: prop.processoId,
      processoNumero: prop.processoNumero,
      escritorioId: prop.escritorioId,
      escritorioNome: prop.escritorioNome,
      advogadoId: prop.advogadoId,
      advogadoNome: prop.advogadoNome,
      advogadoOab: prop.advogadoOab,
      periciandoId: prop.periciandoId,
      periciandoNome: prop.periciandoNome,
      objeto: `Prestação de serviços médico-periciais forenses: ${prop.itens.map((i) => i.descricao).join('; ')}`,
      modeloId: modelo?.id,
      corpoConteudo: corpoContrato,
      servicos: prop.itens.map((i) => ({
        servicoId: i.servicoId,
        nome: i.descricao,
        valor: i.subtotal,
        prazoDiasUteis: i.prazoDiasUteis || 5,
      })),
      valorTotal: prop.valorTotal,
      parcelas: prop.parcelas || 1,
      formaPagamento: prop.condicoesPagamento || 'Pix e Boleto Bancário',
      dataCriacao: new Date().toISOString().split('T')[0],
      status: 'Rascunho',
      statusAssinatura: 'Pendente',
      cobrancasGeradas: false,
      ordensServicoGeradas: false,
    });

    // 4. Atualiza proposta com status Aceita e ID do contrato gerado
    const propostaAtualizada = await this.update(prop.id, {
      status: 'Aceita',
      contratoGeradoId: novoContrato.id,
    });

    auditLogRepository.logAccess({
      acao: 'Aprovação de Proposta e Geração Automática de Contrato',
      entidade: 'Proposta',
      entidadeId: prop.id,
      detalhes: `Proposta ${prop.numeroProposta} aceita. Gerado Contrato ${novoContrato.numeroContrato} no valor de R$ ${prop.valorTotal.toFixed(2)}.`,
      isDadoSensivelSaude: false,
    });

    return { proposta: propostaAtualizada, contrato: novoContrato };
  }
}

// Repositório de Contratos com automação pós-assinatura (Cobranças + Ordens de Serviço)
class ContratoLocalStorageRepository extends LocalStorageRepository<Contrato> implements IContratoRepository {
  async getByStatus(status: Contrato['status']): Promise<Contrato[]> {
    return this.find((c) => c.status === status);
  }

  async assinarContrato(contratoId: string, provedor: 'ZapSign' | 'Clicksign' | 'D4Sign' = 'Clicksign'): Promise<Contrato> {
    const contrato = await this.getById(contratoId);
    if (!contrato) throw new Error('Contrato não encontrado');

    const hoje = new Date();
    const hojeIso = hoje.toISOString().split('T')[0];

    // 1. Gera cobranças no Financeiro se ainda não foram geradas
    if (!contrato.cobrancasGeradas) {
      const parcelas = contrato.parcelas > 0 ? contrato.parcelas : 1;
      const valorParcela = Number((contrato.valorTotal / parcelas).toFixed(2));

      for (let i = 1; i <= parcelas; i++) {
        const dataVenc = new Date(hoje);
        dataVenc.setDate(dataVenc.getDate() + 30 * i);

        await cobrancaRepository.create({
          processoId: contrato.processoId,
          contratoId: contrato.id,
          titulo: `Honorários Contratuais - ${contrato.numeroContrato} (Parcela ${i}/${parcelas})`,
          devedorNome: contrato.escritorioNome || 'Contratante',
          devedorTipo: 'Escritório',
          valor: valorParcela,
          dataEmissao: hojeIso,
          vencimento: dataVenc.toISOString().split('T')[0],
          status: 'Pendente',
          metodo: 'Pix',
        });
      }
    }

    // 2. Gera Ordens de Serviço para cada serviço contratado
    if (!contrato.ordensServicoGeradas && contrato.servicos.length > 0) {
      for (const srv of contrato.servicos) {
        const diasPrazo = srv.prazoDiasUteis || 7;
        const prazoFinal = new Date(hoje);
        prazoFinal.setDate(prazoFinal.getDate() + Math.ceil(diasPrazo * 1.5));

        await ordemDeServicoRepository.create({
          processoId: contrato.processoId || '',
          tipo: 'Parecer Técnico Pericial (Art. 477 §1º)',
          titulo: `Execução contratual de ${srv.nome} conforme Contrato nº ${contrato.numeroContrato}`,
          responsavelId: 'user_karine',
          dataInicio: hojeIso,
          dataPrevisaoEntrega: prazoFinal.toISOString().split('T')[0],
          status: 'Aberta',
          prioridade: 'Urgente',
        });
      }
    }

    // 3. Atualiza status do contrato para Assinado
    const contratoAtualizado = await this.update(contrato.id, {
      status: 'Assinado',
      statusAssinatura: 'Assinado',
      provedorAssinatura: provedor,
      dataAssinatura: hojeIso,
      cobrancasGeradas: true,
      ordensServicoGeradas: true,
    });

    auditLogRepository.logAccess({
      acao: `Assinatura Eletrônica de Contrato (${provedor})`,
      entidade: 'Contrato',
      entidadeId: contrato.id,
      detalhes: `Contrato ${contrato.numeroContrato} assinado via ${provedor}. Cobranças e Ordens de Serviço geradas automaticamente.`,
      isDadoSensivelSaude: false,
    });

    return contratoAtualizado;
  }
}

// Instâncias ativas (Singletons)
export const leadRepository: ILeadRepository = new LeadLocalStorageRepository('leads', initialLeads);
export const escritorioRepository: IEscritorioRepository = new LocalStorageRepository<Escritorio>('escritorios', initialEscritorios);
export const advogadoRepository: IAdvogadoRepository = new AdvogadoLocalStorageRepository('advogados', initialAdvogados);
export const periciandoRepository: IPericiandoRepository = new PericiandoLocalStorageRepository('periciandos', initialPericiandos);
export const processoRepository: IProcessoRepository = new ProcessoLocalStorageRepository('processos', initialProcessos);
export const periciaRepository: IPericiaRepository = new PericiaLocalStorageRepository('pericias', initialPericias);
export const nomeacaoRepository: INomeacaoRepository = new LocalStorageRepository<Nomeacao>('nomeacoes', initialNomeacoes);
export const cobrancaRepository: ICobrancaRepository = new CobrancaLocalStorageRepository('cobrancas', initialCobrancas);
export const despesaRepository: IDespesaRepository = new LocalStorageRepository<Despesa>('despesas', initialDespesas);
export const tarefaRepository: ITarefaRepository = new LocalStorageRepository<Tarefa>('tarefas', initialTarefas);
export const compromissoRepository: ICompromissoRepository = new LocalStorageRepository<Compromisso>('compromissos', initialCompromissos);
export const documentoRepository: IDocumentoRepository = new DocumentoLocalStorageRepository('documentos', initialDocumentos);
export const notificacaoRepository: INotificacaoRepository = new LocalStorageRepository<Notificacao>('notificacoes', initialNotificacoes);
export const funilRepository: IFunilRepository = new LocalStorageRepository<Funil>('funis', initialFunis);
export const oportunidadeRepository: IOportunidadeRepository = new LocalStorageRepository<Oportunidade>('oportunidades', initialOportunidades);
export const interacaoRepository: IInteracaoRepository = new InteracaoLocalStorageRepository('interacoes', initialInteracoes);
export const ordemDeServicoRepository: IOrdemDeServicoRepository = new OrdemDeServicoLocalStorageRepository('ordens_servico', initialOrdensDeServico);
export const feriadoLocalRepository: IFeriadoLocalRepository = new FeriadoLocalLocalStorageRepository('feriados_locais', initialFeriadosLocais);
export const movimentacaoJudicialRepository: IMovimentacaoJudicialRepository = new MovimentacaoJudicialLocalStorageRepository('movimentacoes_judiciais', initialMovimentacoesJudiciais);
export const comunicacaoJudicialRepository: IComunicacaoJudicialRepository = new ComunicacaoJudicialLocalStorageRepository('comunicacoes_judiciais', initialComunicacoesJudiciais);
export const oabMonitoradaRepository: IOabMonitoradaRepository = new LocalStorageRepository<OabMonitorada>('oabs_monitoradas', initialOabsMonitoradas);
export const nomeMonitoradoRepository: INomeMonitoradoRepository = new LocalStorageRepository<NomeMonitorado>('nomes_monitorados', initialNomesMonitorados);
export const servicoRepository: IServicoRepository = new LocalStorageRepository<Servico>('servicos', initialServicos);
export const modeloContratoRepository: IModeloContratoRepository = new LocalStorageRepository<ModeloContrato>('modelos_contrato', initialModelosContrato);
export const propostaRepository: IPropostaRepository = new PropostaLocalStorageRepository('propostas', initialPropostas);
export const contratoRepository: IContratoRepository = new ContratoLocalStorageRepository('contratos', initialContratos);

export { authService } from './authService';

export function resetAllDataToDefault() {
  (papelRepository as LocalStorageRepository<Papel>).resetToDefault();
  (usuarioRepository as LocalStorageRepository<Usuario>).resetToDefault();
  (leadRepository as LeadLocalStorageRepository).resetToDefault();
  (escritorioRepository as LocalStorageRepository<Escritorio>).resetToDefault();
  (advogadoRepository as AdvogadoLocalStorageRepository).resetToDefault();
  (periciandoRepository as PericiandoLocalStorageRepository).resetToDefault();
  (processoRepository as ProcessoLocalStorageRepository).resetToDefault();
  (periciaRepository as PericiaLocalStorageRepository).resetToDefault();
  (nomeacaoRepository as LocalStorageRepository<Nomeacao>).resetToDefault();
  (cobrancaRepository as CobrancaLocalStorageRepository).resetToDefault();
  (despesaRepository as LocalStorageRepository<Despesa>).resetToDefault();
  (tarefaRepository as LocalStorageRepository<Tarefa>).resetToDefault();
  (compromissoRepository as LocalStorageRepository<Compromisso>).resetToDefault();
  (documentoRepository as LocalStorageRepository<Documento>).resetToDefault();
  (notificacaoRepository as LocalStorageRepository<Notificacao>).resetToDefault();
  (funilRepository as LocalStorageRepository<Funil>).resetToDefault();
  (oportunidadeRepository as LocalStorageRepository<Oportunidade>).resetToDefault();
  (interacaoRepository as unknown as LocalStorageRepository<Interacao>).resetToDefault();
  (auditLogRepository as AuditLogLocalStorageRepository).resetToDefault();
  (movimentacaoJudicialRepository as unknown as LocalStorageRepository<MovimentacaoJudicial>).resetToDefault();
  (comunicacaoJudicialRepository as unknown as LocalStorageRepository<ComunicacaoJudicial>).resetToDefault();
  (oabMonitoradaRepository as LocalStorageRepository<OabMonitorada>).resetToDefault();
  (nomeMonitoradoRepository as LocalStorageRepository<NomeMonitorado>).resetToDefault();
  (servicoRepository as LocalStorageRepository<Servico>).resetToDefault();
  (modeloContratoRepository as LocalStorageRepository<ModeloContrato>).resetToDefault();
  (propostaRepository as unknown as LocalStorageRepository<Proposta>).resetToDefault();
  (contratoRepository as unknown as LocalStorageRepository<Contrato>).resetToDefault();
  authService.switchUser('user_karine');
  window.location.reload();
}
