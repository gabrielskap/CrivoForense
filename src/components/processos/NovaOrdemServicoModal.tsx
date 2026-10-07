import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  Calendar,
  User,
  AlertTriangle,
  DollarSign,
  Clock,
} from 'lucide-react';
import { OrdemDeServico, TipoOrdemServico, Processo, Usuario } from '../../types';
import {
  ordemDeServicoRepository,
  usuarioRepository,
  processoRepository,
  auditLogRepository,
} from '../../services';
import { toIsoDate } from '../../utils/calculadoraPrazos';
import { formatProcesso } from '../../utils/formatters';

interface NovaOrdemServicoModalProps {
  onClose: () => void;
  onSuccess: (os: OrdemDeServico) => void;
  processoIdFixo?: string;
  osParaEditar?: OrdemDeServico;
}

const TIPOS_OS: { tipo: TipoOrdemServico; label: string; prazoPadraoDias: number }[] = [
  { tipo: 'Análise Documental & Viabilidade', label: 'Análise Documental & Parecer de Viabilidade', prazoPadraoDias: 5 },
  { tipo: 'Elaboração de Quesitos Iniciais', label: 'Elaboração de Quesitos Iniciais (Art. 465 § 1º do CPC)', prazoPadraoDias: 10 },
  { tipo: 'Acompanhamento de Perícia Presencial / Teleperícia', label: 'Acompanhamento de Perícia (Presencial ou Teleperícia)', prazoPadraoDias: 15 },
  { tipo: 'Parecer Técnico Pericial (Art. 477 §1º)', label: 'Parecer Técnico Divergente/Concordante (Art. 477 § 1º)', prazoPadraoDias: 15 },
  { tipo: 'Impugnação ao Laudo Pericial do Juízo', label: 'Impugnação Técnica ao Laudo Oficial do Perito', prazoPadraoDias: 12 },
  { tipo: 'Quesitos de Esclarecimento / Suplementares', label: 'Quesitos de Esclarecimento / Suplementares (Art. 477 § 2º)', prazoPadraoDias: 10 },
];

export const NovaOrdemServicoModal: React.FC<NovaOrdemServicoModalProps> = ({
  onClose,
  onSuccess,
  processoIdFixo,
  osParaEditar,
}) => {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [processoId, setProcessoId] = useState<string>(
    osParaEditar?.processoId || processoIdFixo || ''
  );
  const [tipo, setTipo] = useState<TipoOrdemServico>(
    osParaEditar?.tipo || 'Elaboração de Quesitos Iniciais'
  );
  const [titulo, setTitulo] = useState(
    osParaEditar?.titulo || 'Quesitos Iniciais - Art. 465 § 1º do CPC'
  );
  const [responsavelId, setResponsavelId] = useState(
    osParaEditar?.responsavelId || 'user_karine'
  );
  const [status, setStatus] = useState<OrdemDeServico['status']>(
    osParaEditar?.status || 'Em Andamento'
  );
  const [prioridade, setPrioridade] = useState<'Normal' | 'Urgente' | 'Crítica'>(
    osParaEditar?.prioridade || 'Urgente'
  );

  const hoje = toIsoDate(new Date());
  const dataPrevisaoInicial = new Date();
  dataPrevisaoInicial.setDate(dataPrevisaoInicial.getDate() + 10);

  const [dataInicio, setDataInicio] = useState(osParaEditar?.dataInicio || hoje);
  const [dataPrevisaoEntrega, setDataPrevisaoEntrega] = useState(
    osParaEditar?.dataPrevisaoEntrega || toIsoDate(dataPrevisaoInicial)
  );
  const [valor, setValor] = useState<number>(osParaEditar?.valor || 2500);
  const [anotacoes, setAnotacoes] = useState(osParaEditar?.anotacoes || '');

  useEffect(() => {
    Promise.all([processoRepository.getAll(), usuarioRepository.getAll()]).then(([p, u]) => {
      setProcessos(p);
      setUsuarios(u);
      if (!processoId && p.length > 0) setProcessoId(p[0].id);
    });
  }, []);

  const handleTipoChange = (novoTipo: TipoOrdemServico) => {
    setTipo(novoTipo);
    const item = TIPOS_OS.find((t) => t.tipo === novoTipo);
    if (item && !osParaEditar) {
      setTitulo(item.label);
      const novaData = new Date();
      novaData.setDate(novaData.getDate() + item.prazoPadraoDias);
      setDataPrevisaoEntrega(toIsoDate(novaData));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processoId) {
      alert('Selecione o processo vinculado à Ordem de Serviço.');
      return;
    }

    const novaOs: OrdemDeServico = {
      id: osParaEditar?.id || `os_${Date.now()}`,
      processoId,
      tipo,
      titulo,
      responsavelId,
      status,
      prioridade,
      dataInicio,
      dataPrevisaoEntrega,
      valor: Number(valor),
      anotacoes,
    };

    if (osParaEditar) {
      await ordemDeServicoRepository.update(osParaEditar.id, novaOs);
    } else {
      await ordemDeServicoRepository.create(novaOs);
    }

    const proc = processos.find((p) => p.id === processoId);

    await auditLogRepository.logAccess({
      acao: osParaEditar ? 'Edição de Ordem de Serviço' : 'Abertura de Ordem de Serviço',
      entidade: 'OrdemDeServico',
      entidadeId: novaOs.id,
      detalhes: `OS: ${novaOs.tipo} (${novaOs.titulo}) para ${proc?.numeroCnj || processoId}. Prazo: ${novaOs.dataPrevisaoEntrega}.`,
      isDadoSensivelSaude: false,
    });

    onSuccess(novaOs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#b8a47c]/15 border border-[#b8a47c]/40 text-[#b8a47c] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#b8a47c]" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#f4efe3]">
                {osParaEditar ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço Pericial'}
              </h2>
              <p className="text-xs text-[#545c6b]">
                Atribuição de trabalho pericial com responsável e prazo fatal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#e8e1d0]">
          {/* Processo Vinculado */}
          <div>
            <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
              Processo Judicial Vinculado:
            </label>
            <select
              value={processoId}
              onChange={(e) => setProcessoId(e.target.value)}
              disabled={!!processoIdFixo}
              className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
            >
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatProcesso(p.numeroCnj)} • {p.poloAtivo} vs {p.poloPassivo} ({p.vara})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de OS */}
          <div>
            <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
              Tipo de Atuação / Serviço Pericial:
            </label>
            <select
              value={tipo}
              onChange={(e) => handleTipoChange(e.target.value as TipoOrdemServico)}
              className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
            >
              {TIPOS_OS.map((item) => (
                <option key={item.tipo} value={item.tipo}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Título da OS */}
          <div>
            <label className="text-[11px] text-[#545c6b] block mb-1">Título / Especificação:</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
            />
          </div>

          {/* Responsável e Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Responsável Interno:</label>
              <select
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.papelNome})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Prioridade:</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Urgente">Urgente (Prazo Judicial)</option>
                <option value="Crítica">Crítica (Iminência de Preclusão)</option>
              </select>
            </div>
          </div>

          {/* Prazos e Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Data Início:</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#b8a47c] block mb-1 font-semibold">
                Prazo Fatal (Entrega):
              </label>
              <input
                type="date"
                value={dataPrevisaoEntrega}
                onChange={(e) => setDataPrevisaoEntrega(e.target.value)}
                className="w-full bg-[#161c26] border border-[#b8a47c]/50 rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="Aberta">Aberta</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Revisão Técnica">Revisão Técnica (Dra. Karine)</option>
                <option value="Finalizada">Finalizada / Protocolada</option>
              </select>
            </div>
          </div>

          {/* Valor e Anotações */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Valor do Serviço (R$):</label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#b8a47c] font-mono focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] text-[#545c6b] block mb-1">Instruções Técnicas:</label>
              <input
                type="text"
                placeholder="Ex: Focar na patologia do punho direito e literatura NIOSH"
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263040]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0] border border-[#263040] font-semibold text-xs hover:bg-[#232c3a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              {osParaEditar ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
