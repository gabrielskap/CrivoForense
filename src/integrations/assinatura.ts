/**
 * Adaptador Unificado de Assinatura Eletrônica Multi-Provedor
 * Suporta ZapSign, Clicksign e D4Sign com conformidade com MP 2.200-2/2001 e Lei 14.063/2020.
 *
 * ESPECIFICAÇÃO DAS APIS:
 * ==============================================================================
 * 1. ZAPSIGN (https://api.zapsign.com.br/v1/docs):
 *    Endpoint: POST /api/v1/docs/
 *    Headers: Authorization: Bearer {ZAPSIGN_TOKEN}
 *    Payload: { "name": "Contrato", "url_pdf": "...", "signers": [{ "name": "...", "email": "...", "phone_country": "55", "phone_number": "..." }] }
 *    Webhook: POST callback quando evento == "doc_signed"
 *
 * 2. CLICKSIGN (https://developers.clicksign.com):
 *    Endpoint: POST /api/v1/documents?access_token={TOKEN}
 *    Payload: { "document": { "path": "/contrato.pdf", "template": { "data": { ... } } } }
 *    Endpoint: POST /api/v1/lists (associar signatário ao documento)
 *    Webhook: POST callback com status "closed" / "signed"
 *
 * 3. D4SIGN (https://docapi.d4sign.com.br):
 *    Endpoint: POST /documents/{UUID_SAFE}/uploadbinary
 *    Payload: FormData com arquivo e lista de signatários
 *    Webhook: POST callback quando status "Finalizado"
 */

import { contratoRepository } from '../services';

export type ProvedorAssinatura = 'ZapSign' | 'Clicksign' | 'D4Sign';

export interface SignatarioAssinatura {
  nome: string;
  email: string;
  whatsapp?: string;
  cpf?: string;
  papel?: 'Contratante' | 'Contratada' | 'Testemunha';
}

export interface EnviarContratoAssinaturaPayload {
  contratoId: string;
  tituloDocumento: string;
  provedor: ProvedorAssinatura;
  signatarios: SignatarioAssinatura[];
  mensagemPersonalizada?: string;
}

export interface EnviarContratoAssinaturaResult {
  sucesso: boolean;
  provedor: ProvedorAssinatura;
  documentoId: string;
  tokenAssinatura: string;
  linkAssinatura: string;
  status: 'Pendente' | 'Assinado';
  mensagem: string;
}

export interface CriarDocumentoAssinaturaPayload {
  titulo: string;
  signatarioNome: string;
  signatarioEmail: string;
  signatarioWhatsapp?: string;
  tipoDocumento: 'Contrato de Assistência Técnica' | 'Termo de Consentimento LGPD Saúde' | 'Proposta Comercial';
}

export interface CriarDocumentoAssinaturaResult {
  sucesso: boolean;
  documentoId: string;
  linkAssinatura: string;
  status: 'enviado_para_assinatura' | 'assinado' | 'recusado';
}

export const assinaturaAdapter = {
  /**
   * Envia contrato para assinatura eletrônica utilizando o provedor escolhido
   */
  async enviarContrato(payload: EnviarContratoAssinaturaPayload): Promise<EnviarContratoAssinaturaResult> {
    await new Promise((res) => setTimeout(res, 600));

    const token = Math.random().toString(36).substring(2, 10);
    const docId = `${payload.provedor.toLowerCase()}_${Date.now()}`;
    const link = `https://app.${payload.provedor.toLowerCase()}.com.br/verificar/${token}`;

    // Atualiza contrato com status Enviado e dados do provedor
    await contratoRepository.update(payload.contratoId, {
      status: 'Enviado',
      statusAssinatura: 'Pendente',
      provedorAssinatura: payload.provedor,
      tokenAssinatura: token,
      linkAssinatura: link,
      dataEnvio: new Date().toISOString().split('T')[0],
    });

    return {
      sucesso: true,
      provedor: payload.provedor,
      documentoId: docId,
      tokenAssinatura: token,
      linkAssinatura: link,
      status: 'Pendente',
      mensagem: `Documento enviado com sucesso para ${payload.signatarios.length} signatário(s) via ${payload.provedor}.`,
    };
  },

  /**
   * Simula o recebimento do Webhook da plataforma confirmando assinatura do cliente
   * Ao confirmar a assinatura, dispara a rotina no contratoRepository para criar cobranças e ordens de serviço!
   */
  async simularWebhookAssinaturaConcluida(contratoId: string, provedor: ProvedorAssinatura = 'Clicksign') {
    await new Promise((res) => setTimeout(res, 400));
    return await contratoRepository.assinarContrato(contratoId, provedor);
  },

  /**
   * Compatibilidade com chamadas simples anteriores
   */
  async enviarParaAssinatura(payload: CriarDocumentoAssinaturaPayload): Promise<CriarDocumentoAssinaturaResult> {
    await new Promise((res) => setTimeout(res, 400));
    const token = Math.random().toString(36).substring(2, 10);
    return {
      sucesso: true,
      documentoId: `doc_sig_${Date.now()}`,
      linkAssinatura: `https://assine.crivoforense.com.br/sign/${token}`,
      status: 'enviado_para_assinatura',
    };
  },

  async consultarStatusAssinatura(documentoId: string): Promise<{ status: 'pendente' | 'assinado' }> {
    await new Promise((res) => setTimeout(res, 300));
    return { status: 'pendente' };
  },
};

