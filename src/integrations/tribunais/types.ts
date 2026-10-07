import {
  MovimentacaoJudicial,
  ComunicacaoJudicial,
  ProcessoConsultaResult,
  TribunalProvider,
  MarcoCpcTipo,
  SugestaoMarcoPericial,
  OabMonitorada,
  NomeMonitorado,
} from '../../types';

export type {
  MovimentacaoJudicial,
  ComunicacaoJudicial,
  ProcessoConsultaResult,
  TribunalProvider,
  SugestaoMarcoPericial,
  OabMonitorada,
  NomeMonitorado,
};

export interface FiltroComunicacoes {
  oab?: {
    numero: string;
    uf: string;
  };
  nome?: string;
  tribunal?: string;
}

export interface PalavraChaveRegra {
  termo: string;
  sinonimos: string[];
  marcoSugerido: MarcoCpcTipo;
  nomeMarco: string;
  artigoCpc: string;
  prazoDiasUteisPadrao: number;
  descricaoOrientativa: string;
}

export interface VarreduraResultado {
  dataHoraInicio: string;
  dataHoraFim: string;
  totalProcessosVerificados: number;
  totalOabsVerificadas: number;
  novasMovimentacoes: MovimentacaoJudicial[];
  novasComunicacoes: ComunicacaoJudicial[];
  sugestoesMarcosGeradas: number;
  erros: string[];
}
