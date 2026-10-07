import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Lock,
  Unlock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Database,
  User,
  Stethoscope,
  Filter,
  Search,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  usuarioRepository,
  papelRepository,
  auditLogRepository,
  resetAllDataToDefault,
} from '../services';
import {
  Usuario,
  Papel,
  AuditLog,
  ModuloSistema,
  AcaoPermissao,
  PermissaoModulo,
} from '../types';
import { formatDate, formatDateTime, formatPhone, maskPhoneInput } from '../utils/formatters';

const MODULOS_SISTEMA: { id: ModuloSistema; label: string; descricao: string }[] = [
  { id: 'dashboard', label: 'Dashboard', descricao: 'Indicadores gerais e métricas periciais' },
  { id: 'leads', label: 'Leads & Funil', descricao: 'Prospecção e negociação com advogados' },
  { id: 'contatos', label: 'Contatos', descricao: 'Escritórios, advogados e periciandos examinados' },
  { id: 'processos', label: 'Processos & Perícias', descricao: 'Autos judiciais, perícias e nomeações' },
  { id: 'tarefas', label: 'Tarefas & Prazos', descricao: 'Prazos fatais e quesitos periciais' },
  { id: 'agenda', label: 'Agenda', descricao: 'Compromissos, exames clínicos e audiências' },
  { id: 'conversas', label: 'Conversas (WhatsApp)', descricao: 'Atendimento direto a escritórios' },
  { id: 'email', label: 'E-mail', descricao: 'Envio formal de pareceres e propostas' },
  { id: 'documentos', label: 'Contratos & Documentos', descricao: 'Termos LGPD, minutas e pareceres' },
  { id: 'financeiro', label: 'Financeiro', descricao: 'Honorários, cobranças Pix/boleto e despesas' },
  { id: 'prospeccao', label: 'Prospecção', descricao: 'Campanhas ativas para bancas de advocacia' },
  { id: 'automacoes', label: 'Automações', descricao: 'Regras e alertas automáticos de prazos' },
  { id: 'site', label: 'Site Institucional', descricao: 'Captura de contatos via crivoforense.com.br' },
  { id: 'relatorios', label: 'Relatórios', descricao: 'Métricas de êxito e rentabilidade' },
  { id: 'configuracoes', label: 'Configurações', descricao: 'Equipe, perfis, permissões e sistema' },
];

const CORES_PALETA = [
  '#b8a47c', // Champagne Crivo
  '#3b82f6', // Azul
  '#10b981', // Verde Esmeralda
  '#f59e0b', // Âmbar
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#64748b', // Slate
];

export const ConfiguracoesView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'equipe';

  const [activeTab, setActiveTab] = useState<'equipe' | 'papeis' | 'auditoria' | 'geral'>(
    initialTab as any
  );

  const { currentUser, switchUser, refreshUsers } = useAuth();

  // State
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Papel Selecionado para Edição de Matriz
  const [selectedPapelId, setSelectedPapelId] = useState<string>('role_admin');
  const [selectedPapel, setSelectedPapel] = useState<Papel | null>(null);
  const [salvouPapelMsg, setSalvouPapelMsg] = useState(false);

  // Modais
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formPapelId, setFormPapelId] = useState('role_assistente');
  const [formCorAgenda, setFormCorAgenda] = useState('#b8a47c');
  const [formCrm, setFormCrm] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);

  // Modal Novo Papel
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [novoPapelNome, setNovoPapelNome] = useState('');
  const [novoPapelDescricao, setNovoPapelDescricao] = useState('');

  // Filtros de Auditoria
  const [filtroAuditoriaLgpd, setFiltroAuditoriaLgpd] = useState(false);
  const [buscaAuditoria, setBuscaAuditoria] = useState('');

  const loadAll = async () => {
    const [u, p, a] = await Promise.all([
      usuarioRepository.getAll(),
      papelRepository.getAll(),
      auditLogRepository.getAll(),
    ]);
    setUsuarios(u);
    setPapeis(p);
    setAuditLogs(a);

    const found = p.find((item) => item.id === selectedPapelId) || p[0];
    if (found) {
      setSelectedPapel(JSON.parse(JSON.stringify(found)));
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedPapelId]);

  const handleTabChange = (tab: 'equipe' | 'papeis' | 'auditoria' | 'geral') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Salvar Matriz de Permissões
  const handleSavePermissoes = async () => {
    if (!selectedPapel) return;

    await papelRepository.update(selectedPapel.id, {
      permissoes: selectedPapel.permissoes,
      verApenasSobMinhaResponsabilidade: selectedPapel.verApenasSobMinhaResponsabilidade,
      acessarDadosSensiveisSaude: selectedPapel.acessarDadosSensiveisSaude,
    });

    await auditLogRepository.logAccess({
      acao: 'Atualização de Matriz de Permissões',
      entidade: 'Papel',
      entidadeId: selectedPapel.id,
      detalhes: `Permissões do perfil "${selectedPapel.nome}" foram reconfiguradas.`,
      isDadoSensivelSaude: false,
    });

    setSalvouPapelMsg(true);
    setTimeout(() => setSalvouPapelMsg(false), 3000);
    loadAll();
  };

  const handleToggleCell = (modulo: ModuloSistema, acao: AcaoPermissao) => {
    if (!selectedPapel) return;
    if (selectedPapel.id === 'role_admin') return; // Admin sempre full

    const currentVal = selectedPapel.permissoes[modulo]?.[acao] ?? false;
    const updated = {
      ...selectedPapel,
      permissoes: {
        ...selectedPapel.permissoes,
        [modulo]: {
          ...selectedPapel.permissoes[modulo],
          [acao]: !currentVal,
        },
      },
    };
    setSelectedPapel(updated);
  };

  const handleToggleRow = (modulo: ModuloSistema) => {
    if (!selectedPapel) return;
    if (selectedPapel.id === 'role_admin') return;

    const row = selectedPapel.permissoes[modulo] || { ver: false, criar: false, editar: false, excluir: false, exportar: false };
    const allTrue = row.ver && row.criar && row.editar && row.excluir && row.exportar;
    const newVal = !allTrue;

    setSelectedPapel({
      ...selectedPapel,
      permissoes: {
        ...selectedPapel.permissoes,
        [modulo]: {
          ver: newVal,
          criar: newVal,
          editar: newVal,
          excluir: newVal,
          exportar: newVal,
        },
      },
    });
  };

  // Usuário: Criar / Editar
  const handleOpenUserModal = (user?: Usuario) => {
    if (user) {
      setEditingUserId(user.id);
      setFormNome(user.nome);
      setFormEmail(user.email);
      setFormTelefone(user.telefone || '');
      setFormPapelId(user.papelId);
      setFormCorAgenda(user.corAgenda || '#b8a47c');
      setFormCrm(user.crm || '');
      setFormAtivo(user.ativo);
    } else {
      setEditingUserId(null);
      setFormNome('');
      setFormEmail('');
      setFormTelefone('');
      setFormPapelId(papeis[0]?.id || 'role_assistente');
      setFormCorAgenda('#3b82f6');
      setFormCrm('');
      setFormAtivo(true);
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formEmail.trim()) return;

    const papelObj = papeis.find((p) => p.id === formPapelId);
    const papelNome = papelObj ? papelObj.nome : 'Assistente Técnico';

    if (editingUserId) {
      await usuarioRepository.update(editingUserId, {
        nome: formNome,
        email: formEmail,
        telefone: formTelefone,
        papelId: formPapelId,
        papelNome: papelNome,
        corAgenda: formCorAgenda,
        crm: formCrm || undefined,
        ativo: formAtivo,
      });

      await auditLogRepository.logAccess({
        acao: 'Edição de Usuário',
        entidade: 'Usuario',
        entidadeId: editingUserId,
        detalhes: `Membro da equipe "${formNome}" atualizado (${papelNome}).`,
        isDadoSensivelSaude: false,
      });
    } else {
      const created = await usuarioRepository.create({
        nome: formNome,
        email: formEmail,
        telefone: formTelefone,
        papelId: formPapelId,
        papelNome: papelNome,
        corAgenda: formCorAgenda,
        crm: formCrm || undefined,
        ativo: formAtivo,
      });

      await auditLogRepository.logAccess({
        acao: 'Cadastro de Usuário',
        entidade: 'Usuario',
        entidadeId: created.id,
        detalhes: `Novo membro "${formNome}" cadastrado com papel ${papelNome}.`,
        isDadoSensivelSaude: false,
      });
    }

    setIsUserModalOpen(false);
    await refreshUsers();
    loadAll();
  };

  // Alternar Ativo/Inativo
  const handleToggleUserAtivo = async (user: Usuario) => {
    if (user.id === 'user_karine') {
      alert('A Dra. Karine Reis é a perita titular administradora e não pode ser inativada.');
      return;
    }
    const novoStatus = !user.ativo;
    await usuarioRepository.update(user.id, { ativo: novoStatus });
    await refreshUsers();
    loadAll();
  };

  // Criar Papel Personalizado
  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPapelNome.trim()) return;

    const emptyPerms: Record<ModuloSistema, PermissaoModulo> = {} as any;
    MODULOS_SISTEMA.forEach((m) => {
      emptyPerms[m.id] = { ver: true, criar: false, editar: false, excluir: false, exportar: false };
    });

    const newRole = await papelRepository.create({
      nome: novoPapelNome,
      descricao: novoPapelDescricao || 'Papel personalizado',
      isPadrao: false,
      verApenasSobMinhaResponsabilidade: false,
      acessarDadosSensiveisSaude: false,
      permissoes: emptyPerms,
    });

    await auditLogRepository.logAccess({
      acao: 'Criação de Papel Personalizado',
      entidade: 'Papel',
      entidadeId: newRole.id,
      detalhes: `Papel personalizado "${novoPapelNome}" criado.`,
      isDadoSensivelSaude: false,
    });

    setIsRoleModalOpen(false);
    setNovoPapelNome('');
    setNovoPapelDescricao('');
    setSelectedPapelId(newRole.id);
    loadAll();
  };

  // Backup e Restauração
  const handleExportBackup = () => {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('crivo_')) {
        backup[key] = JSON.parse(localStorage.getItem(key) || 'null');
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crivo_crm_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const auditLogsFiltrados = auditLogs.filter((log) => {
    const matchLgpd = filtroAuditoriaLgpd ? log.isDadoSensivelSaude : true;
    const matchBusca =
      log.usuarioNome.toLowerCase().includes(buscaAuditoria.toLowerCase()) ||
      log.acao.toLowerCase().includes(buscaAuditoria.toLowerCase()) ||
      (log.detalhes || '').toLowerCase().includes(buscaAuditoria.toLowerCase()) ||
      log.entidade.toLowerCase().includes(buscaAuditoria.toLowerCase());
    return matchLgpd && matchBusca;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Configurações & Gestão de Equipe
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Controle de usuários, papéis, matriz granular de permissões e auditoria LGPD de saúde.
          </p>
        </div>

        <div className="flex flex-wrap rounded-lg bg-[#12171f] border border-[#1b222d] p-1">
          <button
            onClick={() => handleTabChange('equipe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'equipe'
                ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm'
                : 'text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Equipe & Usuários ({usuarios.length})
          </button>
          <button
            onClick={() => handleTabChange('papeis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'papeis'
                ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm'
                : 'text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Papéis & Permissões ({papeis.length})
          </button>
          <button
            onClick={() => handleTabChange('auditoria')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'auditoria'
                ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm'
                : 'text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            Auditoria & LGPD ({auditLogs.length})
          </button>
          <button
            onClick={() => handleTabChange('geral')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'geral'
                ? 'bg-[#1b222d] text-[#b8a47c] shadow-sm'
                : 'text-[#545c6b] hover:text-[#f4efe3]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Dados da Perita & Backup
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: EQUIPE & USUÁRIOS */}
      {/* ========================================================= */}
      {activeTab === 'equipe' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#12171f] border border-[#1b222d]">
            <div>
              <h2 className="font-serif text-base text-[#f4efe3]">
                Membros da Equipe Crivo Forense
              </h2>
              <p className="text-xs text-[#545c6b]">
                Gerencie colaboradores médicos, comerciais, administrativos e controle o status de acesso.
              </p>
            </div>

            <button
              onClick={() => handleOpenUserModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Novo Membro
            </button>
          </div>

          <div className="bg-[#12171f] border border-[#1b222d] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161c26] text-[#b8a47c] uppercase tracking-wider font-semibold border-b border-[#1b222d]">
                  <tr>
                    <th className="px-4 py-3">Membro / Nome</th>
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3">Papel no Sistema</th>
                    <th className="px-4 py-3">Cor na Agenda</th>
                    <th className="px-4 py-3">CRM / Registro</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b222d] text-[#e8e1d0]">
                  {usuarios.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    const papelObj = papeis.find((p) => p.id === u.papelId);

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-[#1b222d]/70 transition-colors ${
                          isCurrent ? 'bg-[#1b222d]/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs text-[#0a0e14] shrink-0"
                              style={{ backgroundColor: u.corAgenda || '#b8a47c' }}
                            >
                              {u.nome
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <div className="font-semibold text-[#f4efe3] flex items-center gap-1.5">
                                {u.nome}
                                {isCurrent && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#b8a47c]/20 text-[#b8a47c] border border-[#b8a47c]/40 font-mono">
                                    Você
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#545c6b]">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[#545c6b]">
                          {formatPhone(u.telefone) || 'Não informado'}
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1b222d] text-[#b8a47c] border border-[#263040]">
                            {u.papelNome}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: u.corAgenda }}
                            />
                            <span className="font-mono text-[11px] text-[#545c6b]">
                              {u.corAgenda}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[11px] text-[#5b9cd9] font-mono">
                          {u.crm || '-'}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleUserAtivo(u)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                              u.ativo
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-950/70'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => switchUser(u.id)}
                              className="px-2 py-1 rounded bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#b8a47c] text-[11px] transition-colors"
                              title="Simular login como este usuário para testar permissões"
                            >
                              Simular Login
                            </button>
                            <button
                              onClick={() => handleOpenUserModal(u)}
                              className="p-1 rounded text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors"
                              title="Editar Usuário"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PAPÉIS & MATRIZ DE PERMISSÕES */}
      {/* ========================================================= */}
      {activeTab === 'papeis' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Coluna da Esquerda: Lista de Papéis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b222d]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b8a47c]">
                Papéis Cadastrados
              </span>
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="p-1 text-[#b8a47c] hover:bg-[#1b222d] rounded transition-colors"
                title="Criar Papel Personalizado"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {papeis.map((p) => {
                const isSelected = selectedPapelId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPapelId(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1b222d] border-[#b8a47c] shadow-sm'
                        : 'bg-[#12171f] border-[#1b222d] hover:border-[#263040]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#f4efe3]">{p.nome}</span>
                      {p.isPadrao && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#12171f] text-[#545c6b] border border-[#263040]">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#545c6b] mt-1 line-clamp-2">
                      {p.descricao}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna da Direita: Matriz de Permissões */}
          <div className="lg:col-span-3 space-y-4">
            {selectedPapel && (
              <div className="bg-[#12171f] border border-[#1b222d] rounded-2xl p-6 shadow-xl space-y-5">
                {/* Header do Papel Selecionado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1b222d]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg text-[#f4efe3]">
                        {selectedPapel.nome}
                      </h2>
                      {selectedPapel.isPadrao ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                          Papel Padrão do Sistema
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 border border-purple-800/40">
                          Papel Personalizado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#545c6b] mt-1">{selectedPapel.descricao}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {salvouPapelMsg && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Salvo!
                      </span>
                    )}

                    <button
                      onClick={handleSavePermissoes}
                      className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm"
                    >
                      Salvar Permissões
                    </button>
                  </div>
                </div>

                {/* Opções Extras / Restrições Específicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#1b222d] border border-[#263040] text-xs">
                  {/* Opção Extra 1: Ver apenas registros sob responsabilidade */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-[#f4efe3] block">
                        Ver apenas registros sob minha responsabilidade
                      </span>
                      <p className="text-[11px] text-[#545c6b] mt-0.5 leading-relaxed">
                        Filtra processos, perícias e leads para exibir somente aqueles onde o colaborador foi designado como perito ou responsável.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={selectedPapel.verApenasSobMinhaResponsabilidade}
                      onChange={(e) =>
                        setSelectedPapel({
                          ...selectedPapel,
                          verApenasSobMinhaResponsabilidade: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#b8a47c] bg-[#12171f] border-[#263040] focus:ring-0 cursor-pointer shrink-0 mt-0.5"
                    />
                  </div>

                  {/* Opção Extra 2: Acesso a dados sensíveis de saúde (LGPD) */}
                  <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30">
                    <div>
                      <span className="font-semibold text-amber-200 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#b8a47c]" />
                        Acessar dados sensíveis de saúde (LGPD Art. 11)
                      </span>
                      <p className="text-[11px] text-amber-300/70 mt-0.5 leading-relaxed">
                        Autoriza visualização de prontuários, CIDs e históricos clínicos de periciandos. Se desmarcado, todos os dados médicos são ofuscados na tela e bloqueados no serviço.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={selectedPapel.acessarDadosSensiveisSaude}
                      onChange={(e) =>
                        setSelectedPapel({
                          ...selectedPapel,
                          acessarDadosSensiveisSaude: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#b8a47c] bg-[#12171f] border-[#263040] focus:ring-0 cursor-pointer shrink-0 mt-0.5"
                    />
                  </div>
                </div>

                {/* Tabela Matriz de Permissões por Módulo e Ação */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#f4efe3]">
                      Matriz Granular de Ações por Módulo
                    </span>
                    {selectedPapel.id === 'role_admin' && (
                      <span className="text-[11px] text-[#b8a47c] italic">
                        Administrador possui acesso total irrestrito nativo.
                      </span>
                    )}
                  </div>

                  <div className="border border-[#263040] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161c26] text-[#b8a47c] uppercase tracking-wider font-semibold border-b border-[#263040]">
                        <tr>
                          <th className="px-4 py-2.5">Módulo do Sistema</th>
                          <th className="px-3 py-2.5 text-center">Ver</th>
                          <th className="px-3 py-2.5 text-center">Criar</th>
                          <th className="px-3 py-2.5 text-center">Editar</th>
                          <th className="px-3 py-2.5 text-center">Excluir</th>
                          <th className="px-3 py-2.5 text-center">Exportar</th>
                          <th className="px-3 py-2.5 text-right">Ação Rápida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1b222d] text-[#e8e1d0]">
                        {MODULOS_SISTEMA.map((mod) => {
                          const perms = selectedPapel.permissoes[mod.id] || {
                            ver: false,
                            criar: false,
                            editar: false,
                            excluir: false,
                            exportar: false,
                          };

                          const isAdmin = selectedPapel.id === 'role_admin';

                          return (
                            <tr key={mod.id} className="hover:bg-[#1b222d]/70 transition-colors">
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-[#f4efe3]">{mod.label}</div>
                                <div className="text-[10px] text-[#545c6b]">{mod.descricao}</div>
                              </td>

                              {(['ver', 'criar', 'editar', 'excluir', 'exportar'] as AcaoPermissao[]).map(
                                (acao) => (
                                  <td key={acao} className="px-3 py-2.5 text-center">
                                    <input
                                      type="checkbox"
                                      disabled={isAdmin}
                                      checked={isAdmin ? true : Boolean(perms[acao])}
                                      onChange={() => handleToggleCell(mod.id, acao)}
                                      className="w-4 h-4 rounded text-[#b8a47c] bg-[#12171f] border-[#263040] focus:ring-0 cursor-pointer disabled:opacity-75"
                                    />
                                  </td>
                                )
                              )}

                              <td className="px-3 py-2.5 text-right">
                                {!isAdmin && (
                                  <button
                                    onClick={() => handleToggleRow(mod.id)}
                                    className="text-[10px] text-[#b8a47c] hover:underline"
                                  >
                                    Alternar Linha
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LOGS DE AUDITORIA & LGPD ART. 11 */}
      {/* ========================================================= */}
      {activeTab === 'auditoria' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-[#12171f] border border-emerald-800/40 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileCheck2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-300 text-sm">
                  Trilha de Auditoria & Conformidade LGPD (Art. 11)
                </h3>
                <p className="text-[#e8e1d0]/80 mt-0.5 leading-relaxed">
                  Registro cronológico imutável de todas as ações de sistema, com alerta prioritário sempre que prontuários ou dados médicos de periciandos forem consultados por membros da equipe.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const json = JSON.stringify(auditLogs, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `crivo_auditoria_lgpd_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#b8a47c] text-xs font-semibold shrink-0 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Trilha de Auditoria
            </button>
          </div>

          {/* Filtros da Trilha */}
          <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#545c6b] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por usuário, ação ou periciando..."
                value={buscaAuditoria}
                onChange={(e) => setBuscaAuditoria(e.target.value)}
                className="w-full bg-[#1b222d] border border-[#263040] rounded-lg pl-9 pr-3 py-2 text-[#f4efe3] placeholder-[#545c6b] focus:outline-none focus:border-[#b8a47c]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#e8e1d0]">
                <input
                  type="checkbox"
                  checked={filtroAuditoriaLgpd}
                  onChange={(e) => setFiltroAuditoriaLgpd(e.target.checked)}
                  className="w-4 h-4 rounded text-[#b8a47c] bg-[#1b222d] border-[#263040] focus:ring-0"
                />
                <span className="text-amber-300 font-medium">
                  Apenas acessos a dados sensíveis de saúde (Art. 11 LGPD)
                </span>
              </label>
            </div>
          </div>

          {/* Tabela de Logs */}
          <div className="bg-[#12171f] border border-[#1b222d] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161c26] text-[#b8a47c] uppercase tracking-wider font-semibold border-b border-[#1b222d]">
                  <tr>
                    <th className="px-4 py-3">Data & Hora</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Ação Registrada</th>
                    <th className="px-4 py-3">Entidade</th>
                    <th className="px-4 py-3">Detalhes do Evento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b222d] text-[#e8e1d0]">
                  {auditLogsFiltrados.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-[#1b222d]/70 transition-colors ${
                        log.isDadoSensivelSaude ? 'bg-amber-950/15' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-[#545c6b] font-mono whitespace-nowrap">
                        {formatDateTime(log.dataHora)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#f4efe3]">{log.usuarioNome}</div>
                        <div className="text-[10px] text-[#b8a47c]">{log.usuarioPapel}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-[#f4efe3]">{log.acao}</span>
                          {log.isDadoSensivelSaude && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
                              LGPD Art. 11 (Saúde)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-[#5b9cd9]">
                        {log.entidade}
                      </td>

                      <td className="px-4 py-3 text-xs text-[#e8e1d0]/80 max-w-md">
                        {log.detalhes || '-'}
                      </td>
                    </tr>
                  ))}

                  {auditLogsFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#545c6b]">
                        Nenhum registro de auditoria corresponde aos filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: GERAL & DADOS DA PERITA & BACKUP */}
      {/* ========================================================= */}
      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados da Dra. Karine Reis */}
          <div className="bg-[#12171f] border border-[#1b222d] rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-[#1b222d] pb-3">
              <User className="w-5 h-5 text-[#b8a47c]" />
              <h3 className="font-serif text-base text-[#f4efe3]">
                Dados da Perita Titular & Responsável Técnica
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[#545c6b] mb-1">Nome Completo</label>
                <input
                  type="text"
                  disabled
                  value="Dra. Karine Reis"
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1">CRM Principal (SP)</label>
                  <input
                    type="text"
                    disabled
                    value="CRM/SP 235.821"
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#b8a47c] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[#545c6b] mb-1">CRM Secundário (TO)</label>
                  <input
                    type="text"
                    disabled
                    value="CRM/TO 6.385"
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#b8a47c] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#545c6b] mb-1">Qualificação / RQE</label>
                <input
                  type="text"
                  disabled
                  value="Perícia Médica, Medicina Legal & Assistência Técnica Forense"
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div>
                <label className="block text-[#545c6b] mb-1">E-mail Profissional</label>
                <input
                  type="email"
                  disabled
                  value="karine.reis@crivoforense.com.br"
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>
            </div>
          </div>

          {/* Gerenciamento de Armazenamento e Banco */}
          <div className="bg-[#12171f] border border-[#1b222d] rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-[#1b222d] pb-3">
              <Database className="w-5 h-5 text-[#b8a47c]" />
              <h3 className="font-serif text-base text-[#f4efe3]">
                Armazenamento & Migração Firebase
              </h3>
            </div>

            <p className="text-[#545c6b] leading-relaxed">
              O CRM opera atualmente na camada de repositórios padronizada em <code>/services</code> via <strong>localStorage</strong>.
              A arquitetura de interfaces (<code>ILeadRepository</code>, <code>IProcessoRepository</code>, etc.) está totalmente isolada das telas, pronta para substituição direta por Firebase Firestore.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#e8e1d0] font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-[#b8a47c]" />
                Exportar Backup Completo (JSON)
              </button>

              <button
                onClick={() => {
                  if (confirm('Restaurar dados fictícios originais (30 leads, 10 escritórios, 20 processos, papéis padrão)?')) {
                    resetAllDataToDefault();
                  }
                }}
                className="w-full py-2.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 text-rose-300 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar para os Dados de Demonstração Originais
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE USUÁRIO */}
      {/* ========================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#263040] pb-3">
              <h2 className="font-serif text-lg text-[#f4efe3]">
                {editingUserId ? 'Editar Membro da Equipe' : 'Cadastrar Novo Membro da Equipe'}
              </h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-[#545c6b] hover:text-[#f4efe3]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-[#545c6b] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Marcelo Albuquerque ou Juliana Santos"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1">E-mail Profissional *</label>
                  <input
                    type="email"
                    required
                    placeholder="colaborador@crivoforense.com.br"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98888-0000"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(maskPhoneInput(e.target.value))}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1">Papel / Perfil de Acesso *</label>
                  <select
                    value={formPapelId}
                    onChange={(e) => setFormPapelId(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    {papeis.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1">CRM (se aplicável)</label>
                  <input
                    type="text"
                    placeholder="Ex: CRM/SP 241.902"
                    value={formCrm}
                    onChange={(e) => setFormCrm(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#545c6b] mb-1">Cor Identificadora na Agenda</label>
                <div className="flex items-center gap-2">
                  {CORES_PALETA.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormCorAgenda(cor)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        formCorAgenda === cor ? 'scale-125 border-white shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formCorAgenda}
                    onChange={(e) => setFormCorAgenda(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                    title="Cor personalizada"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userAtivo"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-[#b8a47c] bg-[#1b222d] border-[#263040]"
                />
                <label htmlFor="userAtivo" className="text-[#e8e1d0] cursor-pointer">
                  Membro ativo (pode acessar o sistema)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#263040]">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0] hover:bg-[#232c3a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold hover:bg-[#c7b692]"
                >
                  {editingUserId ? 'Salvar Alterações' : 'Cadastrar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR PAPEL PERSONALIZADO */}
      {/* ========================================================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#263040] pb-3">
              <h2 className="font-serif text-lg text-[#f4efe3]">Novo Papel Personalizado</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-[#545c6b] hover:text-[#f4efe3]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-3">
              <div>
                <label className="block text-[#545c6b] mb-1">Nome do Papel *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consultor Especialista em DPVAT"
                  value={novoPapelNome}
                  onChange={(e) => setNovoPapelNome(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div>
                <label className="block text-[#545c6b] mb-1">Descrição das Atribuições</label>
                <textarea
                  rows={3}
                  placeholder="Descreva as responsabilidades desse perfil..."
                  value={novoPapelDescricao}
                  onChange={(e) => setNovoPapelDescricao(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#263040]">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0] hover:bg-[#232c3a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold hover:bg-[#c7b692]"
                >
                  Criar Papel & Configurar Matriz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
