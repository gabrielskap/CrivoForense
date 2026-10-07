import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ExternalLink,
  Plus,
  Stethoscope,
  Users,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { compromissoRepository, periciaRepository, processoRepository } from '../services';
import { Compromisso, Pericia, Processo } from '../types';
import { formatDateTime, formatDate, formatProcesso } from '../utils/formatters';
import { agendaAdapter } from '../integrations/agenda';

export const AgendaView: React.FC = () => {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  useEffect(() => {
    Promise.all([
      compromissoRepository.getAll(),
      processoRepository.getAll(),
    ]).then(([c, p]) => {
      setCompromissos(c);
      setProcessos(p);
    });
  }, []);

  const compromissosFiltrados = compromissos.filter((c) => {
    if (filtroTipo === 'todos') return true;
    return c.tipo === filtroTipo;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Agenda Pericial & Compromissos
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Perícias presenciais, reuniões técnicas com advogados e audiências de instrução/esclarecimentos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-[#12171f] border border-[#1b222d] rounded-lg px-3 py-2 text-xs text-[#f4efe3] focus:outline-none"
          >
            <option value="todos">Todos os Compromissos</option>
            <option value="Perícia Médica">Perícias Médicas</option>
            <option value="Reunião c/ Advogado">Reuniões com Advogados</option>
            <option value="Audiência / Esclarecimentos">Audiências / Juízo</option>
          </select>
        </div>
      </div>

      {/* Timeline / Agenda Cards List */}
      <div className="space-y-4">
        {compromissosFiltrados.map((comp) => {
          const proc = processos.find((p) => p.id === comp.processoId);

          return (
            <div
              key={comp.id}
              className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#263040] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                      comp.tipo === 'Perícia Médica'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                        : comp.tipo === 'Reunião c/ Advogado'
                        ? 'bg-[#b8a47c]/15 text-[#b8a47c] border-[#b8a47c]/30'
                        : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                    }`}
                  >
                    {comp.tipo}
                  </span>

                  <span className="text-xs text-[#545c6b]">
                    Modalidade: <strong className="text-[#e8e1d0]">{comp.modalidade}</strong>
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#f4efe3]">
                  {comp.titulo}
                </h3>

                {comp.local && (
                  <div className="flex items-center gap-1.5 text-xs text-[#545c6b]">
                    <MapPin className="w-3.5 h-3.5 text-[#b8a47c] shrink-0" />
                    <span>{comp.local}</span>
                  </div>
                )}

                {proc && (
                  <div className="text-[11px] font-mono text-[#5b9cd9]">
                    Processo: {formatProcesso(proc.numeroCnj)} ({proc.tribunal})
                  </div>
                )}
              </div>

              {/* Date & Google Sync */}
              <div className="flex flex-col sm:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#1b222d]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f4efe3] bg-[#1b222d] px-3 py-1.5 rounded-lg border border-[#263040]">
                  <Clock className="w-3.5 h-3.5 text-[#b8a47c]" />
                  {formatDateTime(comp.dataInicio)}
                </div>

                <a
                  href={agendaAdapter.gerarLinkGoogleCalendar({
                    titulo: comp.titulo,
                    descricao: `Perícia Crivo Forense - Dra. Karine Reis (CRM/SP 235.821). ${comp.local || ''}`,
                    inicio: comp.dataInicio,
                    fim: comp.dataFim,
                    local: comp.local,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#b8a47c] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Sincronizar no Google Calendar
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
