import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  UserCheck,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  MessageSquare,
  Lock,
  Unlock,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Tag,
  Copy,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  escritorioRepository,
  advogadoRepository,
  periciandoRepository,
  processoRepository,
  cobrancaRepository,
  tarefaRepository,
  documentoRepository,
  oportunidadeRepository,
  interacaoRepository,
  auditLogRepository,
} from '../../services';
import {
  Escritorio,
  Advogado,
  Periciando,
  Processo,
  Cobranca,
  Tarefa,
  Documento,
  Oportunidade,
  Interacao,
} from '../../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  formatCpf,
  formatCnpj,
  formatProcesso,
} from '../../utils/formatters';
import { whatsappAdapter } from '../../integrations/whatsapp';
import { useAuth } from '../../context/AuthContext';

interface Ficha360ModalProps {
  tipo: 'escritorio' | 'advogado' | 'periciando';
  id: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export const Ficha360Modal: React.FC<Ficha360ModalProps> = ({
  tipo,
  id,
  onClose,
  onUpdate,
}) => {
  const { currentUser, canAccessSensitiveHealthData } = useAuth();
  const hasHealthAccess = canAccessSensitiveHealthData();

  const [activeTab, setActiveTab] = useState<
    'visao_geral' | 'interacoes' | 'oportunidades' | 'processos' | 'documentos' | 'financeiro' | 'tarefas'
  >('visao_geral');

  // Dados das entidades
  const [escritorio, setEscritorio] = useState<Escritorio | null>(null);
  const [advogado, setAdvogado] = useState<Advogado | null>(null);
  const [periciando, setPericiando] = useState<Periciando | null>(null);
  const [escritorioVinculado, setEscritorioVinculado] = useState<Escritorio | null>(null);

  // Listas vinculadas
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  // Modal / Form de Nova Interação Manual
  const [isNovaInteracaoOpen, setIsNovaInteracaoOpen] = useState(false);
  const [intTipo, setIntTipo] = useState<Interacao['tipo']>('WhatsApp');
  const [intTitulo, setIntTitulo] = useState('');
  const [intDescricao, setIntDescricao] = useState('');
  const [copiadoPix, setCopiadoPix] = useState(false);

  const loadDados = async () => {
    if (tipo === 'escritorio') {
      const esc = await escritorioRepository.getById(id);
      setEscritorio(esc);
      const [allInt, allOp, allProc, allCob, allTar, allDocs] = await Promise.all([
        interacaoRepository.getByContato('escritorio', id),
        oportunidadeRepository.getAll(),
        processoRepository.getAll(),
        cobrancaRepository.getAll(),
        tarefaRepository.getAll(),
        documentoRepository.getAll(),
      ]);
      setInteracoes(allInt);
      setOportunidades(allOp.filter((o) => o.escritorioId === id));
      setProcessos(allProc.filter((p) => p.escritorioId === id));
      setCobrancas(allCob.filter((c) => c.devedorNome.includes(esc?.nomeFantasia || esc?.razaoSocial || '')));
      setTarefas(allTar.filter((t) => t.descricao.includes(esc?.nomeFantasia || '')));
      setDocumentos(allDocs);
    } else if (tipo === 'advogado') {
      const adv = await advogadoRepository.getById(id);
      setAdvogado(adv);
      if (adv?.escritorioId) {
        const esc = await escritorioRepository.getById(adv.escritorioId);
        setEscritorioVinculado(esc);
      }
      const [allInt, allOp, allProc, allCob, allTar, allDocs] = await Promise.all([
        interacaoRepository.getByContato('advogado', id),
        oportunidadeRepository.getAll(),
        processoRepository.getAll(),
        cobrancaRepository.getAll(),
        tarefaRepository.getAll(),
        documentoRepository.getAll(),
      ]);
      setInteracoes(allInt);
      setOportunidades(allOp.filter((o) => o.advogadoId === id));
      setProcessos(allProc.filter((p) => p.advogadoId === id));
      setCobrancas(allCob.filter((c) => c.devedorNome.includes(adv?.nome || '')));
      setTarefas(allTar.filter((t) => t.descricao.includes(adv?.nome || '')));
      setDocumentos(allDocs);
    } else if (tipo === 'periciando') {
      const per = await periciandoRepository.getById(id);
      setPericiando(per);
      const [allInt, allOp, allProc, allCob, allTar, allDocs] = await Promise.all([
        interacaoRepository.getByContato('periciando', id),
        oportunidadeRepository.getAll(),
        processoRepository.getAll(),
        cobrancaRepository.getAll(),
        tarefaRepository.getAll(),
        documentoRepository.getAll(),
      ]);
      setInteracoes(allInt);
      setOportunidades(allOp.filter((o) => o.periciandoId === id));
      setProcessos(allProc.filter((p) => p.periciandoId === id));
      setCobrancas(allCob.filter((c) => c.devedorNome.includes(per?.nome || '')));
      setTarefas(allTar.filter((t) => t.periciaId || t.descricao.includes(per?.nome || '')));
      setDocumentos(allDocs.filter((d) => d.periciandoId === id));
    }
  };

  useEffect(() => {
    loadDados();
  }, [id, tipo, hasHealthAccess]);

  const handleSalvarInteracao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intDescricao.trim()) return;

    await interacaoRepository.create({
      tipo: intTipo,
      titulo: intTitulo.trim() || `${intTipo} com contato`,
      descricao: intDescricao.trim(),
      dataHora: new Date().toISOString(),
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      escritorioId: tipo === 'escritorio' ? id : advogado?.escritorioId,
      advogadoId: tipo === 'advogado' ? id : undefined,
      periciandoId: tipo === 'periciando' ? id : undefined,
      statusEnvio: intTipo === 'WhatsApp' ? 'Lido' : intTipo === 'E-mail' ? 'Entregue' : undefined,
    });

    setIntTitulo('');
    setIntDescricao('');
    setIsNovaInteracaoOpen(false);
    loadDados();
    onUpdate?.();
  };

  const getNomePrincipal = () => {
    if (tipo === 'escritorio') return escritorio?.nomeFantasia || escritorio?.razaoSocial || 'Escritório';
    if (tipo === 'advogado') return advogado?.nome || 'Advogado';
    if (tipo === 'periciando') return periciando?.nome || 'Periciando';
    return '';
  };

  const getSubtitulo = () => {
    if (tipo === 'escritorio') return `CNPJ: ${formatCnpj(escritorio?.cnpj)} • ${escritorio?.cidade}/${escritorio?.uf}`;
    if (tipo === 'advogado') return `OAB/${advogado?.oabUf} nº ${advogado?.oabNumero} • ${escritorioVinculado?.nomeFantasia || 'Autônomo'}`;
    if (tipo === 'periciando') return `CPF: ${formatCpf(periciando?.cpf)} • Nascimento: ${formatDate(periciando?.dataNascimento)}`;
    return '';
  };

  const getTelefone = () => {
    if (tipo === 'escritorio') return escritorio?.telefone;
    if (tipo === 'advogado') return advogado?.whatsapp;
    if (tipo === 'periciando') return periciando?.telefone;
    return '';
  };

  const getEmail = () => {
    if (tipo === 'escritorio') return escritorio?.email;
    if (tipo === 'advogado') return advogado?.email;
    if (tipo === 'periciando') return periciando?.email;
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[90vh] bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e8e1d0]">
        
        {/* Top Header Card */}
        <div className="px-6 py-5 border-b border-[#263040] bg-[#161c26] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1b222d] border border-[#263040] flex items-center justify-center text-[#b8a47c] shrink-0 shadow-inner">
              {tipo === 'escritorio' && <Building2 className="w-6 h-6" />}
              {tipo === 'advogado' && <UserCheck className="w-6 h-6" />}
              {tipo === 'periciando' && <HeartPulse className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/30">
                  Ficha 360° • {tipo === 'escritorio' ? 'Escritório Parceiro' : tipo === 'advogado' ? 'Advogado Contratante' : 'Periciando (Exame Clínico)'}
                </span>
                {tipo === 'advogado' && advogado?.eDecisor && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    ★ Decisor
                  </span>
                )}
                {tipo === 'escritorio' && escritorio?.status && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    {escritorio.status}
                  </span>
                )}
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#f4efe3] mt-1 font-normal">
                {getNomePrincipal()}
              </h2>
              <p className="text-xs text-[#545c6b] mt-0.5">{getSubtitulo()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {getTelefone() && (
              <a
                href={whatsappAdapter.gerarLinkDireto(
                  getTelefone()!,
                  `Olá ${getNomePrincipal()}, tudo bem? Aqui é da Crivo Forense / Dra. Karine Reis.`
                )}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
            <button
              onClick={() => setIsNovaInteracaoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Interação
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#263040] bg-[#12171f] px-6 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('visao_geral')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'visao_geral'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('interacoes')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'interacoes'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            Linha do Tempo
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b222d] text-[#e8e1d0]">
              {interacoes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('oportunidades')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'oportunidades'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            Oportunidades
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b222d] text-[#e8e1d0]">
              {oportunidades.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('processos')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'processos'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            Processos Judiciais
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b222d] text-[#e8e1d0]">
              {processos.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'documentos'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            Documentos & Laudos
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b222d] text-[#e8e1d0]">
              {documentos.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'financeiro'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            Financeiro
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b222d] text-[#e8e1d0]">
              {cobrancas.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tarefas')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tarefas'
                ? 'border-[#b8a47c] text-[#b8a47c]'
                : 'border-transparent text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            Tarefas & Prazos
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b222d] text-[#e8e1d0]">
              {tarefas.length}
            </span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'visao_geral' && (
            <div className="space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-1">
                  <span className="text-[11px] text-[#545c6b] uppercase font-bold tracking-wider">
                    Contato Principal
                  </span>
                  <div className="text-sm font-semibold text-[#f4efe3] flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#b8a47c]" />
                    {formatPhone(getTelefone()) || 'Não informado'}
                  </div>
                  <div className="text-xs text-[#5b9cd9] flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#545c6b]" />
                    {getEmail() || 'Sem e-mail'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-1">
                  <span className="text-[11px] text-[#545c6b] uppercase font-bold tracking-wider">
                    Localidade / Endereço
                  </span>
                  <div className="text-sm font-semibold text-[#f4efe3] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#b8a47c]" />
                    {tipo === 'escritorio' ? `${escritorio?.cidade}/${escritorio?.uf}` : tipo === 'advogado' ? `${escritorioVinculado?.cidade || 'SP'}/${escritorioVinculado?.uf || 'SP'}` : periciando?.endereco || 'São Paulo/SP'}
                  </div>
                  <div className="text-xs text-[#545c6b] truncate">
                    {tipo === 'escritorio' ? escritorio?.endereco : tipo === 'advogado' ? escritorioVinculado?.endereco : periciando?.endereco}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-1">
                  <span className="text-[11px] text-[#545c6b] uppercase font-bold tracking-wider">
                    Pipeline Financeiro Total
                  </span>
                  <div className="text-lg font-mono font-bold text-[#b8a47c]">
                    {formatCurrency(
                      oportunidades.reduce((acc, o) => acc + (o.valorEstimado || 0), 0) +
                      cobrancas.reduce((acc, c) => acc + (c.valor || 0), 0)
                    )}
                  </div>
                  <div className="text-[11px] text-[#545c6b]">
                    {processos.length} processos judiciais ativos
                  </div>
                </div>
              </div>

              {/* Se for Escritório: Áreas e Advogados */}
              {tipo === 'escritorio' && escritorio && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c]">
                      Áreas de Atuação Jurídica do Escritório
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {escritorio.areasAtuacao.map((area) => (
                        <span
                          key={area}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#1b222d] text-[#5b9cd9] border border-[#263040]"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c]">
                      Dados Cadastrais Formais
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[#545c6b] block">Razão Social</span>
                        <span className="font-medium text-[#f4efe3]">{escritorio.razaoSocial}</span>
                      </div>
                      <div>
                        <span className="text-[#545c6b] block">Nome Fantasia</span>
                        <span className="font-medium text-[#f4efe3]">{escritorio.nomeFantasia}</span>
                      </div>
                      <div>
                        <span className="text-[#545c6b] block">CNPJ</span>
                        <span className="font-mono text-[#f4efe3]">{formatCnpj(escritorio.cnpj)}</span>
                      </div>
                      <div>
                        <span className="text-[#545c6b] block">Data de Cadastro</span>
                        <span className="text-[#f4efe3]">{formatDate(escritorio.dataCadastro)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Se for Advogado: Dados OAB e Cargo */}
              {tipo === 'advogado' && advogado && (
                <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c]">
                    Dados Profissionais da Advocacia
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[#545c6b] block">Inscrição na OAB</span>
                      <span className="font-bold text-[#f4efe3] font-mono">OAB/{advogado.oabUf} nº {advogado.oabNumero}</span>
                    </div>
                    <div>
                      <span className="text-[#545c6b] block">Cargo / Papel</span>
                      <span className="text-[#f4efe3]">{advogado.cargo}</span>
                    </div>
                    <div>
                      <span className="text-[#545c6b] block">Poder Decisório</span>
                      <span className={advogado.eDecisor ? 'text-emerald-400 font-semibold' : 'text-[#545c6b]'}>
                        {advogado.eDecisor ? 'Sim (Sócio / Decisor)' : 'Não'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#545c6b] block">Escritório Vinculado</span>
                      <span className="text-[#b8a47c]">{escritorioVinculado?.nomeFantasia || 'Autônomo'}</span>
                    </div>
                  </div>
                  {advogado.anotacoes && (
                    <div className="mt-2 p-3 rounded-lg bg-[#1b222d] border border-[#263040] text-xs text-[#e8e1d0]/80">
                      <span className="font-semibold text-[#b8a47c]">Anotações Técnicas:</span> {advogado.anotacoes}
                    </div>
                  )}
                </div>
              )}

              {/* Se for Periciando: Prontuário Clínico e LGPD Art. 11 */}
              {tipo === 'periciando' && periciando && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c]">
                      Dados Pessoais do Periciando
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[#545c6b] block">CPF</span>
                        <span className="font-mono font-semibold text-[#f4efe3]">{formatCpf(periciando.cpf)}</span>
                      </div>
                      <div>
                        <span className="text-[#545c6b] block">Data de Nascimento</span>
                        <span className="text-[#f4efe3]">{formatDate(periciando.dataNascimento)}</span>
                      </div>
                      <div>
                        <span className="text-[#545c6b] block">Profissão Habitual</span>
                        <span className="text-[#f4efe3]">{periciando.profissaoAtual || 'Não informada'}</span>
                      </div>
                      <div>
                        <span className="text-[#545c6b] block">Consentimento LGPD</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Coletado Art. 11
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quadro Clínico e Exames Sensíveis */}
                  {!hasHealthAccess ? (
                    <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900/40 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center mx-auto">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-rose-300 text-sm">
                        Acesso Restrito a Prontuário e Dados de Saúde (LGPD Art. 11)
                      </h4>
                      <p className="text-xs text-[#e8e1d0]/70 max-w-md mx-auto leading-relaxed">
                        O perfil <strong className="text-white">{currentUser.papelNome}</strong> não possui a permissão especial de saúde. A visualização de prontuários, CIDs e históricos médicos é restrita à médica perita e assistentes técnicos com CRM.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c] flex items-center gap-1.5">
                          <HeartPulse className="w-4 h-4 text-[#b8a47c]" />
                          Prontuário Médico-Pericial & Diagnósticos
                        </h4>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Acesso Auditado
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {periciando.dadosSaude.cid10Principais?.map((cid) => (
                          <span
                            key={cid}
                            className="px-2 py-0.5 rounded font-mono text-xs bg-rose-950/60 text-rose-300 border border-rose-800/40"
                          >
                            CID {cid}
                          </span>
                        ))}
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-[#e8e1d0]">
                        {periciando.dadosSaude.patologias?.map((pat, i) => (
                          <li key={i}>{pat}</li>
                        ))}
                      </ul>
                      <div className="p-3 rounded-lg bg-[#1b222d] border border-[#263040] text-xs space-y-1">
                        <span className="text-[#b8a47c] font-semibold block">Histórico Clínico e Ocupacional:</span>
                        <p className="text-[#e8e1d0]/80 leading-relaxed">{periciando.dadosSaude.historicoClinico}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-[#1b222d] border border-[#263040]">
                          <span className="text-[#b8a47c] font-semibold block">Medicamentos em Uso:</span>
                          <p className="text-[#e8e1d0]/80 mt-1">{periciando.dadosSaude.medicamentosEmUso}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#1b222d] border border-[#263040]">
                          <span className="text-[#b8a47c] font-semibold block">Restrições Físicas / Ergonômicas:</span>
                          <p className="text-[#e8e1d0]/80 mt-1">{periciando.dadosSaude.restricoesFisicas}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LINHA DO TEMPO & INTERAÇÕES */}
          {activeTab === 'interacoes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">
                    Linha do Tempo de Atendimento e Interações
                  </h3>
                  <p className="text-xs text-[#545c6b]">
                    Histórico cronológico de WhatsApp, e-mails, reuniões pré-periciais e notas internas.
                  </p>
                </div>
                <button
                  onClick={() => setIsNovaInteracaoOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Interação
                </button>
              </div>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#263040]">
                {interacoes.map((int) => (
                  <div key={int.id} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-[#1b222d] border-2 border-[#b8a47c] flex items-center justify-center" />
                    <div className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-2 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-[#12171f] text-[#b8a47c] border border-[#263040]">
                            {int.tipo}
                          </span>
                          <span className="font-semibold text-[#f4efe3]">{int.titulo || int.tipo}</span>
                        </div>
                        <div className="text-[11px] text-[#545c6b] flex items-center gap-2 font-mono">
                          <span>{formatDateTime(int.dataHora)}</span>
                          <span className="text-[#e8e1d0] font-sans">• Por {int.usuarioNome}</span>
                        </div>
                      </div>
                      <p className="text-[#e8e1d0]/80 leading-relaxed whitespace-pre-wrap">
                        {int.descricao}
                      </p>
                    </div>
                  </div>
                ))}

                {interacoes.length === 0 && (
                  <div className="p-8 text-center bg-[#161c26] border border-[#263040] rounded-xl text-xs text-[#545c6b]">
                    Nenhuma interação registrada para este contato. Clique em &quot;Registrar Interação&quot; para registrar uma conversa ou reunião.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OPORTUNIDADES & PIPELINE */}
          {activeTab === 'oportunidades' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">
                    Oportunidades de Honorários & Contratações
                  </h3>
                  <p className="text-xs text-[#545c6b]">
                    Negociações em curso e perícias contratadas com esta banca ou periciando.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oportunidades.map((op) => (
                  <div
                    key={op.id}
                    className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-2.5 text-xs shadow-sm hover:border-[#b8a47c]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-[#f4efe3] text-sm leading-tight">
                        {op.titulo}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        op.status === 'Ganha' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        op.status === 'Perdida' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {op.fase}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#5b9cd9] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#545c6b]" />
                      {op.servicoInteresse}
                    </div>

                    {op.numeroProcesso && (
                      <div className="text-[11px] text-[#545c6b] font-mono">
                        Proc: {formatProcesso(op.numeroProcesso)}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#263040] font-mono">
                      <div>
                        <span className="text-[10px] text-[#545c6b] block">Valor Estimado</span>
                        <span className="text-sm font-bold text-[#b8a47c]">{formatCurrency(op.valorEstimado)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#545c6b] block">Probabilidade</span>
                        <span className="font-semibold text-emerald-400">{op.probabilidade}%</span>
                      </div>
                    </div>

                    {op.prazoProcessualCritico && (
                      <div className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3" /> Prazo Fatal: {formatDate(op.prazoProcessualCritico)}
                      </div>
                    )}
                  </div>
                ))}

                {oportunidades.length === 0 && (
                  <div className="col-span-2 p-8 text-center bg-[#161c26] border border-[#263040] rounded-xl text-xs text-[#545c6b]">
                    Nenhuma oportunidade cadastrada no funil para este contato.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROCESSOS JUDICIAIS */}
          {activeTab === 'processos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">
                    Processos Judiciais Vinculados
                  </h3>
                  <p className="text-xs text-[#545c6b]">
                    Autos onde a Dra. Karine Reis atua como assistente técnica ou perita do juízo.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {processos.map((proc) => (
                  <div
                    key={proc.id}
                    className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#f4efe3]">
                          {formatProcesso(proc.numeroCnj)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#12171f] text-[#5b9cd9] border border-[#263040]">
                          {proc.tribunal}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/30">
                          {proc.modalidadeAtuacao}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#545c6b]">
                        {proc.vara} • {proc.comarca}
                      </div>
                      <div className="text-xs text-[#e8e1d0]/80">
                        <span className="font-semibold text-white">Autor:</span> {proc.poloAtivo} × <span className="font-semibold text-white">Réu:</span> {proc.poloPassivo}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-1">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        {proc.statusProcessual}
                      </span>
                      {proc.honorariosAcordados && (
                        <span className="font-mono text-xs font-semibold text-[#b8a47c]">
                          Honorários: {formatCurrency(proc.honorariosAcordados)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {processos.length === 0 && (
                  <div className="p-8 text-center bg-[#161c26] border border-[#263040] rounded-xl text-xs text-[#545c6b]">
                    Nenhum processo judicial associado a este cadastro.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTOS & LAUDOS */}
          {activeTab === 'documentos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">
                    Documentos Periciais & Peças Técnicas
                  </h3>
                  <p className="text-xs text-[#545c6b]">
                    Pareceres assistenciais assinados digitalmente, quesitos, termos LGPD e prontuários.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-[#1b222d] border border-[#263040] flex items-center justify-between text-xs hover:border-[#b8a47c]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#12171f] border border-[#263040] flex items-center justify-center text-[#b8a47c] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-[#f4efe3] block leading-tight">
                          {doc.nomeArquivo}
                        </span>
                        <div className="text-[10px] text-[#545c6b] mt-0.5">
                          {doc.tipo} • {formatDate(doc.dataUpload)}
                        </div>
                      </div>
                    </div>
                    <a
                      href={doc.urlMock}
                      download={doc.nomeArquivo}
                      className="px-2.5 py-1 rounded bg-[#161c26] text-[#b8a47c] border border-[#263040] hover:bg-[#232c3a] text-xs font-semibold transition-colors"
                    >
                      Baixar
                    </a>
                  </div>
                ))}

                {documentos.length === 0 && (
                  <div className="col-span-2 p-8 text-center bg-[#161c26] border border-[#263040] rounded-xl text-xs text-[#545c6b]">
                    Nenhum documento anexado até o momento.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: FINANCEIRO */}
          {activeTab === 'financeiro' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">
                    Cobranças de Honorários & Boletos/Pix
                  </h3>
                  <p className="text-xs text-[#545c6b]">
                    Histórico de parcelas de honorários, depósitos judiciais e quitações.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {cobrancas.map((cob) => (
                  <div
                    key={cob.id}
                    className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#f4efe3]">{cob.titulo}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#12171f] text-[#b8a47c] border border-[#263040]">
                          {cob.metodo}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#545c6b] mt-0.5">
                        Devedor: {cob.devedorNome} • Vencimento: {formatDate(cob.vencimento)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-[#545c6b] block">Valor</span>
                        <span className="font-mono font-bold text-sm text-[#b8a47c]">
                          {formatCurrency(cob.valor)}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        cob.status === 'Paga' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        cob.status === 'Em Atraso' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {cob.status}
                      </span>
                    </div>
                  </div>
                ))}

                {cobrancas.length === 0 && (
                  <div className="p-8 text-center bg-[#161c26] border border-[#263040] rounded-xl text-xs text-[#545c6b]">
                    Nenhuma cobrança registrada para este contato.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: TAREFAS */}
          {activeTab === 'tarefas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">
                    Tarefas, Prazos e Diligências
                  </h3>
                  <p className="text-xs text-[#545c6b]">
                    Atividades técnicas atribuídas aos colaboradores para este caso.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {tarefas.map((tar) => (
                  <div
                    key={tar.id}
                    className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#f4efe3]">{tar.titulo}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tar.prioridade === 'Urgente / Prazo Fatal' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          tar.prioridade === 'Alta' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-[#12171f] text-[#545c6b] border border-[#263040]'
                        }`}>
                          {tar.prioridade}
                        </span>
                      </div>
                      <p className="text-[#e8e1d0]/80">{tar.descricao}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-[#545c6b] block">Data Limite</span>
                        <span className="text-xs font-semibold text-rose-400">{formatDate(tar.dataLimite)}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                        tar.status === 'Concluída' ? 'bg-emerald-950 text-emerald-400' : 'bg-[#161c26] text-[#b8a47c]'
                      }`}>
                        {tar.status}
                      </span>
                    </div>
                  </div>
                ))}

                {tarefas.length === 0 && (
                  <div className="p-8 text-center bg-[#161c26] border border-[#263040] rounded-xl text-xs text-[#545c6b]">
                    Nenhuma tarefa pendente associada a este caso.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal: Nova Interação */}
        {isNovaInteracaoOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-[#161c26] border border-[#263040] rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-[#263040] flex items-center justify-between">
                <h3 className="font-serif text-lg text-[#f4efe3]">Registrar Interação Manual</h3>
                <button
                  onClick={() => setIsNovaInteracaoOpen(false)}
                  className="text-[#545c6b] hover:text-[#f4efe3]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarInteracao} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Canal / Tipo de Interação *</label>
                  <select
                    value={intTipo}
                    onChange={(e) => setIntTipo(e.target.value as any)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Ligação">Ligação Telefônica</option>
                    <option value="Reunião">Reunião Pré-Pericial (Online/Presencial)</option>
                    <option value="Nota Interna">Nota Interna (Anotação Técnica)</option>
                    <option value="Andamento Processual">Andamento Processual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Título Resumido</label>
                  <input
                    type="text"
                    placeholder="Ex: Alinhamento de quesitos sobre ruído e ergonomia"
                    value={intTitulo}
                    onChange={(e) => setIntTitulo(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Descrição Detalhada *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Registre o que foi conversado, orientações passadas ao advogado, exames solicitados ou decisões tomadas..."
                    value={intDescricao}
                    onChange={(e) => setIntDescricao(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#263040]">
                  <button
                    type="button"
                    onClick={() => setIsNovaInteracaoOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold hover:bg-[#c7b692]"
                  >
                    Salvar na Linha do Tempo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
