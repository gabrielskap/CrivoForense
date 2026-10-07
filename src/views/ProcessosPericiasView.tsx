import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Stethoscope,
  Award,
  Search,
  Filter,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  CheckCircle2,
  FileText,
  Building,
  Navigation,
  RefreshCw,
  AlertTriangle,
  Scale,
  CalendarDays,
  User,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  MapPin,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Radar,
} from 'lucide-react';
import {
  processoRepository,
  periciaRepository,
  nomeacaoRepository,
  periciandoRepository,
  ordemDeServicoRepository,
  tarefaRepository,
  usuarioRepository,
  escritorioRepository,
  auditLogRepository,
} from '../services';
import {
  Processo,
  Pericia,
  Nomeacao,
  Periciando,
  OrdemDeServico,
  Tarefa,
  Usuario,
  Escritorio,
  ModalidadeAtuacao,
} from '../types';
import {
  formatProcesso,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../utils/formatters';
import { validarCnj } from '../utils/cnjValidator';
import {
  calcularPrazoDiasUteis,
  calcularDiasUteisRestantes,
  toIsoDate,
} from '../utils/calculadoraPrazos';
import { tribunaisAdapter, ConsultaProcessoJudicialResult } from '../integrations/tribunais';
import { googleMapsAdapter } from '../integrations/googleMaps';
import { NovoProcessoModal } from '../components/processos/NovoProcessoModal';
import { ProcessoDetailModal } from '../components/processos/ProcessoDetailModal';
import { CalculadoraPrazosModal } from '../components/processos/CalculadoraPrazosModal';
import { NovaOrdemServicoModal } from '../components/processos/NovaOrdemServicoModal';
import { NovaPericiaModal } from '../components/processos/NovaPericiaModal';
import { NovaNomeacaoModal } from '../components/processos/NovaNomeacaoModal';
import { PrazosTabContent } from '../components/processos/PrazosTabContent';
import { MonitoramentoJudicialTab } from '../components/processos/MonitoramentoJudicialTab';

export const ProcessosPericiasView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'processos';

  const [activeTab, setActiveTab] = useState<
    'processos' | 'pericias' | 'nomeacoes' | 'ordens_servico' | 'prazos' | 'monitoramento'
  >(initialTab);

  // Estados dos dados
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [nomeacoes, setNomeacoes] = useState<Nomeacao[]>([]);
  const [periciandos, setPericiandos] = useState<Periciando[]>([]);
  const [ordensDeServico, setOrdensDeServico] = useState<OrdemDeServico[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [escritorios, setEscritorios] = useState<Escritorio[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState<string>('todos');
  const [filtroTribunal, setFiltroTribunal] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Modais de Criação & Edição
  const [isNovoProcessoModalOpen, setIsNovoProcessoModalOpen] = useState(false);
  const [processoParaEditar, setProcessoParaEditar] = useState<Processo | undefined>(undefined);

  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);

  const [isCalculadoraModalOpen, setIsCalculadoraModalOpen] = useState(false);
  const [processoParaCalculadora, setProcessoParaCalculadora] = useState<Processo | undefined>(undefined);

  const [isNovaOsModalOpen, setIsNovaOsModalOpen] = useState(false);
  const [osParaEditar, setOsParaEditar] = useState<OrdemDeServico | undefined>(undefined);

  const [isNovaPericiaModalOpen, setIsNovaPericiaModalOpen] = useState(false);
  const [periciaParaEditar, setPericiaParaEditar] = useState<Pericia | undefined>(undefined);

  const [isNovaNomeacaoModalOpen, setIsNovaNomeacaoModalOpen] = useState(false);
  const [nomeacaoParaEditar, setNomeacaoParaEditar] = useState<Nomeacao | undefined>(undefined);

  // Consulta Tribunal Modal
  const [isConsultando, setIsConsultando] = useState(false);
  const [consultaResult, setConsultaResult] = useState<ConsultaProcessoJudicialResult | null>(null);

  const loadData = () => {
    Promise.all([
      processoRepository.getAll(),
      periciaRepository.getAll(),
      nomeacaoRepository.getAll(),
      periciandoRepository.getAll(),
      ordemDeServicoRepository.getAll(),
      tarefaRepository.getAll(),
      usuarioRepository.getAll(),
      escritorioRepository.getAll(),
    ]).then(([p, pe, n, per, os, t, u, esc]) => {
      setProcessos(p);
      setPericias(pe);
      setNomeacoes(n);
      setPericiandos(per);
      setOrdensDeServico(os);
      setTarefas(t);
      setUsuarios(u);
      setEscritorios(esc);
    });
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('novo') === 'true') {
      setIsNovoProcessoModalOpen(true);
    }
    if (searchParams.get('calculadora') === 'true') {
      setIsCalculadoraModalOpen(true);
    }
  }, [searchParams]);

  const handleTabChange = (
    tab: 'processos' | 'pericias' | 'nomeacoes' | 'ordens_servico' | 'prazos' | 'monitoramento'
  ) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleConsultarTribunal = async (cnj: string) => {
    setIsConsultando(true);
    try {
      const res = await tribunaisAdapter.consultarProcesso(cnj);
      setConsultaResult(res);
    } finally {
      setIsConsultando(false);
    }
  };

  // Contagem de prazos vencidos ou urgentes para o badge da tab
  const hoje = toIsoDate(new Date());
  const qtdPrazosCriticos = useMemo(() => {
    let count = 0;
    processos.forEach((p) => {
      if (p.marcosCpc) {
        p.marcosCpc.forEach((m) => {
          if (m.dataLimite && m.status !== 'Concluído') {
            const st = calcularDiasUteisRestantes(m.dataLimite, hoje, p.comarca);
            if (st.semaforo === 'vencido' || st.semaforo === 'alerta_3_dias') count++;
          }
        });
      }
    });
    return count;
  }, [processos, hoje]);

  const processosFiltrados = processos.filter((p) => {
    const matchBusca =
      p.numeroCnj.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.poloAtivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.poloPassivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.comarca.toLowerCase().includes(searchTerm.toLowerCase());

    const matchMod = filtroModalidade === 'todos' || p.modalidadeAtuacao === filtroModalidade;
    const matchTrib = filtroTribunal === 'todos' || p.tribunal === filtroTribunal;
    const matchStatus = filtroStatus === 'todos' || p.statusProcessual === filtroStatus;

    return matchBusca && matchMod && matchTrib && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Processos & Perícias Judiciais
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Gestão pericial do CPC (Lei 13.105/2015), cálculo de prazos em dias úteis e atuação como Assistente Técnica ou Perita Oficial.
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setProcessoParaCalculadora(undefined);
              setIsCalculadoraModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] text-[#b8a47c] border border-[#263040] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Scale className="w-4 h-4 text-[#b8a47c]" />
            Calculadora de Prazos CPC
          </button>

          <button
            onClick={() => {
              setOsParaEditar(undefined);
              setIsNovaOsModalOpen(true);
            }}
            className="px-3 py-2 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] text-[#5b9cd9] border border-[#263040] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Nova OS
          </button>

          <button
            onClick={() => {
              setPericiaParaEditar(undefined);
              setIsNovaPericiaModalOpen(true);
            }}
            className="px-3 py-2 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] text-[#e8e1d0] border border-[#263040] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Stethoscope className="w-4 h-4 text-[#b8a47c]" />
            Agendar Perícia
          </button>

          <button
            onClick={() => {
              setProcessoParaEditar(undefined);
              setIsNovoProcessoModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Novo Processo
          </button>
        </div>
      </div>

      {/* Tabs Principais de Navegação */}
      <div className="flex rounded-xl bg-[#12171f] border border-[#1b222d] p-1.5 overflow-x-auto text-xs">
        <button
          onClick={() => handleTabChange('processos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'processos'
              ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm font-semibold'
              : 'text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Processos Judiciais ({processos.length})
        </button>

        <button
          onClick={() => handleTabChange('pericias')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'pericias'
              ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm font-semibold'
              : 'text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Perícias Médicas ({pericias.length})
        </button>

        <button
          onClick={() => handleTabChange('nomeacoes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'nomeacoes'
              ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm font-semibold'
              : 'text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <Award className="w-4 h-4" />
          Nomeações do Juízo ({nomeacoes.length})
        </button>

        <button
          onClick={() => handleTabChange('ordens_servico')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'ordens_servico'
              ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm font-semibold'
              : 'text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Ordens de Serviço ({ordensDeServico.length})
        </button>

        <button
          onClick={() => handleTabChange('prazos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap relative ${
            activeTab === 'prazos'
              ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm font-semibold'
              : 'text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          Prazos CPC - 30 Dias (Semáforo)
          {qtdPrazosCriticos > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
              {qtdPrazosCriticos}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('monitoramento')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'monitoramento'
              ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm font-semibold'
              : 'text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <Radar className="w-4 h-4 text-[#b8a47c]" />
          Monitoramento Judicial (OABs & Tribunais)
        </button>
      </div>

      {/* Barra de Filtros e Busca (Aparece quando não está na aba Prazos nem Monitoramento que possuem controle próprio) */}
      {activeTab !== 'prazos' && activeTab !== 'monitoramento' && (
        <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#545c6b] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Nº CNJ, partes ou comarca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1b222d] border border-[#263040] rounded-lg pl-9 pr-3 py-2 text-[#f4efe3] placeholder-[#545c6b] focus:outline-none focus:border-[#b8a47c]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[#545c6b]">Modalidade:</span>
              <select
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="bg-[#1b222d] border border-[#263040] rounded-lg px-2.5 py-1.5 text-[#f4efe3] focus:outline-none"
              >
                <option value="todos">Todas</option>
                <option value="Assistente Técnica">Assistente Técnica (Banca)</option>
                <option value="Perita do Juízo">Perita do Juízo (Nomeada)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#545c6b]">Tribunal:</span>
              <select
                value={filtroTribunal}
                onChange={(e) => setFiltroTribunal(e.target.value)}
                className="bg-[#1b222d] border border-[#263040] rounded-lg px-2.5 py-1.5 text-[#f4efe3] focus:outline-none"
              >
                <option value="todos">Todos</option>
                <option value="TJSP">TJSP (São Paulo)</option>
                <option value="TRT-2">TRT-2 (SP Capital)</option>
                <option value="TRT-15">TRT-15 (Campinas)</option>
                <option value="TRF-3">TRF-3 (Federal SP)</option>
                <option value="TJTO">TJTO (Tocantins)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PROCESSOS JUDICIAIS */}
      {activeTab === 'processos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processosFiltrados.map((proc) => {
              const periciando = periciandos.find((p) => p.id === proc.periciandoId);
              const esc = escritorios.find((e) => e.id === proc.escritorioId);
              const isJuizo = proc.modalidadeAtuacao === 'Perita do Juízo';
              const validacaoCnj = validarCnj(proc.numeroCnj);

              // Próximo prazo
              const proximoPrazo = proc.proximaDataImportante || '2026-10-25';
              const statusPrazo = calcularDiasUteisRestantes(proximoPrazo, hoje, proc.comarca);

              return (
                <div
                  key={proc.id}
                  onClick={() => setSelectedProcessoId(proc.id)}
                  className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#b8a47c]/60 transition-all space-y-3.5 flex flex-col justify-between shadow-sm cursor-pointer group"
                >
                  <div className="space-y-3">
                    {/* Top Row: CNJ e Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs sm:text-sm font-bold text-[#5b9cd9] group-hover:text-[#b8a47c] transition-colors">
                            {formatProcesso(proc.numeroCnj)}
                          </span>
                          {validacaoCnj.valido && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                              ✓ DV Válido
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#545c6b] mt-0.5">
                          {proc.tribunal} • {proc.vara} • {proc.comarca}/{proc.uf || 'SP'}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                          isJuizo
                            ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                            : 'bg-[#b8a47c]/15 text-[#b8a47c] border-[#b8a47c]/30'
                        }`}
                      >
                        {proc.modalidadeAtuacao}
                      </span>
                    </div>

                    {/* Partes e Pólo Representado */}
                    <div className="p-3.5 rounded-lg bg-[#1b222d] border border-[#263040] text-xs space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#545c6b] shrink-0">Autor:</span>
                        <span className="font-semibold text-[#f4efe3] text-right truncate">
                          {proc.poloAtivo}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#545c6b] shrink-0">Réu:</span>
                        <span className="text-[#e8e1d0] text-right truncate">
                          {proc.poloPassivo}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-[#263040]/60 flex justify-between items-center text-[11px]">
                        <span className="text-[#545c6b]">Pólo Representado:</span>
                        <span className="font-semibold text-[#b8a47c]">
                          {proc.poloRepresentado || 'Autor'}
                        </span>
                      </div>
                    </div>

                    {/* Próximo Marco CPC com Semáforo */}
                    <div className="flex items-center justify-between text-xs bg-[#161c26] p-2.5 rounded-lg border border-[#263040]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#b8a47c]" />
                        <span className="text-[#545c6b]">Próximo Prazo:</span>
                        <span className="font-mono text-[#f4efe3] font-medium">
                          {formatDate(proximoPrazo)}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusPrazo.corBadge}`}
                      >
                        {statusPrazo.texto}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#545c6b]">
                      <span>Área: <strong className="text-[#e8e1d0]">{proc.area}</strong></span>
                      <span>Fase: <strong className="text-[#b8a47c]">{proc.statusProcessual}</strong></span>
                    </div>
                  </div>

                  {/* Footer Card */}
                  <div className="pt-3 border-t border-[#1b222d] flex items-center justify-between text-xs">
                    <span className="text-[#b8a47c] font-mono font-bold text-sm">
                      {formatCurrency(proc.honorariosAcordados)}
                    </span>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleConsultarTribunal(proc.numeroCnj)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#5b9cd9] text-[11px] transition-colors"
                        title="Consultar DataJud/PJe"
                      >
                        <RefreshCw className="w-3 h-3 text-[#5b9cd9]" />
                        PJe
                      </button>

                      <button
                        onClick={() => setSelectedProcessoId(proc.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#b8a47c]/15 hover:bg-[#b8a47c]/25 border border-[#b8a47c]/30 text-[#b8a47c] text-[11px] font-semibold transition-colors"
                      >
                        Ficha 360° →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PERÍCIAS MÉDICAS */}
      {activeTab === 'pericias' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pericias.map((per) => {
              const proc = processos.find((p) => p.id === per.processoId);
              const periciando = periciandos.find((p) => p.id === per.periciandoId);

              return (
                <div
                  key={per.id}
                  className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#263040] transition-colors space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/30">
                        {per.formatoAtendimento || 'Presencial'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b222d] text-[#5b9cd9] border border-[#263040]">
                        {per.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#f4efe3] font-bold">
                      <Clock className="w-3.5 h-3.5 text-[#b8a47c]" />
                      {formatDateTime(per.dataHora)}
                    </div>

                    <div className="text-xs text-[#e8e1d0]">
                      <span className="text-[#545c6b]">Examinando:</span>{' '}
                      <strong>{periciando?.nome || proc?.poloAtivo}</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#1b222d] text-xs text-[#545c6b] space-y-1">
                      <div className="text-[#e8e1d0] line-clamp-2">{per.local}</div>
                      <div className="text-[10px]">{per.cidade}/{per.uf} • {per.tipoLocal}</div>
                    </div>

                    {per.peritoJuizoNome && (
                      <div className="text-[11px] text-[#545c6b]">
                        Perito Oficial: <span className="text-[#e8e1d0]">{per.peritoJuizoNome}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#1b222d] flex items-center justify-between text-xs">
                    <a
                      href={googleMapsAdapter.gerarLinkRotaGoogleMaps('São Paulo, SP', per.local)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#5b9cd9] hover:underline text-[11px]"
                    >
                      <Navigation className="w-3 h-3" />
                      GPS / Rota
                    </a>

                    <button
                      onClick={() => {
                        setPericiaParaEditar(per);
                        setIsNovaPericiaModalOpen(true);
                      }}
                      className="text-[#b8a47c] hover:underline text-[11px] font-semibold"
                    >
                      Editar Perícia →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: NOMEAÇÕES DO JUÍZO (DRA. KARINE PERITA OFICIAL) */}
      {activeTab === 'nomeacoes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 text-purple-200/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-100">
                  Atuação como Perita Oficial do Juízo (Dra. Karine Reis):
                </span>{' '}
                Varas Cíveis, do Trabalho e Federais (TRF-3, TJSP, TJTO). Prazos de aceite de 5 dias úteis (Art. 465 CPC), fixação de honorários e alvarás judiciais.
              </div>
            </div>

            <button
              onClick={() => {
                setNomeacaoParaEditar(undefined);
                setIsNovaNomeacaoModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/50 text-purple-200 font-semibold text-xs transition-colors shrink-0"
            >
              + Nova Nomeação
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nomeacoes.map((nom) => {
              const proc = processos.find((p) => p.id === nom.processoId);

              return (
                <div
                  key={nom.id}
                  className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#263040] transition-colors space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-mono text-xs text-[#5b9cd9] font-medium">
                        {proc ? formatProcesso(proc.numeroCnj) : nom.vara}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/50 text-purple-300 border border-purple-800/40">
                        {nom.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#f4efe3] font-semibold">
                      {nom.vara} • {nom.comarca}
                    </div>

                    <div className="text-[11px] text-[#545c6b]">
                      Magistrado(a): <span className="text-[#e8e1d0]">{nom.juizNome}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#1b222d] text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#545c6b]">Honorários Fixados:</span>
                        <span className="font-mono font-semibold text-[#b8a47c]">
                          {formatCurrency(nom.honorariosFixados)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#545c6b]">Justiça Gratuita (JG):</span>
                        <span className={nom.justicaGratuita ? 'text-amber-300' : 'text-[#e8e1d0]'}>
                          {nom.justicaGratuita ? `Sim (Tabela ${formatCurrency(nom.valorTabelaJg)})` : 'Não (Particular)'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#545c6b]">Alvará Judicial:</span>
                        <span className="text-emerald-400 font-medium">{nom.alvaraStatus || 'Não expedido'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1b222d] flex items-center justify-between text-xs text-[#545c6b]">
                    <span>Data: {formatDate(nom.dataNomeacao)}</span>
                    <button
                      onClick={() => {
                        setNomeacaoParaEditar(nom);
                        setIsNovaNomeacaoModalOpen(true);
                      }}
                      className="text-[#b8a47c] hover:underline font-semibold"
                    >
                      Editar Nomeação →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ORDENS DE SERVIÇO */}
      {activeTab === 'ordens_servico' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-[#f4efe3]">
                Ordens de Serviço do Atendimento Pericial
              </h2>
              <p className="text-xs text-[#545c6b]">
                Análise documental, elaboração de quesitos, parecer técnico (Art. 477 §1º) e impugnações.
              </p>
            </div>
            <button
              onClick={() => {
                setOsParaEditar(undefined);
                setIsNovaOsModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Ordem de Serviço
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ordensDeServico.map((os) => {
              const proc = processos.find((p) => p.id === os.processoId);
              const user = usuarios.find((u) => u.id === os.responsavelId);

              const statusColor =
                os.status === 'Finalizada'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                  : os.status === 'Revisão Técnica'
                  ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/40';

              return (
                <div
                  key={os.id}
                  className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#263040] transition-colors space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-mono text-xs text-[#5b9cd9] font-medium truncate">
                        {proc ? formatProcesso(proc.numeroCnj) : 'Processo s/ número'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColor}`}>
                        {os.status}
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs text-[#f4efe3] line-clamp-1">
                      {os.titulo || os.tipo}
                    </h4>

                    <div className="text-[11px] text-[#b8a47c]">
                      {os.tipo}
                    </div>

                    <div className="p-3 rounded-lg bg-[#1b222d] text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#545c6b]">Responsável:</span>
                        <span className="text-[#e8e1d0] font-medium">{user?.nome || 'Equipe Técnica'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#545c6b]">Prazo Fatal:</span>
                        <span className="font-mono font-semibold text-[#f4efe3]">{formatDate(os.dataPrevisaoEntrega)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1b222d] flex items-center justify-between text-xs text-[#545c6b]">
                    <span className="font-mono text-[#b8a47c] font-bold">
                      {os.valor ? formatCurrency(os.valor) : '-'}
                    </span>
                    <button
                      onClick={() => {
                        setOsParaEditar(os);
                        setIsNovaOsModalOpen(true);
                      }}
                      className="text-[#b8a47c] hover:underline font-semibold"
                    >
                      Editar OS →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: PRAZOS CPC - 30 DIAS COM SEMÁFORO (TABELA E CALENDÁRIO) */}
      {activeTab === 'prazos' && (
        <PrazosTabContent
          processos={processos}
          pericias={pericias}
          nomeacoes={nomeacoes}
          ordensDeServico={ordensDeServico}
          tarefas={tarefas}
          usuarios={usuarios}
          onSelectProcesso={(p) => setSelectedProcessoId(p.id)}
          onAbrirCalculadora={(p) => {
            setProcessoParaCalculadora(p);
            setIsCalculadoraModalOpen(true);
          }}
          onConcluirPrazo={() => loadData()}
        />
      )}

      {/* TAB 6: MONITORAMENTO JUDICIAL (DATAJUD, DJEN & OABS MONITORADAS) */}
      {activeTab === 'monitoramento' && (
        <MonitoramentoJudicialTab
          onOpenProcesso={(id) => setSelectedProcessoId(id)}
          onOpenNovaNomeacao={() => {
            setNomeacaoParaEditar(undefined);
            setIsNovaNomeacaoModalOpen(true);
          }}
        />
      )}

      {/* MODAL DETALHE DO PROCESSO 360° */}
      {selectedProcessoId && (
        <ProcessoDetailModal
          processoId={selectedProcessoId}
          onClose={() => setSelectedProcessoId(null)}
          onUpdate={loadData}
          onEditProcesso={(proc) => {
            setProcessoParaEditar(proc);
            setIsNovoProcessoModalOpen(true);
          }}
        />
      )}

      {/* MODAL NOVO / EDITAR PROCESSO */}
      {isNovoProcessoModalOpen && (
        <NovoProcessoModal
          onClose={() => {
            setIsNovoProcessoModalOpen(false);
            setProcessoParaEditar(undefined);
          }}
          processoParaEditar={processoParaEditar}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* MODAL CALCULADORA DE PRAZOS CPC */}
      {isCalculadoraModalOpen && (
        <CalculadoraPrazosModal
          onClose={() => {
            setIsCalculadoraModalOpen(false);
            setProcessoParaCalculadora(undefined);
          }}
          processoPreSelecionado={processoParaCalculadora}
          processos={processos}
          onTarefaCriada={() => loadData()}
        />
      )}

      {/* MODAL NOVA / EDITAR ORDEM DE SERVIÇO */}
      {isNovaOsModalOpen && (
        <NovaOrdemServicoModal
          onClose={() => {
            setIsNovaOsModalOpen(false);
            setOsParaEditar(undefined);
          }}
          osParaEditar={osParaEditar}
          onSuccess={() => loadData()}
        />
      )}

      {/* MODAL NOVA / EDITAR PERÍCIA */}
      {isNovaPericiaModalOpen && (
        <NovaPericiaModal
          onClose={() => {
            setIsNovaPericiaModalOpen(false);
            setPericiaParaEditar(undefined);
          }}
          periciaParaEditar={periciaParaEditar}
          onSuccess={() => loadData()}
        />
      )}

      {/* MODAL NOVA / EDITAR NOMEAÇÃO */}
      {isNovaNomeacaoModalOpen && (
        <NovaNomeacaoModal
          onClose={() => {
            setIsNovaNomeacaoModalOpen(false);
            setNomeacaoParaEditar(undefined);
          }}
          nomeacaoParaEditar={nomeacaoParaEditar}
          onSuccess={() => loadData()}
        />
      )}

      {/* MODAL CONSULTA TRIBUNAL DATAJUD */}
      {consultaResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#5b9cd9]" />
                <h2 className="font-serif text-lg text-[#f4efe3]">
                  Consulta DataJud / Diário Oficial
                </h2>
              </div>
              <button
                onClick={() => setConsultaResult(null)}
                className="text-[#545c6b] hover:text-[#f4efe3]"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs text-[#e8e1d0]">
              <div className="p-3 rounded-lg bg-[#1b222d] border border-[#263040] space-y-1">
                <div className="font-mono text-[#5b9cd9] font-medium">
                  {formatProcesso(consultaResult.numeroCnj)}
                </div>
                <div className="text-[11px] text-[#545c6b]">
                  {consultaResult.tribunal} • {consultaResult.vara}
                </div>
              </div>

              <div>
                <span className="text-[#545c6b] block">Última Movimentação Detectada:</span>
                <p className="p-3 rounded-lg bg-[#161c26] text-amber-200/90 border border-amber-900/30 mt-1 leading-relaxed">
                  {consultaResult.movimentacoes && consultaResult.movimentacoes.length > 0
                    ? consultaResult.movimentacoes[0].descricao
                    : 'Processo sincronizado na base do tribunal.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[#545c6b] block">Magistrado</span>
                  <span className="text-[#f4efe3] font-medium">{consultaResult.juiz}</span>
                </div>
                <div>
                  <span className="text-[#545c6b] block">Perito Cadastrado</span>
                  <span className="text-[#b8a47c] font-medium">{consultaResult.peritoNomeado}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-[#263040] bg-[#161c26]">
              <button
                onClick={() => setConsultaResult(null)}
                className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692]"
              >
                Fechar Consulta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
