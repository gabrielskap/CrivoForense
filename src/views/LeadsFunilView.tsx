import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  Search,
  MessageCircle,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  X,
  ChevronRight,
  Building2,
  User,
  HeartPulse,
  AlertTriangle,
  Clock,
  Sparkles,
  GitMerge,
  RotateCcw,
  Download,
  CheckSquare,
  Square,
  CheckCircle2,
  Flame,
  ArrowUpDown,
  Tag,
  Share2,
  ExternalLink,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  leadRepository,
  funilRepository,
  oportunidadeRepository,
  escritorioRepository,
  advogadoRepository,
  usuarioRepository,
  interacaoRepository,
  auditLogRepository,
} from '../services';
import {
  Lead,
  StatusFunilLead,
  AreaDireito,
  TipoLead,
  FaseProcessoLead,
  OrigemLead,
  MotivoPerda,
  Funil,
  EtapaFunil,
  Usuario,
  Escritorio,
} from '../types';
import { formatCurrency, formatDate, formatPhone, maskPhoneInput } from '../utils/formatters';
import { whatsappAdapter } from '../integrations/whatsapp';
import { useAuth } from '../context/AuthContext';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { MotivoPerdaModal } from '../components/leads/MotivoPerdaModal';
import { ConversaoLeadModal } from '../components/leads/ConversaoLeadModal';
import { DuplicateMergeModal } from '../components/leads/DuplicateMergeModal';

type FiltroSalvo = 'todos' | 'prazo_em_curso' | 'score_alto' | 'parados_alerta' | 'trabalhista' | 'previdenciario' | 'erro_medico' | 'perdidos';

export const LeadsFunilView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // Estados principais
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funis, setFunis] = useState<Funil[]>([]);
  const [funilAtivoId, setFunilAtivoId] = useState<string>('funil_assistencia');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [escritorios, setEscritorios] = useState<Escritorio[]>([]);

  // Modos de visualização
  const [viewMode, setViewMode] = useState<'kanban' | 'tabela' | 'reativacao' | 'duplicados'>('kanban');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroArea, setFiltroArea] = useState<string>('todos');
  const [filtroOrigem, setFiltroOrigem] = useState<string>('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [filtroSalvoAtivo, setFiltroSalvoAtivo] = useState<FiltroSalvo>('todos');

  // Seleção em massa (lote)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isLoteResponsavelOpen, setIsLoteResponsavelOpen] = useState(false);
  const [isLoteEtapaOpen, setIsLoteEtapaOpen] = useState(false);
  const [isLoteTagOpen, setIsLoteTagOpen] = useState(false);
  const [novaTagLote, setNovaTagLote] = useState('');

  // Configuração da Aba de Reativação
  const [diasReativacao, setDiasReativacao] = useState<number>(30);

  // Drag and Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Modais de detalhe e ações
  const [selectedLeadIdForDetail, setSelectedLeadIdForDetail] = useState<string | null>(null);
  const [leadParaPerda, setLeadParaPerda] = useState<Lead | null>(null);
  const [leadParaConversao, setLeadParaConversao] = useState<Lead | null>(null);
  const [mergePair, setMergePair] = useState<{ lead1: Lead; lead2: Lead; motivo: string } | null>(null);

  // Modal Novo Lead
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoLead>('Advogado');
  const [novoContatoNome, setNovoContatoNome] = useState('');
  const [novoWhatsapp, setNovoWhatsapp] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoCidade, setNovoCidade] = useState('São Paulo');
  const [novoUf, setNovoUf] = useState('SP');
  const [novoArea, setNovoArea] = useState<AreaDireito>('Trabalhista');
  const [novoFaseProcesso, setNovoFaseProcesso] = useState<FaseProcessoLead>('Aguardando perícia');
  const [novoNecessidade, setNovoNecessidade] = useState('');
  const [novoPrazoEmCurso, setNovoPrazoEmCurso] = useState(false);
  const [novoPrazoData, setNovoPrazoData] = useState('');
  const [novoOrigem, setNovoOrigem] = useState<OrigemLead>('Indicação');
  const [novoIndicadoPor, setNovoIndicadoPor] = useState('');
  const [novoValorEstimado, setNovoValorEstimado] = useState(4500);
  const [novoScore, setNovoScore] = useState(80);
  const [novoResponsavelId, setNovoResponsavelId] = useState('user_karine');
  const [novoTags, setNovoTags] = useState('Urgente, Quesitos');
  const [novoObservacoes, setNovoObservacoes] = useState('');

  const loadData = async () => {
    const [allLeads, allFunis, allUsers, allEscs] = await Promise.all([
      leadRepository.getAll(),
      funilRepository.getAll(),
      usuarioRepository.getAll(),
      escritorioRepository.getAll(),
    ]);
    setLeads(allLeads);
    setFunis(allFunis);
    setUsuarios(allUsers);
    setEscritorios(allEscs);
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('novo') === 'true') {
      setIsNovoModalOpen(true);
    }
  }, [searchParams]);

  // Funil Ativo
  const funilAtivo = useMemo(() => {
    return funis.find((f) => f.id === funilAtivoId) || funis[0] || {
      id: 'funil_assistencia',
      nome: 'Assistência Técnica Médico-Pericial',
      etapas: [
        { id: 'Novo', nome: 'Novo', ordem: 1, cor: '#64748b', diasAlerta: 2, tipo: 'aberto' },
        { id: 'Em triagem', nome: 'Em Triagem', ordem: 2, cor: '#0284c7', diasAlerta: 3, tipo: 'aberto' },
        { id: 'Qualificado', nome: 'Qualificado', ordem: 3, cor: '#0d9488', diasAlerta: 4, tipo: 'aberto' },
        { id: 'Análise de viabilidade', nome: 'Análise de Viabilidade', ordem: 4, cor: '#8b5cf6', diasAlerta: 5, tipo: 'aberto' },
        { id: 'Proposta enviada', nome: 'Proposta Enviada', ordem: 5, cor: '#d97706', diasAlerta: 3, tipo: 'aberto' },
        { id: 'Negociação', nome: 'Negociação', ordem: 6, cor: '#b8a47c', diasAlerta: 5, tipo: 'aberto' },
        { id: 'Ganho', nome: 'Ganho (Contratado)', ordem: 7, cor: '#10b981', diasAlerta: 999, tipo: 'ganho' },
        { id: 'Perdido', nome: 'Perdido', ordem: 8, cor: '#ef4444', diasAlerta: 999, tipo: 'perdido' },
      ],
    };
  }, [funis, funilAtivoId]);

  // Cálculo de dias parado na etapa
  const getDiasParado = (dataEntrada?: string) => {
    if (!dataEntrada) return 0;
    const entrada = new Date(dataEntrada).getTime();
    const agora = new Date().getTime();
    const diff = Math.floor((agora - entrada) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Detecção de Pares de Duplicados em toda a base
  const duplicadosEncontrados = useMemo(() => {
    const pairs: { lead1: Lead; lead2: Lead; motivo: string }[] = [];
    for (let i = 0; i < leads.length; i++) {
      for (let j = i + 1; j < leads.length; j++) {
        const l1 = leads[i];
        const l2 = leads[j];

        const tel1 = (l1.whatsapp || l1.telefone || '').replace(/\D/g, '');
        const tel2 = (l2.whatsapp || l2.telefone || '').replace(/\D/g, '');
        if (tel1 && tel2 && tel1.length >= 8 && tel1 === tel2) {
          pairs.push({ lead1: l1, lead2: l2, motivo: `Telefone coincidente (${formatPhone(l1.whatsapp)})` });
          continue;
        }

        if (l1.email && l2.email && l1.email.toLowerCase().trim() === l2.email.toLowerCase().trim()) {
          pairs.push({ lead1: l1, lead2: l2, motivo: `E-mail idêntico (${l1.email})` });
          continue;
        }

        if (l1.oabNumero && l2.oabNumero && l1.oabNumero.trim() === l2.oabNumero.trim()) {
          pairs.push({ lead1: l1, lead2: l2, motivo: `OAB idêntica (${l1.oabNumero})` });
          continue;
        }

        const doc1 = (l1.cpfCnpj || '').replace(/\D/g, '');
        const doc2 = (l2.cpfCnpj || '').replace(/\D/g, '');
        if (doc1 && doc2 && doc1.length >= 11 && doc1 === doc2) {
          pairs.push({ lead1: l1, lead2: l2, motivo: `CPF/CNPJ correspondente (${l1.cpfCnpj})` });
          continue;
        }
      }
    }
    return pairs;
  }, [leads]);

  // Filtros aplicados
  const leadsFiltrados = useMemo(() => {
    return leads.filter((lead) => {
      // Busca geral
      const matchBusca =
        lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.contatoNome && lead.contatoNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.whatsapp && lead.whatsapp.includes(searchTerm)) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.cidade && lead.cidade.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchBusca) return false;

      // Filtro de Área
      if (filtroArea !== 'todos' && lead.area !== filtroArea) return false;

      // Filtro de Origem
      if (filtroOrigem !== 'todos' && lead.origem !== filtroOrigem) return false;

      // Filtro de Responsável
      if (filtroResponsavel !== 'todos' && lead.responsavelId !== filtroResponsavel) return false;

      // Chips de Filtro Salvo
      if (filtroSalvoAtivo === 'prazo_em_curso' && !lead.prazoEmCurso) return false;
      if (filtroSalvoAtivo === 'score_alto' && (lead.score || 0) < 70) return false;
      if (filtroSalvoAtivo === 'trabalhista' && lead.area !== 'Trabalhista') return false;
      if (filtroSalvoAtivo === 'previdenciario' && lead.area !== 'Previdenciário') return false;
      if (filtroSalvoAtivo === 'erro_medico' && lead.area !== 'Cível - Erro Médico') return false;
      if (filtroSalvoAtivo === 'perdidos' && lead.statusFunil !== 'Perdido') return false;
      if (filtroSalvoAtivo === 'parados_alerta') {
        const etapa = funilAtivo.etapas.find((e) => e.id === lead.statusFunil);
        const dias = getDiasParado(lead.dataEntradaEtapa || lead.dataCriacao);
        const limite = etapa?.diasAlerta || 3;
        if (dias < limite || lead.statusFunil === 'Ganho' || lead.statusFunil === 'Perdido') return false;
      }

      return true;
    });
  }, [leads, searchTerm, filtroArea, filtroOrigem, filtroResponsavel, filtroSalvoAtivo, funilAtivo]);

  // Leads Elegíveis para Reativação (Perdidos há mais de X dias)
  const leadsReativacao = useMemo(() => {
    const agora = new Date().getTime();
    return leads.filter((l) => {
      if (l.statusFunil !== 'Perdido') return false;
      const dataRef = l.dataPerda || l.dataUltimoContato || l.dataCriacao;
      const diffDias = Math.floor((agora - new Date(dataRef).getTime()) / (1000 * 60 * 60 * 24));
      return diffDias >= diasReativacao;
    });
  }, [leads, diasReativacao]);

  // Clientes sem novo contrato há mais de X dias
  const clientesInativos = useMemo(() => {
    const agora = new Date().getTime();
    return escritorios.filter((esc) => {
      const dataRef = esc.dataCadastro;
      const diffDias = Math.floor((agora - new Date(dataRef).getTime()) / (1000 * 60 * 60 * 24));
      return diffDias >= diasReativacao;
    });
  }, [escritorios, diasReativacao]);

  // Handler: Criação de Novo Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const agora = new Date().toISOString().split('T')[0];
    const tagsArr = novoTags.split(',').map((t) => t.trim()).filter(Boolean);

    await leadRepository.create({
      tipo: novoTipo,
      nome: novoNome.trim(),
      contatoNome: novoContatoNome.trim() || novoNome.trim(),
      whatsapp: novoWhatsapp,
      telefone: novoWhatsapp,
      email: novoEmail,
      cidade: novoCidade,
      uf: novoUf,
      area: novoArea,
      faseProcesso: novoFaseProcesso,
      necessidade: novoNecessidade,
      prazoEmCurso: novoPrazoEmCurso,
      prazoData: novoPrazoEmCurso ? novoPrazoData : undefined,
      origem: novoOrigem,
      indicadoPor: novoIndicadoPor || undefined,
      responsavelId: novoResponsavelId,
      tags: tagsArr,
      score: novoScore,
      funilId: funilAtivoId,
      etapaId: 'Novo',
      statusFunil: 'Novo',
      valorEstimado: Number(novoValorEstimado) || 4500,
      dataCriacao: agora,
      dataUltimoContato: agora,
      dataEntradaEtapa: agora,
      observacoes: novoObservacoes,
    });

    setIsNovoModalOpen(false);
    setNovoNome('');
    setNovoContatoNome('');
    setNovoWhatsapp('');
    setNovoEmail('');
    setNovoNecessidade('');
    setNovoObservacoes('');
    loadData();
  };

  // Handler: Mudar fase do lead (arrastar ou seletor)
  const handleMudarFase = async (leadId: string, novaFase: StatusFunilLead) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    if (novaFase === 'Perdido') {
      setLeadParaPerda(targetLead);
      return;
    }

    const agora = new Date().toISOString().split('T')[0];
    await leadRepository.update(leadId, {
      statusFunil: novaFase,
      etapaId: novaFase,
      dataUltimoContato: agora,
      dataEntradaEtapa: agora,
    });

    await interacaoRepository.create({
      tipo: 'Evento do Sistema',
      titulo: `Etapa do Funil: ${novaFase}`,
      descricao: `Lead movido para a coluna "${novaFase}" pelo usuário ${currentUser.nome}.`,
      dataHora: new Date().toISOString(),
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      leadId: leadId,
    });

    loadData();
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, etapaId: StatusFunilLead) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      handleMudarFase(leadId, etapaId);
    }
    setDraggedLeadId(null);
  };

  // Handler: Reabertura de Lead / Oportunidade
  const handleReabrirOportunidade = async (lead: Lead) => {
    const agora = new Date().toISOString().split('T')[0];
    await leadRepository.update(lead.id, {
      statusFunil: 'Em triagem',
      etapaId: 'Em triagem',
      motivoPerda: undefined,
      motivoPerdaDetalhe: undefined,
      dataPerda: undefined,
      dataEntradaEtapa: agora,
      dataUltimoContato: agora,
    });

    await interacaoRepository.create({
      tipo: 'Evento do Sistema',
      titulo: 'Oportunidade Reaberta no Funil',
      descricao: `Lead reativado da aba de Reativação pela Dra. Karine Reis. Nova tentativa de assistência pericial iniciada.`,
      dataHora: new Date().toISOString(),
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      leadId: lead.id,
    });

    loadData();
  };

  // Seleção em Massa
  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === leadsFiltrados.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leadsFiltrados.map((l) => l.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Ação em Massa: Atribuir Responsável
  const handleMassaAtribuirResponsavel = async (responsavelId: string) => {
    const user = usuarios.find((u) => u.id === responsavelId);
    for (const id of selectedLeadIds) {
      await leadRepository.update(id, {
        responsavelId,
      });
    }
    setSelectedLeadIds([]);
    setIsLoteResponsavelOpen(false);
    loadData();
  };

  // Ação em Massa: Mudar Etapa
  const handleMassaMudarEtapa = async (novaEtapa: StatusFunilLead) => {
    const agora = new Date().toISOString().split('T')[0];
    for (const id of selectedLeadIds) {
      await leadRepository.update(id, {
        statusFunil: novaEtapa,
        etapaId: novaEtapa,
        dataEntradaEtapa: agora,
      });
    }
    setSelectedLeadIds([]);
    setIsLoteEtapaOpen(false);
    loadData();
  };

  // Ação em Massa: Adicionar Tag
  const handleMassaAdicionarTag = async () => {
    if (!novaTagLote.trim()) return;
    for (const id of selectedLeadIds) {
      const l = leads.find((item) => item.id === id);
      if (l) {
        const tagsAtualizadas = Array.from(new Set([...(l.tags || []), novaTagLote.trim()]));
        await leadRepository.update(id, { tags: tagsAtualizadas });
      }
    }
    setNovaTagLote('');
    setSelectedLeadIds([]);
    setIsLoteTagOpen(false);
    loadData();
  };

  // Exportação CSV
  const handleExportarCsv = (leadsParaExportar: Lead[] = leadsFiltrados) => {
    const colunas = [
      'ID',
      'Nome/Razão Social',
      'Tipo',
      'Contato',
      'WhatsApp/Telefone',
      'E-mail',
      'Cidade',
      'UF',
      'Área do Direito',
      'Fase do Processo',
      'Prazo em Curso?',
      'Data do Prazo',
      'Origem',
      'Score',
      'Valor Estimado (R$)',
      'Status do Funil',
      'Responsável',
      'Tags',
      'Data de Criação',
    ];

    const linhas = leadsParaExportar.map((l) => [
      `"${l.id}"`,
      `"${l.nome.replace(/"/g, '""')}"`,
      `"${l.tipo}"`,
      `"${(l.contatoNome || l.nome).replace(/"/g, '""')}"`,
      `"${l.whatsapp || l.telefone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.cidade || ''}"`,
      `"${l.uf || ''}"`,
      `"${l.area}"`,
      `"${l.faseProcesso || ''}"`,
      `"${l.prazoEmCurso ? 'Sim' : 'Não'}"`,
      `"${l.prazoData || ''}"`,
      `"${l.origem}"`,
      `"${l.score || 0}"`,
      `"${l.valorEstimado || 0}"`,
      `"${l.statusFunil}"`,
      `"${l.responsavelId}"`,
      `"${(l.tags || []).join('; ')}"`,
      `"${l.dataCriacao}"`,
    ]);

    const csvContent = '\uFEFF' + [colunas.join(';'), ...linhas.map((row) => row.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_crivo_forense_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPipeline = leadsFiltrados.reduce((acc, l) => acc + (l.valorEstimado || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
              Leads & Funil de Prospecção
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/30">
              {leadsFiltrados.length} Registros
            </span>
            {duplicadosEncontrados.length > 0 && (
              <button
                onClick={() => setViewMode('duplicados')}
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-1 hover:bg-amber-900/50 transition-colors"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                {duplicadosEncontrados.length} Duplicidades Detectadas
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Gestão médico-pericial de novos casos, advogados contratantes e bancas parceiras. Pipeline: <span className="text-[#b8a47c] font-bold font-mono">{formatCurrency(totalPipeline)}</span>
          </p>
        </div>

        {/* Funil Switcher & Main Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Seletor de Funil */}
          <div className="flex items-center gap-1.5 bg-[#12171f] border border-[#1b222d] rounded-lg px-2 py-1">
            <span className="text-[11px] text-[#545c6b]">Funil:</span>
            <select
              value={funilAtivoId}
              onChange={(e) => setFunilAtivoId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#f4efe3] focus:outline-none"
            >
              {funis.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#12171f] text-[#f4efe3]">
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          {/* View Modes */}
          <div className="flex rounded-lg bg-[#12171f] border border-[#1b222d] p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-[#1b222d] text-[#b8a47c]' : 'text-[#545c6b] hover:text-[#f4efe3]'
              }`}
              title="Quadro Kanban"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('tabela')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'tabela' ? 'bg-[#1b222d] text-[#b8a47c]' : 'text-[#545c6b] hover:text-[#f4efe3]'
              }`}
              title="Lista Tabular Completa"
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('reativacao')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'reativacao' ? 'bg-[#1b222d] text-[#b8a47c]' : 'text-[#545c6b] hover:text-[#f4efe3]'
              }`}
              title="Oportunidades e Leads para Reativação"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Reativação ({leadsReativacao.length})
            </button>
            <button
              onClick={() => setViewMode('duplicados')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'duplicados' ? 'bg-[#1b222d] text-[#b8a47c]' : 'text-[#545c6b] hover:text-[#f4efe3]'
              }`}
              title="Gestão de Duplicados"
            >
              <GitMerge className="w-3.5 h-3.5 text-rose-400" />
              Duplicados ({duplicadosEncontrados.length})
            </button>
          </div>

          {/* Exportar CSV */}
          <button
            onClick={() => handleExportarCsv()}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#161c26] hover:bg-[#232c3a] border border-[#263040] text-xs font-medium text-[#e8e1d0] transition-colors"
            title="Exportar dados para Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#b8a47c]" />
            CSV
          </button>

          {/* Botão Novo Lead */}
          <button
            onClick={() => setIsNovoModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-bold text-xs tracking-wider uppercase transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Chips de Filtros Salvos Rápidos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-[#545c6b] font-semibold uppercase tracking-wider shrink-0">
          Filtros Salvos:
        </span>
        <button
          onClick={() => setFiltroSalvoAtivo('todos')}
          className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            filtroSalvoAtivo === 'todos'
              ? 'bg-[#b8a47c] text-[#0a0e14] font-semibold shadow-sm'
              : 'bg-[#12171f] text-[#545c6b] border border-[#1b222d] hover:text-[#f4efe3]'
          }`}
        >
          Todos ({leads.length})
        </button>
        <button
          onClick={() => setFiltroSalvoAtivo('prazo_em_curso')}
          className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 flex items-center gap-1 ${
            filtroSalvoAtivo === 'prazo_em_curso'
              ? 'bg-rose-600 text-white font-semibold'
              : 'bg-[#12171f] text-rose-300 border border-rose-900/40 hover:bg-rose-950/40'
          }`}
        >
          <Clock className="w-3 h-3" /> Prazos em Curso
        </button>
        <button
          onClick={() => setFiltroSalvoAtivo('score_alto')}
          className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 flex items-center gap-1 ${
            filtroSalvoAtivo === 'score_alto'
              ? 'bg-amber-600 text-white font-semibold'
              : 'bg-[#12171f] text-amber-300 border border-amber-900/40 hover:bg-amber-950/40'
          }`}
        >
          <Flame className="w-3 h-3 text-amber-400" /> Score Alto (≥ 70)
        </button>
        <button
          onClick={() => setFiltroSalvoAtivo('parados_alerta')}
          className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 flex items-center gap-1 ${
            filtroSalvoAtivo === 'parados_alerta'
              ? 'bg-amber-600 text-[#0a0e14] font-semibold'
              : 'bg-[#12171f] text-amber-400 border border-amber-800/40 hover:bg-[#1b222d]'
          }`}
        >
          <AlertTriangle className="w-3 h-3" /> Estagnados na Etapa
        </button>
        <button
          onClick={() => setFiltroSalvoAtivo('trabalhista')}
          className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            filtroSalvoAtivo === 'trabalhista'
              ? 'bg-[#5b9cd9] text-[#0a0e14] font-semibold'
              : 'bg-[#12171f] text-[#5b9cd9] border border-[#263040] hover:bg-[#1b222d]'
          }`}
        >
          Trabalhista
        </button>
        <button
          onClick={() => setFiltroSalvoAtivo('previdenciario')}
          className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            filtroSalvoAtivo === 'previdenciario'
              ? 'bg-[#5b9cd9] text-[#0a0e14] font-semibold'
              : 'bg-[#12171f] text-[#5b9cd9] border border-[#263040] hover:bg-[#1b222d]'
          }`}
        >
          Previdenciário
        </button>
        <button
          onClick={() => setFiltroSalvoAtivo('erro_medico')}
          className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            filtroSalvoAtivo === 'erro_medico'
              ? 'bg-[#5b9cd9] text-[#0a0e14] font-semibold'
              : 'bg-[#12171f] text-[#5b9cd9] border border-[#263040] hover:bg-[#1b222d]'
          }`}
        >
          Erro Médico
        </button>
        <button
          onClick={() => setFiltroSalvoAtivo('perdidos')}
          className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            filtroSalvoAtivo === 'perdidos'
              ? 'bg-rose-950 text-rose-300 font-semibold border border-rose-800'
              : 'bg-[#12171f] text-[#545c6b] border border-[#1b222d] hover:text-[#f4efe3]'
          }`}
        >
          Perdidos / Arquivados
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#545c6b] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, contato, telefone, e-mail ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1b222d] border border-[#263040] rounded-lg pl-9 pr-3 py-2 text-[#f4efe3] placeholder-[#545c6b] focus:outline-none focus:border-[#b8a47c]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[#545c6b]">Área:</span>
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="bg-[#1b222d] border border-[#263040] rounded-lg px-2.5 py-1.5 text-[#f4efe3] focus:outline-none"
            >
              <option value="todos">Todas as Áreas</option>
              <option value="Previdenciário">Previdenciário</option>
              <option value="Trabalhista">Trabalhista</option>
              <option value="Cível - Erro Médico">Cível - Erro Médico</option>
              <option value="Cível - DPVAT/Seguros">Cível - DPVAT/Seguros</option>
              <option value="Doença Ocupacional">Doença Ocupacional</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#545c6b]">Origem:</span>
            <select
              value={filtroOrigem}
              onChange={(e) => setFiltroOrigem(e.target.value)}
              className="bg-[#1b222d] border border-[#263040] rounded-lg px-2.5 py-1.5 text-[#f4efe3] focus:outline-none"
            >
              <option value="todos">Todas as Origens</option>
              <option value="Indicação">Indicação</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Google orgânico">Google orgânico</option>
              <option value="Formulário do site">Formulário do site</option>
              <option value="WhatsApp direto">WhatsApp direto</option>
              <option value="Instagram">Instagram</option>
              <option value="Google Maps/prospecção">Google Maps</option>
              <option value="Evento">Evento / Congresso</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#545c6b]">Responsável:</span>
            <select
              value={filtroResponsavel}
              onChange={(e) => setFiltroResponsavel(e.target.value)}
              className="bg-[#1b222d] border border-[#263040] rounded-lg px-2.5 py-1.5 text-[#f4efe3] focus:outline-none"
            >
              <option value="todos">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[#161c26] border-2 border-[#b8a47c] flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#b8a47c] text-[#0a0e14] font-bold">
              {selectedLeadIds.length} selecionados
            </span>
            <span className="text-[#e8e1d0]">Ações em massa disponíveis:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Atribuir Responsável */}
            <div className="relative">
              <button
                onClick={() => setIsLoteResponsavelOpen(!isLoteResponsavelOpen)}
                className="px-3 py-1.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#f4efe3] font-medium"
              >
                Atribuir Responsável ▾
              </button>
              {isLoteResponsavelOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl p-1 z-20 space-y-0.5">
                  {usuarios.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleMassaAtribuirResponsavel(u.id)}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-[#e8e1d0] hover:bg-[#1b222d]"
                    >
                      {u.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mover Etapa */}
            <div className="relative">
              <button
                onClick={() => setIsLoteEtapaOpen(!isLoteEtapaOpen)}
                className="px-3 py-1.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#f4efe3] font-medium"
              >
                Mudar Etapa ▾
              </button>
              {isLoteEtapaOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl p-1 z-20 space-y-0.5">
                  {funilAtivo.etapas.map((et) => (
                    <button
                      key={et.id}
                      onClick={() => handleMassaMudarEtapa(et.id as StatusFunilLead)}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-[#e8e1d0] hover:bg-[#1b222d]"
                    >
                      {et.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Adicionar Tag */}
            <div className="relative">
              <button
                onClick={() => setIsLoteTagOpen(!isLoteTagOpen)}
                className="px-3 py-1.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#f4efe3] font-medium"
              >
                + Adicionar Tag
              </button>
              {isLoteTagOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl p-3 z-20 space-y-2">
                  <input
                    type="text"
                    placeholder="Nome da tag (ex: Prioridade)"
                    value={novaTagLote}
                    onChange={(e) => setNovaTagLote(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded px-2 py-1 text-xs text-[#f4efe3]"
                  />
                  <button
                    onClick={handleMassaAdicionarTag}
                    className="w-full py-1 bg-[#b8a47c] text-[#0a0e14] font-semibold rounded text-xs"
                  >
                    Aplicar Tag
                  </button>
                </div>
              )}
            </div>

            {/* Exportar Selecionados */}
            <button
              onClick={() => {
                const selecionados = leads.filter((l) => selectedLeadIds.includes(l.id));
                handleExportarCsv(selecionados);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold"
            >
              Exportar CSV
            </button>

            {/* Cancelar Seleção */}
            <button
              onClick={() => setSelectedLeadIds([])}
              className="p-1.5 text-[#545c6b] hover:text-[#f4efe3]"
              title="Limpar seleção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6 min-h-[580px]">
          {funilAtivo.etapas.map((etapa) => {
            const leadsDaEtapa = leadsFiltrados.filter((l) => l.statusFunil === etapa.id);
            const totalEtapa = leadsDaEtapa.reduce((sum, l) => sum + (l.valorEstimado || 0), 0);

            return (
              <div
                key={etapa.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, etapa.id as StatusFunilLead)}
                className="w-80 shrink-0 bg-[#12171f] border border-[#1b222d] rounded-2xl p-3 flex flex-col min-h-[550px] transition-colors"
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-[#1b222d] mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: etapa.cor || '#b8a47c' }}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#f4efe3]">
                      {etapa.nome}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b222d] text-[#e8e1d0] font-mono">
                      {leadsDaEtapa.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#b8a47c] font-semibold">
                    {formatCurrency(totalEtapa)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {leadsDaEtapa.map((lead) => {
                    const diasParado = getDiasParado(lead.dataEntradaEtapa || lead.dataCriacao);
                    const isEstagnado =
                      etapa.tipo === 'aberto' && diasParado >= (etapa.diasAlerta || 3);
                    const resp = usuarios.find((u) => u.id === lead.responsavelId);

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLeadIdForDetail(lead.id)}
                        className={`p-3.5 rounded-xl bg-[#1b222d] hover:bg-[#232c3a] border cursor-grab active:cursor-grabbing transition-all space-y-2.5 shadow-sm group relative ${
                          isEstagnado
                            ? 'border-amber-600/80 hover:border-amber-500'
                            : 'border-[#263040] hover:border-[#b8a47c]/60'
                        }`}
                      >
                        {/* Top Card Bar */}
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-semibold text-[#f4efe3] group-hover:text-[#b8a47c] transition-colors line-clamp-1">
                            {lead.nome}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#12171f] text-[#5b9cd9] border border-[#263040] shrink-0 font-medium">
                            {lead.area}
                          </span>
                        </div>

                        {/* Contato & Localidade */}
                        <div className="text-[11px] text-[#545c6b] flex items-center justify-between">
                          <span className="truncate max-w-[170px]">
                            {lead.contatoNome || lead.nome}
                          </span>
                          <span>{lead.cidade}/{lead.uf}</span>
                        </div>

                        {/* Alerta de Dias Parado */}
                        {isEstagnado && (
                          <div className="px-2 py-1 rounded-md bg-amber-950/60 border border-amber-800/50 text-amber-300 text-[10px] flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              {diasParado}d parado nesta etapa
                            </span>
                            <span className="text-[9px] text-amber-400/80 font-normal">
                              Alerta &gt; {etapa.diasAlerta}d
                            </span>
                          </div>
                        )}

                        {/* Prazo Fatal Tag */}
                        {lead.prazoEmCurso && (
                          <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Prazo Fatal {formatDate(lead.prazoData)}
                          </div>
                        )}

                        {/* Valor, Responsável & Score */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#263040]/60 text-xs">
                          <span className="font-mono font-bold text-[#b8a47c]">
                            {formatCurrency(lead.valorEstimado)}
                          </span>

                          <div className="flex items-center gap-2">
                            {lead.score !== undefined && (
                              <span className="text-[10px] text-emerald-400 font-semibold font-mono flex items-center gap-0.5">
                                <Flame className="w-3 h-3 text-amber-400" />
                                {lead.score}
                              </span>
                            )}
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                              style={{ backgroundColor: resp?.corAgenda || '#b8a47c' }}
                              title={`Responsável: ${resp?.nome || lead.responsavelId}`}
                            >
                              {(resp?.nome || lead.responsavelId).charAt(0)}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer com WhatsApp Direto e Mudar Etapa */}
                        <div className="flex items-center justify-between pt-1 gap-1 text-[11px]">
                          {lead.whatsapp ? (
                            <a
                              href={whatsappAdapter.gerarLinkDireto(
                                lead.whatsapp,
                                `Olá ${lead.contatoNome || lead.nome}, tudo bem? Aqui é da Crivo Forense / Dra. Karine Reis.`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          ) : (
                            <span className="text-[#545c6b] text-[10px]">Sem WhatsApp</span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadIdForDetail(lead.id);
                            }}
                            className="text-[#b8a47c] hover:underline text-[10px] font-medium"
                          >
                            Ver Detalhes →
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {leadsDaEtapa.length === 0 && (
                    <div className="h-36 flex flex-col items-center justify-center text-xs text-[#545c6b] border border-dashed border-[#1b222d] rounded-xl p-4 text-center">
                      <span>Nenhum caso nesta etapa</span>
                      <span className="text-[10px] mt-1 text-[#545c6b]/70">Arraste um card para cá</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TABELA COMPLETA */}
      {viewMode === 'tabela' && (
        <div className="bg-[#12171f] border border-[#1b222d] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161c26] text-[#b8a47c] uppercase tracking-wider font-semibold border-b border-[#1b222d]">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === leadsFiltrados.length && leadsFiltrados.length > 0}
                      onChange={handleToggleSelectAll}
                      className="accent-[#b8a47c]"
                    />
                  </th>
                  <th className="px-4 py-3.5">Lead / Razão Social</th>
                  <th className="px-4 py-3.5">Contato & Telefone</th>
                  <th className="px-4 py-3.5">Área do Direito</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Prazo Fatal</th>
                  <th className="px-4 py-3.5">Valor Estimado</th>
                  <th className="px-4 py-3.5">Etapa do Funil</th>
                  <th className="px-4 py-3.5">Responsável</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b222d] text-[#e8e1d0]">
                {leadsFiltrados.map((lead) => {
                  const resp = usuarios.find((u) => u.id === lead.responsavelId);
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadIdForDetail(lead.id)}
                      className={`hover:bg-[#1b222d]/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#1b222d]/90' : ''
                      }`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(lead.id)}
                          className="accent-[#b8a47c]"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#f4efe3]">
                        <div>{lead.nome}</div>
                        <div className="text-[10px] text-[#545c6b] font-normal">
                          {lead.tipo} • {lead.cidade}/{lead.uf}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{lead.contatoNome || lead.nome}</div>
                        <div className="text-[11px] text-[#545c6b]">{formatPhone(lead.whatsapp || lead.telefone)}</div>
                      </td>
                      <td className="px-4 py-3 text-[#5b9cd9] font-medium">{lead.area}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        {lead.score || 70}
                      </td>
                      <td className="px-4 py-3">
                        {lead.prazoEmCurso ? (
                          <span className="text-rose-400 font-semibold font-mono">
                            {formatDate(lead.prazoData)}
                          </span>
                        ) : (
                          <span className="text-[#545c6b]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#b8a47c]">
                        {formatCurrency(lead.valorEstimado)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.statusFunil}
                          onChange={(e) => handleMudarFase(lead.id, e.target.value as StatusFunilLead)}
                          className="bg-[#1b222d] text-xs text-[#f4efe3] border border-[#263040] rounded-md px-2 py-1 focus:outline-none"
                        >
                          {funilAtivo.etapas.map((et) => (
                            <option key={et.id} value={et.id}>
                              {et.nome}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-[#e8e1d0]">
                        <span className="truncate max-w-[120px] block">
                          {resp?.nome || lead.responsavelId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {lead.whatsapp && (
                            <a
                              href={whatsappAdapter.gerarLinkDireto(lead.whatsapp, `Olá ${lead.contatoNome || lead.nome}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 p-1 rounded"
                              title="Conversar no WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedLeadIdForDetail(lead.id)}
                            className="px-2 py-1 rounded bg-[#1b222d] text-[#b8a47c] border border-[#263040] hover:bg-[#232c3a] font-semibold text-[11px]"
                          >
                            Abrir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: ABA DE REATIVAÇÃO */}
      {viewMode === 'reativacao' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#161c26] border border-[#263040] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg text-[#f4efe3] flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                Módulo de Reativação & Reengajamento Comercial
              </h2>
              <p className="text-xs text-[#545c6b] mt-0.5">
                Oportunidades perdidas no passado e escritórios parceiros sem nova perícia contratada há mais de X dias.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#545c6b]">Inativo há mais de:</span>
              <div className="flex rounded-lg bg-[#12171f] p-0.5 border border-[#263040]">
                {[15, 30, 60, 90, 180].map((dias) => (
                  <button
                    key={dias}
                    onClick={() => setDiasReativacao(dias)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      diasReativacao === dias
                        ? 'bg-[#b8a47c] text-[#0a0e14]'
                        : 'text-[#545c6b] hover:text-[#f4efe3]'
                    }`}
                  >
                    {dias}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seção 1: Leads Perdidos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#f4efe3] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Leads & Oportunidades Perdidas há mais de {diasReativacao} dias ({leadsReativacao.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadsReativacao.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 rounded-xl bg-[#12171f] border border-[#263040] space-y-3 flex flex-col justify-between hover:border-[#b8a47c]/50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-xs text-[#f4efe3]">{lead.nome}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                        {lead.motivoPerda || 'Perdido'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#545c6b]">
                      Contato: {lead.contatoNome || lead.nome} • {lead.cidade}/{lead.uf}
                    </div>

                    <div className="text-[11px] text-[#5b9cd9]">
                      Área: {lead.area} • Valor: {formatCurrency(lead.valorEstimado)}
                    </div>

                    {lead.motivoPerdaDetalhe && (
                      <p className="text-[11px] text-[#e8e1d0]/70 italic line-clamp-2">
                        &quot;{lead.motivoPerdaDetalhe}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1b222d] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleReabrirOportunidade(lead)}
                      className="flex-1 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Reabrir Oportunidade
                    </button>

                    {lead.whatsapp && (
                      <a
                        href={whatsappAdapter.gerarLinkDireto(
                          lead.whatsapp,
                          `Olá ${lead.contatoNome || lead.nome}! Aqui é da Crivo Forense / Dra. Karine Reis. Entramos em contato há alguns meses e gostaríamos de saber se surgiram novas perícias médicas em sua banca.`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs"
                        title="Reconectar via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {leadsReativacao.length === 0 && (
                <div className="col-span-3 p-8 text-center text-xs text-[#545c6b] bg-[#12171f] border border-[#1b222d] rounded-xl">
                  Nenhum lead perdido há mais de {diasReativacao} dias encontrado.
                </div>
              )}
            </div>
          </div>

          {/* Seção 2: Escritórios sem Nova Demanda */}
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-semibold text-[#f4efe3] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#b8a47c]" />
              Bancas & Escritórios Cadastrados Sem Nova Demanda Recente ({clientesInativos.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientesInativos.map((esc) => (
                <div
                  key={esc.id}
                  className="p-4 rounded-xl bg-[#12171f] border border-[#263040] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-[#f4efe3] block leading-tight">
                      {esc.nomeFantasia || esc.razaoSocial}
                    </span>
                    <span className="text-[11px] text-[#545c6b] block">
                      {esc.cidade}/{esc.uf} • Cadastro: {formatDate(esc.dataCadastro)}
                    </span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {esc.areasAtuacao.map((a) => (
                        <span key={a} className="text-[10px] px-1.5 py-0.2 rounded bg-[#1b222d] text-[#5b9cd9]">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1b222d] flex items-center justify-between">
                    <a
                      href={whatsappAdapter.gerarLinkDireto(
                        esc.telefone,
                        `Olá equipe ${esc.nomeFantasia}, tudo bem? Dra. Karine Reis da Crivo Forense. Gostaríamos de apresentar nossas novas soluções em assistência pericial para suas ações.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Propor Nova Perícia
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 4: GESTÃO DE DUPLICADOS */}
      {viewMode === 'duplicados' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#161c26] border border-[#263040] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-[#f4efe3] flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-amber-400" />
                Deduplicação de Contatos & Leads
              </h2>
              <p className="text-xs text-[#545c6b] mt-0.5">
                O CRM detecta automaticamente duplicidades por telefone, e-mail, CPF/CNPJ ou inscrição na OAB para evitar retrabalho da equipe comercial.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
              {duplicadosEncontrados.length} Casos Identificados
            </span>
          </div>

          <div className="space-y-3">
            {duplicadosEncontrados.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#12171f] border border-[#263040] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300">
                    <GitMerge className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#f4efe3]">{item.lead1.nome}</span>
                      <span className="text-[#545c6b]">⟷</span>
                      <span className="font-bold text-rose-300">{item.lead2.nome}</span>
                    </div>
                    <div className="text-[11px] text-amber-300">
                      Motivo: <strong>{item.motivo}</strong>
                    </div>
                    <div className="text-[10px] text-[#545c6b]">
                      Lead 1: {item.lead1.tipo} ({item.lead1.statusFunil}) • Lead 2: {item.lead2.tipo} ({item.lead2.statusFunil})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMergePair({
                      lead1: item.lead1,
                      lead2: item.lead2,
                      motivo: item.motivo,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-bold text-xs hover:bg-[#c7b692] shadow-sm transition-colors whitespace-nowrap self-end md:self-center"
                >
                  Mesclar Registros
                </button>
              </div>
            ))}

            {duplicadosEncontrados.length === 0 && (
              <div className="p-12 text-center text-xs text-[#545c6b] bg-[#12171f] border border-[#1b222d] rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                Base de dados limpa! Nenhuma duplicidade de telefone, e-mail, CPF ou OAB detectada.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Novo Lead */}
      {isNovoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e8e1d0] max-h-[92vh]">
            <div className="px-6 py-4 border-b border-[#263040] bg-[#161c26] flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg sm:text-xl text-[#f4efe3]">
                  Cadastrar Novo Lead & Caso
                </h2>
                <p className="text-xs text-[#545c6b]">Preencha os dados do advogado ou escritório demandante.</p>
              </div>
              <button
                onClick={() => setIsNovoModalOpen(false)}
                className="text-[#545c6b] hover:text-[#f4efe3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Tipo de Lead *</label>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as TipoLead)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    <option value="Advogado">Advogado</option>
                    <option value="Escritório">Escritório de Advocacia</option>
                    <option value="Paciente/Periciando">Paciente / Periciando (Particular)</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Área do Direito *</label>
                  <select
                    value={novoArea}
                    onChange={(e) => setNovoArea(e.target.value as AreaDireito)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    <option value="Previdenciário">Previdenciário</option>
                    <option value="Trabalhista">Trabalhista</option>
                    <option value="Cível - Erro Médico">Cível - Erro Médico</option>
                    <option value="Cível - DPVAT/Seguros">Cível - DPVAT/Seguros</option>
                    <option value="Doença Ocupacional">Doença Ocupacional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#545c6b] mb-1 font-medium">Nome / Razão Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Carlos Eduardo Toledo ou Silveira & Associados"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    value={novoWhatsapp}
                    onChange={(e) => setNovoWhatsapp(maskPhoneInput(e.target.value))}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">E-mail</label>
                  <input
                    type="email"
                    placeholder="contato@advocacia.com.br"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[#545c6b] mb-1 font-medium">Cidade</label>
                  <input
                    type="text"
                    value={novoCidade}
                    onChange={(e) => setNovoCidade(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={novoUf}
                    onChange={(e) => setNovoUf(e.target.value.toUpperCase())}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Fase do Processo Judicial</label>
                  <select
                    value={novoFaseProcesso}
                    onChange={(e) => setNovoFaseProcesso(e.target.value as FaseProcessoLead)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    <option value="Pré-ajuizamento">Pré-ajuizamento (Petição Inicial)</option>
                    <option value="Aguardando perícia">Aguardando Perícia (Quesitos)</option>
                    <option value="Perícia marcada">Perícia Marcada (Acompanhamento)</option>
                    <option value="Laudo já emitido">Laudo já Emitido (Impugnação)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Canal de Origem</label>
                  <select
                    value={novoOrigem}
                    onChange={(e) => setNovoOrigem(e.target.value as OrigemLead)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    <option value="Indicação">Indicação</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Google orgânico">Google orgânico</option>
                    <option value="Formulário do site">Formulário do site</option>
                    <option value="WhatsApp direto">WhatsApp direto</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google Maps/prospecção">Google Maps</option>
                    <option value="Evento">Evento / Congresso</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Prazo em Curso */}
              <div className="p-3 rounded-xl bg-[#161c26] border border-[#263040] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-[#f4efe3] block">Existe prazo processual em curso?</span>
                  <span className="text-[11px] text-[#545c6b]">Marque se houver prazo fatal correndo para quesitos ou impugnação.</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoPrazoEmCurso}
                      onChange={(e) => setNovoPrazoEmCurso(e.target.checked)}
                      className="accent-[#b8a47c]"
                    />
                    <span className="text-xs font-semibold text-rose-300">Sim, com prazo fatal</span>
                  </label>
                  {novoPrazoEmCurso && (
                    <input
                      type="date"
                      required={novoPrazoEmCurso}
                      value={novoPrazoData}
                      onChange={(e) => setNovoPrazoData(e.target.value)}
                      className="bg-[#1b222d] border border-rose-800 rounded px-2 py-1 text-xs text-rose-200"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#545c6b] mb-1 font-medium">Necessidade / Demanda do Advogado</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Análise prévia de viabilidade de ação de erro médico e quesitos técnicos."
                  value={novoNecessidade}
                  onChange={(e) => setNovoNecessidade(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Honorários Estimados (R$)</label>
                  <input
                    type="number"
                    step="100"
                    value={novoValorEstimado}
                    onChange={(e) => setNovoValorEstimado(Number(e.target.value))}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Responsável Interno</label>
                  <select
                    value={novoResponsavelId}
                    onChange={(e) => setNovoResponsavelId(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.papelNome})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#263040]">
                <button
                  type="button"
                  onClick={() => setIsNovoModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-bold text-xs uppercase tracking-wider hover:bg-[#c7b692] shadow-md"
                >
                  Salvar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha 360° do Lead */}
      {selectedLeadIdForDetail && (
        <LeadDetailModal
          leadId={selectedLeadIdForDetail}
          onClose={() => setSelectedLeadIdForDetail(null)}
          onUpdate={loadData}
        />
      )}

      {/* Modal Motivo de Perda */}
      {leadParaPerda && (
        <MotivoPerdaModal
          lead={leadParaPerda}
          onClose={() => setLeadParaPerda(null)}
          onConfirm={async (motivo, detalhe) => {
            const agora = new Date().toISOString().split('T')[0];
            await leadRepository.update(leadParaPerda.id, {
              statusFunil: 'Perdido',
              etapaId: 'Perdido',
              motivoPerda: motivo,
              motivoPerdaDetalhe: detalhe,
              dataPerda: agora,
              dataEntradaEtapa: agora,
            });

            await interacaoRepository.create({
              tipo: 'Evento do Sistema',
              titulo: `Lead Marcado como Perdido: ${motivo}`,
              descricao: `Motivo: ${motivo}. Detalhe: ${detalhe || 'Nenhum detalhe adicional informado.'}`,
              dataHora: new Date().toISOString(),
              usuarioId: currentUser.id,
              usuarioNome: currentUser.nome,
              leadId: leadParaPerda.id,
            });

            setLeadParaPerda(null);
            loadData();
          }}
        />
      )}

      {/* Modal Conversão de Lead */}
      {leadParaConversao && (
        <ConversaoLeadModal
          lead={leadParaConversao}
          onClose={() => setLeadParaConversao(null)}
          onConverted={() => {
            setLeadParaConversao(null);
            loadData();
          }}
        />
      )}

      {/* Modal Mesclagem de Duplicados */}
      {mergePair && (
        <DuplicateMergeModal
          leadPrincipal={mergePair.lead1}
          leadDuplicado={mergePair.lead2}
          criterioMatch={mergePair.motivo}
          onClose={() => setMergePair(null)}
          onMerged={() => {
            setMergePair(null);
            loadData();
          }}
        />
      )}

    </div>
  );
};
