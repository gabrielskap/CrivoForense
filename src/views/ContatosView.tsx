import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  UserCheck,
  HeartPulse,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  FileText,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  escritorioRepository,
  advogadoRepository,
  periciandoRepository,
  processoRepository,
} from '../services';
import { Escritorio, Advogado, Periciando, Processo } from '../types';
import {
  formatCpf,
  formatCnpj,
  formatPhone,
  formatDate,
  formatProcesso,
} from '../utils/formatters';
import { whatsappAdapter } from '../integrations/whatsapp';
import { useAuth } from '../context/AuthContext';
import { Ficha360Modal } from '../components/contatos/Ficha360Modal';

export const ContatosView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'escritorios' | 'advogados' | 'periciandos') || 'escritorios';

  const { currentUser, canAccessSensitiveHealthData } = useAuth();
  const hasHealthAccess = canAccessSensitiveHealthData();

  const [activeTab, setActiveTab] = useState<'escritorios' | 'advogados' | 'periciandos'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');

  const [escritorios, setEscritorios] = useState<Escritorio[]>([]);
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [periciandos, setPericiandos] = useState<Periciando[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);

  // Selected Periciando for Sensitive Health Drawer
  const [selectedPericiando, setSelectedPericiando] = useState<Periciando | null>(null);
  
  // Selected Entity for 360 Degree View Modal
  const [ficha360Target, setFicha360Target] = useState<{
    tipo: 'escritorio' | 'advogado' | 'periciando';
    id: string;
  } | null>(null);

  const loadData = () => {
    Promise.all([
      escritorioRepository.getAll(),
      advogadoRepository.getAll(),
      periciandoRepository.getAll(),
      processoRepository.getAll(),
    ]).then(([e, a, p, pr]) => {
      setEscritorios(e);
      setAdvogados(a);
      setPericiandos(p);
      setProcessos(pr);
    });
  };

  useEffect(() => {
    loadData();
  }, [hasHealthAccess]);

  const handleSelectPericiando = async (per: Periciando) => {
    // Calling getById on repository registers audit log if user has health access
    const detailed = await periciandoRepository.getById(per.id);
    setSelectedPericiando(detailed || per);
  };

  const handleTabChange = (tab: 'escritorios' | 'advogados' | 'periciandos') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Gestão de Contatos & Partes
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Escritórios parceiros, advogados contratantes e periciandos examinados nos processos.
          </p>
        </div>

        <div className="flex rounded-lg bg-[#12171f] border border-[#1b222d] p-1">
          <button
            onClick={() => handleTabChange('escritorios')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'escritorios'
                ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm'
                : 'text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Escritórios ({escritorios.length})
          </button>
          <button
            onClick={() => handleTabChange('advogados')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'advogados'
                ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm'
                : 'text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Advogados ({advogados.length})
          </button>
          <button
            onClick={() => handleTabChange('periciandos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'periciandos'
                ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm'
                : 'text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            Periciandos ({periciandos.length})
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#545c6b] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'escritorios'
                ? 'Buscar por Razão Social, CNPJ ou Cidade...'
                : activeTab === 'advogados'
                ? 'Buscar por Nome, OAB ou WhatsApp...'
                : 'Buscar por Nome do Periciando ou CPF...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1b222d] border border-[#263040] rounded-lg pl-9 pr-3 py-2 text-[#f4efe3] placeholder-[#545c6b] focus:outline-none focus:border-[#b8a47c]"
          />
        </div>
      </div>

      {/* TAB 1: ESCRITÓRIOS */}
      {activeTab === 'escritorios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {escritorios
            .filter((e) =>
              e.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
              e.cnpj.includes(searchTerm) ||
              e.cidade.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((esc) => {
              const advsDoEscritorio = advogados.filter((a) => a.escritorioId === esc.id);
              const procsDoEscritorio = processos.filter((p) => p.escritorioId === esc.id);

              return (
                <div
                  key={esc.id}
                  onClick={() => setFicha360Target({ tipo: 'escritorio', id: esc.id })}
                  className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#b8a47c]/60 transition-all cursor-pointer space-y-3 flex flex-col justify-between group shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-[#f4efe3] group-hover:text-[#b8a47c] transition-colors leading-snug">
                        {esc.razaoSocial}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 shrink-0">
                        {esc.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#545c6b] font-mono">
                      CNPJ: {formatCnpj(esc.cnpj)}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#e8e1d0]/80">
                      <MapPin className="w-3.5 h-3.5 text-[#b8a47c] shrink-0" />
                      <span>{esc.cidade}/{esc.uf}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {esc.areasAtuacao.map((area) => (
                        <span
                          key={area}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#1b222d] text-[#5b9cd9] border border-[#263040]"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1b222d] flex items-center justify-between text-xs text-[#545c6b]">
                    <span>{advsDoEscritorio.length} Advogados</span>
                    <span className="text-[#b8a47c] font-medium group-hover:underline">
                      Ver Ficha 360° →
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* TAB 2: ADVOGADOS */}
      {activeTab === 'advogados' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {advogados
            .filter((a) =>
              a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.oabNumero.includes(searchTerm) ||
              a.whatsapp.includes(searchTerm)
            )
            .map((adv) => {
              const esc = escritorios.find((e) => e.id === adv.escritorioId);

              return (
                <div
                  key={adv.id}
                  onClick={() => setFicha360Target({ tipo: 'advogado', id: adv.id })}
                  className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#b8a47c]/60 transition-all cursor-pointer space-y-3 flex flex-col justify-between group shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-semibold text-[#f4efe3] group-hover:text-[#b8a47c] transition-colors leading-snug">
                        {adv.nome}
                      </span>
                      {adv.eDecisor && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 shrink-0 font-medium">
                          Decisor
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#b8a47c] font-mono">
                      OAB/{adv.oabUf} nº {adv.oabNumero} • {adv.cargo}
                    </div>

                    <div className="text-[11px] text-[#545c6b] line-clamp-1">
                      {esc ? esc.razaoSocial : 'Escritório Particular'}
                    </div>

                    {adv.anotacoes && (
                      <p className="text-[11px] text-[#e8e1d0]/70 italic line-clamp-2">
                        &quot;{adv.anotacoes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#1b222d] flex items-center justify-between text-xs">
                    <a
                      href={whatsappAdapter.gerarLinkDireto(
                        adv.whatsapp,
                        `Olá ${adv.nome}, tudo bem? Aqui é da assessoria técnica da Dra. Karine Reis (Crivo Forense).`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {formatPhone(adv.whatsapp)}
                    </a>

                    <span className="text-[#b8a47c] text-[11px] group-hover:underline">
                      Ficha 360° →
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* TAB 3: PERICIANDOS (COM DADOS SENSÍVEIS DE SAÚDE) */}
      {activeTab === 'periciandos' && (
        <div className="space-y-4">
          {/* LGPD Sensitive Data Notice */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 text-amber-200/90 text-xs flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#b8a47c] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-100">
                Aviso de Proteção de Dados Sensíveis de Saúde (LGPD Art. 5º, II e Art. 11):
              </span>{' '}
              Os prontuários, CIDs e históricos clínicos aqui catalogados destinam-se exclusivamente à elaboração de quesitos, laudos e manifestações técnicas pela Dra. Karine Reis sob sigilo médico-pericial (Código de Ética Médica e Resoluções CFM).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periciandos
              .filter((p) =>
                p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.cpf.includes(searchTerm)
              )
              .map((per) => {
                const procs = processos.filter((pr) => pr.periciandoId === per.id);

                return (
                  <div
                    key={per.id}
                    onClick={() => handleSelectPericiando(per)}
                    className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] hover:border-[#b8a47c]/50 transition-all cursor-pointer space-y-3 shadow-sm group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-[#f4efe3] group-hover:text-[#b8a47c] transition-colors">
                          {per.nome}
                        </span>
                        <div className="text-xs text-[#545c6b] font-mono mt-0.5">
                          CPF: {formatCpf(per.cpf)} • Nasc: {formatDate(per.dataNascimento)}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-purple-950/40 text-purple-300 border border-purple-800/40">
                        {per.profissaoAtual || 'Periciando'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="text-[#545c6b] text-[11px] font-medium flex items-center justify-between">
                        <span>Patologias & CIDs:</span>
                        {!hasHealthAccess && (
                          <span className="text-[10px] text-rose-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> LGPD Restrito
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {per.dadosSaude.cid10Principais.map((cid) => (
                          <span
                            key={cid}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                              hasHealthAccess
                                ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            CID {cid}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#e8e1d0]/80 line-clamp-2 mt-1">
                        {per.dadosSaude.patologias.join(', ')}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1b222d] flex items-center justify-between text-xs text-[#545c6b]">
                      <span>{procs.length} Processo(s) vinculado(s)</span>
                      <span className="text-[#b8a47c] font-medium group-hover:underline flex items-center gap-1">
                        {hasHealthAccess ? 'Ver Prontuário Pericial →' : 'Ver Ficha Cadastral →'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Drawer / Modal de Detalhes Clínicos do Periciando */}
      {selectedPericiando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#b8a47c] font-semibold">
                  Ficha Médico-Pericial & LGPD
                </span>
                <h2 className="font-serif text-xl text-[#f4efe3]">
                  {selectedPericiando.nome}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPericiando(null)}
                className="text-[#545c6b] hover:text-[#f4efe3]"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-[#e8e1d0]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-[#1b222d] border border-[#263040]">
                <div>
                  <span className="text-[#545c6b] block">CPF</span>
                  <span className="font-mono text-[#f4efe3] font-medium">
                    {formatCpf(selectedPericiando.cpf)}
                  </span>
                </div>
                <div>
                  <span className="text-[#545c6b] block">Nascimento</span>
                  <span className="text-[#f4efe3]">
                    {formatDate(selectedPericiando.dataNascimento)}
                  </span>
                </div>
                <div>
                  <span className="text-[#545c6b] block">Profissão Habitual</span>
                  <span className="text-[#f4efe3]">
                    {selectedPericiando.profissaoAtual}
                  </span>
                </div>
                <div>
                  <span className="text-[#545c6b] block">Contato</span>
                  <span className="text-[#f4efe3]">
                    {formatPhone(selectedPericiando.telefone)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#545c6b] block">Endereço</span>
                  <span className="text-[#f4efe3] truncate block">
                    {selectedPericiando.endereco}
                  </span>
                </div>
              </div>

              {/* Quadro Clínico e Exames */}
              {!hasHealthAccess ? (
                <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900/40 text-center space-y-2 my-2">
                  <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-rose-300 text-sm">
                    Acesso a Dados Clínicos e Prontuário Bloqueado (LGPD Art. 11)
                  </h3>
                  <p className="text-xs text-[#e8e1d0]/70 max-w-md mx-auto leading-relaxed">
                    O perfil <strong className="text-white">{currentUser.papelNome}</strong> não possui a permissão especial &quot;Acessar dados sensíveis de saúde&quot;.
                    A visualização de prontuários, CIDs e históricos médicos é restrita à médica perita e assistentes técnicos com CRM.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-[#161c26] border border-[#263040] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#b8a47c] flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 text-[#b8a47c]" />
                        Diagnósticos & CIDs Principais
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Acesso Auditado
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedPericiando.dadosSaude.cid10Principais.map((cid) => (
                        <span
                          key={cid}
                          className="px-2 py-0.5 rounded font-mono text-xs bg-rose-950/60 text-rose-300 border border-rose-800/40"
                        >
                          CID {cid}
                        </span>
                      ))}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[#e8e1d0]/90 pt-1">
                      {selectedPericiando.dadosSaude.patologias.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#161c26] border border-[#263040] space-y-1.5">
                    <span className="font-semibold text-[#b8a47c]">Histórico Clínico e Ocupacional</span>
                    <p className="text-[#e8e1d0]/80 leading-relaxed">
                      {selectedPericiando.dadosSaude.historicoClinico}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-[#161c26] border border-[#263040] space-y-1">
                      <span className="font-semibold text-[#b8a47c]">Medicamentos em Uso</span>
                      <p className="text-[#e8e1d0]/80">
                        {selectedPericiando.dadosSaude.medicamentosEmUso}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#161c26] border border-[#263040] space-y-1">
                      <span className="font-semibold text-[#b8a47c]">Restrições Físicas & Ergonômicas</span>
                      <p className="text-[#e8e1d0]/80">
                        {selectedPericiando.dadosSaude.restricoesFisicas}
                      </p>
                    </div>
                  </div>

                  {selectedPericiando.dadosSaude.observacoesRestritas && (
                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-amber-200/90 text-xs">
                      <span className="font-semibold">Observações Restritas da Perita:</span>{' '}
                      {selectedPericiando.dadosSaude.observacoesRestritas}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#263040] bg-[#161c26]">
              <span className="text-[11px] text-[#545c6b]">
                Consentimento LGPD: {selectedPericiando.dadosSaude.consentimentoLgpdColetado ? '✓ Coletado' : 'Pendente'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFicha360Target({ tipo: 'periciando', id: selectedPericiando.id });
                    setSelectedPericiando(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#b8a47c] border border-[#263040] font-semibold text-xs hover:bg-[#232c3a]"
                >
                  Abrir Ficha 360° Completa
                </button>
                <button
                  onClick={() => setSelectedPericiando(null)}
                  className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692]"
                >
                  Fechar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha 360° Completa */}
      {ficha360Target && (
        <Ficha360Modal
          tipo={ficha360Target.tipo}
          id={ficha360Target.id}
          onClose={() => setFicha360Target(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};
