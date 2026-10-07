import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Calendar,
  Briefcase,
  AlertCircle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  Filter,
  DollarSign,
  ArrowUpRight,
  Navigation,
} from 'lucide-react';
import {
  leadRepository,
  processoRepository,
  periciaRepository,
  cobrancaRepository,
  tarefaRepository,
} from '../services';
import { Lead, Processo, Pericia, Cobranca, Tarefa } from '../types';
import { formatCurrency, formatDate, formatDateTime, formatProcesso } from '../utils/formatters';
import { googleMapsAdapter } from '../integrations/googleMaps';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  useEffect(() => {
    Promise.all([
      leadRepository.getAll(),
      processoRepository.getAll(),
      periciaRepository.getAll(),
      cobrancaRepository.getAll(),
      tarefaRepository.getAll(),
    ]).then(([l, p, pe, c, t]) => {
      setLeads(l);
      setProcessos(p);
      setPericias(pe);
      setCobrancas(c);
      setTarefas(t);
    });
  }, []);

  const totalHonorariosRecebidos = cobrancas
    .filter((c) => c.status === 'Paga')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalHonorariosPendentes = cobrancas
    .filter((c) => c.status === 'Pendente')
    .reduce((sum, c) => sum + c.valor, 0);

  const assistenciaCount = processos.filter((p) => p.modalidadeAtuacao === 'Assistente Técnica').length;
  const peritaJuizoCount = processos.filter((p) => p.modalidadeAtuacao === 'Perita do Juízo').length;

  const tarefasUrgentes = tarefas.filter(
    (t) => t.prioridade === 'Urgente / Prazo Fatal' || t.prioridade === 'Alta'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner - Dra. Karine Reis & Crivo Forense */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#12171f] via-[#1b222d] to-[#12171f] border border-[#263040] p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#b8a47c]/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/30 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel de Gestão Pericial Forense
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3] font-normal tracking-wide">
              Crivo Forense • Dra. Karine Reis
            </h1>
            <p className="text-sm text-[#e8e1d0]/80 max-w-2xl leading-relaxed">
              Médica Perita (CRM/SP 235.821 • CRM/TO 6.385). Assistência técnica médico-pericial especializada e perícias judiciais nomeadas nas áreas Previdenciária, Trabalhista e Cível (Erro Médico & Seguros).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => navigate('/leads?novo=true')}
              className="px-4 py-2.5 rounded-lg bg-[#b8a47c] hover:bg-[#c7b692] text-[#0a0e14] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm"
            >
              + Novo Lead / Caso
            </button>
            <button
              onClick={() => navigate('/agenda')}
              className="px-4 py-2.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#f4efe3] text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              Ver Agenda
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Leads e Funil */}
        <div
          onClick={() => navigate('/leads')}
          className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#b8a47c]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#545c6b] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Leads & Prospecção</span>
            <div className="p-2 rounded-lg bg-[#1b222d] text-[#b8a47c] group-hover:scale-110 transition-transform">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif text-[#f4efe3]">{leads.length}</div>
          <div className="text-xs text-[#545c6b] mt-1 flex items-center justify-between">
            <span>
              {leads.filter((l) => l.statusFunil === 'Negociação' || l.statusFunil === 'Proposta enviada').length} em negociação
            </span>
            <span className="text-[#b8a47c] flex items-center font-medium">
              Funil <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Processos Judiciais */}
        <div
          onClick={() => navigate('/processos')}
          className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#5b9cd9]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#545c6b] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Processos Ativos</span>
            <div className="p-2 rounded-lg bg-[#1b222d] text-[#5b9cd9] group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif text-[#f4efe3]">{processos.length}</div>
          <div className="text-xs text-[#545c6b] mt-1 flex items-center justify-between">
            <span>{assistenciaCount} Assistência • {peritaJuizoCount} Juízo</span>
            <span className="text-[#5b9cd9] flex items-center font-medium">
              Ver <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Perícias Agendadas */}
        <div
          onClick={() => navigate('/agenda')}
          className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#545c6b] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Perícias Próximas</span>
            <div className="p-2 rounded-lg bg-[#1b222d] text-emerald-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif text-[#f4efe3]">
            {pericias.filter((p) => p.status === 'Agendada').length}
          </div>
          <div className="text-xs text-[#545c6b] mt-1 flex items-center justify-between">
            <span>SP & TO neste mês</span>
            <span className="text-emerald-400 flex items-center font-medium">
              Agenda <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Honorários */}
        <div
          onClick={() => navigate('/financeiro')}
          className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#b8a47c]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#545c6b] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Honorários Previstos</span>
            <div className="p-2 rounded-lg bg-[#1b222d] text-[#b8a47c] group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif text-[#b8a47c]">
            {formatCurrency(totalHonorariosPendentes)}
          </div>
          <div className="text-xs text-[#545c6b] mt-1 flex items-center justify-between">
            <span>{formatCurrency(totalHonorariosRecebidos)} já recebidos</span>
            <span className="text-[#b8a47c] flex items-center font-medium">
              Financeiro <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Próximas Perícias + Prazos e Tarefas Fatais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Próximas Perícias Médicas com detalhes logísticos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#b8a47c]" />
              <h2 className="font-serif text-lg text-[#f4efe3]">
                Próximas Perícias Médicas Agendadas
              </h2>
            </div>
            <button
              onClick={() => navigate('/agenda')}
              className="text-xs text-[#b8a47c] hover:underline flex items-center gap-1"
            >
              Ver calendário completo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pericias.slice(0, 4).map((per) => {
              const proc = processos.find((p) => p.id === per.processoId);
              const isJuizo = per.modalidade === 'Perita do Juízo';

              return (
                <div
                  key={per.id}
                  className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#263040] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1b222d]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                          isJuizo
                            ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                            : 'bg-[#b8a47c]/15 text-[#b8a47c] border-[#b8a47c]/30'
                        }`}
                      >
                        {per.modalidade}
                      </span>
                      <span className="text-xs font-mono text-[#5b9cd9]">
                        {proc ? formatProcesso(proc.numeroCnj) : '-'}
                      </span>
                      <span className="text-xs text-[#545c6b]">
                        {proc?.tribunal} • {proc?.vara}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#e8e1d0] font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#b8a47c]" />
                      {formatDateTime(per.dataHora)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[#545c6b] text-[11px]">Periciando / Reclamante</p>
                      <p className="font-semibold text-[#f4efe3] mt-0.5">{proc?.poloAtivo}</p>
                      {proc?.poloPassivo && (
                        <p className="text-[#545c6b] text-[11px] mt-0.5">
                          vs {proc.poloPassivo}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-[#545c6b] text-[11px]">Local da Perícia</p>
                      <p className="text-[#e8e1d0] mt-0.5 line-clamp-1">{per.local}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <a
                          href={googleMapsAdapter.gerarLinkRotaGoogleMaps('São Paulo, SP', per.local)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#5b9cd9] hover:underline"
                        >
                          <Navigation className="w-3 h-3" />
                          Calcular Rota / GPS
                        </a>
                        <span className="text-[11px] text-[#545c6b]">{per.cidade}/{per.uf}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Prazos Fatais e Tarefas Urgentes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif text-lg text-[#f4efe3]">Prazos Fatais</h2>
            </div>
            <button
              onClick={() => navigate('/tarefas')}
              className="text-xs text-[#b8a47c] hover:underline"
            >
              Todas ({tarefas.length})
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-3">
            {tarefasUrgentes.map((tar) => (
              <div
                key={tar.id}
                onClick={() => navigate('/tarefas')}
                className="p-3 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-[#f4efe3] leading-snug">
                    {tar.titulo}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/40 shrink-0 font-medium">
                    {tar.prioridade}
                  </span>
                </div>
                <p className="text-[11px] text-[#545c6b] mt-1 line-clamp-2">
                  {tar.descricao}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#e8e1d0]/60 mt-2 pt-2 border-t border-[#263040]/50">
                  <span>Limite: {formatDate(tar.dataLimite)}</span>
                  <span className="text-[#b8a47c]">{tar.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Áreas de Atuação Crivo Forense */}
          <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] text-xs">
            <div className="font-semibold text-[#f4efe3] mb-2 flex items-center justify-between">
              <span>Especialidades Periciais</span>
              <span className="text-[10px] text-[#b8a47c]">Resolução CFM</span>
            </div>
            <div className="space-y-1.5 text-[#545c6b]">
              <div className="flex justify-between items-center py-1 border-b border-[#1b222d]">
                <span className="text-[#e8e1d0]">Previdenciário (B31, B91, BPC)</span>
                <span className="text-[#5b9cd9] font-mono">40%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1b222d]">
                <span className="text-[#e8e1d0]">Trabalhista & DORT/LER</span>
                <span className="text-[#5b9cd9] font-mono">30%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1b222d]">
                <span className="text-[#e8e1d0]">Cível - Erro Médico Cirúrgico</span>
                <span className="text-[#5b9cd9] font-mono">20%</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#e8e1d0]">DPVAT & Seguros Privados</span>
                <span className="text-[#5b9cd9] font-mono">10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
