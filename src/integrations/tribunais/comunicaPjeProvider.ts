/**
 * Provedor Comunica PJe e DJEN (Diário de Justiça Eletrônico Nacional)
 *
 * ESPECIFICAÇÃO DA API COMUNICA PJE / DJEN:
 * ==============================================================================
 * A API Comunica PJe centraliza todas as comunicações processuais, intimações
 * eletrônicas e publicações no DJEN para advogados e peritos.
 *
 * Endpoint de Consulta de Comunicações:
 *   GET https://comunicaapi.pje.jus.br/api/v1/comunicacao
 *
 * Parâmetros de Query Suportados:
 *   - numeroOab: string (ex: "123456")
 *   - ufOab: string (ex: "SP", "TO")
 *   - nomeParte: string (ex: "Karine Reis")
 *   - numeroProcesso: string (ex: "50021481220234036100")
 *   - dataDisponibilizacaoInicio: string (YYYY-MM-DD)
 *   - dataDisponibilizacaoFim: string (YYYY-MM-DD)
 *   - pagina: number
 *   - itensPorPagina: number
 *
 * Formato de Resposta JSON da API:
 * {
 *   "status": "success",
 *   "totalRegistros": 3,
 *   "items": [
 *     {
 *       "id": 9823104,
 *       "numeroProcessoFormatado": "5002148-12.2023.4.03.6100",
 *       "siglaTribunal": "TRF3",
 *       "nomeOrgao": "5ª Vara Previdenciária Federal",
 *       "tipoComunicacao": "Intimação",
 *       "tipoDocumento": "Despacho",
 *       "dataDisponibilizacao": "2026-10-06T00:00:00.000Z",
 *       "dataPublicacao": "2026-10-07T00:00:00.000Z",
 *       "destinatario": "Alessandra Prado (OAB/SP 382.114)",
 *       "texto": "Ficam os procuradores intimados a se manifestar sobre o laudo pericial oficial...",
 *       "meio": "DJEN",
 *       "link": "https://comunica.pje.jus.br/painel/consulta/9823104"
 *     }
 *   ]
 * }
 * ==============================================================================
 */

import {
  TribunalProvider,
  ProcessoConsultaResult,
  MovimentacaoJudicial,
  ComunicacaoJudicial,
} from './types';
import { analisarPalavrasChaveMovimentacao } from './keywordEngine';

export class ComunicaPjeProvider implements TribunalProvider {
  readonly id = 'comunica_pje_djen';
  readonly nome = 'Comunica PJe & DJEN (Diário de Justiça Eletrônico Nacional)';
  readonly sigla = 'Comunica PJe / DJEN';
  readonly tipo = 'publico_djen' as const;
  readonly descricao = 'Monitoramento oficial de publicações no DJEN e intimações eletrônicas pelo PJe por número de OAB ou nome de perito.';

  async buscarProcesso(numeroCNJ: string): Promise<ProcessoConsultaResult | null> {
    await new Promise((res) => setTimeout(res, 500));
    const movimentacoes = await this.listarMovimentacoes(numeroCNJ);

    return {
      sucesso: true,
      numeroCnj: numeroCNJ,
      tribunal: 'PJe Nacional / Tribunal Regional',
      vara: 'Vara da Comarca Competente',
      comarca: 'São Paulo',
      classe: 'Procedimento Comum Cível',
      assunto: 'Perícia Médica',
      poloAtivo: 'Parte Autora',
      poloPassivo: 'Parte Ré',
      juiz: 'Magistrado Titular',
      dataDistribuicao: '2023-05-10T10:00:00Z',
      movimentacoes,
    };
  }

  async listarMovimentacoes(numeroCNJ: string, desde?: string): Promise<MovimentacaoJudicial[]> {
    await new Promise((res) => setTimeout(res, 400));

    const mock: MovimentacaoJudicial[] = [
      {
        id: `mov_pje_${numeroCNJ.replace(/\D/g, '')}_1`,
        numeroCnj: numeroCNJ,
        dataHora: '2026-10-05T18:12:00Z',
        titulo: 'Disponibilização de Intimação no DJEN',
        descricao: 'Publicação disponibilizada no Diário de Justiça Eletrônico Nacional para manifestação das partes.',
        conteudoCompleto:
          'Intimação expedida eletronicamente no sistema PJe para o patrono constituído, com prazo legal de 15 dias para parecer técnico pericial.',
        codigoMovimentoCnj: '60',
        fonte: 'DJEN',
        grau: '1º Grau',
        orgaoJulgador: 'Vara do Juízo',
        palavrasChaveDetectadas: ['laudo', 'parecer'],
        sugestaoMarco: {
          tipoMarco: 'laudo_juntado',
          nomeMarco: 'Laudo Pericial Oficial Juntado aos Autos',
          artigoCpc: 'Art. 477 §1º do CPC',
          prazoDiasUteis: 15,
          motivo: 'Intimação publicada no DJEN facultando prazo de 15 dias para o assistente técnico.',
          palavraChaveGatilho: 'laudo',
          confirmadoPeloUsuario: false,
          descartado: false,
        },
        lido: false,
        notificadoAoResponsavel: false,
      },
    ];

    return mock;
  }

  async listarComunicacoes(
    filtro: { oab?: { numero: string; uf: string }; nome?: string },
    desde?: string
  ): Promise<ComunicacaoJudicial[]> {
    // Simula consulta à API pública do Comunica PJe
    await new Promise((res) => setTimeout(res, 600));

    const comunicacoesMock: ComunicacaoJudicial[] = [];

    // Se o filtro busca por OAB de advogado parceiro
    if (filtro.oab) {
      const oabStr = `${filtro.oab.numero}/${filtro.oab.uf}`;
      const analise1 = analisarPalavrasChaveMovimentacao(
        'Fica o procurador intimado a se manifestar sobre os quesitos apresentados no prazo de 15 dias.'
      );

      comunicacoesMock.push({
        id: `com_oab_${filtro.oab.numero}_1`,
        processoId: 'proc_1',
        numeroCnj: '5002148-12.2023.4.03.6100',
        tipo: 'Publicação no DJEN',
        tribunal: 'TRF-3',
        varaOuOrgao: '5ª Vara Previdenciária Federal de São Paulo',
        dataDisponibilizacao: '2026-10-06T00:00:00Z',
        dataPublicacao: '2026-10-07T00:00:00Z',
        meio: 'DJEN',
        destinatarioNome: `Advogado OAB ${oabStr}`,
        oabNumero: filtro.oab.numero,
        oabUf: filtro.oab.uf,
        teorResumido: 'Intimação para apresentação de Quesitos e Assistente Técnico (art. 465 §1º CPC).',
        teorCompleto:
          'Nos autos da ação em epígrafe, fica a parte autora devidamente intimada, na pessoa de seu patrono cadastrado sob a OAB/SP, para apresentar quesitos pertinentes e indicar assistente técnico médico no prazo improrrogável de 15 (quinze) dias.',
        palavrasChaveDetectadas: ['quesitos', 'assistente técnico'],
        sugestaoMarco: analise1.sugestaoMarco,
        linkVisualizacao: 'https://comunica.pje.jus.br/painel/consulta/9823104',
        lida: false,
      });

      comunicacoesMock.push({
        id: `com_oab_${filtro.oab.numero}_2`,
        processoId: 'proc_2',
        numeroCnj: '1001429-87.2023.5.02.0042',
        tipo: 'Intimação Eletrônica',
        tribunal: 'TRT-2',
        varaOuOrgao: '42ª Vara do Trabalho de São Paulo',
        dataDisponibilizacao: '2026-10-04T12:00:00Z',
        dataPublicacao: '2026-10-05T00:00:00Z',
        meio: 'Comunica PJe',
        destinatarioNome: `Advogado OAB ${oabStr}`,
        oabNumero: filtro.oab.numero,
        oabUf: filtro.oab.uf,
        teorResumido: 'Juntado laudo oficial. Prazo de 15 dias para parecer técnico assistencial.',
        teorCompleto:
          'Intime-se o patrono para ciência do laudo pericial acostado e formulação de impugnação ou juntada de parecer do assistente técnico.',
        palavrasChaveDetectadas: ['laudo', 'parecer'],
        linkVisualizacao: 'https://comunica.pje.jus.br/painel/consulta/9823105',
        lida: true,
      });
    }

    // Se o filtro busca por Nome (Dra. Karine Reis para capturar nomeações como Perita do Juízo!)
    if (filtro.nome) {
      const nomeLower = filtro.nome.toLowerCase();
      if (nomeLower.includes('karine') || nomeLower.includes('reis')) {
        const analiseNomeacao = analisarPalavrasChaveMovimentacao(
          'Decisão saneadora: Nomeio a perita médica Dra. Karine Reis para realização de perícia médica em São Paulo. Fixados honorários provisórios.'
        );

        comunicacoesMock.push({
          id: `com_nom_karine_1`,
          processoId: 'proc_4',
          numeroCnj: '0004122-19.2023.8.27.2729',
          tipo: 'Intimação Eletrônica',
          tribunal: 'TJTO',
          varaOuOrgao: '2ª Vara Cível da Comarca de Palmas',
          dataDisponibilizacao: '2026-10-05T14:20:00Z',
          dataPublicacao: '2026-10-06T00:00:00Z',
          meio: 'Comunica PJe',
          destinatarioNome: 'Dra. Karine Reis (Perita Judicial)',
          teorResumido:
            'NOVA NOMEAÇÃO JUDICIAL: Intimação da Perita Dra. Karine Reis para dizer se aceita o encargo e estimar honorários.',
          teorCompleto:
            'Vistos. NOMEIO como perita do juízo a Dra. Karine Reis (CRM/TO 6.385 / CRM/SP 235.821). Intime-se a ilustre perita pelo sistema eletrônico para que se manifeste no prazo de 5 (cinco) dias informando se aceita o encargo pericial, bem como apresentando sua proposta de honorários periciais ou justificando escusa fundada (Art. 465 §2º do CPC).',
          palavrasChaveDetectadas: ['nomeio', 'perito', 'honorários periciais'],
          sugestaoNomeacao: true,
          sugestaoMarco: analiseNomeacao.sugestaoMarco,
          linkVisualizacao: 'https://eproc1.tjto.jus.br/eprocV2_prod_1grau/controlador.php?acao=comunicacao_karine',
          lida: false,
        });

        comunicacoesMock.push({
          id: `com_nom_karine_2`,
          numeroCnj: '1023841-55.2024.8.26.0100',
          tipo: 'Publicação no DJEN',
          tribunal: 'TJSP',
          varaOuOrgao: '18ª Vara Cível do Foro Central Cível da Capital',
          dataDisponibilizacao: '2026-10-02T10:00:00Z',
          dataPublicacao: '2026-10-03T00:00:00Z',
          meio: 'DJEN',
          destinatarioNome: 'Dra. Karine Reis (Perita do Juízo)',
          teorResumido:
            'Expedido alvará judicial de levantamento dos honorários periciais em favor da perita Dra. Karine Reis.',
          teorCompleto:
            'Fica a perita judicial Dra. Karine Reis cientificada da expedição do ALVARÁ judicial nº 2026/00142 para levantamento dos honorários depositados.',
          palavrasChaveDetectadas: ['alvará', 'honorários periciais'],
          sugestaoNomeacao: false,
          linkVisualizacao: 'https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo=102384155',
          lida: true,
        });
      }
    }

    return comunicacoesMock;
  }
}
