import { IRepository } from '../types';

export class LocalStorageRepository<T extends { id: string }> implements IRepository<T> {
  protected storageKey: string;
  protected defaultData: T[];

  constructor(storageKey: string, defaultData: T[] = []) {
    this.storageKey = `crivo_crm_v2_${storageKey}`;
    this.defaultData = defaultData;
    this.initialize();
  }

  protected initialize(): void {
    try {
      const existing = localStorage.getItem(this.storageKey);
      if (!existing) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.defaultData));
      }
    } catch (e) {
      console.warn(`Erro ao inicializar localStorage para ${this.storageKey}`, e);
    }
  }

  private read(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [...this.defaultData];
      return JSON.parse(data) as T[];
    } catch {
      return [...this.defaultData];
    }
  }

  private write(items: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (e) {
      console.error(`Erro ao salvar no localStorage para ${this.storageKey}`, e);
    }
  }

  async getAll(): Promise<T[]> {
    return this.read();
  }

  async getById(id: string): Promise<T | null> {
    const items = this.read();
    return items.find((i) => i.id === id) || null;
  }

  async create(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const items = this.read();
    const newItem = {
      ...item,
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    } as T;

    items.unshift(newItem);
    this.write(items);
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const items = this.read();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Item com ID ${id} não encontrado`);
    }

    const updated = { ...items[index], ...updates };
    items[index] = updated;
    this.write(items);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const items = this.read();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return false;
    this.write(filtered);
    return true;
  }

  async find(predicate: (item: T) => boolean): Promise<T[]> {
    const items = this.read();
    return items.filter(predicate);
  }

  // Utilidade para resetar para dados iniciais fictícios
  resetToDefault(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.defaultData));
  }
}
