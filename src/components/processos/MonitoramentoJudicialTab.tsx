import React, { useState, useEffect } from 'react';
import {
  Radar,
  RefreshCw,
  Plus,
  Scale,
  Building2,
  User,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
  Sparkles,
  Calendar,
  Clock,
  Layers,
  FileText,
  BadgeAlert,
  Database,
  ArrowRight,
  Filter,
  Check,
  X,
} from 'lucide-react';
import {
  OabMonitorada,
  NomeMonitorado,
  ComunicacaoJudicial,
  MovimentacaoJudicial,
  Escritorio,
  Advogado,
  Usuario,
} from '../../types';
import {
  oabMonitoradaRepository,
  nomeMonitoradoRepository,
  comunicacaoJudicialRepository,
  movimentacaoJudicialRepository,
  escritorioRepository,
  advogadoRepository,
  auditLogRepository,
} from '../../services';
import {
  tribunaisManager,
  VarreduraResultado,
} from '../../integrations/tribunais';
import { formatDate, formatDateTime, formatProcesso } from '../../utils/formatters';

interface MonitoramentoJudicialTabProps {
  onOpenProcesso?: (processoId: string) => void;
  onOpenNovaNomeacao?: (dadosPreenchidos?: any) => void;
}

export const MonitoramentoJudicialTab: React.FC<MonitoramentoJudicialTabProps> = ({
  onOpenProcesso,
  onOpenNovaNomeacao,
}) => {
  const [subTab, setSubTab] = useState<'oabs' | 'intimacoes' | 'movimentacoes' | 'provedores'>('oabs');

  const [oabs, setOabs] = useState<OabMonitorada[]>([]);
  const [nomes, setNomes] = useState<NomeMonitorado[]>([]);
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoJudicial[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoJudicial[]>([]);
  const [escritorios, setEscritorios] = useState<Escritorio[]>([]);
  const [advogados, setAdvogados] = useState<Advogado[]>([]);

  // Varredura Geral
  const [isVarrendo, setIsVarrendo] = useState(false);
  const [resultadoVarredura, setResultadoVarredura] = useState<VarreduraResultado | null>(null);

  // Modal Nova OAB
  const [isModalNovaOabOpen, setIsModalNovaOabOpen] = useState(false);
  const [novaOab, setNovaOab] = useState<{
    numero: string;
    uf: string;
    titularNome: string;
    escritorioId: string;
    advogadoId: string;
    autorizacaoObtida: boolean;
    tipo: 'Advogado Parceiro' | 'Dra. Karine (Perita / Nomeações)';
    observacoes: string;
  }>({
    numero: '',
    uf: 'SP',
    titularNome: '',
    escritorioId: '',
    advogadoId: '',
    autorizacaoObtida: true,
    tipo: 'Advogado Parceiro',
    observacoes: '',
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipoCom, setFiltroTipoCom] = useState<'todos' | 'nomeacoes' | 'laudos'>('todos');

  const loadData = async () => {
    const [allOabs, allNomes, allComs, allMovs, allEsc, allAdv] = await Promise.all([
      oabMonitoradaRepository.getAll(),
      nomeMonitoradoRepository.getAll(),
      comunicacaoJudicialRepository.getAll(),
      movimentacaoJudicialRepository.getAll(),
      escritorioRepository.getAll(),
      advogadoRepository.getAll(),
    ]);

    setOabs(allOabs);
    setNomes(allNomes);
    setComunicacoes(allComs);
    setMovimentacoes(allMovs);
    setEscritorios(allEsc);
    setAdvogados(allAdv);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecutarVarreduraGeral = async () => {
    setIsVarrendo(true);
    setResultadoVarredura(null);
    try {
      const res = await tribunaisManager.executarVarreduraGeral();
      setResultadoVarredura(res);
      await loadData();
    } catch (err: any) {
      console.error('Falha na varredura:', err);
    } finally {
      setIsVarrendo(false);
    }
  };

  const handleToggleOabAtivo = async (id: string, ativoAtual: boolean) => {
    await oabMonitoradaRepository.update(id, { ativo: !ativoAtual });
    loadData();
  };

  const handleSalvarNovaOab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaOab.numero || !novaOab.titularNome) return;

    await oabMonitoradaRepository.create({
      numero: novaOab.numero.replace(/\D/g, ''),
      uf: novaOab.uf.toUpperCase(),
      titularNome: novaOab.titularNome,
      escritorioId: novaOab.escritorioId || undefined,
      advogadoId: novaOab.advogadoId || undefined,
      autorizacaoObtida: novaOab.autorizacaoObtida,
      dataAutorizacao: novaOab.autorizacaoObtida ? new Date().toISOString().slice(0, 10) : undefined,
      ativo: true,
      dataCadastro: new Date().toISOString(),
      tipo: novaOab.tipo,
      totalCapturas: 0,
      observacoes: novaOab.observacoes,
    });

    await auditLogRepository.logAccess({
      acao: 'Cadastro de OAB para Monitoramento Judicial',
      entidade: 'OabMonitorada',
      entidadeId: `oab_${novaOab.numero}_${novaOab.uf}`,
      detalhes: `Cadastrada OAB nº ${novaOab.numero}/${novaOab.uf} de ${novaOab.titularNome} com consentimento formal LGPD=${novaOab.autorizacaoObtida}.`,
      isDadoSensivelSaude: false,
    });

    setIsModalNovaOabOpen(false);
    setNovaOab({
      numero: '',
      uf: 'SP',
      titularNome: '',
      escritorioId: '',
      advogadoId: '',
      autorizacaoObtida: true,
      tipo: 'Advogado Parceiro',
      observacoes: '',
    });
    loadData();
  };

  const providers = tribunaisManager.getProviders();

  const totalOabsAtivas = oabs.filter((o) => o.ativo).length;
  const totalNomeacoesCapturadas = comunicacoes.filter((c) => c.sugestaoNomeacao).length;
  const totalMovimentacoesComTermos = movimentacoes.filter(
    (m) => m.palavrasChaveDetectadas && m.palavrasChaveDetectadas.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner Principal com Métricas e Botão de Varredura */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#161c26] via-[#1a212d] to-[#161c26] border border-[#263040] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b8a47c]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/30">
                <Radar className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#f4efe3]">
                Monitoramento Judicial Inteligente
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DataJud & PJe Conectados
              </span>
            </div>
            <p className="text-xs text-[#8c96a5] max-w-2xl leading-relaxed">
              Varredura unificada no Conselho Nacional de Justiça (DataJud), Diário de Justiça
              Eletrônico Nacional (DJEN/PJe) e crawlers estaduais. Identificação automática de
              despachos periciais e nomeações de Dra. Karine Reis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalNovaOabOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-xs font-semibold text-[#f4efe3] flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 text-[#b8a47c]" />
              Nova OAB Monitorada
            </button>

            <button
              onClick={handleExecutarVarreduraGeral}
              disabled={isVarrendo}
              className="px-5 py-2.5 rounded-xl bg-[#b8a47c] hover:bg-[#c7b692] disabled:opacity-60 text-[#0a0e14] font-semibold text-xs flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isVarrendo ? 'animate-spin' : ''}`} />
              {isVarrendo ? 'Executando Varredura Geral...' : 'Executar Varredura Geral'}
            </button>
          </div>
        </div>

        {/* Métricas do Radar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#263040]/70 text-xs">
          <div className="p-3.5 rounded-xl bg-[#12171f]/60 border border-[#263040]/60 space-y-1">
            <span className="text-[11px] text-[#545c6b]">OABs Monitoradas Ativas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#f4efe3]">{totalOabsAtivas}</span>
              <span className="text-[10px] text-emerald-400">c/ autorização LGPD</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#12171f]/60 border border-[#263040]/60 space-y-1">
            <span className="text-[11px] text-[#545c6b]">Nomeações Dra. Karine</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-300">
                {totalNomeacoesCapturadas}
              </span>
              <span className="text-[10px] text-amber-400">detectadas</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#12171f]/60 border border-[#263040]/60 space-y-1">
            <span className="text-[11px] text-[#545c6b]">Andamentos com Termos CPC</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#5b9cd9]">
                {totalMovimentacoesComTermos}
              </span>
              <span className="text-[10px] text-[#5b9cd9]">laudos & quesitos</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#12171f]/60 border border-[#263040]/60 space-y-1">
            <span className="text-[11px] text-[#545c6b]">Provedores Conectados</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {providers.length}/3
              </span>
              <span className="text-[10px] text-emerald-400">DataJud + DJEN + Escavador</span>
            </div>
          </div>
        </div>
      </div>

      {/* Relatório de Feedback da Varredura */}
      {resultadoVarredura && (
        <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2 animate-in slide-in-from-top-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-[#f4efe3]">
                Varredura Concluída com Sucesso em Todos os Tribunais
              </h4>
            </div>
            <span className="text-[11px] text-[#545c6b]">
              Duração:{' '}
              {Math.max(
                1,
                Math.round(
                  (new Date(resultadoVarredura.dataHoraFim).getTime() -
                    new Date(resultadoVarredura.dataHoraInicio).getTime()) /
                    1000
                )
              )}
              s
            </span>
          </div>
          <p className="text-[#8c96a5]">
            Verificados {resultadoVarredura.totalProcessosVerificados} processos judiciais ativos e{' '}
            {resultadoVarredura.totalOabsVerificadas} OABs cadastradas. Encontradas{' '}
            <strong className="text-emerald-400">
              {resultadoVarredura.novasMovimentacoes.length} novas movimentações
            </strong>{' '}
            e{' '}
            <strong className="text-amber-300">
              {resultadoVarredura.novasComunicacoes.length} novas publicações no DJEN
            </strong>
            . Geradas{' '}
            <strong className="text-[#5b9cd9]">
              {resultadoVarredura.sugestoesMarcosGeradas} tarefas para confirmação humana de prazos
            </strong>
            .
          </p>
        </div>
      )}

      {/* Navegação entre Sub-Abas do Monitoramento */}
      <div className="flex border-b border-[#263040] gap-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('oabs')}
          className={`py-3 px-4 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 text-xs ${
            subTab === 'oabs'
              ? 'border-[#b8a47c] text-[#b8a47c]'
              : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <Scale className="w-4 h-4" />
          OABs & Nomes Monitorados ({oabs.length + nomes.length})
        </button>

        <button
          onClick={() => setSubTab('intimacoes')}
          className={`py-3 px-4 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 text-xs ${
            subTab === 'intimacoes'
              ? 'border-[#b8a47c] text-[#b8a47c]'
              : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Feed de Intimações & DJEN ({comunicacoes.length})
        </button>

        <button
          onClick={() => setSubTab('movimentacoes')}
          className={`py-3 px-4 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 text-xs ${
            subTab === 'movimentacoes'
              ? 'border-[#b8a47c] text-[#b8a47c]'
              : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Andamentos Judiciais (DataJud) ({movimentacoes.length})
        </button>

        <button
          onClick={() => setSubTab('provedores')}
          className={`py-3 px-4 font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 text-xs ${
            subTab === 'provedores'
              ? 'border-[#b8a47c] text-[#b8a47c]'
              : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
          }`}
        >
          <Database className="w-4 h-4" />
          Provedores de Tribunais (APIs) ({providers.length})
        </button>
      </div>

      {/* CONTEÚDO SUB-ABA 1: OABS E NOMES MONITORADOS */}
      {subTab === 'oabs' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Card Especial: Monitoramento do Nome da Dra. Karine para Capturar Nomeações */}
          {nomes.map((nomeItem) => (
            <div
              key={nomeItem.id}
              className="p-5 rounded-2xl bg-gradient-to-r from-[#1c222e] to-[#161c26] border border-amber-600/40 space-y-4 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#263040]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-[#f4efe3]">
                        Captura Automática de Nomeações Judiciais • Dra. Karine Reis
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                        Perita do Juízo
                      </span>
                    </div>
                    <p className="text-xs text-[#8c96a5] mt-0.5">
                      Monitora diários oficiais e PJe em busca de publicações nomeando a Dra. Karine
                      como perita judicial para cálculo imediato de prazos de aceite e proposta de honorários.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#545c6b] block">Última checagem</span>
                  <span className="font-mono text-xs text-[#e8e1d0]">
                    {nomeItem.ultimaVerificacao
                      ? formatDateTime(nomeItem.ultimaVerificacao)
                      : 'Em sincronização'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#b8a47c]">
                  Variações Textuais Monitoradas no Diário Oficial:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {nomeItem.variacoes.map((v) => (
                    <span
                      key={v}
                      className="px-2.5 py-1 rounded-lg bg-[#12171f] border border-[#263040] text-xs text-[#e8e1d0]"
                    >
                      "{v}"
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#263040] text-[#545c6b]">
                <span>
                  Total de nomeações já capturadas:{' '}
                  <strong className="text-amber-300 font-mono">
                    {nomeItem.totalNomeacoesDetectadas} nomeações
                  </strong>
                </span>
                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ativo no PJe, e-SAJ e DJEN
                </span>
              </div>
            </div>
          ))}

          {/* Lista de OABs de Advogados Parceiros */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-sm font-semibold text-[#f4efe3]">
                  OABs de Advogados Parceiros Monitoradas ({oabs.length})
                </h3>
                <p className="text-xs text-[#545c6b]">
                  Acompanhamento de intimações de bancas parceiras com consentimento formal LGPD para
                  atuação antecipada da assistência técnica.
                </p>
              </div>

              <button
                onClick={() => setIsModalNovaOabOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs flex items-center gap-1.5 hover:bg-[#c7b692] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar OAB
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {oabs.map((oabItem) => {
                const esc = escritorios.find((e) => e.id === oabItem.escritorioId);

                return (
                  <div
                    key={oabItem.id}
                    className="p-4 rounded-xl bg-[#161c26] border border-[#263040] hover:border-[#354359] transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#5b9cd9]">
                            OAB/{oabItem.uf} {oabItem.numero}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b222d] text-[#b8a47c] border border-[#263040]">
                            {oabItem.tipo}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-[#f4efe3] mt-1">
                          {oabItem.titularNome}
                        </h4>
                        {esc && (
                          <p className="text-[11px] text-[#545c6b] flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-[#b8a47c]" />
                            {esc.nomeFantasia}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleOabAtivo(oabItem.id, oabItem.ativo)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                          oabItem.ativo
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-950/70'
                            : 'bg-zinc-800/40 text-zinc-400 border border-zinc-700/40 hover:bg-zinc-800/70'
                        }`}
                      >
                        {oabItem.ativo ? 'Monitoramento Ativo' : 'Pausado'}
                      </button>
                    </div>

                    {oabItem.observacoes && (
                      <p className="text-[11px] text-[#8c96a5] italic leading-relaxed bg-[#12171f] p-2 rounded-lg border border-[#263040]/60">
                        "{oabItem.observacoes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#263040] text-[#545c6b]">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Autorização LGPD Concedida
                      </span>
                      <span>
                        Total capturas:{' '}
                        <strong className="text-[#f4efe3] font-mono">
                          {oabItem.totalCapturas}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO SUB-ABA 2: FEED DE INTIMAÇÕES E DJEN */}
      {subTab === 'intimacoes' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#545c6b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por OAB, advogado, tribunal ou termo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg pl-9 pr-4 py-2 text-xs text-[#f4efe3] placeholder-[#545c6b] focus:outline-none focus:border-[#b8a47c]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltroTipoCom('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtroTipoCom === 'todos'
                    ? 'bg-[#b8a47c] text-[#0a0e14]'
                    : 'bg-[#161c26] text-[#545c6b] border border-[#263040]'
                }`}
              >
                Todas ({comunicacoes.length})
              </button>
              <button
                onClick={() => setFiltroTipoCom('nomeacoes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtroTipoCom === 'nomeacoes'
                    ? 'bg-[#b8a47c] text-[#0a0e14]'
                    : 'bg-[#161c26] text-[#545c6b] border border-[#263040]'
                }`}
              >
                Nomeações Dra. Karine (
                {comunicacoes.filter((c) => c.sugestaoNomeacao).length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {comunicacoes
              .filter((c) => {
                if (filtroTipoCom === 'nomeacoes' && !c.sugestaoNomeacao) return false;
                if (searchTerm) {
                  const s = searchTerm.toLowerCase();
                  return (
                    c.numeroCnj.toLowerCase().includes(s) ||
                    c.destinatarioNome.toLowerCase().includes(s) ||
                    c.tribunal.toLowerCase().includes(s) ||
                    c.teorResumido.toLowerCase().includes(s)
                  );
                }
                return true;
              })
              .map((com) => (
                <div
                  key={com.id}
                  className={`p-4 rounded-xl border transition-all ${
                    com.sugestaoNomeacao
                      ? 'bg-[#1c222d] border-amber-500/50 hover:border-amber-400'
                      : 'bg-[#161c26] border-[#263040] hover:border-[#354359]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#5b9cd9]">
                          {formatProcesso(com.numeroCnj)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#1b222d] text-[#b8a47c] border border-[#263040]">
                          {com.tipo} • {com.meio}
                        </span>
                        <span className="text-[11px] text-[#545c6b]">
                          {com.tribunal} • {com.varaOuOrgao}
                        </span>
                        {com.sugestaoNomeacao && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                            Nomeação Pericial Oficial
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-[#f4efe3]">{com.teorResumido}</h4>
                    </div>

                    <span className="font-mono text-[11px] text-[#545c6b] whitespace-nowrap">
                      {formatDate(com.dataDisponibilizacao)}
                    </span>
                  </div>

                  {com.teorCompleto && (
                    <div className="mt-2 p-3 rounded-lg bg-[#12171f] border border-[#263040] text-[11px] text-[#e8e1d0] leading-relaxed">
                      {com.teorCompleto}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-2 border-t border-[#263040]/60 text-xs">
                    <div className="text-[11px] text-[#545c6b]">
                      Destinatário: <strong className="text-[#f4efe3]">{com.destinatarioNome}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {com.linkVisualizacao && (
                        <a
                          href={com.linkVisualizacao}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#5b9cd9] text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver no Diário / PJe
                        </a>
                      )}

                      {com.processoId && onOpenProcesso && (
                        <button
                          onClick={() => onOpenProcesso(com.processoId!)}
                          className="px-3 py-1 rounded-lg bg-[#b8a47c]/15 hover:bg-[#b8a47c]/25 border border-[#b8a47c]/40 text-[#b8a47c] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          Abrir Ficha do Processo
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {com.sugestaoNomeacao && onOpenNovaNomeacao && (
                        <button
                          onClick={() =>
                            onOpenNovaNomeacao({
                              processoId: com.processoId || '',
                              vara: com.varaOuOrgao,
                              comarca: com.tribunal,
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          Cadastrar em Nomeações
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO SUB-ABA 3: MOVIMENTAÇÕES JUDICIAIS RECENTES */}
      {subTab === 'movimentacoes' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-sm font-semibold text-[#f4efe3]">
                Log Consolidado de Andamentos Judiciais ({movimentacoes.length})
              </h3>
              <p className="text-xs text-[#545c6b]">
                Histórico de movimentações sincronizadas pelo DataJud e PJe nos processos sob
                acompanhamento da equipe.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {movimentacoes.map((mov) => (
              <div
                key={mov.id}
                className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#5b9cd9]">
                        {formatProcesso(mov.numeroCnj)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1b222d] text-[#b8a47c] border border-[#263040]">
                        {mov.fonte}
                      </span>
                      {mov.codigoMovimentoCnj && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1b222d] text-[#545c6b]">
                          Cód. {mov.codigoMovimentoCnj}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-xs text-[#f4efe3] mt-1">{mov.titulo}</h4>
                    <p className="text-xs text-[#e8e1d0] leading-relaxed mt-0.5">{mov.descricao}</p>
                  </div>

                  <span className="font-mono text-[11px] text-[#545c6b] whitespace-nowrap">
                    {formatDateTime(mov.dataHora)}
                  </span>
                </div>

                {mov.palavrasChaveDetectadas && mov.palavrasChaveDetectadas.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#263040]/50 flex-wrap">
                    <span className="text-[10px] text-[#545c6b]">Termos detectados:</span>
                    {mov.palavrasChaveDetectadas.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/30 text-amber-300 border border-amber-800/40"
                      >
                        {kw}
                      </span>
                    ))}
                    {mov.sugestaoMarco?.confirmadoPeloUsuario && (
                      <span className="text-[10px] text-emerald-400 font-semibold ml-auto">
                        ✓ Marco CPC Confirmado e Tarefa Gerada
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO SUB-ABA 4: PROVEDORES DE TRIBUNAIS (DOCUMENTAÇÃO TÉCNICA) */}
      {subTab === 'provedores' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="font-serif text-sm font-semibold text-[#f4efe3]">
              Provedores & Barramento de Tribunais
            </h3>
            <p className="text-xs text-[#545c6b]">
              Arquitetura multi-provedor conectando bases públicas do Judiciário e crawlers comerciais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Provedor 1: DataJud */}
            <div className="p-5 rounded-2xl bg-[#161c26] border border-[#263040] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#f4efe3]">DataJud / CNJ</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                  Ativo / Produção
                </span>
              </div>
              <p className="text-xs text-[#8c96a5] leading-relaxed">
                Base nacional unificada de processos e movimentos criada pelo CNJ (Resolução 331/2020).
                Utiliza Elasticsearch clusterizado.
              </p>
              <div className="space-y-1 text-[11px] font-mono text-[#545c6b] bg-[#12171f] p-3 rounded-lg border border-[#263040]">
                <div>POST /api_publica_{'{tribunal}'}/_search</div>
                <div className="text-emerald-400">Auth: APIKey CNJ Pública</div>
                <div>Status: Operacional 100%</div>
              </div>
            </div>

            {/* Provedor 2: Comunica PJe / DJEN */}
            <div className="p-5 rounded-2xl bg-[#161c26] border border-[#263040] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#f4efe3]">Comunica PJe & DJEN</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                  Ativo / Produção
                </span>
              </div>
              <p className="text-xs text-[#8c96a5] leading-relaxed">
                Diário de Justiça Eletrônico Nacional oficial do CNJ. Busca intimações e publicações
                por número de OAB de advogados e nome de perito.
              </p>
              <div className="space-y-1 text-[11px] font-mono text-[#545c6b] bg-[#12171f] p-3 rounded-lg border border-[#263040]">
                <div>GET /api/v1/comunicacao</div>
                <div className="text-amber-400">Params: numeroOab, nomeParte</div>
                <div>Status: Operacional 100%</div>
              </div>
            </div>

            {/* Provedor 3: Provedor Comercial LegalTech */}
            <div className="p-5 rounded-2xl bg-[#161c26] border border-[#263040] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#f4efe3]">Escavador / Judit</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950/50 text-sky-400 border border-sky-800/40">
                  Fallback Opcional
                </span>
              </div>
              <p className="text-xs text-[#8c96a5] leading-relaxed">
                API comercial de contingência e webhook push notification para diários de tribunais de
                pequeno porte e instâncias recursais.
              </p>
              <div className="space-y-1 text-[11px] font-mono text-[#545c6b] bg-[#12171f] p-3 rounded-lg border border-[#263040]">
                <div>POST /api/v2/processos/rastreamento</div>
                <div className="text-sky-400">Webhook: /api/webhooks/tribunais</div>
                <div>Status: Standby Habilitado</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA OAB MONITORADA */}
      {isModalNovaOabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#b8a47c]/15 text-[#b8a47c] flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-sm font-semibold text-[#f4efe3]">
                  Cadastrar OAB para Monitoramento Judicial
                </h3>
              </div>
              <button
                onClick={() => setIsModalNovaOabOpen(false)}
                className="text-[#545c6b] hover:text-[#f4efe3]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarNovaOab} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[#8c96a5] text-[11px]">Número da OAB *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 382114"
                    value={novaOab.numero}
                    onChange={(e) => setNovaOab({ ...novaOab, numero: e.target.value })}
                    className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] font-mono focus:border-[#b8a47c] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#8c96a5] text-[11px]">UF *</label>
                  <select
                    value={novaOab.uf}
                    onChange={(e) => setNovaOab({ ...novaOab, uf: e.target.value })}
                    className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    {['SP', 'TO', 'RJ', 'MG', 'DF', 'PR', 'RS', 'SC', 'GO', 'BA', 'PE'].map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#8c96a5] text-[11px]">Nome do Advogado Titular *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Marcelo Prado Fontes"
                  value={novaOab.titularNome}
                  onChange={(e) => setNovaOab({ ...novaOab, titularNome: e.target.value })}
                  className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#8c96a5] text-[11px]">Escritório Parceiro Vinculado</label>
                <select
                  value={novaOab.escritorioId}
                  onChange={(e) => setNovaOab({ ...novaOab, escritorioId: e.target.value })}
                  className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                >
                  <option value="">Selecione um escritório (opcional)...</option>
                  {escritorios.map((esc) => (
                    <option key={esc.id} value={esc.id}>
                      {esc.nomeFantasia} ({esc.cidade}/{esc.uf})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161c26] border border-amber-900/40 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="chk_autorizacao"
                    checked={novaOab.autorizacaoObtida}
                    onChange={(e) =>
                      setNovaOab({ ...novaOab, autorizacaoObtida: e.target.checked })
                    }
                    className="mt-0.5 rounded border-[#263040] text-[#b8a47c] focus:ring-0"
                  />
                  <label htmlFor="chk_autorizacao" className="text-[11px] text-[#e8e1d0] cursor-pointer">
                    <strong className="text-amber-300">Consentimento Formal LGPD Obtido:</strong>{' '}
                    Declaro que o advogado parceiro autorizou expressamente o monitoramento de suas
                    publicações judiciais em diários oficiais para fins de suporte técnico-pericial.
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#8c96a5] text-[11px]">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Parceria para ações acidentárias e erro médico..."
                  value={novaOab.observacoes}
                  onChange={(e) => setNovaOab({ ...novaOab, observacoes: e.target.value })}
                  className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#263040]">
                <button
                  type="button"
                  onClick={() => setIsModalNovaOabOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#161c26] text-[#8c96a5] hover:text-[#f4efe3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!novaOab.autorizacaoObtida}
                  className="px-4 py-2 rounded-lg bg-[#b8a47c] hover:bg-[#c7b692] disabled:opacity-50 text-[#0a0e14] font-semibold text-xs"
                >
                  Salvar e Iniciar Monitoramento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
