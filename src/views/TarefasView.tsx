import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';
import { tarefaRepository, processoRepository } from '../services';
import { Tarefa, Processo } from '../types';
import { formatDate, formatProcesso } from '../utils/formatters';

export const TarefasView: React.FC = () => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoPrioridade, setNovoPrioridade] = useState<Tarefa['prioridade']>('Alta');
  const [novoDataLimite, setNovoDataLimite] = useState('');
  const [novoProcessoId, setNovoProcessoId] = useState('');

  const loadData = () => {
    Promise.all([tarefaRepository.getAll(), processoRepository.getAll()]).then(
      ([t, p]) => {
        setTarefas(t);
        setProcessos(p);
      }
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (tarefa: Tarefa) => {
    const novoStatus = tarefa.status === 'Concluída' ? 'A Fazer' : 'Concluída';
    await tarefaRepository.update(tarefa.id, { status: novoStatus });
    loadData();
  };

  const handleCreateTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    await tarefaRepository.create({
      titulo: novoTitulo,
      descricao: novoDescricao,
      prioridade: novoPrioridade,
      status: 'A Fazer',
      dataLimite: novoDataLimite || new Date().toISOString().split('T')[0],
      responsavelId: 'user_karine',
      processoId: novoProcessoId || undefined,
    });

    setIsModalOpen(false);
    setNovoTitulo('');
    setNovoDescricao('');
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Tarefas & Prazos Periciais
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Controle de prazos fatais para quesitos, pareceres técnicos e impugnações.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa / Prazo
        </button>
      </div>

      {/* Grid of Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarefas.map((tar) => {
          const proc = processos.find((p) => p.id === tar.processoId);
          const isConcluida = tar.status === 'Concluída';
          const isFatal = tar.prioridade === 'Urgente / Prazo Fatal';

          return (
            <div
              key={tar.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                isConcluida
                  ? 'bg-[#12171f]/50 border-[#1b222d] opacity-60'
                  : isFatal
                  ? 'bg-[#161c26] border-amber-800/40 shadow-sm'
                  : 'bg-[#12171f] border-[#1b222d]'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      isFatal
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                        : tar.prioridade === 'Alta'
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                        : 'bg-[#1b222d] text-[#545c6b] border-[#263040]'
                    }`}
                  >
                    {tar.prioridade}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(tar)}
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors ${
                      isConcluida
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        : 'bg-[#1b222d] text-[#545c6b] border-[#263040] hover:text-[#f4efe3]'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {isConcluida ? 'Concluída' : 'Marcar Feita'}
                  </button>
                </div>

                <h3
                  className={`text-sm font-semibold leading-snug ${
                    isConcluida ? 'line-through text-[#545c6b]' : 'text-[#f4efe3]'
                  }`}
                >
                  {tar.titulo}
                </h3>

                <p className="text-xs text-[#545c6b] leading-relaxed">
                  {tar.descricao}
                </p>

                {proc && (
                  <div className="p-2 rounded bg-[#1b222d] text-[11px] font-mono text-[#5b9cd9] truncate">
                    {formatProcesso(proc.numeroCnj)}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#1b222d] mt-3 flex items-center justify-between text-xs text-[#545c6b]">
                <span className="flex items-center gap-1 text-amber-300">
                  <Clock className="w-3 h-3 text-[#b8a47c]" />
                  Prazo: {formatDate(tar.dataLimite)}
                </span>
                <span className="text-[#b8a47c]">{tar.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nova Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#263040] pb-3">
              <h2 className="font-serif text-lg text-[#f4efe3]">Nova Tarefa / Prazo Processual</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#545c6b] hover:text-[#f4efe3]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTarefa} className="space-y-3">
              <div>
                <label className="block text-[#545c6b] mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Formular quesitos sobre cirurgia plástica"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1">Prioridade</label>
                  <select
                    value={novoPrioridade}
                    onChange={(e) => setNovoPrioridade(e.target.value as any)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente / Prazo Fatal">Urgente / Prazo Fatal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#545c6b] mb-1">Data Limite</label>
                  <input
                    type="date"
                    value={novoDataLimite}
                    onChange={(e) => setNovoDataLimite(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#545c6b] mb-1">Vincular a Processo Judicial (Opcional)</label>
                <select
                  value={novoProcessoId}
                  onChange={(e) => setNovoProcessoId(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                >
                  <option value="">Nenhum processo</option>
                  {processos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numeroCnj} - {p.poloAtivo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#545c6b] mb-1">Descrição Detalhada</label>
                <textarea
                  rows={3}
                  placeholder="Instruções técnicas periciais..."
                  value={novoDescricao}
                  onChange={(e) => setNovoDescricao(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#263040]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
