/**
 * Módulo de Integrações com Tribunais, Diários Oficiais e Sistemas Processuais
 *
 * Provedores:
 * - DataJud (CNJ) - Base unificada nacional do Judiciário
 * - Comunica PJe / DJEN - Diário de Justiça Eletrônico Nacional
 * - Provedor Comercial LegalTech (Escavador / Judit)
 */

export * from './types';
export * from './keywordEngine';
export * from './datajudProvider';
export * from './comunicaPjeProvider';
export * from './provedorComercial';
export * from './tribunaisManager';

import { tribunaisManager } from './tribunaisManager';
import { ProcessoConsultaResult } from './types';

export type ConsultaProcessoJudicialResult = ProcessoConsultaResult;

/**
 * Adaptador de compatibilidade para chamadas legadas
 */
export const tribunaisAdapter = {
  async consultarProcesso(numeroCnj: string): Promise<ConsultaProcessoJudicialResult> {
    const res = await tribunaisManager.buscarProcesso(numeroCnj);
    if (res) return res;

    return {
      sucesso: false,
      numeroCnj,
      tribunal: 'Tribunal Não Localizado',
      vara: 'Vara Não Localizada',
      comarca: 'Comarca',
      classe: 'Desconhecida',
      assunto: 'Não Identificado',
      poloAtivo: 'N/A',
      poloPassivo: 'N/A',
      juiz: 'N/A',
      dataDistribuicao: new Date().toISOString(),
      movimentacoes: [],
    };
  },

  async monitorarPublicacoesOab(
    oabNumero: string,
    oabUf: string
  ): Promise<{ publicacoesEncontradas: number }> {
    const coms = await tribunaisManager.listarComunicacoes({
      oab: { numero: oabNumero, uf: oabUf },
    });
    return { publicacoesEncontradas: coms.length };
  },
};
