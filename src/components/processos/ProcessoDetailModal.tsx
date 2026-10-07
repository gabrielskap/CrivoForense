import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  Scale,
  Calendar,
  Clock,
  User,
  Building2,
  HeartPulse,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Stethoscope,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ChevronRight,
  Edit2,
  CheckSquare,
  Square,
  Sparkles,
  Search,
  Check,
  Radio,
  Bell,
  Info,
} from 'lucide-react';
import {
  Processo,
  Pericia,
  Nomeacao,
  OrdemDeServico,
  Periciando,
  Escritorio,
  Advogado,
  Usuario,
  MarcoCpc,
  MovimentacaoJudicial,
  ComunicacaoJudicial,
} from '../../types';
import {
  processoRepository,
  periciaRepository,
  ordemDeServicoRepository,
  periciandoRepository,
  escritorioRepository,
  advogadoRepository,
  usuarioRepository,
  tarefaRepository,
  auditLogRepository,
  movimentacaoJudicialRepository,
  comunicacaoJudicialRepository,
} from '../../services';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatProcesso,
} from '../../utils/formatters';
import { validarCnj } from '../../utils/cnjValidator';
import {
  calcularPrazoDiasUteis,
  calcularDiasUteisRestantes,
  toIsoDate,
} from '../../utils/calculadoraPrazos';
import {
  tribunaisAdapter,
  ConsultaProcessoJudicialResult,
  tribunaisManager,
} from '../../integrations/tribunais';
import { NovaOrdemServicoModal } from './NovaOrdemServicoModal';
import { NovaPericiaModal } from './NovaPericiaModal';

interface ProcessoDetailModalProps {
  processoId: string;
  onClose: () => void;
  onUpdate?: () => void;
  onEditProcesso?: (processo: Processo) => void;
}

export const ProcessoDetailModal: React.FC<ProcessoDetailModalProps> = ({
  processoId,
  onClose,
  onUpdate,
  onEditProcesso,
}) => {
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [periciando, setPericiando] = useState<Periciando | null>(null);
  const [escritorio, setEscritorio] = useState<Escritorio | null>(null);
  const [advogado, setAdvogado] = useState<Advogado | null>(null);
  const [responsavel, setResponsavel] = useState<Usuario | null>(null);
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [ordensDeServico, setOrdensDeServico] = useState<OrdemDeServico[]>([]);

  const [activeTab, setActiveTab] = useState<
    'visao_geral' | 'linha_tempo_cpc' | 'ordens_servico' | 'pericia' | 'movimentacoes'
  >('visao_geral');

  // Monitoramento e Movimentações Judiciais
  const [isConsultando, setIsConsultando] = useState(false);
  const [consultaResult, setConsultaResult] = useState<ConsultaProcessoJudicialResult | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoJudicial[]>([]);
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoJudicial[]>([]);
  const [filtroMov, setFiltroMov] = useState<'todos' | 'com_palavras' | 'nao_lidos'>('todos');
  const [expandedMovId, setExpandedMovId] = useState<string | null>(null);
  const [feedbackVarredura, setFeedbackVarredura] = useState<{
    tipo: 'sucesso' | 'info' | 'erro';
    mensagem: string;
  } | null>(null);

  // Modais de Criação
  const [isNovaOsOpen, setIsNovaOsOpen] = useState(false);
  const [isNovaPericiaOpen, setIsNovaPericiaOpen] = useState(false);

  // Estado para cálculo de prazo rápido na aba CPC
  const [prazoPersonalizadoDias, setPrazoPersonalizadoDias] = useState<number>(15);
  const [dataIntimacaoRapida, setDataIntimacaoRapida] = useState<string>(toIsoDate(new Date()));
  const [tarefaGeradaSucesso, setTarefaGeradaSucesso] = useState<string | null>(null);

  const loadData = async () => {
    const proc = await processoRepository.getById(processoId);
    if (!proc) return;
    setProcesso(proc);

    const [per, esc, adv, users, allPericias, allOs, movs, coms] = await Promise.all([
      proc.periciandoId ? periciandoRepository.getById(proc.periciandoId) : null,
      proc.escritorioId ? escritorioRepository.getById(proc.escritorioId) : null,
      proc.advogadoId ? advogadoRepository.getById(proc.advogadoId) : null,
      usuarioRepository.getAll(),
      periciaRepository.getAll(),
      ordemDeServicoRepository.getByProcesso(proc.id),
      movimentacaoJudicialRepository.getByNumeroCnj(proc.numeroCnj),
      comunicacaoJudicialRepository.getByProcesso(proc.id),
    ]);

    setPericiando(per);
    setEscritorio(esc);
    setAdvogado(adv);
    if (proc.responsavelId) {
      setResponsavel(users.find((u) => u.id === proc.responsavelId) || null);
    }
    setPericias(allPericias.filter((p) => p.processoId === proc.id));
    setOrdensDeServico(allOs);
    setMovimentacoes(movs);
    setComunicacoes(coms);

    // Auditoria de visualização
    auditLogRepository.logAccess({
      acao: 'Acesso a Detalhes do Processo Judicial',
      entidade: 'Processo',
      entidadeId: proc.id,
      detalhes: `Consulta da ficha completa do processo nº ${proc.numeroCnj}`,
      isDadoSensivelSaude: false,
    });
  };

  useEffect(() => {
    loadData();
  }, [processoId]);

  if (!processo) return null;

  const cnjInfo = validarCnj(processo.numeroCnj);

  // Ação de concluir ou alterar marco do CPC
  const handleAtualizarMarco = async (marcoId: string, novoStatus: MarcoCpc['status']) => {
    if (!processo.marcosCpc) return;

    const novosMarcos = processo.marcosCpc.map((m) => {
      if (m.id === marcoId) {
        return {
          ...m,
          status: novoStatus,
          dataConclusao: novoStatus === 'Concluído' ? toIsoDate(new Date()) : undefined,
        };
      }
      return m;
    });

    const atualizado = await processoRepository.update(processo.id, {
      marcosCpc: novosMarcos,
    });
    setProcesso(atualizado);
    if (onUpdate) onUpdate();
  };

  const handleGerarTarefaMarco = async (marco: MarcoCpc) => {
    const dataVenc = marco.dataLimite || toIsoDate(new Date());

    await tarefaRepository.create({
      titulo: `Cumprir Marco CPC: ${marco.nome} [${marco.artigoCpc}]`,
      descricao: `Prazo do processo nº ${processo.numeroCnj} (${processo.vara} - ${processo.comarca}). Observação: ${marco.observacoes || 'Acompanhamento do marco pericial.'}`,
      dataLimite: dataVenc,
      prioridade: 'Alta',
      status: 'A Fazer',
      responsavelId: processo.responsavelId || 'user_karine',
      processoId: processo.id,
    });

    setTarefaGeradaSucesso(marco.id);
    setTimeout(() => setTarefaGeradaSucesso(null), 3000);
  };

  // Rotina de verificação: busca novas movimentações no DataJud e atualiza linha do tempo
  const handleAtualizarAgora = async () => {
    setIsConsultando(true);
    setFeedbackVarredura(null);
    try {
      const res = await tribunaisManager.verificarMovimentacoesProcesso(processo.id);
      await loadData();
      if (onUpdate) onUpdate();

      if (res.novasMovimentacoes.length > 0) {
        setFeedbackVarredura({
          tipo: 'sucesso',
          mensagem: `Sincronização concluída! ${res.novasMovimentacoes.length} novo(s) andamento(s) capturado(s) e inserido(s) na linha do tempo do processo.`,
        });
      } else {
        setFeedbackVarredura({
          tipo: 'info',
          mensagem: 'Tribunal consultado. Todos os andamentos já estavam sincronizados.',
        });
      }
    } catch (err: any) {
      setFeedbackVarredura({
        tipo: 'erro',
        mensagem: `Erro na consulta com tribunais: ${err.message || 'Falha de comunicação'}`,
      });
    } finally {
      setIsConsultando(false);
    }
  };

  // Confirmação humana de sugestão pericial (REGRA: Nunca alterar prazo sem confirmação)
  const handleDecidirMarco = async (movId: string, aceitar: boolean) => {
    try {
      const res = await tribunaisManager.responderSugestaoMarco(processo.id, movId, aceitar);
      await loadData();
      if (onUpdate) onUpdate();
      setFeedbackVarredura({
        tipo: aceitar ? 'sucesso' : 'info',
        mensagem: res.mensagem,
      });
    } catch (err: any) {
      setFeedbackVarredura({
        tipo: 'erro',
        mensagem: err.message || 'Não foi possível registrar a decisão.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[94vh] bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b8a47c]/15 border border-[#b8a47c]/40 text-[#b8a47c] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-[#b8a47c]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm sm:text-base font-bold text-[#5b9cd9]">
                  {formatProcesso(processo.numeroCnj)}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/30">
                  {processo.modalidadeAtuacao}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b222d] text-[#e8e1d0] border border-[#263040]">
                  {processo.statusProcessual}
                </span>
              </div>
              <p className="text-xs text-[#545c6b] mt-0.5">
                {processo.tribunal} • {processo.vara} • {processo.comarca}/{processo.uf || 'SP'} • Área: {processo.area}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onEditProcesso && (
              <button
                onClick={() => {
                  onEditProcesso(processo);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-xs font-semibold text-[#b8a47c] flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Processo
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-[#263040] bg-[#12171f] px-6 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('visao_geral')}
            className={`py-3 px-3.5 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'visao_geral'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Visão Geral dos Autos
          </button>

          <button
            onClick={() => setActiveTab('linha_tempo_cpc')}
            className={`py-3 px-3.5 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'linha_tempo_cpc'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <Scale className="w-4 h-4" />
            Linha do Tempo Pericial CPC
            {processo.marcosCpc && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b222d] text-[#b8a47c]">
                {processo.marcosCpc.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ordens_servico')}
            className={`py-3 px-3.5 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'ordens_servico'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Ordens de Serviço ({ordensDeServico.length})
          </button>

          <button
            onClick={() => setActiveTab('pericia')}
            className={`py-3 px-3.5 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'pericia'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Perícia Médica ({pericias.length})
          </button>

          <button
            onClick={() => setActiveTab('movimentacoes')}
            className={`py-3 px-3.5 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'movimentacoes'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isConsultando ? 'animate-spin text-[#b8a47c]' : ''}`} />
            Movimentações ({movimentacoes.length})
            {movimentacoes.some(
              (m) =>
                m.sugestaoMarco &&
                !m.sugestaoMarco.confirmadoPeloUsuario &&
                !m.sugestaoMarco.descartado
            ) && (
              <span
                className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                title="Sugestão de marco pericial pendente de confirmação humana"
              />
            )}
          </button>
        </div>

        {/* Corpo da Ficha */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#e8e1d0]">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'visao_geral' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Partes e Pólos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
                  <div className="flex items-center justify-between text-[#545c6b]">
                    <span>Pólo Ativo (Autor / Reclamante):</span>
                    {processo.poloRepresentado === 'Autor' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#b8a47c]/15 text-[#b8a47c] font-semibold border border-[#b8a47c]/30">
                        Representado por Nós
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-sm text-[#f4efe3]">
                    {processo.poloAtivo}
                  </div>
                  {periciando && (
                    <div className="pt-2 border-t border-[#263040] text-[11px] text-[#5b9cd9] flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                      <span>Examinando: {periciando.nome} (CPF {periciando.cpf})</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
                  <div className="flex items-center justify-between text-[#545c6b]">
                    <span>Pólo Passivo (Réu / Reclamada):</span>
                    {processo.poloRepresentado === 'Réu' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#b8a47c]/15 text-[#b8a47c] font-semibold border border-[#b8a47c]/30">
                        Representado por Nós
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-sm text-[#f4efe3]">
                    {processo.poloPassivo}
                  </div>
                  <div className="pt-2 border-t border-[#263040] text-[11px] text-[#545c6b]">
                    Pólo geral representado no contrato: <strong className="text-[#e8e1d0]">{processo.poloRepresentado || 'Autor'}</strong>
                  </div>
                </div>
              </div>

              {/* Informações Processuais & Vínculos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
                  <span className="text-[11px] font-semibold text-[#b8a47c] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Escritório & Advogado
                  </span>
                  <div className="font-semibold text-[#f4efe3]">
                    {escritorio ? escritorio.razaoSocial : 'Contratação Particular'}
                  </div>
                  {advogado && (
                    <div className="text-[11px] text-[#545c6b]">
                      Patrono: <span className="text-[#e8e1d0]">{advogado.nome}</span> (OAB/{advogado.oabUf} nº {advogado.oabNumero})
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
                  <span className="text-[11px] font-semibold text-[#b8a47c] flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Perito do Juízo & Magistrado
                  </span>
                  <div className="text-[#f4efe3]">
                    {processo.peritoJuizoNome ? (
                      <span className="font-semibold text-amber-200">{processo.peritoJuizoNome}</span>
                    ) : (
                      <span className="text-[#545c6b]">Aguardando despacho de nomeação</span>
                    )}
                  </div>
                  {processo.juiz && (
                    <div className="text-[11px] text-[#545c6b]">
                      Juiz(a): <span className="text-[#e8e1d0]">{processo.juiz}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
                  <span className="text-[11px] font-semibold text-[#b8a47c] flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Valores & Honorários
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="text-[#545c6b]">Honorários Acordados:</span>
                    <span className="font-mono font-bold text-[#b8a47c] text-sm">
                      {formatCurrency(processo.honorariosAcordados)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#545c6b]">Valor da Causa:</span>
                    <span className="font-mono text-[#e8e1d0]">
                      {formatCurrency(processo.valorCausa)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalhes da Ação */}
              <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-2">
                <span className="text-[11px] font-semibold text-[#545c6b]">Especificações da Ação:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#545c6b] block text-[10px]">Classe Processual</span>
                    <span className="font-medium text-[#f4efe3]">{processo.classe || 'Não especificada'}</span>
                  </div>
                  <div>
                    <span className="text-[#545c6b] block text-[10px]">Assunto Principal</span>
                    <span className="font-medium text-[#f4efe3]">{processo.assunto || 'Perícia Médica'}</span>
                  </div>
                  <div>
                    <span className="text-[#545c6b] block text-[10px]">Data de Distribuição</span>
                    <span className="font-mono text-[#f4efe3]">{formatDate(processo.dataDistribuicao)}</span>
                  </div>
                  <div>
                    <span className="text-[#545c6b] block text-[10px]">Responsável Técnico</span>
                    <span className="font-medium text-[#b8a47c]">{responsavel?.nome || 'Dra. Karine Reis'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LINHA DO TEMPO PERICIAL COM OS MARCOS DO CPC */}
          {activeTab === 'linha_tempo_cpc' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#f4efe3] flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#b8a47c]" />
                    Linha do Tempo Pericial CPC (Lei nº 13.105/2015)
                  </h3>
                  <p className="text-[11px] text-[#545c6b] mt-0.5">
                    Controle de prazos preclusivos em dias úteis com exclusão de início, feriados e recesso.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#545c6b]">Comarca do Processo:</span>
                  <span className="px-2.5 py-1 rounded bg-[#12171f] font-semibold text-[#b8a47c] border border-[#263040]">
                    {processo.comarca}/{processo.uf || 'SP'}
                  </span>
                </div>
              </div>

              {/* Lista dos 8 Marcos do CPC */}
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#263040]">
                {(processo.marcosCpc || []).map((marco, idx) => {
                  const isConcluido = marco.status === 'Concluído';
                  const isEmAndamento = marco.status === 'Em Andamento';
                  const isVencido = marco.status === 'Atrasado';

                  return (
                    <div key={marco.id} className="relative group">
                      {/* Bolinha do Marco */}
                      <div
                        className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isConcluido
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : isEmAndamento
                            ? 'bg-amber-500 border-amber-300 text-black animate-pulse'
                            : isVencido
                            ? 'bg-rose-600 border-rose-400 text-white'
                            : 'bg-[#1b222d] border-[#323d4f] text-[#545c6b]'
                        }`}
                      >
                        {isConcluido ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <span className="text-[9px] font-bold">{idx + 1}</span>
                        )}
                      </div>

                      {/* Card do Marco */}
                      <div
                        className={`p-4 rounded-xl border transition-all space-y-2 ${
                          isEmAndamento
                            ? 'bg-[#1b222d] border-[#b8a47c] shadow-md'
                            : isConcluido
                            ? 'bg-[#161c26]/60 border-[#263040]'
                            : 'bg-[#12171f] border-[#1b222d]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-[#b8a47c] font-semibold block">
                              {marco.artigoCpc}
                            </span>
                            <h4 className="font-semibold text-xs sm:text-sm text-[#f4efe3]">
                              {marco.nome}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                                isConcluido
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                                  : isEmAndamento
                                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                                  : isVencido
                                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                                  : 'bg-[#1b222d] text-[#545c6b] border-[#263040]'
                              }`}
                            >
                              {marco.status}
                            </span>

                            {/* Atualizador rápido de status */}
                            <select
                              value={marco.status}
                              onChange={(e) =>
                                handleAtualizarMarco(marco.id, e.target.value as any)
                              }
                              className="bg-[#12171f] border border-[#263040] rounded px-2 py-0.5 text-[10px] text-[#f4efe3] focus:outline-none"
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Em Andamento">Em Andamento</option>
                              <option value="Concluído">Concluído</option>
                              <option value="Atrasado">Atrasado</option>
                            </select>
                          </div>
                        </div>

                        {/* Detalhes de Prazos do Marco */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-[#545c6b]">
                          {marco.prazoDiasUteis && (
                            <div>
                              <span>Prazo Legal: </span>
                              <strong className="text-[#b8a47c]">{marco.prazoDiasUteis} dias úteis</strong>
                            </div>
                          )}
                          {marco.dataLimite && (
                            <div>
                              <span>Data Fatal: </span>
                              <strong className="text-[#f4efe3] font-mono">{formatDate(marco.dataLimite)}</strong>
                            </div>
                          )}
                          {marco.dataConclusao && (
                            <div>
                              <span>Concluído em: </span>
                              <strong className="text-emerald-400 font-mono">{formatDate(marco.dataConclusao)}</strong>
                            </div>
                          )}
                        </div>

                        {marco.observacoes && (
                          <p className="text-[11px] text-[#e8e1d0]/80 italic pt-1">
                            &quot;{marco.observacoes}&quot;
                          </p>
                        )}

                        {/* Botão Gerar Tarefa / Alerta para o Marco */}
                        <div className="pt-2 border-t border-[#263040]/50 flex items-center justify-between">
                          <span className="text-[10px] text-[#545c6b]">
                            Gera lembrete na agenda e na central de tarefas
                          </span>
                          <div className="flex items-center gap-2">
                            {tarefaGeradaSucesso === marco.id && (
                              <span className="text-emerald-400 text-[10px] font-semibold">
                                ✓ Tarefa Gerada!
                              </span>
                            )}
                            <button
                              onClick={() => handleGerarTarefaMarco(marco)}
                              className="px-2.5 py-1 rounded bg-[#1b222d] hover:bg-[#232c3a] text-[#b8a47c] border border-[#263040] text-[11px] font-medium transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Gerar Tarefa & Alerta
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ORDENS DE SERVIÇO */}
          {activeTab === 'ordens_servico' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#f4efe3]">
                    Ordens de Serviço do Processo
                  </h3>
                  <p className="text-[11px] text-[#545c6b]">
                    Análise documental, elaboração de quesitos, parecer técnico e impugnações.
                  </p>
                </div>
                <button
                  onClick={() => setIsNovaOsOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Ordem de Serviço
                </button>
              </div>

              {ordensDeServico.length === 0 ? (
                <div className="p-8 text-center bg-[#161c26] rounded-xl border border-[#263040] space-y-2">
                  <FileText className="w-8 h-8 text-[#545c6b] mx-auto" />
                  <p className="text-xs text-[#545c6b]">
                    Nenhuma ordem de serviço cadastrada para este processo ainda.
                  </p>
                  <button
                    onClick={() => setIsNovaOsOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1b222d] text-[#b8a47c] border border-[#263040] text-xs font-semibold hover:bg-[#232c3a]"
                  >
                    Criar Primeira OS
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ordensDeServico.map((os) => {
                    const statusClass =
                      os.status === 'Finalizada'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                        : os.status === 'Revisão Técnica'
                        ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                        : 'bg-amber-950/40 text-amber-300 border-amber-800/40';

                    return (
                      <div
                        key={os.id}
                        className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-xs text-[#f4efe3]">
                              {os.titulo || os.tipo}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${statusClass}`}>
                              {os.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#b8a47c]">
                            {os.tipo}
                          </div>

                          {os.anotacoes && (
                            <p className="text-[11px] text-[#e8e1d0]/80 italic line-clamp-2">
                              &quot;{os.anotacoes}&quot;
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#263040] flex items-center justify-between text-[11px] text-[#545c6b]">
                          <span>Prazo: <strong className="text-[#f4efe3] font-mono">{formatDate(os.dataPrevisaoEntrega)}</strong></span>
                          {os.valor && (
                            <span className="font-mono text-[#b8a47c] font-semibold">
                              {formatCurrency(os.valor)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PERÍCIA MÉDICA */}
          {activeTab === 'pericia' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#f4efe3]">
                    Exame Médico Pericial Designado
                  </h3>
                  <p className="text-[11px] text-[#545c6b]">
                    Data/hora, endereço físico/link, checklist de preparação e resultado.
                  </p>
                </div>
                <button
                  onClick={() => setIsNovaPericiaOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agendar Perícia
                </button>
              </div>

              {pericias.length === 0 ? (
                <div className="p-8 text-center bg-[#161c26] rounded-xl border border-[#263040] space-y-2">
                  <Stethoscope className="w-8 h-8 text-[#545c6b] mx-auto" />
                  <p className="text-xs text-[#545c6b]">
                    Nenhuma perícia médica agendada nos autos ainda.
                  </p>
                  <button
                    onClick={() => setIsNovaPericiaOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1b222d] text-[#b8a47c] border border-[#263040] text-xs font-semibold hover:bg-[#232c3a]"
                  >
                    Agendar Exame Pericial
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pericias.map((per) => (
                    <div
                      key={per.id}
                      className="p-5 rounded-xl bg-[#161c26] border border-[#263040] space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#f4efe3] flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#b8a47c]" />
                            {formatDateTime(per.dataHora)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b222d] text-[#b8a47c] border border-[#b8a47c]/30 font-semibold">
                            {per.formatoAtendimento || 'Presencial'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b222d] text-[#5b9cd9] border border-[#263040]">
                            Status: {per.status}
                          </span>
                          {per.resultado && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                              Resultado: {per.resultado}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#12171f] border border-[#263040] space-y-1.5 text-xs">
                        <div className="flex items-start gap-1.5 text-[#e8e1d0]">
                          <MapPin className="w-4 h-4 text-[#b8a47c] shrink-0 mt-0.5" />
                          <span>{per.local}</span>
                        </div>
                        {per.linkVideochamada && (
                          <div className="text-[11px] text-[#5b9cd9] pt-1">
                            Link: <a href={per.linkVideochamada} target="_blank" rel="noreferrer" className="underline">{per.linkVideochamada}</a>
                          </div>
                        )}
                        <div className="text-[11px] text-[#545c6b]">
                          Perito Judicial: <strong className="text-[#e8e1d0]">{per.peritoJuizoNome || 'A definir'}</strong> • Assistente Dra. Karine: <strong className="text-[#b8a47c]">{per.comparecimentoAssistente ? 'Sim (Presença Confirmada)' : 'Apenas Parecer'}</strong>
                        </div>
                      </div>

                      {/* Checklist */}
                      {per.checklist && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-[#b8a47c]">
                            Checklist de Preparação:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              {per.checklist.documentosRevisados ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>Documentos revisados</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {per.checklist.quesitosProtocolados ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>Quesitos protocolados</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {per.checklist.deslocamentoConfirmado ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>Deslocamento confirmado</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {per.checklist.periciandoOrientado ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>Periciando orientado</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {per.checklist.kitExamePreparado ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>Kit exame e CRM prontos</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MOVIMENTAÇÕES JUDICIAIS, DATAJUD & DJEN */}
          {activeTab === 'movimentacoes' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Cabeçalho da Aba com botão Atualizar Agora e status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#161c26] border border-[#263040] gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-sm font-semibold text-[#f4efe3]">
                      Histórico de Movimentações & DJEN
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      DataJud (CNJ) Conectado
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#1b222d] text-[#b8a47c] border border-[#263040]">
                      Comunica PJe / DJEN
                    </span>
                  </div>
                  <p className="text-[11px] text-[#545c6b]">
                    Última verificação oficial:{' '}
                    <strong className="text-[#e8e1d0]">
                      {processo.ultimaVerificacaoTribunal
                        ? formatDateTime(processo.ultimaVerificacaoTribunal)
                        : 'Nunca verificado'}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleAtualizarAgora}
                    disabled={isConsultando}
                    className="px-4 py-2 rounded-lg bg-[#b8a47c] hover:bg-[#c7b692] disabled:opacity-60 text-[#0a0e14] font-semibold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConsultando ? 'animate-spin' : ''}`} />
                    {isConsultando ? 'Consultando Tribunais...' : 'Atualizar agora'}
                  </button>
                </div>
              </div>

              {/* Feedback de Sincronização */}
              {feedbackVarredura && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
                    feedbackVarredura.tipo === 'sucesso'
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                      : feedbackVarredura.tipo === 'erro'
                      ? 'bg-red-950/30 border-red-800/50 text-red-200'
                      : 'bg-sky-950/30 border-sky-800/50 text-sky-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {feedbackVarredura.tipo === 'sucesso' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {feedbackVarredura.tipo === 'erro' && (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    {feedbackVarredura.tipo === 'info' && (
                      <Info className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                    <span>{feedbackVarredura.mensagem}</span>
                  </div>
                  <button
                    onClick={() => setFeedbackVarredura(null)}
                    className="text-[#545c6b] hover:text-[#f4efe3] text-[11px]"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* ALERTA DE PALAVRAS-CHAVE: SUGESTÃO DE MARCO PERICIAL COM CONFIRMAÇÃO HUMANA OBRIGATÓRIA */}
              {movimentacoes
                .filter(
                  (m) =>
                    m.sugestaoMarco &&
                    !m.sugestaoMarco.confirmadoPeloUsuario &&
                    !m.sugestaoMarco.descartado
                )
                .map((movComSugestao) => (
                  <div
                    key={`sugestao_${movComSugestao.id}`}
                    className="p-4 rounded-xl bg-[#1b222d] border border-amber-600/40 space-y-3 shadow-lg animate-in slide-in-from-top-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-xs text-amber-300">
                              Sugestão de Marco Pericial Detectada por Palavra-Chave
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800/50">
                              Gatilho: "{movComSugestao.sugestaoMarco?.palavraChaveGatilho}"
                            </span>
                          </div>
                          <p className="text-[11px] text-[#b8a47c] mt-0.5">
                            Movimentação de {formatDate(movComSugestao.dataHora)}: "{movComSugestao.titulo}"
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-800/40 whitespace-nowrap">
                        Confirmação Humana Exigida
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#12171f] border border-[#263040] text-xs space-y-2">
                      <p className="text-[#f4efe3] leading-relaxed">
                        {movComSugestao.sugestaoMarco?.motivo}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-[#545c6b] flex-wrap pt-1 border-t border-[#263040]">
                        <span>
                          Marco Sugerido:{' '}
                          <strong className="text-[#f4efe3]">
                            {movComSugestao.sugestaoMarco?.nomeMarco}
                          </strong>
                        </span>
                        <span>
                          Fundamentação:{' '}
                          <strong className="text-[#b8a47c]">
                            {movComSugestao.sugestaoMarco?.artigoCpc}
                          </strong>
                        </span>
                        <span>
                          Prazo Sugerido:{' '}
                          <strong className="text-amber-300">
                            {movComSugestao.sugestaoMarco?.prazoDiasUteis} dias úteis
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#545c6b]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          Diretriz de Segurança: O prazo e o marco NUNCA são alterados sem sua aprovação explícita.
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleDecidirMarco(movComSugestao.id, false)}
                          className="px-3 py-1.5 rounded-lg bg-[#12171f] hover:bg-[#161c26] border border-[#263040] text-[11px] text-[#545c6b] hover:text-[#f4efe3] transition-colors"
                        >
                          ✕ Descartar Sugestão
                        </button>
                        <button
                          onClick={() => handleDecidirMarco(movComSugestao.id, true)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirmar e Aplicar Marco
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Filtros e Quantitativo de Movimentações */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFiltroMov('todos')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filtroMov === 'todos'
                        ? 'bg-[#b8a47c] text-[#0a0e14]'
                        : 'bg-[#161c26] text-[#545c6b] hover:text-[#f4efe3] border border-[#263040]'
                    }`}
                  >
                    Todas ({movimentacoes.length})
                  </button>
                  <button
                    onClick={() => setFiltroMov('com_palavras')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filtroMov === 'com_palavras'
                        ? 'bg-[#b8a47c] text-[#0a0e14]'
                        : 'bg-[#161c26] text-[#545c6b] hover:text-[#f4efe3] border border-[#263040]'
                    }`}
                  >
                    Com Termos Periciais (
                    {
                      movimentacoes.filter(
                        (m) => m.palavrasChaveDetectadas && m.palavrasChaveDetectadas.length > 0
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setFiltroMov('nao_lidos')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filtroMov === 'nao_lidos'
                        ? 'bg-[#b8a47c] text-[#0a0e14]'
                        : 'bg-[#161c26] text-[#545c6b] hover:text-[#f4efe3] border border-[#263040]'
                    }`}
                  >
                    Não Lidas ({movimentacoes.filter((m) => !m.lido).length})
                  </button>
                </div>

                <span className="text-[11px] text-[#545c6b]">
                  {movimentacoes.length} andamento(s) catalogado(s) neste processo
                </span>
              </div>

              {/* Lista Cronológica de Movimentações */}
              <div className="space-y-3">
                {movimentacoes
                  .filter((m) => {
                    if (filtroMov === 'com_palavras') {
                      return m.palavrasChaveDetectadas && m.palavrasChaveDetectadas.length > 0;
                    }
                    if (filtroMov === 'nao_lidos') {
                      return !m.lido;
                    }
                    return true;
                  })
                  .map((mov, idx) => {
                    const isExpanded = expandedMovId === mov.id;

                    return (
                      <div
                        key={mov.id || idx}
                        className={`p-4 rounded-xl border transition-all ${
                          mov.sugestaoMarco && !mov.sugestaoMarco.descartado
                            ? 'bg-[#161c26] border-amber-900/40 hover:border-amber-700/60'
                            : 'bg-[#161c26] border-[#263040] hover:border-[#344257]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#f4efe3] text-xs">
                                {mov.titulo}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#1b222d] text-[#5b9cd9] border border-[#263040]">
                                {mov.fonte}
                              </span>
                              {mov.codigoMovimentoCnj && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1b222d] text-[#545c6b]">
                                  Cód. {mov.codigoMovimentoCnj}
                                </span>
                              )}
                              {!mov.lido && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                                  Novo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#e8e1d0] leading-relaxed">
                              {mov.descricao}
                            </p>
                          </div>

                          <span className="font-mono text-[11px] text-[#545c6b] whitespace-nowrap self-start">
                            {formatDateTime(mov.dataHora)}
                          </span>
                        </div>

                        {/* Badges de Palavras-Chave Detectadas */}
                        {mov.palavrasChaveDetectadas && mov.palavrasChaveDetectadas.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-2 mt-2 border-t border-[#263040]/60">
                            <span className="text-[10px] text-[#545c6b] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              Palavras-chave:
                            </span>
                            {mov.palavrasChaveDetectadas.map((kw) => (
                              <span
                                key={kw}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/30 text-amber-300 border border-amber-800/40"
                              >
                                {kw}
                              </span>
                            ))}

                            {mov.sugestaoMarco?.confirmadoPeloUsuario && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center gap-1 ml-auto">
                                <Check className="w-3 h-3" />
                                Marco Aplicado
                              </span>
                            )}
                            {mov.sugestaoMarco?.descartado && (
                              <span className="px-2 py-0.5 rounded text-[10px] text-[#545c6b] ml-auto">
                                Sugestão Descartada
                              </span>
                            )}
                          </div>
                        )}

                        {/* Expansor de Conteúdo Integral */}
                        {mov.conteudoCompleto && (
                          <div className="mt-2 pt-2 border-t border-[#263040]/40">
                            <button
                              onClick={() => setExpandedMovId(isExpanded ? null : mov.id)}
                              className="text-[11px] text-[#5b9cd9] hover:underline flex items-center gap-1"
                            >
                              {isExpanded ? 'Ocultar teor integral' : 'Ver teor integral da movimentação / certidão'}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-3 rounded-lg bg-[#12171f] border border-[#263040] text-[11px] text-[#e8e1d0] whitespace-pre-wrap leading-relaxed font-sans">
                                {mov.conteudoCompleto}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {movimentacoes.length === 0 && (
                  <div className="p-8 text-center rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
                    <RefreshCw className="w-8 h-8 text-[#545c6b] mx-auto opacity-50" />
                    <p className="text-xs text-[#545c6b]">
                      Nenhuma movimentação registrada localmente para este processo.
                    </p>
                    <button
                      onClick={handleAtualizarAgora}
                      disabled={isConsultando}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#5b9cd9] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors mt-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isConsultando ? 'animate-spin' : ''}`} />
                      Consultar DataJud e PJe Agora
                    </button>
                  </div>
                )}
              </div>

              {/* Publicações / Intimações Vinculadas do DJEN */}
              {comunicacoes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#263040]">
                  <h4 className="font-serif text-xs font-semibold text-[#f4efe3] flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#b8a47c]" />
                    Intimações e Publicações no DJEN deste Processo ({comunicacoes.length})
                  </h4>

                  <div className="space-y-2">
                    {comunicacoes.map((com) => (
                      <div
                        key={com.id}
                        className="p-3.5 rounded-lg bg-[#161c26] border border-[#263040] space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#f4efe3]">
                            {com.tipo} • {com.meio}
                          </span>
                          <span className="text-[#545c6b] font-mono">
                            Disponibilizado: {formatDate(com.dataDisponibilizacao)}
                          </span>
                        </div>
                        <p className="text-xs text-[#e8e1d0] leading-relaxed">
                          {com.teorResumido}
                        </p>
                        {com.destinatarioNome && (
                          <div className="text-[10px] text-[#545c6b]">
                            Destinatário: <strong className="text-[#b8a47c]">{com.destinatarioNome}</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#263040] bg-[#161c26]">
          <span className="text-[11px] text-[#545c6b]">
            Dra. Karine Reis • CRM/SP 235.821 • CRM/TO 6.385 • Crivo Forense
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors"
          >
            Fechar Ficha
          </button>
        </div>
      </div>

      {/* Modal Nova OS */}
      {isNovaOsOpen && (
        <NovaOrdemServicoModal
          onClose={() => setIsNovaOsOpen(false)}
          processoIdFixo={processo.id}
          onSuccess={() => {
            loadData();
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {/* Modal Nova Pericia */}
      {isNovaPericiaOpen && (
        <NovaPericiaModal
          onClose={() => setIsNovaPericiaOpen(false)}
          processoIdFixo={processo.id}
          onSuccess={() => {
            loadData();
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
};
