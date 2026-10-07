/**
 * Provedor Oficial DataJud (Conselho Nacional de Justiça - CNJ)
 *
 * ESPECIFICAÇÃO DA API DATAJUD:
 * ==============================================================================
 * A API Pública do DataJud utiliza Elasticsearch mantido pelo CNJ.
 * Endpoint Padrão:
 *   POST https://api-publica.datajud.cnj.jus.br/api_publica_{tribunal}/_search
 *
 * Headers de Autenticação:
 *   Authorization: APIKey <CHAVE_PUBLICA_CNJ>
 *   Content-Type: application/json
 *
 * Formato de Requisição (Query DSL Elasticsearch):
 * {
 *   "query": {
 *     "bool": {
 *       "must": [
 *         { "match": { "numeroProcesso": "50021481220234036100" } }
 *       ],
 *       "filter": [
 *         { "range": { "movimentos.dataHora": { "gte": "2024-01-01T00:00:00.000Z" } } }
 *       ]
 *     }
 *   },
 *   "sort": [{ "dataHoraUltimaAtualizacao": { "order": "desc" } }],
 *   "size": 1
 * }
 *
 * Formato de Resposta (Elasticsearch Hits):
 * {
 *   "took": 42,
 *   "hits": {
 *     "total": { "value": 1, "relation": "eq" },
 *     "hits": [{
 *       "_index": "api_publica_trf3",
 *       "_source": {
 *         "numeroProcesso": "50021481220234036100",
 *         "tribunal": "TRF3",
 *         "grau": "G1",
 *         "classe": { "codigo": 120, "nome": "Procedimento Comum Cível" },
 *         "assunto": [{ "codigo": 6084, "nome": "Aposentadoria por Incapacidade Permanente" }],
 *         "orgaoJulgador": { "codigo": 105, "nome": "5ª Vara Previdenciária Federal de São Paulo" },
 *         "dataAjuizamento": "2023-08-14T11:20:00.000Z",
 *         "movimentos": [
 *           {
 *             "codigo": 85,
 *             "nome": "Juntada de Laudo",
 *             "dataHora": "2026-10-06T14:30:00.000Z",
 *             "complementosTabelados": [{ "codigo": 1, "descricao": "Laudo Pericial Médico de Capacidade Laborativa" }]
 *           }
 *         ]
 *       }
 *     }]
 *   }
 * }
 * ==============================================================================
 */

import {
  TribunalProvider,
  ProcessoConsultaResult,
  MovimentacaoJudicial,
  ComunicacaoJudicial,
} from './types';
import { extrairMetadadosCnj, validarCnj } from '../../utils/cnjValidator';
import { analisarPalavrasChaveMovimentacao } from './keywordEngine';

export class DataJudProvider implements TribunalProvider {
  readonly id = 'datajud_cnj';
  readonly nome = 'DataJud - Base Nacional de Dados do Poder Judiciário (CNJ)';
  readonly sigla = 'DataJud / CNJ';
  readonly tipo = 'publico_cnj' as const;
  readonly descricao = 'Integração pública direta com a base nacional de processos e movimentações unificadas do CNJ (Resolução 331/2020).';

  async buscarProcesso(numeroCNJ: string): Promise<ProcessoConsultaResult | null> {
    // Simula delay de requisição de rede ao Elasticsearch do CNJ
    await new Promise((res) => setTimeout(res, 650));

    const meta = extrairMetadadosCnj(numeroCNJ);
    const validacao = validarCnj(numeroCNJ);

    const limpo = numeroCNJ.replace(/\D/g, '');
    const tribunalIdentificado = meta?.tribunal.sigla || 'TJSP';
    const orgaoJulgador = meta?.tribunal.nome || 'Tribunal de Justiça';

    const movimentacoes = await this.listarMovimentacoes(numeroCNJ);

    return {
      sucesso: true,
      numeroCnj: numeroCNJ,
      tribunal: `${tribunalIdentificado} - ${meta?.tribunal.ramo || 'Justiça Estadual'}`,
      vara: `1ª Vara Cível / Previdenciária de ${meta?.tribunal.ufSede || 'SP'}`,
      comarca: meta?.tribunal.ufSede ? `Comarca Sede - ${meta.tribunal.ufSede}` : 'São Paulo/SP',
      classe: 'Procedimento Comum Cível (Art. 318 CPC)',
      assunto: 'Perícia Médica / Indenização por Danos Morais e Materiais / Benefício Previdenciário',
      poloAtivo: 'Requerente / Periciando Titular',
      poloPassivo: 'Requerido / Instituto ou Empresa Ré',
      juiz: 'Dr(a). Juiz(a) Titular da Vara',
      dataDistribuicao: `${meta?.ano || '2023'}-03-15T09:00:00Z`,
      movimentacoes,
      peritoNomeado: 'Dra. Karine Reis (CRM/SP 235.821 / CRM/TO 6.385)',
      dataPericiaAgendada: '2026-10-24T14:30:00Z',
      valorCausa: 150000,
    };
  }

  async listarMovimentacoes(numeroCNJ: string, desde?: string): Promise<MovimentacaoJudicial[]> {
    // Simula consulta de movimentos no DataJud
    await new Promise((res) => setTimeout(res, 450));

    const meta = extrairMetadadosCnj(numeroCNJ);
    const tribunalSigla = meta?.tribunal.sigla || 'TJSP';

    // Gerador de movimentações realistas com palavras-chave estratégicas para teste do fluxo
    const mockMovimentosRaw = [
      {
        codigo: '85',
        titulo: 'Juntada de Laudo Pericial Oficial',
        descricao:
          'Juntada aos autos do Laudo Pericial Médico elaborado pelo perito judicial, com respostas aos quesitos e conclusão de nexo causal.',
        conteudoCompleto:
          'Certifico e dou fé que nesta data juntei aos presentes autos o LAUDO PERICIAL médico oficial apresentado pelo perito nomeado, Dr. Roberto Galvão. Conforme art. 477 §1º do CPC, intimem-se as partes para manifestação no prazo comum de 15 (quinze) dias, facultada a juntada de parecer pelo assistente técnico.',
        dataHora: '2026-10-06T14:28:10Z',
      },
      {
        codigo: '26',
        titulo: 'Publicação de Intimação - Quesitos e Assistente Técnico',
        descricao:
          'Intimação das partes para apresentação de quesitos e indicação de assistente técnico nos termos do art. 465 §1º do CPC.',
        conteudoCompleto:
          'Ficam as partes intimadas para que, no prazo preclusivo de 15 dias, formulem seus QUESITOS e indiquem seus respectivos assistentes técnicos para acompanhar a perícia médica.',
        dataHora: '2026-09-18T10:15:00Z',
      },
      {
        codigo: '123',
        titulo: 'Decisão Interlocutória - Nomeio Perito Judicial',
        descricao:
          'Vistos. Para esclarecimento dos fatos controvertidos de ordem médica, nomeio como perito judicial o médico especialista designado.',
        conteudoCompleto:
          'Defiro a produção de prova pericial médica. NOMEIO perito do juízo a Dra. Karine Reis (CRM 235.821), fixando honorários provisórios. Intimem-se as partes para cumprimento do art. 465 §1º do CPC.',
        dataHora: '2026-08-10T16:45:22Z',
      },
      {
        codigo: '906',
        titulo: 'Expedição de Alvará Judicial de Honorários',
        descricao:
          'Expedido alvará eletrônico para levantamento dos honorários periciais periciais depositados em conta judicial vinculada.',
        conteudoCompleto:
          'Certifico que expediu-se o ALVARÁ judicial em favor do perito para levantamento da quantia depositada a título de honorários periciais homologados.',
        dataHora: '2026-07-22T11:00:00Z',
      },
      {
        codigo: '51',
        titulo: 'Distribuição da Ação Judicial',
        descricao: 'Distribuído livremente à Vara competente.',
        conteudoCompleto: 'Processo distribuído e autuado no sistema informatizado do tribunal.',
        dataHora: '2024-03-01T08:30:00Z',
      },
    ];

    // Converte e passa pelo motor de detecção de palavras-chave periciais
    const formatados: MovimentacaoJudicial[] = mockMovimentosRaw.map((raw, index) => {
      const analise = analisarPalavrasChaveMovimentacao(
        `${raw.titulo} ${raw.descricao} ${raw.conteudoCompleto}`
      );

      return {
        id: `mov_dj_${numeroCNJ.replace(/\D/g, '')}_${index + 1}`,
        numeroCnj: numeroCNJ,
        dataHora: raw.dataHora,
        titulo: raw.titulo,
        descricao: raw.descricao,
        conteudoCompleto: raw.conteudoCompleto,
        codigoMovimentoCnj: raw.codigo,
        fonte: 'DataJud (CNJ)',
        grau: '1º Grau',
        orgaoJulgador: `${meta?.tribunal.sigla || 'TJ'} - Foro Central`,
        palavrasChaveDetectadas: analise.palavrasDetectadas,
        sugestaoMarco: analise.sugestaoMarco,
        lido: index > 0, // Primeiro movimento não lido para teste
        notificadoAoResponsavel: index > 0,
      };
    });

    if (desde) {
      const dataFiltro = new Date(desde).getTime();
      return formatados.filter((m) => new Date(m.dataHora).getTime() >= dataFiltro);
    }

    return formatados;
  }

  async listarComunicacoes(
    filtro: { oab?: { numero: string; uf: string }; nome?: string },
    desde?: string
  ): Promise<ComunicacaoJudicial[]> {
    // DataJud concentra movimentações unificadas; comunicações detalhadas vêm de Comunica PJe / DJEN
    return [];
  }
}
