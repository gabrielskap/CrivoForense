export interface IRepository<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: Omit<T, 'id'> & { id?: string }): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  find(predicate: (item: T) => boolean): Promise<T[]>;
}

// Interfaces específicas prontas para substituição por Firebase Firestore futuramente
export interface ILeadRepository extends IRepository<import('../types').Lead> {
  getByStatus(status: import('../types').StatusFunilLead): Promise<import('../types').Lead[]>;
}

export interface IEscritorioRepository extends IRepository<import('../types').Escritorio> {}

export interface IAdvogadoRepository extends IRepository<import('../types').Advogado> {
  getByEscritorio(escritorioId: string): Promise<import('../types').Advogado[]>;
}

export interface IPericiandoRepository extends IRepository<import('../types').Periciando> {
  buscarPorCpf(cpf: string): Promise<import('../types').Periciando | null>;
}

export interface IProcessoRepository extends IRepository<import('../types').Processo> {
  buscarPorNumeroCnj(numeroCnj: string): Promise<import('../types').Processo | null>;
}

export interface IPericiaRepository extends IRepository<import('../types').Pericia> {
  getProximasPericias(dias?: number): Promise<import('../types').Pericia[]>;
}

export interface INomeacaoRepository extends IRepository<import('../types').Nomeacao> {}

export interface ITarefaRepository extends IRepository<import('../types').Tarefa> {}

export interface ICompromissoRepository extends IRepository<import('../types').Compromisso> {}

export interface ICobrancaRepository extends IRepository<import('../types').Cobranca> {}

export interface IDespesaRepository extends IRepository<import('../types').Despesa> {}

export interface IServicoRepository extends IRepository<import('../types').Servico> {}

export interface IModeloContratoRepository extends IRepository<import('../types').ModeloContrato> {}

export interface IPropostaRepository extends IRepository<import('../types').Proposta> {
  getByStatus(status: import('../types').Proposta['status']): Promise<import('../types').Proposta[]>;
  aprovarProposta(propostaId: string): Promise<{ proposta: import('../types').Proposta; contrato: import('../types').Contrato }>;
}

export interface IContratoRepository extends IRepository<import('../types').Contrato> {
  getByStatus(status: import('../types').Contrato['status']): Promise<import('../types').Contrato[]>;
  assinarContrato(contratoId: string, provedor?: 'ZapSign' | 'Clicksign' | 'D4Sign'): Promise<import('../types').Contrato>;
}

export interface IDocumentoRepository extends IRepository<import('../types').Documento> {}

export interface IInteracaoRepository extends IRepository<import('../types').Interacao> {
  getByContato(tipo: 'escritorio' | 'advogado' | 'periciando' | 'lead', id: string): Promise<import('../types').Interacao[]>;
}

export interface IOportunidadeRepository extends IRepository<import('../types').Oportunidade> {}

export interface IFunilRepository extends IRepository<import('../types').Funil> {}

export interface INotificacaoRepository extends IRepository<import('../types').Notificacao> {}

export interface IAuditLogRepository extends IRepository<import('../types').AuditLog> {
  logAccess(entry: Omit<import('../types').AuditLog, 'id' | 'dataHora' | 'usuarioId' | 'usuarioNome' | 'usuarioPapel'> & {
    usuarioId?: string;
    usuarioNome?: string;
    usuarioPapel?: string;
  }): Promise<import('../types').AuditLog>;
}

export interface IOrdemDeServicoRepository extends IRepository<import('../types').OrdemDeServico> {
  getByProcesso(processoId: string): Promise<import('../types').OrdemDeServico[]>;
}

export interface IFeriadoLocalRepository extends IRepository<import('../types').FeriadoLocal> {
  getByComarca(comarca: string): Promise<import('../types').FeriadoLocal[]>;
}

export interface IPapelRepository extends IRepository<import('../types').Papel> {}

export interface IUsuarioRepository extends IRepository<import('../types').Usuario> {}

export interface IMovimentacaoJudicialRepository extends IRepository<import('../types').MovimentacaoJudicial> {
  getByProcesso(processoId: string): Promise<import('../types').MovimentacaoJudicial[]>;
  getByNumeroCnj(numeroCnj: string): Promise<import('../types').MovimentacaoJudicial[]>;
}

export interface IComunicacaoJudicialRepository extends IRepository<import('../types').ComunicacaoJudicial> {
  getByProcesso(processoId: string): Promise<import('../types').ComunicacaoJudicial[]>;
  getByOab(numero: string, uf: string): Promise<import('../types').ComunicacaoJudicial[]>;
}

export interface IOabMonitoradaRepository extends IRepository<import('../types').OabMonitorada> {}

export interface INomeMonitoradoRepository extends IRepository<import('../types').NomeMonitorado> {}
