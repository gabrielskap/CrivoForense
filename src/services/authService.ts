// TODO: Firebase Auth - Integração pronta para substituição por Firebase Authentication (signInWithEmailAndPassword, onAuthStateChanged, etc.)

import { Usuario, Papel, ModuloSistema, AcaoPermissao } from '../types';
import { initialUsuarios, initialPapeis } from './localStorage/seedData';

export class PermissionDeniedError extends Error {
  modulo: ModuloSistema;
  acao: AcaoPermissao;

  constructor(modulo: ModuloSistema, acao: AcaoPermissao, message?: string) {
    super(message || `Acesso negado: Seu perfil não possui permissão para '${acao}' no módulo '${modulo}'.`);
    this.name = 'PermissionDeniedError';
    this.modulo = modulo;
    this.acao = acao;
  }
}

type AuthSubscriber = (user: Usuario, role: Papel) => void;

class AuthService {
  private currentUserId: string = 'user_karine';
  private subscribers: Set<AuthSubscriber> = new Set();

  constructor() {
    try {
      const savedUserId = localStorage.getItem('crivo_current_user_id');
      if (savedUserId) {
        this.currentUserId = savedUserId;
      }
    } catch {
      // LocalStorage indisponível, usa padrão
    }
  }

  getCurrentUser(): Usuario {
    try {
      const usersData = localStorage.getItem('crivo_crm_usuarios');
      const users: Usuario[] = usersData ? JSON.parse(usersData) : initialUsuarios;
      const found = users.find((u) => u.id === this.currentUserId);
      if (found && found.ativo) return found;
      return users[0] || initialUsuarios[0];
    } catch {
      return initialUsuarios[0];
    }
  }

  getCurrentRole(): Papel {
    const user = this.getCurrentUser();
    try {
      const rolesData = localStorage.getItem('crivo_crm_papeis');
      const roles: Papel[] = rolesData ? JSON.parse(rolesData) : initialPapeis;
      const found = roles.find((r) => r.id === user.papelId);
      if (found) return found;
      return roles[0] || initialPapeis[0];
    } catch {
      return initialPapeis[0];
    }
  }

  async switchUser(userId: string): Promise<Usuario> {
    this.currentUserId = userId;
    try {
      localStorage.setItem('crivo_current_user_id', userId);
    } catch (e) {
      console.warn('Erro ao salvar usuário atual no storage', e);
    }

    const user = this.getCurrentUser();
    const role = this.getCurrentRole();

    this.notify(user, role);
    return user;
  }

  can(modulo: ModuloSistema, acao: AcaoPermissao): boolean {
    const role = this.getCurrentRole();
    if (!role || !role.permissoes) return false;

    // Administrador tem acesso total
    if (role.id === 'role_admin') return true;

    const moduloPerm = role.permissoes[modulo];
    if (!moduloPerm) return false;

    return Boolean(moduloPerm[acao]);
  }

  canAccessSensitiveHealthData(): boolean {
    const role = this.getCurrentRole();
    if (role.id === 'role_admin') return true;
    return Boolean(role.acessarDadosSensiveisSaude);
  }

  isOwnRecordsOnly(): boolean {
    const role = this.getCurrentRole();
    return Boolean(role.verApenasSobMinhaResponsabilidade);
  }

  assertPermission(modulo: ModuloSistema, acao: AcaoPermissao): void {
    if (!this.can(modulo, acao)) {
      throw new PermissionDeniedError(modulo, acao);
    }
  }

  subscribe(callback: AuthSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getCurrentUser(), this.getCurrentRole());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(user: Usuario, role: Papel): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(user, role);
      } catch (err) {
        console.error('Erro no callback de auth', err);
      }
    });
  }

  // TODO: Firebase Auth - Implementar login real
  async loginSimulado(email: string): Promise<Usuario> {
    const usersData = localStorage.getItem('crivo_crm_usuarios');
    const users: Usuario[] = usersData ? JSON.parse(usersData) : initialUsuarios;
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return this.switchUser(user.id);
  }

  logout(): void {
    this.switchUser('user_karine');
  }
}

export const authService = new AuthService();
