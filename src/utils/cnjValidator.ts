/**
 * Validador e Extrator de Metadados do Número Único de Processo CNJ
 * Resolução nº 65/2008 do Conselho Nacional de Justiça
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos numéricos)
 */

export interface ValidacaoCnjResult {
  valido: boolean;
  numeroFormatado: string;
  digitoInformado: string;
  digitoEsperado: string;
  ramoCodigo: string;
  ramoJustica: string;
  tribunalCodigo: string;
  tribunalNome: string;
  tribunalSigla: string;
  anoDistribuicao: string;
  unidadeOrigem: string;
  erro?: string;
}

const RAMOS_JUSTICA: Record<string, { nome: string; sigla: string }> = {
  '1': { nome: 'Supremo Tribunal Federal', sigla: 'STF' },
  '2': { nome: 'Conselho Nacional de Justiça', sigla: 'CNJ' },
  '3': { nome: 'Superior Tribunal de Justiça', sigla: 'STJ' },
  '4': { nome: 'Justiça Federal', sigla: 'JF' },
  '5': { nome: 'Justiça do Trabalho', sigla: 'JT' },
  '6': { nome: 'Justiça Eleitoral', sigla: 'JE' },
  '7': { nome: 'Justiça Militar da União', sigla: 'JMU' },
  '8': { nome: 'Justiça dos Estados e DF', sigla: 'JE' },
  '9': { nome: 'Justiça Militar Estadual', sigla: 'JME' },
};

const TRIBUNAIS_ESTADUAIS: Record<string, { sigla: string; nome: string }> = {
  '01': { sigla: 'TJAC', nome: 'Tribunal de Justiça do Acre' },
  '02': { sigla: 'TJAL', nome: 'Tribunal de Justiça de Alagoas' },
  '03': { sigla: 'TJAP', nome: 'Tribunal de Justiça do Amapá' },
  '04': { sigla: 'TJAM', nome: 'Tribunal de Justiça do Amazonas' },
  '05': { sigla: 'TJBA', nome: 'Tribunal de Justiça da Bahia' },
  '06': { sigla: 'TJCE', nome: 'Tribunal de Justiça do Ceará' },
  '07': { sigla: 'TJDFT', nome: 'Tribunal de Justiça do DF e Territórios' },
  '08': { sigla: 'TJES', nome: 'Tribunal de Justiça do Espírito Santo' },
  '09': { sigla: 'TJGO', nome: 'Tribunal de Justiça de Goiás' },
  '10': { sigla: 'TJMA', nome: 'Tribunal de Justiça do Maranhão' },
  '11': { sigla: 'TJMT', nome: 'Tribunal de Justiça de Mato Grosso' },
  '12': { sigla: 'TJMS', nome: 'Tribunal de Justiça de Mato Grosso do Sul' },
  '13': { sigla: 'TJMG', nome: 'Tribunal de Justiça de Minas Gerais' },
  '14': { sigla: 'TJPA', nome: 'Tribunal de Justiça do Pará' },
  '15': { sigla: 'TJPB', nome: 'Tribunal de Justiça da Paraíba' },
  '16': { sigla: 'TJPR', nome: 'Tribunal de Justiça do Paraná' },
  '17': { sigla: 'TJPE', nome: 'Tribunal de Justiça de Pernambuco' },
  '18': { sigla: 'TJPI', nome: 'Tribunal de Justiça do Piauí' },
  '19': { sigla: 'TJRJ', nome: 'Tribunal de Justiça do Rio de Janeiro' },
  '20': { sigla: 'TJRN', nome: 'Tribunal de Justiça do Rio Grande do Norte' },
  '21': { sigla: 'TJRS', nome: 'Tribunal de Justiça do Rio Grande do Sul' },
  '22': { sigla: 'TJRO', nome: 'Tribunal de Justiça de Rondônia' },
  '23': { sigla: 'TJRR', nome: 'Tribunal de Justiça de Roraima' },
  '24': { sigla: 'TJSC', nome: 'Tribunal de Justiça de Santa Catarina' },
  '25': { sigla: 'TJSE', nome: 'Tribunal de Justiça de Sergipe' },
  '26': { sigla: 'TJSP', nome: 'Tribunal de Justiça de São Paulo' },
  '27': { sigla: 'TJTO', nome: 'Tribunal de Justiça do Tocantins' },
};

const TRIBUNAIS_TRT: Record<string, { sigla: string; nome: string }> = {
  '01': { sigla: 'TRT-1', nome: 'TRT da 1ª Região (Rio de Janeiro)' },
  '02': { sigla: 'TRT-2', nome: 'TRT da 2ª Região (São Paulo - Capital e Litoral)' },
  '03': { sigla: 'TRT-3', nome: 'TRT da 3ª Região (Minas Gerais)' },
  '04': { sigla: 'TRT-4', nome: 'TRT da 4ª Região (Rio Grande do Sul)' },
  '05': { sigla: 'TRT-5', nome: 'TRT da 5ª Região (Bahia)' },
  '06': { sigla: 'TRT-6', nome: 'TRT da 6ª Região (Pernambuco)' },
  '07': { sigla: 'TRT-7', nome: 'TRT da 7ª Região (Ceará)' },
  '08': { sigla: 'TRT-8', nome: 'TRT da 8ª Região (Pará e Amapá)' },
  '09': { sigla: 'TRT-9', nome: 'TRT da 9ª Região (Paraná)' },
  '10': { sigla: 'TRT-10', nome: 'TRT da 10ª Região (DF e Tocantins)' },
  '11': { sigla: 'TRT-11', nome: 'TRT da 11ª Região (Amazonas e Roraima)' },
  '12': { sigla: 'TRT-12', nome: 'TRT da 12ª Região (Santa Catarina)' },
  '13': { sigla: 'TRT-13', nome: 'TRT da 13ª Região (Paraíba)' },
  '14': { sigla: 'TRT-14', nome: 'TRT da 14ª Região (Rondônia e Acre)' },
  '15': { sigla: 'TRT-15', nome: 'TRT da 15ª Região (Campinas e Interior SP)' },
  '16': { sigla: 'TRT-16', nome: 'TRT da 16ª Região (Maranhão)' },
  '17': { sigla: 'TRT-17', nome: 'TRT da 17ª Região (Espírito Santo)' },
  '18': { sigla: 'TRT-18', nome: 'TRT da 18ª Região (Goiás)' },
  '19': { sigla: 'TRT-19', nome: 'TRT da 19ª Região (Alagoas)' },
  '20': { sigla: 'TRT-20', nome: 'TRT da 20ª Região (Sergipe)' },
  '21': { sigla: 'TRT-21', nome: 'TRT da 21ª Região (Rio Grande do Norte)' },
  '22': { sigla: 'TRT-22', nome: 'TRT da 22ª Região (Piauí)' },
  '23': { sigla: 'TRT-23', nome: 'TRT da 23ª Região (Mato Grosso)' },
  '24': { sigla: 'TRT-24', nome: 'TRT da 24ª Região (Mato Grosso do Sul)' },
};

const TRIBUNAIS_TRF: Record<string, { sigla: string; nome: string }> = {
  '01': { sigla: 'TRF-1', nome: 'TRF da 1ª Região (DF, GO, TO, MT, BA, etc.)' },
  '02': { sigla: 'TRF-2', nome: 'TRF da 2ª Região (RJ e ES)' },
  '03': { sigla: 'TRF-3', nome: 'TRF da 3ª Região (São Paulo e MS)' },
  '04': { sigla: 'TRF-4', nome: 'TRF da 4ª Região (RS, SC e PR)' },
  '05': { sigla: 'TRF-5', nome: 'TRF da 5ª Região (PE, CE, RN, PB, AL, SE)' },
  '06': { sigla: 'TRF-6', nome: 'TRF da 6ª Região (Minas Gerais)' },
};

/**
 * Aplica máscara progressiva durante digitação do número CNJ:
 * NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function mascararCnjInput(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 20);
  if (digits.length <= 7) return digits;
  if (digits.length <= 9) return `${digits.slice(0, 7)}-${digits.slice(7)}`;
  if (digits.length <= 13) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9)}`;
  if (digits.length <= 14) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13)}`;
  if (digits.length <= 16) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14)}`;
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`;
}

/**
 * Valida o dígito verificador CNJ e extrai as informações do tribunal e ramo
 */
export function validarCnj(numeroCnj: string): ValidacaoCnjResult {
  const clean = numeroCnj.replace(/\D/g, '');

  if (clean.length !== 20) {
    return {
      valido: false,
      numeroFormatado: mascararCnjInput(numeroCnj),
      digitoInformado: clean.slice(7, 9) || '',
      digitoEsperado: '',
      ramoCodigo: '',
      ramoJustica: '',
      tribunalCodigo: '',
      tribunalNome: '',
      tribunalSigla: '',
      anoDistribuicao: '',
      unidadeOrigem: '',
      erro: `Número incompleto: esperado 20 dígitos numéricos (informado ${clean.length}).`,
    };
  }

  const numero = clean.slice(0, 7);
  const digitoInformado = clean.slice(7, 9);
  const ano = clean.slice(9, 13);
  const ramo = clean.slice(13, 14);
  const tribunal = clean.slice(14, 16);
  const origem = clean.slice(16, 20);

  // Cálculo do dígito verificador via Módulo 97 (ISO 7064)
  // Concatenação de NNNNNNN + AAAA + J + TR + OOOO + 00
  const blocoNumerico = `${numero}${ano}${ramo}${tribunal}${origem}00`;
  const resto = Number(BigInt(blocoNumerico) % 97n);
  const digitoCalculado = 98 - resto;
  const digitoEsperado = String(digitoCalculado).padStart(2, '0');

  const valido = digitoInformado === digitoEsperado;

  // Extração do Ramo da Justiça
  const infoRamo = RAMOS_JUSTICA[ramo] || { nome: 'Ramo Não Identificado', sigla: `J${ramo}` };

  // Extração do Tribunal
  let tribunalNome = 'Tribunal não mapeado';
  let tribunalSigla = `TR-${tribunal}`;

  if (ramo === '8') {
    const t = TRIBUNAIS_ESTADUAIS[tribunal];
    if (t) {
      tribunalNome = t.nome;
      tribunalSigla = t.sigla;
    }
  } else if (ramo === '5') {
    const t = TRIBUNAIS_TRT[tribunal];
    if (t) {
      tribunalNome = t.nome;
      tribunalSigla = t.sigla;
    }
  } else if (ramo === '4') {
    const t = TRIBUNAIS_TRF[tribunal];
    if (t) {
      tribunalNome = t.nome;
      tribunalSigla = t.sigla;
    }
  } else if (ramo === '1') {
    tribunalNome = 'Supremo Tribunal Federal';
    tribunalSigla = 'STF';
  } else if (ramo === '2') {
    tribunalNome = 'Conselho Nacional de Justiça';
    tribunalSigla = 'CNJ';
  } else if (ramo === '3') {
    tribunalNome = 'Superior Tribunal de Justiça';
    tribunalSigla = 'STJ';
  }

  const numeroFormatado = `${numero}-${digitoInformado}.${ano}.${ramo}.${tribunal}.${origem}`;

  return {
    valido,
    numeroFormatado,
    digitoInformado,
    digitoEsperado,
    ramoCodigo: ramo,
    ramoJustica: infoRamo.nome,
    tribunalCodigo: tribunal,
    tribunalNome,
    tribunalSigla,
    anoDistribuicao: ano,
    unidadeOrigem: origem,
    erro: valido
      ? undefined
      : `Dígito verificador inválido: informado ${digitoInformado}, esperado ${digitoEsperado}.`,
  };
}

export function extrairMetadadosCnj(numeroCnj: string) {
  const res = validarCnj(numeroCnj);
  let ufSede = 'SP';
  if (res.tribunalSigla.startsWith('TJ')) {
    ufSede = res.tribunalSigla.slice(2);
  } else if (res.tribunalSigla === 'TRT-2' || res.tribunalSigla === 'TRT-15') {
    ufSede = 'SP';
  } else if (res.tribunalSigla === 'TRF-3') {
    ufSede = 'SP';
  }

  return {
    ano: res.anoDistribuicao,
    ramo: res.ramoJustica,
    tribunal: {
      sigla: res.tribunalSigla,
      nome: res.tribunalNome,
      ramo: res.ramoJustica,
      ufSede,
    },
    unidadeOrigem: res.unidadeOrigem,
    valido: res.valido,
  };
}

