/**
 * Mecanismo de Análise e Detecção de Palavras-Chave Jurídico-Periciais
 *
 * REGRA DE OURO DE GOVERNANÇA:
 * "Sugerir o marco pericial correspondente e criar tarefa de prazo para confirmação humana.
 *  NUNCA alterar prazo ou marco processual sem estrita confirmação humana."
 */

import { MarcoCpcTipo, SugestaoMarcoPericial } from '../../types';
import { PalavraChaveRegra } from './types';

export const REGRAS_PALAVRAS_CHAVE: PalavraChaveRegra[] = [
  {
    termo: 'laudo',
    sinonimos: ['laudo oficial', 'laudo pericial', 'juntada de laudo', 'entrega do laudo', 'apresentado o laudo', 'laudo médico'],
    marcoSugerido: 'laudo_juntado',
    nomeMarco: 'Laudo Pericial Oficial Juntado aos Autos',
    artigoCpc: 'Art. 477 §1º do CPC',
    prazoDiasUteisPadrao: 15,
    descricaoOrientativa:
      'Detectada juntada de laudo do perito judicial. Sugerido marco "Laudo Juntado" e abertura de prazo comum de 15 dias úteis para manifestação e protocolo do Parecer Técnico do Assistente (Art. 477 §1º do CPC).',
  },
  {
    termo: 'nomeio',
    sinonimos: ['nomeação', 'nomeio perito', 'designo perito', 'nomeado o perito', 'nomeia-se perito', 'decisão saneadora perito'],
    marcoSugerido: 'nomeacao_perito',
    nomeMarco: 'Nomeação do Perito Oficial do Juízo',
    artigoCpc: 'Art. 465 do CPC',
    prazoDiasUteisPadrao: 15,
    descricaoOrientativa:
      'Detectado despacho de nomeação do perito judicial. Sugerido marco "Nomeação do Perito" e abertura de prazo de 15 dias úteis para formulação de quesitos e indicação de assistente técnico (Art. 465 §1º do CPC).',
  },
  {
    termo: 'quesitos',
    sinonimos: ['apresentação de quesitos', 'quesitos das partes', 'quesitos suplementares', 'quesitos prévios', 'quesitos complementares'],
    marcoSugerido: 'quesitos_assistente',
    nomeMarco: 'Protocolo de Quesitos e Indicação de Assistente Técnico',
    artigoCpc: 'Art. 465 §1º do CPC',
    prazoDiasUteisPadrao: 15,
    descricaoOrientativa:
      'Detectada intimação ou peticionamento de quesitos. Sugerido registrar o marco "Quesitos e Indicação de Assistente Técnico" (Art. 465 §1º do CPC).',
  },
  {
    termo: 'esclarecimentos',
    sinonimos: ['quesitos de esclarecimento', 'esclarecer o laudo', 'intimação do perito para prestar esclarecimentos', 'esclarecimentos periciais'],
    marcoSugerido: 'esclarecimentos',
    nomeMarco: 'Esclarecimentos do Perito do Juízo (Art. 477 §2º)',
    artigoCpc: 'Art. 477 §2º do CPC',
    prazoDiasUteisPadrao: 15,
    descricaoOrientativa:
      'Detectada determinação ou petição de esclarecimentos periciais. Sugerido registrar o marco de "Esclarecimentos e Quesitos Complementares" (Art. 477 §2º do CPC).',
  },
  {
    termo: 'honorários periciais',
    sinonimos: ['honorários do perito', 'proposta de honorários', 'arbitramento de honorários periciais', 'depósito dos honorários', 'honorários periciais homologados'],
    marcoSugerido: 'nomeacao_perito',
    nomeMarco: 'Manifestação sobre Proposta de Honorários Periciais',
    artigoCpc: 'Art. 465 §3º do CPC',
    prazoDiasUteisPadrao: 5,
    descricaoOrientativa:
      'Detectada movimentação referente a honorários do perito judicial. Conforme Art. 465 §3º do CPC, as partes têm 5 dias úteis para manifestação sobre a estimativa.',
  },
  {
    termo: 'alvará',
    sinonimos: ['expedição de alvará', 'alvará de levantamento', 'alvará judicial expedido', 'liberação de honorários', 'ordem de pagamento judicial'],
    marcoSugerido: 'encerrado',
    nomeMarco: 'Expedição / Levantamento de Alvará Judicial de Honorários',
    artigoCpc: 'Art. 906 do CPC',
    prazoDiasUteisPadrao: 5,
    descricaoOrientativa:
      'Detectada expedição de alvará judicial nos autos. Sugerido acompanhamento para confirmação do levantamento bancário da verba honorária pericial.',
  },
  {
    termo: 'perito',
    sinonimos: ['perita', 'perícia médica agendada', 'exame pericial designado', 'data da perícia designada', 'comparecimento à perícia'],
    marcoSugerido: 'pericia_agendada',
    nomeMarco: 'Designação de Data para Realização da Perícia Médica',
    artigoCpc: 'Art. 474 do CPC',
    prazoDiasUteisPadrao: 5,
    descricaoOrientativa:
      'Detectada referência a designação ou intimação para a perícia. Conforme Art. 474 do CPC, as partes e assistentes devem ser intimados da data e local com antecedência mínima.',
  },
];

export interface AnalisePalavrasChaveResultado {
  palavrasDetectadas: string[];
  sugestaoMarco?: SugestaoMarcoPericial;
}

/**
 * Analisa o texto de uma movimentação judicial ou publicação de diário
 * e identifica ocorrências de palavras-chave periciais do CPC.
 */
export function analisarPalavrasChaveMovimentacao(texto: string): AnalisePalavrasChaveResultado {
  if (!texto) {
    return { palavrasDetectadas: [] };
  }

  const textoNormalizado = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const palavrasDetectadasSet = new Set<string>();
  let melhorRegra: PalavraChaveRegra | null = null;

  // Ordem de prioridade estrita: Laudo > Esclarecimentos > Nomeio > Honorários Periciais > Alvará > Quesitos > Perito
  for (const regra of REGRAS_PALAVRAS_CHAVE) {
    const termoNormalizado = regra.termo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const achouTermoPrincipal = textoNormalizado.includes(termoNormalizado);

    let achouSinonimo = false;
    for (const sin of regra.sinonimos) {
      const sinNorm = sin.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (textoNormalizado.includes(sinNorm)) {
        achouSinonimo = true;
        break;
      }
    }

    if (achouTermoPrincipal || achouSinonimo) {
      palavrasDetectadasSet.add(regra.termo);
      if (!melhorRegra) {
        melhorRegra = regra;
      }
    }
  }

  const palavrasDetectadas = Array.from(palavrasDetectadasSet);

  if (!melhorRegra) {
    return { palavrasDetectadas };
  }

  const sugestaoMarco: SugestaoMarcoPericial = {
    tipoMarco: melhorRegra.marcoSugerido,
    nomeMarco: melhorRegra.nomeMarco,
    artigoCpc: melhorRegra.artigoCpc,
    prazoDiasUteis: melhorRegra.prazoDiasUteisPadrao,
    motivo: melhorRegra.descricaoOrientativa,
    palavraChaveGatilho: melhorRegra.termo,
    confirmadoPeloUsuario: false, // NUNCA alterar prazo sem confirmação humana!
    descartado: false,
  };

  return {
    palavrasDetectadas,
    sugestaoMarco,
  };
}
