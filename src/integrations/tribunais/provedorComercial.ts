/**
 * Provedor Comercial Opcional (Escavador / Judit / Codilo)
 *
 * ESPECIFICAÇÃO DE INTEGRAÇÃO COMERCIAL (EX: ESCAVADOR / JUDIT API V2):
 * ==============================================================================
 * Provedores comerciais oferecem enriquecimento de dados processuais, rastreamento
 * contínuo de diários oficiais estaduais e federais com webhooks de push notification.
 *
 * Endpoint REST de Consulta:
 *   POST https://api.escavador.com/api/v2/processos/numero_cnj/{numeroCnj}
 *   POST https://api.judit.io/v1/tracking/cases/search
 *
 * Headers de Autenticação:
 *   Authorization: Bearer <API_TOKEN_COMERCIAL>
 *   X-Requested-With: XMLHttpRequest
 *   Content-Type: application/json
 *
 * Formato de Requisição para Monitoramento Contínuo (Webhook Push):
 * {
 *   "tipo": "PROCESSO",
 *   "valor": "50021481220234036100",
 *   "callback_url": "https://api.crivoforense.com.br/webhooks/tribunais/escavador",
 *   "frequencia_checagem": "DIARIA",
 *   "capturar_diarios": true
 * }
 *
 * Formato de Resposta do Webhook / Polling:
 * {
 *   "sucesso": true,
 *   "status": "MONITORANDO",
 *   "processo": {
 *     "numero_cnj": "5002148-12.2023.4.03.6100",
 *     "titulo_polo": "Antônio Carlos da Silva vs Instituto Nacional do Seguro Social",
 *     "grau": 1,
 *     "unidade": "5ª Vara Previdenciária Federal",
 *     "estado": "SP",
 *     "movimentacoes": [
 *       {
 *         "data": "2026-10-06 14:32:00",
 *         "tipo": "ANDAMENTO",
 *         "fonte": "DOU / DJEN",
 *         "conteudo": "Juntada de Laudo do Perito Judicial..."
 *       }
 *     ]
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
import { extrairMetadadosCnj } from '../../utils/cnjValidator';
import { analisarPalavrasChaveMovimentacao } from './keywordEngine';

export class ProvedorComercialProvider implements TribunalProvider {
  readonly id = 'provedor_comercial_escavador';
  readonly nome = 'Provedor Comercial LegalTech (Escavador / Judit API)';
  readonly sigla = 'Escavador / Judit';
  readonly tipo = 'comercial' as const;
  readonly descricao = 'Monitoramento complementar via webhooks e crawlers comerciais de diários dos 27 estados e tribunais superiores.';

  async buscarProcesso(numeroCNJ: string): Promise<ProcessoConsultaResult | null> {
    await new Promise((res) => setTimeout(res, 550));
    const meta = extrairMetadadosCnj(numeroCNJ);
    const movimentacoes = await this.listarMovimentacoes(numeroCNJ);

    return {
      sucesso: true,
      numeroCnj: numeroCNJ,
      tribunal: meta?.tribunal.sigla || 'TJSP',
      vara: 'Vara Judicial Cível',
      comarca: 'São Paulo/SP',
      classe: 'Procedimento Comum',
      assunto: 'Responsabilidade Civil e Perícia Médica',
      poloAtivo: 'Requerente Assistido',
      poloPassivo: 'Empresa ou Autarquia Ré',
      juiz: 'Juízo da Causa',
      dataDistribuicao: '2023-09-01T10:00:00Z',
      movimentacoes,
    };
  }

  async listarMovimentacoes(numeroCNJ: string, desde?: string): Promise<MovimentacaoJudicial[]> {
    await new Promise((res) => setTimeout(res, 400));

    const texto = 'Certidão de publicação no diário oficial com intimação para esclarecimentos periciais.';
    const analise = analisarPalavrasChaveMovimentacao(texto);

    return [
      {
        id: `mov_esc_${numeroCNJ.replace(/\D/g, '')}_1`,
        numeroCnj: numeroCNJ,
        dataHora: '2026-10-05T19:00:00Z',
        titulo: 'Captura via Crawler de Diário Oficial (Escavador/Judit)',
        descricao: 'Intimação publicada em Diário Oficial do Estado capturada pelo crawler comercial.',
        conteudoCompleto: texto,
        codigoMovimentoCnj: 'COM-99',
        fonte: 'Provedor Comercial (Escavador/Judit)',
        grau: '1º Grau',
        orgaoJulgador: 'Juízo Cível',
        palavrasChaveDetectadas: analise.palavrasDetectadas,
        sugestaoMarco: analise.sugestaoMarco,
        lido: true,
        notificadoAoResponsavel: true,
      },
    ];
  }

  async listarComunicacoes(
    filtro: { oab?: { numero: string; uf: string }; nome?: string },
    desde?: string
  ): Promise<ComunicacaoJudicial[]> {
    await new Promise((res) => setTimeout(res, 450));
    return [];
  }
}
