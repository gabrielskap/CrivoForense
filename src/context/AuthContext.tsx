import React, { createContext, useContext, useEffect, useState } from 'react';
import { Usuario, Papel, ModuloSistema, AcaoPermissao } from '../types';
import { authService } from '../services/authService';
import { usuarioRepository } from '../services';

interface AuthContextType {
  currentUser: Usuario;
  currentRole: Papel;
  allUsers: Usuario[];
  switchUser: (userId: string) => Promise<void>;
  can: (modulo: ModuloSistema, acao: AcaoPermissao) => boolean;
  canAccessSensitiveHealthData: () => boolean;
  isOwnRecordsOnly: () => boolean;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario>(() => authService.getCurrentUser());
  const [currentRole, setCurrentRole] = useState<Papel>(() => authService.getCurrentRole());
  const [allUsers, setAllUsers] = useState<Usuario[]>([]);

  const loadUsers = async () => {
    const list = await usuarioRepository.getAll();
    setAllUsers(list);
  };

  useEffect(() => {
    loadUsers();
    const unsubscribe = authService.subscribe((user, role) => {
      setCurrentUser(user);
      setCurrentRole(role);
    });
    return unsubscribe;
  }, []);

  const handleSwitchUser = async (userId: string) => {
    await authService.switchUser(userId);
    await loadUsers();
  };

  const value: AuthContextType = {
    currentUser,
    currentRole,
    allUsers,
    switchUser: handleSwitchUser,
    can: (modulo, acao) => authService.can(modulo, acao),
    canAccessSensitiveHealthData: () => authService.canAccessSensitiveHealthData(),
    isOwnRecordsOnly: () => authService.isOwnRecordsOnly(),
    refreshUsers: loadUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};

// Componente para proteger botões e seções baseado em permissão
export const PermissionGate: React.FC<{
  modulo: ModuloSistema;
  acao: AcaoPermissao;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ modulo, acao, fallback = null, children }) => {
  const { can } = useAuth();
  if (!can(modulo, acao)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
