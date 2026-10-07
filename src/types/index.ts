export type AreaDireito = 
  | 'Previdenciário'
  | 'Trabalhista'
  | 'Cível - Erro Médico'
  | 'Cível / Erro Médico'
  | 'Cível - DPVAT/Seguros'
  | 'Securitário / DPVAT'
  | 'Doença Ocupacional'
  | 'Geral';

export type ModalidadeAtuacao = 
  | 'Assistente Técnica' // Contratada pelo advogado de uma das partes
  | 'Perita do Juízo';    // Nomeada pelo juiz

export type ModuloSistema = 
  | 'dashboard'
  | 'leads'
  | 'contatos'
  | 'processos'
  | 'tarefas'
  | 'agenda'
  | 'conversas'
  | 'email'
  | 'documentos'
  | 'financeiro'
  | 'prospeccao'
  | 'automacoes'
  | 'site'
  | 'relatorios'
  | 'configuracoes';

export type AcaoPermissao = 'ver' | 'criar' | 'editar' | 'excluir' | 'exportar';

export interface PermissaoModulo {
  ver: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  exportar: boolean;
}

export interface Papel {
  id: string;
  nome: string;
  descricao: string;
  isPadrao: boolean;
  permissoes: Record<ModuloSistema, PermissaoModulo>;
  verApenasSobMinhaResponsabilidade: boolean;
  acessarDadosSensiveisSaude: boolean; // LGPD Art. 11 (Prontuários e dados de saúde de periciandos)
}

export type UsuarioPapel = 'Administrador' | 'Comercial/SDR' | 'Assistente Técnico' | 'Administrativo/Secretaria' | 'Financeiro' | string;

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  papelId: string;
  papelNome: UsuarioPapel;
  corAgenda: string; // Ex: #b8a47c, #3b82f6, #10b981
  crm?: string; // Ex: CRM/SP 235.821 | CRM/TO 6.385
  rqe?: string;
  avatar?: string;
  ativo: boolean;
}

export interface Escritorio {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  nome?: string;
  cnpj: string;
  cidade: string;
  uf: string;
  areasAtuacao: AreaDireito[];
  telefone: string;
  email: string;
  site?: string;
  endereco: string;
  status: 'Ativo' | 'Em Prospecção' | 'Inativo';
  advogadosCount?: number;
  processosCount?: number;
  dataCadastro: string;
}

export interface Advogado {
  id: string;
  escritorioId: string;
  nome: string;
  oabNumero: string;
  oabUf: string;
  whatsapp: string;
  email: string;
  eDecisor: boolean;
  cargo: 'Sócio' | 'Advogado Sênior' | 'Advogado Pleno' | 'Associado';
  areasAtuacao: AreaDireito[];
  anotacoes?: string;
  dataCadastro: string;
}

export interface DadosSaudeSensivel {
  patologias: string[];
  historicoClinico: string;
  medicamentosEmUso: string;
  restricoesFisicas: string;
  cid10Principais: string[];
  consentimentoLgpdColetado: boolean;
  observacoesRestritas?: string;
}

export interface Periciando {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: 'M' | 'F' | 'Outro';
  telefone: string;
  email?: string;
  endereco: string;
  profissaoAtual?: string;
  dadosSaude: DadosSaudeSensivel;
  dataCadastro: string;
}

export type TipoLead = 'Advogado' | 'Escritório' | 'Paciente/Periciando' | 'Outro';

export type FaseProcessoLead = 
  | 'Pré-ajuizamento' 
  | 'Aguardando perícia' 
  | 'Perícia marcada' 
  | 'Laudo já emitido';

export type OrigemLead = 
  | 'Google Ads'
  | 'Google orgânico'
  | 'Formulário do site'
  | 'WhatsApp direto'
  | 'Instagram'
  | 'Indicação'
  | 'Google Maps/prospecção'
  | 'Evento'
  | 'Outro';

export type MotivoPerda = 
  | 'Preço'
  | 'Prazo inviável'
  | 'Sem viabilidade técnica'
  | 'Fechou com concorrente'
  | 'Sem resposta'
  | 'Fora da área'
  | 'Outro';

export interface EtapaFunil {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
  diasAlerta: number; // dias parado na etapa antes do alerta visual
  tipo: 'aberto' | 'ganho' | 'perdido';
}

export interface Funil {
  id: string;
  nome: string;
  descricao?: string;
  padrao?: boolean;
  etapas: EtapaFunil[];
}

export type StatusFunilLead = 
  | 'Novo'
  | 'Em triagem'
  | 'Qualificado'
  | 'Análise de viabilidade'
  | 'Proposta enviada'
  | 'Negociação'
  | 'Ganho'
  | 'Perdido';

export type CanalOrigemLead = OrigemLead;

export interface Lead {
  id: string;
  nome: string;
  tipo: TipoLead;
  whatsapp: string;
  telefone?: string;
  email: string;
  cidade: string;
  uf: string;
  area: AreaDireito | 'Outro';
  faseProcesso: FaseProcessoLead;
  necessidade: string;
  prazoEmCurso: boolean;
  prazoData?: string;
  origem: OrigemLead;
  indicadoPor?: string;
  campanha?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  gclid?: string;
  responsavelId: string;
  responsavelNome?: string;
  tags: string[];
  score: number; // 0 a 100
  proximoContato?: string; // data ISO
  cpfCnpj?: string; // para deduplicação
  oabNumero?: string; // para deduplicação
  oabUf?: string;
  funilId: string;
  etapaId: string;
  statusFunil: StatusFunilLead;
  valorEstimado: number;
  dataCriacao: string;
  dataUltimoContato: string;
  dataEntradaEtapa: string; // Para calcular tempo estagnado
  motivoPerda?: MotivoPerda;
  motivoPerdaDetalhe?: string;
  dataPerda?: string;
  convertidoEm?: {
    escritorioId?: string;
    advogadoId?: string;
    periciandoId?: string;
    oportunidadeId?: string;
    data: string;
  };
  observacoes?: string;
  contatoNome?: string;
  modalidade?: ModalidadeAtuacao;
  areaDireito?: AreaDireito;
  canalOrigem?: string;
}

export interface Oportunidade {
  id: string;
  leadId?: string;
  escritorioId?: string;
  advogadoId?: string;
  periciandoId?: string;
  titulo: string;
  servicoInteresse: string; // Ex: 'Elaboração de Quesitos Estratégicos', 'Análise Prévia de Viabilidade', 'Acompanhamento Pericial Presencial'
  numeroProcesso?: string;
  valorEstimado: number;
  probabilidade: number; // 0-100%
  previsaoFechamento: string;
  prazoProcessualCritico?: string; // data limite judicial
  fase: string;
  status: 'Aberta' | 'Ganha' | 'Perdida';
  motivoPerda?: MotivoPerda;
  responsavelId: string;
  dataCriacao: string;
  dataFechamento?: string;
  observacoes?: string;
}

export type StatusProcessual = 
  | 'Inicial / Quesitos'
  | 'Perícia Agendada'
  | 'Laudo Pericial Entregue'
  | 'Impugnação / Quesitos Suplementares'
  | 'Sentença'
  | 'Concluído';

export type PoloRepresentado = 'Autor' | 'Réu' | 'Terceiro Interessado' | 'Juízo (Imparcial)';

export type MarcoCpcTipo =
  | 'nomeacao_perito'
  | 'quesitos_assistente'
  | 'pericia_agendada'
  | 'pericia_realizada'
  | 'laudo_juntado'
  | 'parecer_assistente'
  | 'esclarecimentos'
  | 'encerrado';

export interface MarcoCpc {
  id: string;
  tipo: MarcoCpcTipo;
  nome: string;
  artigoCpc: string;
  prazoDiasUteis?: number;
  dataInicio?: string;
  dataLimite?: string;
  dataConclusao?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  observacoes?: string;
  tarefaId?: string;
}

export interface Processo {
  id: string;
  numeroCnj: string;
  tribunal: string; // Ex: TRT-2, TRT-15, TJSP, TJTO, TRF-3
  ramoJustica?: string;
  comarca: string;
  uf?: string;
  vara: string;
  classe?: string;
  assunto?: string;
  area: AreaDireito;
  modalidadeAtuacao: ModalidadeAtuacao;
  poloAtivo: string; // Autor / Reclamante
  poloPassivo: string; // Réu / Reclamada
  poloRepresentado?: PoloRepresentado;
  periciandoId: string;
  periciandoNome?: string;
  escritorioId?: string;
  advogadoId?: string;
  juiz?: string;
  peritoJuizoNome?: string;
  valorCausa?: number;
  honorariosAcordados?: number;
  statusProcessual: StatusProcessual;
  responsavelId?: string;
  dataDistribuicao: string;
  proximaDataImportante?: string;
  marcosCpc?: MarcoCpc[];
  ultimaVerificacaoTribunal?: string;
  movimentacoesNaoLidas?: number;
}

export type StatusPericia = 
  | 'Agendada'
  | 'Realizada - Em Análise'
  | 'Aguardando Laudo do Juízo'
  | 'Laudo Protocolado'
  | 'Concluída'
  | 'Remarcada'
  | 'Cancelada';

export type ResultadoPericia =
  | 'Favorável'
  | 'Parcialmente Favorável'
  | 'Desfavorável'
  | 'Aguardando Sentença';

export interface ChecklistPreparacaoPericia {
  documentosRevisados: boolean;
  quesitosProtocolados: boolean;
  deslocamentoConfirmado: boolean;
  periciandoOrientado: boolean;
  kitExamePreparado: boolean;
}

export interface Pericia {
  id: string;
  processoId: string;
  periciandoId: string;
  modalidade: ModalidadeAtuacao;
  formatoAtendimento?: 'Presencial' | 'On-line / Teleperícia';
  dataHora: string;
  local: string;
  linkVideochamada?: string;
  tipoLocal: 'Clínica Dra. Karine' | 'Consultório Médico' | 'Fórum / Vara' | 'Posto INSS' | 'Empresa (In Loco)' | 'Teleperícia';
  cidade: string;
  uf: string;
  peritoJuizoNome?: string;
  assistenteContrario?: string;
  comparecimentoAssistente?: boolean;
  checklist?: ChecklistPreparacaoPericia;
  status: StatusPericia;
  resultado?: ResultadoPericia;
  quesitosEnviados: boolean;
  acompanhamentoPresencial: boolean;
  parecerEmitido: boolean;
  observacoes?: string;
}

export interface Nomeacao {
  id: string;
  processoId: string;
  vara: string;
  comarca: string;
  juizNome: string;
  dataNomeacao: string;
  prazoManifestacaoDias: number;
  dataLimiteAceite: string;
  honorariosPropostos: number;
  honorariosFixados: number;
  justicaGratuita: boolean;
  valorTabelaJg?: number;
  depositoJudicial: 'Pendente' | 'Efetuado' | 'Comprovado';
  alvaraStatus: 'Não expedido' | 'Expedido' | 'Levantado';
  status: 'Aguardando Aceite' | 'Aceita' | 'Recusada' | 'Honorários Depositados' | 'Alvará Solicitado' | 'Pago';
  observacoes?: string;
}

export type TipoOrdemServico =
  | 'Análise Documental & Viabilidade'
  | 'Elaboração de Quesitos Iniciais'
  | 'Acompanhamento de Perícia Presencial / Teleperícia'
  | 'Parecer Técnico Pericial (Art. 477 §1º)'
  | 'Impugnação ao Laudo Pericial do Juízo'
  | 'Quesitos de Esclarecimento / Suplementares';

export interface OrdemDeServico {
  id: string;
  processoId: string;
  servicoId?: string;
  tipo: TipoOrdemServico;
  titulo?: string;
  responsavelId: string;
  status: 'Aberta' | 'Em Andamento' | 'Revisão Técnica' | 'Finalizada';
  prioridade?: 'Normal' | 'Urgente' | 'Crítica';
  dataInicio: string;
  dataPrevisaoEntrega: string;
  dataEntregaReal?: string;
  valor?: number;
  anotacoes?: string;
}

export interface FeriadoLocal {
  id: string;
  comarca: string;
  uf: string;
  nome: string;
  data: string; // YYYY-MM-DD
  recorrenteAnual: boolean;
}

export interface ItemPrazo {
  id: string;
  processoId: string;
  numeroCnj: string;
  titulo: string;
  tipo: 'Marco CPC' | 'Ordem de Serviço' | 'Perícia' | 'Nomeação' | 'Audiência';
  artigoCpc?: string;
  dataLimite: string; // YYYY-MM-DD
  dataLimiteFormatada?: string;
  diasRestantesUteis: number;
  semaforo: 'vencido' | 'alerta_3_dias' | 'ok';
  responsavelId: string;
  responsavelNome: string;
  concluido: boolean;
  dataConclusao?: string;
  comarca: string;
}

// ==========================================
// MONITORAMENTO JUDICIAL & TRIBUNAIS (DataJud, DJEN/PJe, Provedor Comercial)
// ==========================================

export type FonteMovimentacaoJudicial =
  | 'DataJud (CNJ)'
  | 'Comunica PJe'
  | 'DJEN'
  | 'Provedor Comercial (Escavador/Judit)'
  | 'Manual';

export interface SugestaoMarcoPericial {
  tipoMarco: MarcoCpcTipo;
  nomeMarco: string;
  artigoCpc: string;
  prazoDiasUteis: number;
  motivo: string;
  palavraChaveGatilho: string;
  confirmadoPeloUsuario?: boolean;
  dataDecisaoUsuario?: string;
  descartado?: boolean;
  tarefaGeradaId?: string;
}

export interface MovimentacaoJudicial {
  id: string;
  processoId?: string;
  numeroCnj: string;
  dataHora: string; // ISO string
  titulo: string;
  descricao: string;
  conteudoCompleto?: string;
  codigoMovimentoCnj?: string; // Tabela processual unificada do CNJ (ex: 85, 26, 123)
  fonte: FonteMovimentacaoJudicial;
  grau?: '1º Grau' | '2º Grau' | 'Tribunal Superior';
  orgaoJulgador?: string;
  palavrasChaveDetectadas?: string[];
  sugestaoMarco?: SugestaoMarcoPericial;
  lido: boolean;
  notificadoAoResponsavel: boolean;
}

export interface ComunicacaoJudicial {
  id: string;
  processoId?: string;
  numeroCnj: string;
  tipo: 'Intimação Eletrônica' | 'Publicação no DJEN' | 'Citação' | 'Edital';
  tribunal: string;
  varaOuOrgao: string;
  dataDisponibilizacao: string;
  dataPublicacao?: string;
  meio: 'DJEN' | 'Comunica PJe' | 'DataJud' | 'Diário Oficial';
  destinatarioNome: string;
  oabNumero?: string;
  oabUf?: string;
  teorResumido: string;
  teorCompleto?: string;
  palavrasChaveDetectadas?: string[];
  sugestaoNomeacao?: boolean; // Detectado Dra. Karine como perita
  sugestaoMarco?: SugestaoMarcoPericial;
  linkVisualizacao?: string;
  lida: boolean;
}

export interface OabMonitorada {
  id: string;
  tipo: 'Advogado Parceiro' | 'Dra. Karine (Perita / Nomeações)';
  numero: string;
  uf: string;
  titularNome: string;
  escritorioId?: string;
  advogadoId?: string;
  autorizacaoObtida: boolean; // Advogado parceiro com consentimento formal
  dataAutorizacao?: string;
  ativo: boolean;
  dataCadastro: string;
  ultimaVerificacao?: string;
  totalCapturas: number;
  observacoes?: string;
}

export interface NomeMonitorado {
  id: string;
  nome: string;
  titularId?: string;
  variacoes: string[]; // ex: ['Karine Reis', 'Dra. Karine Reis', 'Karine de Oliveira Reis']
  ativo: boolean;
  ultimaVerificacao?: string;
  totalNomeacoesDetectadas: number;
  observacoes?: string;
}

export interface ProcessoConsultaResult {
  sucesso: boolean;
  numeroCnj: string;
  tribunal: string;
  vara: string;
  comarca: string;
  classe: string;
  assunto: string;
  poloAtivo: string;
  poloPassivo: string;
  juiz: string;
  dataDistribuicao: string;
  movimentacoes: MovimentacaoJudicial[];
  peritoNomeado?: string;
  dataPericiaAgendada?: string;
  valorCausa?: number;
}

export interface TribunalProvider {
  id: string;
  nome: string;
  sigla: string;
  tipo: 'publico_cnj' | 'publico_djen' | 'comercial';
  descricao: string;
  buscarProcesso(numeroCNJ: string): Promise<ProcessoConsultaResult | null>;
  listarMovimentacoes(numeroCNJ: string, desde?: string): Promise<MovimentacaoJudicial[]>;
  listarComunicacoes(
    filtro: { oab?: { numero: string; uf: string }; nome?: string },
    desde?: string
  ): Promise<ComunicacaoJudicial[]>;
}

// ==========================================
// CATÁLOGO DE SERVIÇOS & TABELA DE PREÇOS
// ==========================================

export type ServicoFormaCobranca = 'Fixo' | 'Por Etapa' | 'Por Hora' | 'Mensal';

export interface PrecoNegociadoCliente {
  clienteId: string;
  clienteNome: string;
  valorNegociado: number;
  condicoes?: string;
  dataAcordo?: string;
}

export interface Servico {
  id: string;
  codigo?: string;
  nome: string;
  descricao: string;
  area: AreaDireito;
  valorBase: number;
  valorTabela?: number;
  formaCobranca: ServicoFormaCobranca;
  prazoPadraoDiasUteis: number;
  prazoMedioDias?: number;
  entregaveis: string[];
  modeloContratoPadraoId?: string;
  precosPorCliente?: PrecoNegociadoCliente[];
  ativo: boolean;
}

// ==========================================
// MODELOS DE CONTRATO (TEMPLATES COM VARIÁVEIS)
// ==========================================

export interface ModeloContrato {
  id: string;
  nome: string;
  descricao?: string;
  area?: string;
  corpo: string; // Suporta variáveis: {{escritorio.razao_social}}, {{advogado.nome}}, {{advogado.oab}}, {{processo.numero}}, {{servicos}}, {{valor_total}}, {{parcelas}}, {{data}}
  ativo: boolean;
  padrao?: boolean;
}

// ==========================================
// PROPOSTAS COMERCIAIS
// ==========================================

export interface PropostaItem {
  servicoId: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
  formaCobranca?: ServicoFormaCobranca;
  prazoDiasUteis?: number;
}

export interface Proposta {
  id: string;
  numeroProposta: string;
  oportunidadeId?: string;
  oportunidadeTitulo?: string;
  escritorioId: string;
  escritorioNome?: string;
  advogadoId?: string;
  advogadoNome?: string;
  advogadoOab?: string;
  periciandoId?: string;
  periciandoNome?: string;
  processoId?: string;
  processoNumero?: string;
  itens: PropostaItem[];
  valorTotal: number;
  parcelas: number;
  condicoesPagamento: string;
  validadeAte: string;
  dataCriacao: string;
  status: 'Rascunho' | 'Enviada' | 'Aceita' | 'Recusada';
  observacoes?: string;
  contratoGeradoId?: string;
}

// ==========================================
// CONTRATOS & ASSINATURA ELETRÔNICA
// ==========================================

export interface ServicoContratadoResumo {
  servicoId?: string;
  nome: string;
  valor: number;
  prazoDiasUteis?: number;
}

export interface Contrato {
  id: string;
  numeroContrato: string;
  propostaId?: string;
  oportunidadeId?: string;
  processoId?: string;
  processoNumero?: string;
  escritorioId: string;
  escritorioNome?: string;
  advogadoId?: string;
  advogadoNome?: string;
  advogadoOab?: string;
  periciandoId?: string;
  periciandoNome?: string;
  objeto: string;
  modeloId?: string;
  corpoConteudo: string; // Rich-text interpolado com variáveis
  servicos: ServicoContratadoResumo[];
  valorTotal: number;
  parcelas: number;
  formaPagamento: string;
  dataCriacao: string;
  dataEnvio?: string;
  dataAssinatura?: string;
  status: 'Rascunho' | 'Enviado' | 'Assinado' | 'Cancelado';
  provedorAssinatura?: 'ZapSign' | 'Clicksign' | 'D4Sign';
  tokenAssinatura?: string;
  linkAssinatura?: string;
  statusAssinatura?: 'Pendente' | 'Assinado' | 'Recusado';
  cobrancasGeradas?: boolean;
  ordensServicoGeradas?: boolean;
  documentoUrl?: string;
}

// ==========================================
// GESTÃO DOCUMENTAL & LGPD DE SAÚDE
// ==========================================

export type TipoDocumento = 
  | 'exame'
  | 'prontuario'
  | 'laudo_oficial'
  | 'parecer'
  | 'quesitos'
  | 'peticao'
  | 'procuracao'
  | 'contrato'
  | 'comprovante'
  | 'outro'
  | 'Prontuário Médico'
  | 'Exames Complementares'
  | 'Quesitos Iniciais'
  | 'Quesitos Suplementares'
  | 'Parecer Técnico Assistencial'
  | 'Laudo Pericial Oficial'
  | 'Impugnação ao Laudo'
  | 'Termo de Consentimento LGPD'
  | 'Proposta Comercial'
  | 'Contrato Assinado'
  | 'Comprovante / Alvará';

export interface VersaoDocumento {
  versao: number;
  dataUpload: string;
  tamanhoBytes: number;
  autorNome: string;
  urlMock: string;
  motivoRevisao?: string;
}

export interface Documento {
  id: string;
  processoId?: string;
  processoNumero?: string;
  periciandoId?: string;
  periciandoNome?: string;
  clienteId?: string; // Escritório ou cliente contratante
  clienteNome?: string;
  tipo: TipoDocumento;
  nomeArquivo: string;
  tamanhoBytes: number;
  dataUpload: string;
  urlMock: string;
  autorNome: string;
  versao: number;
  historicoVersoes?: VersaoDocumento[];
  sensivelSaude: boolean; // Flag LGPD Art. 11: Acesso restrito a usuários com permissão
  paginas?: number;
  conteudoTexto?: string; // Texto indexado para buscas e extração de IA
  cidMencionados?: string[];
  previewTipo?: 'pdf' | 'imagem' | 'texto';
}

// ==========================================
// IA: CRONOLOGIA CLÍNICA
// ==========================================

export interface CronologiaClinicaItem {
  id?: string;
  data: string; // Data do evento médico (ex: 2024-03-12 ou 12/03/2024)
  evento: string; // Descrição do atendimento, procedimento, cirurgia, queixa ou exame
  cid?: string; // CID-10 citado (ex: M54.5, S82.1)
  documentoOrigem: string; // Nome do documento fonte
  pagina: number | string; // Página do prontuário/laudo
  observacao?: string;
}

export interface Cobranca {
  id: string;
  processoId?: string;
  contratoId?: string;
  titulo: string;
  devedorNome: string;
  devedorTipo: 'Escritório' | 'Juízo / Tribunal' | 'Particular';
  valor: number;
  dataEmissao: string;
  vencimento: string;
  status: 'Pendente' | 'Paga' | 'Em Atraso' | 'Cancelada';
  metodo: 'Pix' | 'Boleto' | 'Depósito Judicial' | 'Transferência';
  codigoPixOuBarra?: string;
}

export interface Pagamento {
  id: string;
  cobrancaId: string;
  valorPago: number;
  dataPagamento: string;
  metodo: string;
  comprovanteUrl?: string;
}

export interface Despesa {
  id: string;
  processoId?: string;
  categoria: 'Deslocamento / Quilometragem' | 'Pedágio' | 'Hospedagem' | 'Alimentação' | 'Certidões / Cartório' | 'Material de Exame' | 'Software Forense';
  descricao: string;
  valor: number;
  data: string;
  reembolsavel: boolean;
  reembolsado: boolean;
  comprovanteUrl?: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente / Prazo Fatal';
  status: 'A Fazer' | 'Em Progresso' | 'Concluída';
  dataLimite: string;
  responsavelId: string;
  processoId?: string;
  periciaId?: string;
}

export interface Interacao {
  id: string;
  tipo: 'WhatsApp' | 'E-mail' | 'Ligação' | 'Reunião' | 'Nota Interna' | 'Andamento Processual' | 'Evento do Sistema';
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  titulo?: string;
  leadId?: string;
  escritorioId?: string;
  advogadoId?: string;
  periciandoId?: string;
  processoId?: string;
  descricao: string;
  statusEnvio?: 'Enviado' | 'Entregue' | 'Lido';
}

export interface Compromisso {
  id: string;
  titulo: string;
  dataInicio: string; // ISO string
  dataFim: string;    // ISO string
  tipo: 'Perícia Médica' | 'Reunião c/ Advogado' | 'Exame de Periciando' | 'Audiência / Esclarecimentos' | 'Prazo Fatal Processual';
  local?: string;
  processoId?: string;
  periciandoId?: string;
  modalidade: ModalidadeAtuacao;
  concluido: boolean;
}

export interface Campanha {
  id: string;
  nome: string;
  canal: 'WhatsApp' | 'E-mail' | 'LinkedIn';
  publicoAlvo: string;
  status: 'Rascunho' | 'Em Disparo' | 'Finalizada';
  enviados: number;
  taxaAbertura?: number;
  leadsGerados?: number;
  dataDisparo?: string;
}

export interface Automacao {
  id: string;
  nome: string;
  gatilho: string;
  acao: string;
  ativo: boolean;
  execucoesTotal: number;
  ultimaExecucao?: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'prazo' | 'pericia' | 'financeiro' | 'sistema';
  lida: boolean;
  dataHora: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioPapel: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  dataHora: string;
  detalhes?: string;
  isDadoSensivelSaude?: boolean; // Destacado conforme LGPD Art. 11
}
