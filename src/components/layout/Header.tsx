import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Check,
  User,
  Stethoscope,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificacaoRepository, resetAllDataToDefault } from '../../services';
import { Notificacao } from '../../types';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ sidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, currentRole, can } = useAuth();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const newRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificacaoRepository.getAll().then(setNotificacoes);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (newRef.current && !newRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  const markAllAsRead = async () => {
    const updated = await Promise.all(
      notificacoes.map((n) => notificacaoRepository.update(n.id, { lida: true }))
    );
    setNotificacoes(updated);
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 z-20 h-20 transition-all duration-300 ease-in-out border-b
        ${sidebarCollapsed ? 'left-20' : 'left-64'}
        bg-[#0a0e14]/90 dark:bg-[#0a0e14]/90 backdrop-blur-md border-[#1b222d] px-6 flex items-center justify-between`}
      >
        {/* Global Search Bar Trigger */}
        <div className="flex-1 max-w-xl">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#12171f] hover:bg-[#161c26] border border-[#1b222d] text-[#545c6b] hover:text-[#e8e1d0] transition-colors text-sm group"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <Search className="w-4 h-4 text-[#b8a47c] group-hover:scale-105 transition-transform" />
              <span className="truncate">
                Buscar por Nome, CPF, CNPJ, OAB ou Processo...
              </span>
            </div>
            <div className="flex items-center space-x-1 pl-2">
              <kbd className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#1b222d] border border-[#263040] text-[#e8e1d0]/60">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center space-x-3 ml-4">
          {/* Quick Create Dropdown */}
          <div className="relative" ref={newRef}>
            <button
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wide transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Novo Registro</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isNewMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl py-2 z-50 text-xs">
                {can('leads', 'criar') && (
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      navigate('/leads?novo=true');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#1b222d] text-[#f4efe3] flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#b8a47c]"></span>
                    Novo Lead / Oportunidade
                  </button>
                )}
                {can('processos', 'criar') && (
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      navigate('/processos?novo=true');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#1b222d] text-[#f4efe3] flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#5b9cd9]"></span>
                    Novo Processo Judicial
                  </button>
                )}
                {can('agenda', 'criar') && (
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      navigate('/agenda?nova=true');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#1b222d] text-[#f4efe3] flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Nova Perícia / Compromisso
                  </button>
                )}
                {can('tarefas', 'criar') && (
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      navigate('/tarefas?nova=true');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#1b222d] text-[#f4efe3] flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Nova Tarefa / Prazo Fatal
                  </button>
                )}
                {!can('leads', 'criar') && !can('processos', 'criar') && !can('agenda', 'criar') && !can('tarefas', 'criar') && (
                  <div className="px-4 py-2 text-[#545c6b] text-[11px] italic">
                    Sem permissão de criação
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="p-2 rounded-lg bg-[#12171f] hover:bg-[#1b222d] border border-[#1b222d] text-[#e8e1d0] hover:text-[#b8a47c] transition-colors"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-lg bg-[#12171f] hover:bg-[#1b222d] border border-[#1b222d] text-[#e8e1d0] hover:text-[#b8a47c] transition-colors relative"
              title="Notificações e Prazos"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl overflow-hidden z-50 text-xs">
                <div className="px-4 py-3 border-b border-[#263040] bg-[#161c26] flex items-center justify-between">
                  <div className="font-semibold text-[#f4efe3] flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#b8a47c]" />
                    Prazos e Alertas ({notificacoes.length})
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[#b8a47c] hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#1b222d]">
                  {notificacoes.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (item.link) navigate(item.link);
                      }}
                      className={`p-3 hover:bg-[#1b222d] cursor-pointer transition-colors ${
                        !item.lida ? 'bg-[#161c26]/60 border-l-2 border-[#b8a47c]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-[#f4efe3]">{item.titulo}</div>
                        {!item.lida && (
                          <span className="w-2 h-2 rounded-full bg-[#b8a47c] shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-[#545c6b] text-[11px] mt-1 leading-relaxed">
                        {item.mensagem}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 p-1.5 pl-2.5 rounded-lg bg-[#12171f] hover:bg-[#1b222d] border border-[#1b222d] transition-colors"
            >
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-[#f4efe3] leading-none">
                  {currentUser.nome}
                </span>
                <span className="text-[10px] text-[#b8a47c] mt-0.5 font-medium">
                  {currentUser.papelNome}
                </span>
              </div>
              <div
                className="w-8 h-8 rounded-full overflow-hidden border border-[#b8a47c]/50 bg-[#1b222d] flex items-center justify-center font-semibold text-xs"
                style={{ color: currentUser.corAgenda || '#b8a47c' }}
              >
                {currentUser.nome
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-4 py-3 border-b border-[#263040]">
                  <p className="font-semibold text-[#f4efe3]">{currentUser.nome}</p>
                  <p className="text-[11px] text-[#b8a47c] flex items-center gap-1 mt-0.5">
                    <Stethoscope className="w-3 h-3" />
                    {currentUser.papelNome}
                  </p>
                  <p className="text-[10px] text-[#545c6b] mt-1">
                    {currentUser.email} • {currentUser.crm || 'Colaborador(a)'}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/configuracoes?tab=equipe');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#1b222d] text-[#f4efe3] flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-[#545c6b]" />
                    Equipe & Permissões
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/configuracoes?tab=auditoria');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#1b222d] text-[#f4efe3] flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Logs de Auditoria (LGPD Art. 11)
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (confirm('Restaurar os dados fictícios originais (30 leads, 10 escritórios, 20 processos, papéis padrão, etc.)?')) {
                        resetAllDataToDefault();
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#1b222d] text-rose-300 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resetar Dados Fictícios
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
