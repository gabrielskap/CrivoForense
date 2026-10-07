// TODO: backend - Integração com Gateway de Cobranças (Asaas, Mercado Pago, Iugu ou Sicoob)

export interface GerarCobrancaPayload {
  valor: number;
  descricao: string;
  clienteNome: string;
  clienteCpfCnpj: string;
  dataVencimento: string;
}

export interface GerarCobrancaResult {
  sucesso: boolean;
  cobrancaId: string;
  pixCopiaECola: string;
  pixQrCodeUrl: string;
  linkBoletoPdf: string;
  linhaDigitavel: string;
}

export const pagamentosAdapter = {
  async gerarCobrancaPixEBoleto(payload: GerarCobrancaPayload): Promise<GerarCobrancaResult> {
    // TODO: backend - chamada POST /api/integrations/pagamentos/gerar
    await new Promise((res) => setTimeout(res, 500));

    const mockHash = Math.random().toString(36).substring(2, 12).toUpperCase();
    return {
      sucesso: true,
      cobrancaId: `cob_${Date.now()}`,
      pixCopiaECola: `00020126580014br.gov.bcb.pix0136crivoforense-pix-${mockHash}520400005303986540${payload.valor.toFixed(2)}5802BR5916CRIVO FORENSE6009SAO PAULO62070503***6304${mockHash}`,
      pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=crivoforense-pix-${mockHash}`,
      linkBoletoPdf: `https://crivoforense.com.br/financeiro/boletos/bol_${mockHash}.pdf`,
      linhaDigitavel: `34191.79001 01043.510047 91020.150008 4 98250000${Math.floor(payload.valor)}00`,
    };
  },

  async consultarStatusPagamento(cobrancaId: string): Promise<{ status: 'pendente' | 'pago' | 'expirado' }> {
    // TODO: backend - chamada GET /api/integrations/pagamentos/:id/status
    await new Promise((res) => setTimeout(res, 300));
    return { status: 'pendente' };
  }
};
