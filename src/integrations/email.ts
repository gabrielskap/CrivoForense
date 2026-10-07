// TODO: backend - Integração com serviço de envio de e-mails transacionais (Resend, SendGrid, Amazon SES ou Google Workspace SMTP)

export interface EmailPayload {
  destinatarioEmail: string;
  destinatarioNome: string;
  assunto: string;
  corpoTexto: string;
  anexos?: { nome: string; url: string }[];
}

export interface EmailSendResult {
  sucesso: boolean;
  id: string;
  enviadoEm: string;
}

export const emailAdapter = {
  async enviarEmail(payload: EmailPayload): Promise<EmailSendResult> {
    // TODO: backend - chamada POST /api/integrations/email/send
    await new Promise((res) => setTimeout(res, 600));

    return {
      sucesso: true,
      id: `em_${Date.now()}`,
      enviadoEm: new Date().toISOString(),
    };
  },

  modelos: [
    {
      id: 'envio_parecer',
      assunto: 'Crivo Forense - Parecer Técnico Conclusivo - Proc. {processo}',
      corpo: 'Prezado(a) Dr(a). {advogado},\n\nEm anexo, encaminhamos o Parecer Técnico Médico-Pericial elaborado pela Dra. Karine Reis (CRM/SP 235.821 | CRM/TO 6.385) referente aos autos nº {processo}.\n\nPermanecemos à disposição para eventuais esclarecimentos complementares.\n\nAtenciosamente,\nEquipe Crivo Forense',
    },
    {
      id: 'aceite_nomeacao',
      assunto: 'Manifestação de Aceite de Nomeação Pericial - Autos {processo} - Dra. Karine Reis',
      corpo: 'Excelentíssimo(a) Senhor(a) Doutor(a) Juiz(a) de Direito,\n\nVem a médica perita Dra. Karine Reis comunicar o aceite honroso da nomeação para atuar como Perita do Juízo nos autos em epígrafe, apresentando proposta e cronograma para realização dos exames.',
    }
  ]
};
