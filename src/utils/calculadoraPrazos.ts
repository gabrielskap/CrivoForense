/**
 * Calculadora de Prazos Processuais em Dias Úteis
 * Em conformidade com o Código de Processo Civil (Lei 13.105/2015):
 * - Art. 219: Contagem computa somente dias úteis
 * - Art. 220: Recesso forense de 20 de dezembro a 20 de janeiro (suspensão de prazos)
 * - Art. 224: Exclui dia do começo e inclui dia do vencimento (com prorrogação se não útil)
 */

import { FeriadoLocal } from '../types';

export interface DetalheDiaCalculo {
  data: string; // YYYY-MM-DD
  diaSemana: string;
  util: boolean;
  motivo?: string;
}

export interface ResultadoCalculoPrazo {
  dataInicio: string;
  dataPrimeiroDiaUtil: string;
  dataVencimento: string;
  diasUteisSolicitados: number;
  diasCorridosTotais: number;
  houveRecessoForense: boolean;
  diasSuspensosTotal: number;
  cronologia: DetalheDiaCalculo[];
}

export interface StatusSemaforoPrazo {
  diasUteisRestantes: number;
  semaforo: 'vencido' | 'alerta_3_dias' | 'ok';
  texto: string;
  corBadge: string;
  corBorda: string;
}

// Feriados Nacionais e Forenses Fixos (Mês-Dia: MM-DD)
const FERIADOS_NACIONAIS_FIXOS: Record<string, string> = {
  '01-01': 'Confraternização Universal (Ano Novo)',
  '04-21': 'Tiradentes',
  '05-01': 'Dia do Trabalho',
  '08-11': 'Dia da Criação dos Cursos Jurídicos / Dia do Advogado (Feriado Forense)',
  '09-07': 'Independência do Brasil',
  '10-12': 'Nossa Senhora Aparecida (Padroeira do Brasil)',
  '10-28': 'Dia do Servidor Público (Feriado Forense)',
  '11-01': 'Todos os Santos (Art. 62 Lei 5.010/66 - Judiciário)',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '11-20': 'Dia Nacional de Zumbi e da Consciência Negra (Lei 14.759/2023)',
  '12-08': 'Dia da Justiça (Art. 62 Lei 5.010/66 - Judiciário)',
  '12-25': 'Natal',
};

// Feriados Móveis 2025/2026/2027 (Carnaval, Sexta-feira Santa, Corpus Christi)
const FERIADOS_MOVEIS: Record<string, string> = {
  // 2025
  '2025-03-03': 'Carnaval (Segunda-feira)',
  '2025-03-04': 'Carnaval (Terça-feira)',
  '2025-03-05': 'Quarta-feira de Cinzas (Suspensão Forense)',
  '2025-04-17': 'Quinta-feira Santa (Feriado Regimental Judiciário)',
  '2025-04-18': 'Sexta-feira Santa (Paixão de Cristo)',
  '2025-06-19': 'Corpus Christi',
  // 2026
  '2026-02-16': 'Carnaval (Segunda-feira)',
  '2026-02-17': 'Carnaval (Terça-feira)',
  '2026-02-18': 'Quarta-feira de Cinzas (Suspensão Forense)',
  '2026-04-02': 'Quinta-feira Santa (Feriado Regimental Judiciário)',
  '2026-04-03': 'Sexta-feira Santa (Paixão de Cristo)',
  '2026-06-04': 'Corpus Christi',
  // 2027
  '2027-02-08': 'Carnaval (Segunda-feira)',
  '2027-02-09': 'Carnaval (Terça-feira)',
  '2027-02-10': 'Quarta-feira de Cinzas (Suspensão Forense)',
  '2027-03-25': 'Quinta-feira Santa (Feriado Regimental Judiciário)',
  '2027-03-26': 'Sexta-feira Santa (Paixão de Cristo)',
  '2027-05-27': 'Corpus Christi',
};

// Feriados Locais padrão cadastrados no sistema
export const FERIADOS_LOCAIS_PADRAO: FeriadoLocal[] = [
  { id: 'fer_sp_1', comarca: 'São Paulo', uf: 'SP', nome: 'Aniversário da Cidade de São Paulo', data: '2026-01-25', recorrenteAnual: true },
  { id: 'fer_sp_2', comarca: 'São Paulo', uf: 'SP', nome: 'Revolução Constitucionalista de 1932', data: '2026-07-09', recorrenteAnual: true },
  { id: 'fer_palmas_1', comarca: 'Palmas', uf: 'TO', nome: 'Criação de Palmas', data: '2026-05-20', recorrenteAnual: true },
  { id: 'fer_palmas_2', comarca: 'Palmas', uf: 'TO', nome: 'Criação do Estado do Tocantins', data: '2026-10-05', recorrenteAnual: true },
  { id: 'fer_santos_1', comarca: 'Santos', uf: 'SP', nome: 'Aniversário da Comarca de Santos', data: '2026-01-26', recorrenteAnual: true },
  { id: 'fer_santos_2', comarca: 'Santos', uf: 'SP', nome: 'Nossa Senhora do Monte Serrat (Padroeira)', data: '2026-09-08', recorrenteAnual: true },
  { id: 'fer_campinas_1', comarca: 'Campinas', uf: 'SP', nome: 'Nossa Senhora da Conceição (Padroeira)', data: '2026-12-08', recorrenteAnual: true },
];

const DIAS_SEMANA_NOMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

/**
 * Converte Date para string ISO YYYY-MM-DD
 */
export function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte string YYYY-MM-DD para objeto Date em horário local meia-noite
 */
export function parseIsoDate(str: string): Date {
  const parts = str.slice(0, 10).split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
}

/**
 * Verifica se uma data está dentro do recesso forense (20/12 a 20/01 do ano seguinte)
 * Conforme Art. 220 do CPC
 */
export function isRecessoForense(date: Date): boolean {
  const month = date.getMonth(); // 0 a 11 (11 = Dezembro, 0 = Janeiro)
  const day = date.getDate();

  // 20 de dezembro a 31 de dezembro
  if (month === 11 && day >= 20) return true;
  // 01 de janeiro a 20 de janeiro
  if (month === 0 && day <= 20) return true;

  return false;
}

/**
 * Verifica se um dia específico é útil na comarca indicada
 */
export function verificarDiaUtil(
  date: Date,
  comarca?: string,
  feriadosLocais: FeriadoLocal[] = FERIADOS_LOCAIS_PADRAO
): { util: boolean; motivo?: string } {
  const diaSemana = date.getDay();

  // Fim de semana
  if (diaSemana === 0) return { util: false, motivo: 'Domingo' };
  if (diaSemana === 6) return { util: false, motivo: 'Sábado' };

  // Recesso Forense (Art. 220 CPC)
  if (isRecessoForense(date)) {
    return { util: false, motivo: 'Recesso Forense (Art. 220 do CPC - 20/12 a 20/01)' };
  }

  const iso = toIsoDate(date);
  const mmDd = iso.slice(5);

  // Feriado móvel
  if (FERIADOS_MOVEIS[iso]) {
    return { util: false, motivo: FERIADOS_MOVEIS[iso] };
  }

  // Feriado nacional / forense fixo
  if (FERIADOS_NACIONAIS_FIXOS[mmDd]) {
    return { util: false, motivo: FERIADOS_NACIONAIS_FIXOS[mmDd] };
  }

  // Feriado local da comarca
  if (comarca) {
    const comarcaNorm = comarca.toLowerCase().trim();
    const ferLocal = feriadosLocais.find((fl) => {
      const flComarca = fl.comarca.toLowerCase().trim();
      if (!flComarca.includes(comarcaNorm) && !comarcaNorm.includes(flComarca)) return false;

      if (fl.recorrenteAnual) {
        return fl.data.slice(5) === mmDd;
      }
      return fl.data === iso;
    });

    if (ferLocal) {
      return { util: false, motivo: `Feriado Local (${ferLocal.comarca}): ${ferLocal.nome}` };
    }
  }

  return { util: true };
}

/**
 * Calcula o vencimento do prazo em dias úteis com base no CPC
 * Art. 224: Exclui dia do começo e inclui dia do vencimento
 */
export function calcularPrazoDiasUteis(
  dataIntimacao: string | Date,
  diasUteis: number,
  comarca?: string,
  feriadosLocais: FeriadoLocal[] = FERIADOS_LOCAIS_PADRAO
): ResultadoCalculoPrazo {
  const inicioDate = typeof dataIntimacao === 'string' ? parseIsoDate(dataIntimacao) : new Date(dataIntimacao);
  const dataInicioIso = toIsoDate(inicioDate);

  const cronologia: DetalheDiaCalculo[] = [];
  let houveRecesso = false;
  let diasSuspensos = 0;

  // Registrar dia da intimação / publicação (dia excluído nos termos do art. 224)
  cronologia.push({
    data: dataInicioIso,
    diaSemana: DIAS_SEMANA_NOMES[inicioDate.getDay()],
    util: false,
    motivo: 'Dia da Intimação / Publicação (Excluído pelo Art. 224 do CPC)',
  });

  // O prazo começa a correr no primeiro dia útil seguinte
  let cursor = new Date(inicioDate);
  cursor.setDate(cursor.getDate() + 1);

  let diasContados = 0;
  let primeiroDiaUtilIso = '';

  while (diasContados < diasUteis) {
    const status = verificarDiaUtil(cursor, comarca, feriadosLocais);
    const cursorIso = toIsoDate(cursor);
    const nomeDia = DIAS_SEMANA_NOMES[cursor.getDay()];

    if (isRecessoForense(cursor)) {
      houveRecesso = true;
    }

    if (status.util) {
      diasContados++;
      if (!primeiroDiaUtilIso) {
        primeiroDiaUtilIso = cursorIso;
      }
      cronologia.push({
        data: cursorIso,
        diaSemana: nomeDia,
        util: true,
        motivo: `Dia Útil ${diasContados} de ${diasUteis}`,
      });
    } else {
      diasSuspensos++;
      cronologia.push({
        data: cursorIso,
        diaSemana: nomeDia,
        util: false,
        motivo: status.motivo,
      });
    }

    if (diasContados < diasUteis) {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // O vencimento é o dia em que completou o último dia útil
  // Se por alguma razão extraordinária esse dia não for útil, prorroga-se (Art. 224 § 1º)
  while (!verificarDiaUtil(cursor, comarca, feriadosLocais).util) {
    cursor.setDate(cursor.getDate() + 1);
    const statusProrrogado = verificarDiaUtil(cursor, comarca, feriadosLocais);
    cronologia.push({
      data: toIsoDate(cursor),
      diaSemana: DIAS_SEMANA_NOMES[cursor.getDay()],
      util: statusProrrogado.util,
      motivo: statusProrrogado.util
        ? 'Vencimento prorrogado para o primeiro dia útil subsequente (Art. 224 § 1º)'
        : statusProrrogado.motivo,
    });
  }

  const dataVencimentoIso = toIsoDate(cursor);

  // Dias corridos totais
  const diffTime = cursor.getTime() - inicioDate.getTime();
  const diasCorridosTotais = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return {
    dataInicio: dataInicioIso,
    dataPrimeiroDiaUtil: primeiroDiaUtilIso || dataVencimentoIso,
    dataVencimento: dataVencimentoIso,
    diasUteisSolicitados: diasUteis,
    diasCorridosTotais,
    houveRecessoForense: houveRecesso,
    diasSuspensosTotal: diasSuspensos,
    cronologia,
  };
}

/**
 * Calcula dias úteis restantes até a data limite e determina o status no semáforo
 */
export function calcularDiasUteisRestantes(
  dataLimite: string | Date,
  dataReferencia: string | Date = new Date(),
  comarca?: string,
  feriadosLocais: FeriadoLocal[] = FERIADOS_LOCAIS_PADRAO
): StatusSemaforoPrazo {
  const limite = typeof dataLimite === 'string' ? parseIsoDate(dataLimite) : new Date(dataLimite);
  const ref = typeof dataReferencia === 'string' ? parseIsoDate(dataReferencia) : new Date(dataReferencia);

  const limiteIso = toIsoDate(limite);
  const refIso = toIsoDate(ref);

  if (limiteIso < refIso) {
    // Já vencido
    // Contar quantos dias úteis já se passaram de atraso
    let cursor = new Date(limite);
    let diasAtraso = 0;
    while (toIsoDate(cursor) < refIso) {
      cursor.setDate(cursor.getDate() + 1);
      if (verificarDiaUtil(cursor, comarca, feriadosLocais).util) {
        diasAtraso++;
      }
    }
    return {
      diasUteisRestantes: -diasAtraso,
      semaforo: 'vencido',
      texto: `Vencido há ${diasAtraso === 0 ? '1' : diasAtraso} dia(s) útil(eis)`,
      corBadge: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
      corBorda: 'border-rose-600',
    };
  }

  if (limiteIso === refIso) {
    return {
      diasUteisRestantes: 0,
      semaforo: 'alerta_3_dias',
      texto: 'Vence HOJE!',
      corBadge: 'bg-amber-950/60 text-amber-300 border-amber-800/40 animate-pulse',
      corBorda: 'border-amber-500',
    };
  }

  // Contar dias úteis entre hoje e a data limite
  let cursor = new Date(ref);
  cursor.setDate(cursor.getDate() + 1);
  let diasUteisRestantes = 0;

  while (toIsoDate(cursor) <= limiteIso) {
    if (verificarDiaUtil(cursor, comarca, feriadosLocais).util) {
      diasUteisRestantes++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (diasUteisRestantes <= 3) {
    return {
      diasUteisRestantes,
      semaforo: 'alerta_3_dias',
      texto: `${diasUteisRestantes} dia(s) útil(eis) restantes (Crítico)`,
      corBadge: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
      corBorda: 'border-amber-500',
    };
  }

  return {
    diasUteisRestantes,
    semaforo: 'ok',
    texto: `${diasUteisRestantes} dias úteis (Dentro do prazo)`,
    corBadge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    corBorda: 'border-emerald-600',
  };
}
