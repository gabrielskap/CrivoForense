// TODO: backend - Integração com Google Maps Distance Matrix API e Geocoding API para perícias in loco

export interface CalculoDeslocamentoPericiaPayload {
  origemEndereco: string; // Ex: Consultório / Base Dra. Karine (São Paulo ou Palmas)
  destinoEndereco: string; // Ex: Vara do Trabalho de Campinas / Empresa Ré
  valorKmRodado: number; // Ex: R$ 2,50/km
}

export interface CalculoDeslocamentoResult {
  sucesso: boolean;
  distanciaKm: number;
  tempoEstimadoMinutos: number;
  custoDeslocamentoSugerido: number;
  rotaFormatada: string;
}

export const googleMapsAdapter = {
  async calcularDeslocamento(payload: CalculoDeslocamentoPericiaPayload): Promise<CalculoDeslocamentoResult> {
    // TODO: backend - chamada POST /api/integrations/maps/distance-matrix
    await new Promise((res) => setTimeout(res, 400));

    // Simulação estimada
    const distanciaKm = 88; // Exemplo SP -> Campinas
    const custo = distanciaKm * 2 * (payload.valorKmRodado || 2.5) + 65.0; // ida e volta + pedagios est.

    return {
      sucesso: true,
      distanciaKm,
      tempoEstimadoMinutos: 75,
      custoDeslocamentoSugerido: custo,
      rotaFormatada: `${payload.origemEndereco} -> ${payload.destinoEndereco} via Rod. dos Bandeirantes`,
    };
  },

  gerarLinkRotaGoogleMaps(origem: string, destino: string): string {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origem)}&destination=${encodeURIComponent(destino)}`;
  }
};
