import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  AlertTriangle,
  Sparkles,
  GitMerge,
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  Share2,
  ExternalLink,
  Target,
  BarChart3,
  Flame,
} from 'lucide-react';
import { Lead, Interacao, StatusFunilLead, AreaDireito, OrigemLead } from '../../types';
import { leadRepository, interacaoRepository, auditLogRepository } from '../../services';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '../../utils/formatters';
import { whatsappAdapter } from '../../integrations/whatsapp';
import { useAuth } from '../../context/AuthContext';
import { ConversaoLeadModal } from './ConversaoLeadModal';
import { MotivoPerdaModal } from './MotivoPerdaModal';
import { DuplicateMergeModal } from './DuplicateMergeModal';

interface LeadDetailModalProps {
  leadId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  onClose,
  onUpdate,
}) => {
  const { currentUser } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);

  // Modais auxiliares
  const [isConversaoOpen, setIsConversaoOpen] = useState(false);
  const [isMotivoPerdaOpen, setIsMotivoPerdaOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [duplicadoDetectado, setDuplicadoDetectado] = useState<Lead | null>(null);
  const [criterioDuplicidade, setCriterioDuplicidade] = useState<string>('');

  // Nova Interação
  const [isNovaInteracaoOpen, setIsNovaInteracaoOpen] = useState(false);
  const [intTipo, setIntTipo] = useState<Interacao['tipo']>('WhatsApp');
  const [intTitulo, setIntTitulo] = useState('');
  const [intDescricao, setIntDescricao] = useState('');

  const loadLead = async () => {
    const item = await leadRepository.getById(leadId);
    setLead(item);

    const [all, ints] = await Promise.all([
      leadRepository.getAll(),
      interacaoRepository.getByContato('lead', leadId),
    ]);
    setAllLeads(all);
    setInteracoes(ints);

    // Detecção de duplicados
    if (item) {
      const match = all.find((outro) => {
        if (outro.id === item.id) return false;
        
        // Match por telefone
        const tel1 = (item.whatsapp || item.telefone || '').replace(/\D/g, '');
        const tel2 = (outro.whatsapp || outro.telefone || '').replace(/\D/g, '');
        if (tel1 && tel2 && tel1.length >= 8 && tel1 === tel2) {
          setCriterioDuplicidade(`Telefone/WhatsApp coincidente (${formatPhone(item.whatsapp)})`);
          return true;
        }

        // Match por e-mail
        if (item.email && outro.email && item.email.toLowerCase().trim() === outro.email.toLowerCase().trim()) {
          setCriterioDuplicidade(`E-mail idêntico (${item.email})`);
          return true;
        }

        // Match por CPF/CNPJ
        const doc1 = (item.cpfCnpj || '').replace(/\D/g, '');
        const doc2 = (outro.cpfCnpj || '').replace(/\D/g, '');
        if (doc1 && doc2 && doc1.length >= 11 && doc1 === doc2) {
          setCriterioDuplicidade(`CPF/CNPJ correspondente (${item.cpfCnpj})`);
          return true;
        }

        // Match por OAB
        if (item.oabNumero && outro.oabNumero && item.oabNumero.trim() === outro.oabNumero.trim()) {
          setCriterioDuplicidade(`Nº de OAB coincidente (OAB nº ${item.oabNumero})`);
          return true;
        }

        return false;
      });

      setDuplicadoDetectado(match || null);
    }
  };

  useEffect(() => {
    loadLead();
  }, [leadId]);

  if (!lead) return null;

  const handleMudarFase = async (novaFase: StatusFunilLead) => {
    if (novaFase === 'Perdido') {
      setIsMotivoPerdaOpen(true);
      return;
    }

    const agora = new Date().toISOString().split('T')[0];
    await leadRepository.update(lead.id, {
      statusFunil: novaFase,
      dataUltimoContato: agora,
      dataEntradaEtapa: agora,
    });

    await interacaoRepository.create({
      tipo: 'Evento do Sistema',
      titulo: `Etapa do Funil alterada para "${novaFase}"`,
      descricao: `Lead avançou para a fase ${novaFase} pelo usuário ${currentUser.nome}.`,
      dataHora: new Date().toISOString(),
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      leadId: lead.id,
    });

    loadLead();
    onUpdate();
  };

  const handleSalvarInteracao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intDescricao.trim()) return;

    await interacaoRepository.create({
      tipo: intTipo,
      titulo: intTitulo.trim() || `${intTipo} com Lead`,
      descricao: intDescricao.trim(),
      dataHora: new Date().toISOString(),
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      leadId: lead.id,
    });

    await leadRepository.update(lead.id, {
      dataUltimoContato: new Date().toISOString().split('T')[0],
    });

    setIntTitulo('');
    setIntDescricao('');
    setIsNovaInteracaoOpen(false);
    loadLead();
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e8e1d0]">
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-[#263040] bg-[#161c26] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#1b222d] border border-[#263040] flex items-center justify-center text-[#b8a47c] shrink-0">
              {lead.tipo === 'Escritório' ? <Building2 className="w-6 h-6" /> : lead.tipo === 'Paciente/Periciando' ? <HeartPulse className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/30">
                  Lead • {lead.tipo}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b222d] text-[#5b9cd9] border border-[#263040]">
                  {lead.area}
                </span>
                {lead.prazoEmCurso && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Prazo Fatal {formatDate(lead.prazoData)}
                  </span>
                )}
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#f4efe3] mt-1">
                {lead.nome}
              </h2>
              <p className="text-xs text-[#545c6b] mt-0.5">
                Contato: {lead.contatoNome || lead.nome} • {lead.cidade}/{lead.uf}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
            {lead.whatsapp && (
              <a
                href={whatsappAdapter.gerarLinkDireto(
                  lead.whatsapp,
                  `Olá ${lead.contatoNome || lead.nome}, tudo bem? Aqui é da Crivo Forense / Dra. Karine Reis.`
                )}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}

            {lead.statusFunil !== 'Ganho' && (
              <button
                onClick={() => setIsConversaoOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Converter Lead
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner de Duplicidade Detectada */}
        {duplicadoDetectado && (
          <div className="px-6 py-3 bg-amber-950/40 border-b border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Possível Duplicidade Detectada:</strong> O lead coincide com <strong className="text-white">{duplicadoDetectado.nome}</strong> ({criterioDuplicidade}).
              </span>
            </div>
            <button
              onClick={() => setIsMergeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-colors whitespace-nowrap self-end sm:self-auto"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Mesclar Registros
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Status Pipeline & KPI Bar */}
          <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] text-[#545c6b] font-semibold uppercase tracking-wider block">
                Etapa do Pipeline / Funil
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={lead.statusFunil}
                  onChange={(e) => handleMudarFase(e.target.value as StatusFunilLead)}
                  className="bg-[#1b222d] border border-[#263040] text-sm font-semibold text-[#f4efe3] rounded-lg px-3 py-1.5 focus:border-[#b8a47c] focus:outline-none"
                >
                  <option value="Novo">1. Novo</option>
                  <option value="Em triagem">2. Em Triagem</option>
                  <option value="Qualificado">3. Qualificado</option>
                  <option value="Análise de viabilidade">4. Análise de Viabilidade</option>
                  <option value="Proposta enviada">5. Proposta Enviada</option>
                  <option value="Negociação">6. Negociação</option>
                  <option value="Ganho">7. Ganho (Contratado)</option>
                  <option value="Perdido">8. Perdido</option>
                </select>

                {lead.statusFunil === 'Perdido' && lead.motivoPerda && (
                  <span className="text-xs px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    Motivo: {lead.motivoPerda}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 font-mono border-t md:border-t-0 md:border-l border-[#263040] pt-3 md:pt-0 md:pl-6">
              <div>
                <span className="text-[10px] text-[#545c6b] block font-sans">Valor Estimado</span>
                <span className="text-base font-bold text-[#b8a47c]">{formatCurrency(lead.valorEstimado)}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#545c6b] block font-sans">Score Lead</span>
                <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> {lead.score || 75}/100
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#545c6b] block font-sans">Data Entrada</span>
                <span className="text-xs text-[#e8e1d0]">{formatDate(lead.dataCriacao)}</span>
              </div>
            </div>
          </div>

          {/* Dados Detalhados em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco 1: Contato e Localização */}
            <div className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Dados de Contato & Localidade
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                  <span className="text-[#545c6b]">WhatsApp / Telefone:</span>
                  <span className="font-semibold text-[#f4efe3]">{formatPhone(lead.whatsapp || lead.telefone)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                  <span className="text-[#545c6b]">E-mail:</span>
                  <span className="text-[#5b9cd9] truncate max-w-[200px]">{lead.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                  <span className="text-[#545c6b]">Cidade / UF:</span>
                  <span className="text-[#f4efe3]">{lead.cidade}/{lead.uf}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                  <span className="text-[#545c6b]">CPF ou CNPJ:</span>
                  <span className="font-mono text-[#f4efe3]">{lead.cpfCnpj || 'Não coletado'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#545c6b]">Inscrição OAB:</span>
                  <span className="font-mono text-[#f4efe3]">{lead.oabNumero ? `OAB/${lead.oabUf || lead.uf} ${lead.oabNumero}` : 'Não se aplica'}</span>
                </div>
              </div>
            </div>

            {/* Bloco 2: Processo & Necessidade Médica */}
            <div className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Caso Médico-Pericial & Demanda
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                  <span className="text-[#545c6b]">Área do Direito:</span>
                  <span className="font-semibold text-[#5b9cd9]">{lead.area}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                  <span className="text-[#545c6b]">Fase Processual:</span>
                  <span className="text-[#f4efe3]">{lead.faseProcesso || 'Aguardando perícia'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                  <span className="text-[#545c6b]">Prazo Fatal Processual:</span>
                  <span className={lead.prazoEmCurso ? 'font-bold text-rose-400' : 'text-[#545c6b]'}>
                    {lead.prazoEmCurso ? `Sim - ${formatDate(lead.prazoData)}` : 'Não informado'}
                  </span>
                </div>
                <div className="py-1">
                  <span className="text-[#545c6b] block mb-1">Necessidade Manifestada:</span>
                  <p className="text-[#e8e1d0]/90 leading-relaxed bg-[#161c26] p-2 rounded-lg border border-[#263040]">
                    {lead.necessidade || 'Avaliação técnica preliminar e quesitos periciais estratégicos.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco 3: Rastreamento & Marketing */}
            <div className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Origem & Métricas de Marketing
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                  <span className="text-[#545c6b]">Canal de Origem:</span>
                  <span className="px-2 py-0.5 rounded bg-[#161c26] text-[#b8a47c] font-medium border border-[#263040]">
                    {lead.origem}
                  </span>
                </div>
                {lead.indicadoPor && (
                  <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                    <span className="text-[#545c6b]">Indicado Por:</span>
                    <span className="text-[#f4efe3]">{lead.indicadoPor}</span>
                  </div>
                )}
                {lead.campanha && (
                  <div className="flex items-center justify-between py-1 border-b border-[#263040]/50">
                    <span className="text-[#545c6b]">Campanha:</span>
                    <span className="text-[#f4efe3]">{lead.campanha}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                  <div>
                    <span className="text-[#545c6b] block font-sans">UTM Source / Medium</span>
                    <span className="text-[#e8e1d0]">{lead.utmSource || 'direct'} / {lead.utmMedium || 'none'}</span>
                  </div>
                  <div>
                    <span className="text-[#545c6b] block font-sans">GCLID Google Ads</span>
                    <span className="text-[#545c6b] truncate block">{lead.gclid || 'orgânico'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 4: Tags e Observações */}
            <div className="p-4 rounded-xl bg-[#1b222d] border border-[#263040] space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags & Anotações Internas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#161c26] text-[#b8a47c] border border-[#263040]"
                  >
                    #{tag}
                  </span>
                ))}
                {(!lead.tags || lead.tags.length === 0) && (
                  <span className="text-[11px] text-[#545c6b]">Sem tags atribuídas</span>
                )}
              </div>
              <div className="pt-2">
                <span className="text-[#545c6b] block mb-1">Observações da Dra. Karine / SDR:</span>
                <p className="text-[#e8e1d0]/80 leading-relaxed bg-[#161c26] p-2.5 rounded-lg border border-[#263040]">
                  {lead.observacoes || 'Nenhuma observação interna cadastrada.'}
                </p>
              </div>
            </div>

          </div>

          {/* Linha do Tempo de Atendimento */}
          <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b8a47c]">
                  Linha do Tempo de Atendimento com o Lead
                </h3>
                <p className="text-[11px] text-[#545c6b]">
                  Histórico de WhatsApp, tentativas de contato, reuniões e eventos.
                </p>
              </div>
              <button
                onClick={() => setIsNovaInteracaoOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Interação
              </button>
            </div>

            <div className="space-y-3">
              {interacoes.map((int) => (
                <div key={int.id} className="p-3 rounded-lg bg-[#1b222d] border border-[#263040] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#12171f] text-[#b8a47c] font-semibold border border-[#263040]">
                        {int.tipo}
                      </span>
                      <span className="font-semibold text-[#f4efe3]">{int.titulo || int.tipo}</span>
                    </div>
                    <span className="text-[10px] text-[#545c6b] font-mono">
                      {formatDateTime(int.dataHora)} • Por {int.usuarioNome}
                    </span>
                  </div>
                  <p className="text-[#e8e1d0]/80 leading-relaxed whitespace-pre-wrap">{int.descricao}</p>
                </div>
              ))}

              {interacoes.length === 0 && (
                <div className="p-6 text-center text-xs text-[#545c6b]">
                  Nenhuma interação registrada para este lead até o momento.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal: Registrar Interação */}
        {isNovaInteracaoOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-[#161c26] border border-[#263040] rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-[#263040] flex items-center justify-between">
                <h3 className="font-serif text-lg text-[#f4efe3]">Registrar Interação com o Lead</h3>
                <button
                  onClick={() => setIsNovaInteracaoOpen(false)}
                  className="text-[#545c6b] hover:text-[#f4efe3]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarInteracao} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Canal de Comunicação *</label>
                  <select
                    value={intTipo}
                    onChange={(e) => setIntTipo(e.target.value as any)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Ligação">Ligação Telefônica</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Reunião">Reunião / Videoconferência</option>
                    <option value="Nota Interna">Nota Interna</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Assunto / Título</label>
                  <input
                    type="text"
                    placeholder="Ex: Esclarecimento sobre prazo de quesitos e envio de proposta"
                    value={intTitulo}
                    onChange={(e) => setIntTitulo(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Descrição *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Detalhes do que foi alinhado com o advogado ou periciando..."
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
                    Salvar Interação
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Conversão de Lead */}
        {isConversaoOpen && (
          <ConversaoLeadModal
            lead={lead}
            onClose={() => setIsConversaoOpen(false)}
            onConverted={() => {
              loadLead();
              onUpdate();
            }}
          />
        )}

        {/* Modal: Motivo de Perda */}
        {isMotivoPerdaOpen && (
          <MotivoPerdaModal
            lead={lead}
            onClose={() => setIsMotivoPerdaOpen(false)}
            onConfirm={async (motivo, detalhe) => {
              const agora = new Date().toISOString().split('T')[0];
              await leadRepository.update(lead.id, {
                statusFunil: 'Perdido',
                motivoPerda: motivo,
                motivoPerdaDetalhe: detalhe,
                dataPerda: agora,
                dataUltimoContato: agora,
                dataEntradaEtapa: agora,
              });

              await interacaoRepository.create({
                tipo: 'Evento do Sistema',
                titulo: `Lead Marcado como Perdido: ${motivo}`,
                descricao: `Motivo: ${motivo}. Detalhe: ${detalhe || 'Nenhum detalhe adicional informado.'}`,
                dataHora: new Date().toISOString(),
                usuarioId: currentUser.id,
                usuarioNome: currentUser.nome,
                leadId: lead.id,
              });

              loadLead();
              onUpdate();
            }}
          />
        )}

        {/* Modal: Mesclagem de Duplicados */}
        {isMergeOpen && duplicadoDetectado && (
          <DuplicateMergeModal
            leadPrincipal={lead}
            leadDuplicado={duplicadoDetectado}
            criterioMatch={criterioDuplicidade}
            onClose={() => setIsMergeOpen(false)}
            onMerged={() => {
              loadLead();
              onUpdate();
            }}
          />
        )}

      </div>
    </div>
  );
};
