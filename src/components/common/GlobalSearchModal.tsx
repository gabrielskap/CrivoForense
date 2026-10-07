import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Building2,
  UserCheck,
  HeartPulse,
  Briefcase,
  ExternalLink,
  Filter,
} from 'lucide-react';
import {
  leadRepository,
  escritorioRepository,
  advogadoRepository,
  periciandoRepository,
  processoRepository,
} from '../../services';
import { Lead, Escritorio, Advogado, Periciando, Processo } from '../../types';
import { formatCpf, formatCnpj, formatProcesso } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [escritorios, setEscritorios] = useState<Escritorio[]>([]);
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [periciandos, setPericiandos] = useState<Periciando[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      Promise.all([
        leadRepository.getAll(),
        escritorioRepository.getAll(),
        advogadoRepository.getAll(),
        periciandoRepository.getAll(),
        processoRepository.getAll(),
      ]).then(([l, e, a, p, pr]) => {
        setLeads(l);
        setEscritorios(e);
        setAdvogados(a);
        setPericiandos(p);
        setProcessos(pr);
      });
    }
  }, [isOpen, initialQuery]);

  const cleanQuery = query.trim().toLowerCase();
  const digitsQuery = query.replace(/\D/g, '');

  const filtered = useMemo(() => {
    if (!cleanQuery && !digitsQuery) {
      return { processos: [], periciandos: [], advogados: [], escritorios: [], leads: [] };
    }

    const matchedProcessos = processos.filter(
      (p) =>
        p.numeroCnj.toLowerCase().includes(cleanQuery) ||
        (digitsQuery && p.numeroCnj.replace(/\D/g, '').includes(digitsQuery)) ||
        p.poloAtivo.toLowerCase().includes(cleanQuery) ||
        p.poloPassivo.toLowerCase().includes(cleanQuery)
    );

    const matchedPericiandos = periciandos.filter(
      (p) =>
        p.nome.toLowerCase().includes(cleanQuery) ||
        (digitsQuery && p.cpf.replace(/\D/g, '').includes(digitsQuery)) ||
        p.dadosSaude.patologias.some((pat) => pat.toLowerCase().includes(cleanQuery))
    );

    const matchedAdvogados = advogados.filter(
      (a) =>
        a.nome.toLowerCase().includes(cleanQuery) ||
        a.oabNumero.toLowerCase().includes(cleanQuery) ||
        (digitsQuery && a.whatsapp.replace(/\D/g, '').includes(digitsQuery))
    );

    const matchedEscritorios = escritorios.filter(
      (e) =>
        e.razaoSocial.toLowerCase().includes(cleanQuery) ||
        e.nomeFantasia.toLowerCase().includes(cleanQuery) ||
        (digitsQuery && e.cnpj.replace(/\D/g, '').includes(digitsQuery))
    );

    const matchedLeads = leads.filter(
      (l) =>
        l.nome.toLowerCase().includes(cleanQuery) ||
        (l.contatoNome && l.contatoNome.toLowerCase().includes(cleanQuery)) ||
        (l.area && l.area.toLowerCase().includes(cleanQuery)) ||
        (l.areaDireito && l.areaDireito.toLowerCase().includes(cleanQuery))
    );

    return {
      processos: matchedProcessos.slice(0, 5),
      periciandos: matchedPericiandos.slice(0, 5),
      advogados: matchedAdvogados.slice(0, 5),
      escritorios: matchedEscritorios.slice(0, 5),
      leads: matchedLeads.slice(0, 5),
    };
  }, [cleanQuery, digitsQuery, processos, periciandos, advogados, escritorios, leads]);

  if (!isOpen) return null;

  const totalResults =
    filtered.processos.length +
    filtered.periciandos.length +
    filtered.advogados.length +
    filtered.escritorios.length +
    filtered.leads.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#263040] bg-[#161c26]">
          <Search className="w-5 h-5 text-[#b8a47c] mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por Nome, CPF, CNPJ, OAB, Nº Processo CNJ..."
            className="w-full bg-transparent text-[#f4efe3] placeholder-[#545c6b] text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#545c6b] hover:text-[#f4efe3] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-3 px-2 py-1 text-xs bg-[#1b222d] border border-[#263040] rounded text-[#e8e1d0]/70 hover:text-[#f4efe3]"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1 text-sm">
          {cleanQuery && totalResults === 0 && (
            <div className="text-center py-12 text-[#545c6b]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#b8a47c]" />
              <p>Nenhum resultado encontrado para &quot;{query}&quot;</p>
              <p className="text-xs mt-1">Tente pesquisar por nome do autor, número CNJ, CPF ou OAB.</p>
            </div>
          )}

          {!cleanQuery && (
            <div className="text-center py-8 text-[#545c6b]">
              <p className="text-sm text-[#e8e1d0]/80">Busca global no Crivo CRM</p>
              <div className="flex justify-center gap-2 mt-3 flex-wrap text-xs text-[#b8a47c]">
                <span className="px-2.5 py-1 rounded bg-[#1b222d] border border-[#263040]">Nº do Processo CNJ</span>
                <span className="px-2.5 py-1 rounded bg-[#1b222d] border border-[#263040]">CPF do Periciando</span>
                <span className="px-2.5 py-1 rounded bg-[#1b222d] border border-[#263040]">CNPJ do Escritório</span>
                <span className="px-2.5 py-1 rounded bg-[#1b222d] border border-[#263040]">OAB do Advogado</span>
              </div>
            </div>
          )}

          {/* Processos */}
          {filtered.processos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#b8a47c] uppercase tracking-wider mb-2">
                <Briefcase className="w-4 h-4" />
                Processos Judiciais ({filtered.processos.length})
              </div>
              <div className="space-y-1.5">
                {filtered.processos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onClose();
                      navigate('/processos');
                    }}
                    className="p-2.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="font-mono text-xs text-[#5b9cd9] font-medium">
                        {formatProcesso(p.numeroCnj)}
                      </div>
                      <div className="text-xs text-[#f4efe3] font-medium mt-0.5">
                        {p.poloAtivo} vs {p.poloPassivo}
                      </div>
                      <div className="text-[11px] text-[#545c6b]">
                        {p.tribunal} • {p.vara} • {p.modalidadeAtuacao}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#545c6b] group-hover:text-[#b8a47c]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Periciandos */}
          {filtered.periciandos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#b8a47c] uppercase tracking-wider mb-2">
                <HeartPulse className="w-4 h-4" />
                Periciandos ({filtered.periciandos.length})
              </div>
              <div className="space-y-1.5">
                {filtered.periciandos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onClose();
                      navigate('/contatos?tab=periciandos');
                    }}
                    className="p-2.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#f4efe3] flex items-center gap-2">
                        {p.nome}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">
                          Dado Sensível Saúde
                        </span>
                      </div>
                      <div className="text-[11px] text-[#545c6b] mt-0.5">
                        CPF: {formatCpf(p.cpf)} • {p.profissaoAtual || 'Profissão não informada'}
                      </div>
                      <div className="text-[11px] text-[#e8e1d0]/70 truncate max-w-lg mt-0.5">
                        {p.dadosSaude.patologias.join(', ')}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#545c6b] group-hover:text-[#b8a47c]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advogados */}
          {filtered.advogados.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#b8a47c] uppercase tracking-wider mb-2">
                <UserCheck className="w-4 h-4" />
                Advogados ({filtered.advogados.length})
              </div>
              <div className="space-y-1.5">
                {filtered.advogados.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      onClose();
                      navigate('/contatos?tab=advogados');
                    }}
                    className="p-2.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#f4efe3] flex items-center gap-2">
                        {a.nome}
                        {a.eDecisor && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                            Decisor
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#545c6b] mt-0.5">
                        OAB/{a.oabUf} nº {a.oabNumero} • {a.cargo} • WhatsApp: {a.whatsapp}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#545c6b] group-hover:text-[#b8a47c]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escritorios */}
          {filtered.escritorios.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#b8a47c] uppercase tracking-wider mb-2">
                <Building2 className="w-4 h-4" />
                Escritórios de Advocacia ({filtered.escritorios.length})
              </div>
              <div className="space-y-1.5">
                {filtered.escritorios.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => {
                      onClose();
                      navigate('/contatos?tab=escritorios');
                    }}
                    className="p-2.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#f4efe3]">
                        {e.razaoSocial}
                      </div>
                      <div className="text-[11px] text-[#545c6b] mt-0.5">
                        CNPJ: {formatCnpj(e.cnpj)} • {e.cidade}/{e.uf} • Áreas: {e.areasAtuacao.join(', ')}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#545c6b] group-hover:text-[#b8a47c]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads */}
          {filtered.leads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#b8a47c] uppercase tracking-wider mb-2">
                <Filter className="w-4 h-4" />
                Leads e Oportunidades ({filtered.leads.length})
              </div>
              <div className="space-y-1.5">
                {filtered.leads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      onClose();
                      navigate('/leads');
                    }}
                    className="p-2.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#f4efe3]">
                        {l.nome} ({l.tipo})
                      </div>
                      <div className="text-[11px] text-[#545c6b] mt-0.5">
                        Fase: <span className="text-[#b8a47c]">{l.statusFunil}</span> • Área: {l.area || l.areaDireito} • Contato: {l.contatoNome || l.nome}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#545c6b] group-hover:text-[#b8a47c]" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
