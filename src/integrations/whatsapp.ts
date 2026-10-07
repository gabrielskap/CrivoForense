// TODO: backend - Integração com API oficial do WhatsApp Business / Provedores BSP (Z-API, Evolution API, Cloud API)

export interface WhatsAppMessagePayload {
  telefone: string;
  mensagem: string;
  anexoUrl?: string;
  advogadoNome?: string;
  processoNumero?: string;
}

export interface WhatsAppSendResult {
  sucesso: boolean;
  messageId: string;
  timestamp: string;
  status: 'enviado' | 'entregue' | 'lido';
  mensagemExibida: string;
}

export const whatsappAdapter = {
  async enviarMensagem(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    // TODO: backend - chamada POST /api/integrations/whatsapp/send
    await new Promise((res) => setTimeout(res, 500));
    
    return {
      sucesso: true,
      messageId: `wa_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'entregue',
      mensagemExibida: payload.mensagem,
    };
  },

  gerarLinkDireto(telefone: string, texto: string): string {
    const cleanPhone = telefone.replace(/\D/g, '');
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(texto)}`;
  },

  modelosPreDefinidos: [
    {
      id: 'solicitar_prontuario',
      titulo: 'Solicitação de Prontuários Médicos',
      texto: 'Olá, Dr(a). {advogado}! Aqui é a equipe da Dra. Karine Reis (Crivo Forense). Para elaboração dos quesitos técnicos do processo nº {processo}, precisamos cópia integral dos prontuários hospitalares e exames de imagem do periciando. Poderia nos encaminhar?',
    },
    {
      id: 'lembrete_pericia',
      titulo: 'Confirmação de Perícia Médica Presencial',
      texto: 'Prezado(a) Dr(a). {advogado}, lembramos que a perícia médica judicial do processo nº {processo} está confirmada para {data_hora} no endereço {local}. A Dra. Karine comparecerá como Assistente Técnica. O periciando deve portar documento original com foto e exames físicos.',
    },
    {
      id: 'envio_quesitos',
      titulo: 'Envio de Quesitos Médicos Prontos',
      texto: 'Dr(a). {advogado}, os quesitos médicos estratégicos para o processo nº {processo} foram concluídos pela Dra. Karine Reis e já estão disponíveis no sistema para protocolo. Qualquer ajuste estamos à disposição!',
    },
    {
      id: 'proposta_honorarios',
      titulo: 'Envio de Proposta de Assistência Técnica',
      texto: 'Prezado(a) Colega, encaminhamos a proposta da Crivo Forense para assistência médica pericial no processo nº {processo}. Inclui análise documental, formulação de quesitos e parecer técnico conclusivo.',
    }
  ],
};
