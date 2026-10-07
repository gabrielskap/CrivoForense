import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Filter,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  MessageSquare,
  Mail,
  FileText,
  DollarSign,
  Compass,
  Cpu,
  Globe,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ModuloSistema } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { can } = useAuth();

  const menuItems: {
    label: string;
    path: string;
    icon: any;
    modulo: ModuloSistema;
    badge?: string;
    sub?: string;
  }[] = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, modulo: 'dashboard' },
    { label: 'Leads & Funil', path: '/leads', icon: Filter, modulo: 'leads', badge: '30' },
    { label: 'Contatos', path: '/contatos', icon: Users, modulo: 'contatos', sub: 'Escritórios, Adv., Periciandos' },
    { label: 'Processos & Perícias', path: '/processos', icon: Briefcase, modulo: 'processos', badge: '20' },
    { label: 'Tarefas', path: '/tarefas', icon: CheckSquare, modulo: 'tarefas', badge: '4' },
    { label: 'Agenda', path: '/agenda', icon: Calendar, modulo: 'agenda' },
    { label: 'Conversas', path: '/conversas', icon: MessageSquare, modulo: 'conversas', badge: 'WA' },
    { label: 'E-mail', path: '/email', icon: Mail, modulo: 'email' },
    { label: 'Contratos & Documentos', path: '/documentos', icon: FileText, modulo: 'documentos' },
    { label: 'Financeiro', path: '/financeiro', icon: DollarSign, modulo: 'financeiro' },
    { label: 'Prospecção', path: '/prospeccao', icon: Compass, modulo: 'prospeccao' },
    { label: 'Automações', path: '/automacoes', icon: Cpu, modulo: 'automacoes' },
    { label: 'Site & Formulários', path: '/site', icon: Globe, modulo: 'site' },
    { label: 'Relatórios', path: '/relatorios', icon: BarChart3, modulo: 'relatorios' },
    { label: 'Configurações', path: '/configuracoes', icon: Settings, modulo: 'configuracoes' },
  ];

  const visibleMenuItems = menuItems.filter((item) => can(item.modulo, 'ver'));

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out border-r
      ${collapsed ? 'w-20' : 'w-64'}
      bg-[#0a0e14] dark:bg-[#0a0e14] border-[#1b222d] text-[#e8e1d0]`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-[#1b222d] bg-[#12171f]">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#b8a47c]/15 border border-[#b8a47c]/40 text-[#b8a47c] shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#b8a47c]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-lg tracking-wider text-[#f4efe3] font-semibold truncate leading-tight">
                CRIVO FORENSE
              </span>
              <span className="text-[11px] text-[#b8a47c] font-medium tracking-wide flex items-center gap-1">
                <Stethoscope className="w-3 h-3 inline text-[#b8a47c]" />
                Dra. Karine Reis
              </span>
              <span className="text-[9px] text-[#545c6b] truncate">
                CRM/SP 235.821 • CRM/TO 6.385
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="p-1.5 rounded-md text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                ${
                  isActive
                    ? 'bg-[#1b222d] text-[#b8a47c] border-l-2 border-[#b8a47c] shadow-sm'
                    : 'text-[#e8e1d0]/80 hover:text-[#f4efe3] hover:bg-[#12171f]'
                } ${collapsed ? 'justify-center' : 'justify-between'}`
              }
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors group-hover:text-[#b8a47c]`}
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!collapsed && item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#1b222d] text-[#b8a47c] border border-[#b8a47c]/30">
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#12171f] text-[#f4efe3] text-xs rounded-md shadow-xl border border-[#1b222d] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Mode Badge & Medical Scope */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-3 rounded-lg bg-[#12171f] border border-[#1b222d] text-xs">
          <div className="flex items-center gap-1.5 text-[#b8a47c] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Atuação Pericial Ativa
          </div>
          <p className="text-[11px] text-[#545c6b] leading-relaxed">
            Assistência Técnica & Perita Nomeada nos Tribunais (TRF-3, TJSP, TRT-2, TJTO).
          </p>
        </div>
      )}
    </aside>
  );
};
