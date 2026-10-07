/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ModuloSistema } from './types';
import { ShieldAlert } from 'lucide-react';

import { DashboardView } from './views/DashboardView';
import { LeadsFunilView } from './views/LeadsFunilView';
import { ContatosView } from './views/ContatosView';
import { ProcessosPericiasView } from './views/ProcessosPericiasView';
import { TarefasView } from './views/TarefasView';
import { AgendaView } from './views/AgendaView';
import { ConversasView } from './views/ConversasView';
import { EmailView } from './views/EmailView';
import { ContratosDocumentosView } from './views/ContratosDocumentosView';
import { FinanceiroView } from './views/FinanceiroView';
import { ProspeccaoView } from './views/ProspeccaoView';
import { AutomacoesView } from './views/AutomacoesView';
import { SiteView } from './views/SiteView';
import { RelatoriosView } from './views/RelatoriosView';
import { ConfiguracoesView } from './views/ConfiguracoesView';

const ProtectedRoute: React.FC<{ modulo: ModuloSistema; children: React.ReactNode }> = ({ modulo, children }) => {
  const { can, currentUser } = useAuth();
  if (!can(modulo, 'ver')) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center bg-[#12171f] border border-[#263040] rounded-2xl shadow-xl space-y-4 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl text-[#f4efe3]">Acesso Não Autorizado (403)</h2>
        <p className="text-xs text-[#e8e1d0]/80 leading-relaxed">
          O perfil <strong className="text-[#b8a47c]">{currentUser.papelNome}</strong> associado a <strong>{currentUser.nome}</strong> não possui permissão para visualizar o módulo <strong>{modulo}</strong>.
        </p>
        <p className="text-[11px] text-[#545c6b]">
          Utilize a barra de simulação no topo para trocar para um perfil autorizado ou solicite permissão em <em>Configurações &gt; Equipe e Permissões</em>.
        </p>
      </div>
    );
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<ProtectedRoute modulo="dashboard"><DashboardView /></ProtectedRoute>} />
              <Route path="leads" element={<ProtectedRoute modulo="leads"><LeadsFunilView /></ProtectedRoute>} />
              <Route path="contatos" element={<ProtectedRoute modulo="contatos"><ContatosView /></ProtectedRoute>} />
              <Route path="processos" element={<ProtectedRoute modulo="processos"><ProcessosPericiasView /></ProtectedRoute>} />
              <Route path="tarefas" element={<ProtectedRoute modulo="tarefas"><TarefasView /></ProtectedRoute>} />
              <Route path="agenda" element={<ProtectedRoute modulo="agenda"><AgendaView /></ProtectedRoute>} />
              <Route path="conversas" element={<ProtectedRoute modulo="conversas"><ConversasView /></ProtectedRoute>} />
              <Route path="email" element={<ProtectedRoute modulo="email"><EmailView /></ProtectedRoute>} />
              <Route path="documentos" element={<ProtectedRoute modulo="documentos"><ContratosDocumentosView /></ProtectedRoute>} />
              <Route path="financeiro" element={<ProtectedRoute modulo="financeiro"><FinanceiroView /></ProtectedRoute>} />
              <Route path="prospeccao" element={<ProtectedRoute modulo="prospeccao"><ProspeccaoView /></ProtectedRoute>} />
              <Route path="automacoes" element={<ProtectedRoute modulo="automacoes"><AutomacoesView /></ProtectedRoute>} />
              <Route path="site" element={<ProtectedRoute modulo="site"><SiteView /></ProtectedRoute>} />
              <Route path="relatorios" element={<ProtectedRoute modulo="relatorios"><RelatoriosView /></ProtectedRoute>} />
              <Route path="configuracoes" element={<ProtectedRoute modulo="configuracoes"><ConfiguracoesView /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
