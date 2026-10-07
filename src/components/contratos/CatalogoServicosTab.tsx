import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  Edit2,
  Trash2,
  Filter,
  Layers,
  Sparkles,
  FileText,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Servico, PrecoNegociadoCliente, Escritorio, AreaDireito } from '../../types';
import { servicoRepository } from '../../services';
import { formatCurrency } from '../../utils/formatters';

interface CatalogoServicosTabProps {
  servicos: Servico[];
  escritorios: Escritorio[];
  onRefresh: () => void;
  onCriarPropostaComServico?: (servico: Servico) => void;
}

export const CatalogoServicosTab: React.FC<CatalogoServicosTabProps> = ({
  servicos,
  escritorios,
  onRefresh,
  onCriarPropostaComServico,
}) => {
  const [busca, setBusca] = useState('');
  const [areaFiltro, setAreaFiltro] = useState<string>('todas');
  const [servicoEmEdicao, setServicoEmEdicao] = useState<Servico | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [servicoPrecoNegociado, setServicoPrecoNegociado] = useState<Servico | null>(null);

  // Estados para formulário de serviço
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formArea, setFormArea] = useState<AreaDireito>('Trabalhista');
  const [formValorBase, setFormValorBase] = useState<number>(1500);
  const [formFormaCobranca, setFormFormaCobranca] = useState<'Fixo' | 'Por Etapa' | 'Por Hora' | 'Mensal'>('Fixo');
  const [formPrazoDiasUteis, setFormPrazoDiasUteis] = useState<number>(5);
  const [formEntregaveis, setFormEntregaveis] = useState<string>('');

  // Estados para preço negociado
  const [negClienteId, setNegClienteId] = useState('');
  const [negValor, setNegValor] = useState<number>(1200);
  const [negCondicoes, setNegCondicoes] = useState('');

  const abrirModalCriacao = () => {
    setServicoEmEdicao(null);
    setFormNome('');
    setFormDescricao('');
    setFormArea('Trabalhista');
    setFormValorBase(1500);
    setFormFormaCobranca('Fixo');
    setFormPrazoDiasUteis(5);
    setFormEntregaveis('');
    setModalNovoAberto(true);
  };

  const abrirModalEdicao = (srv: Servico) => {
    setServicoEmEdicao(srv);
    setFormNome(srv.nome);
    setFormDescricao(srv.descricao);
    setFormArea(srv.area);
    setFormValorBase(srv.valorBase);
    setFormFormaCobranca(srv.formaCobranca);
    setFormPrazoDiasUteis(srv.prazoPadraoDiasUteis);
    setFormEntregaveis(srv.entregaveis.join('\n'));
    setModalNovoAberto(true);
  };

  const handleSalvarServico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    const entregaveisArray = formEntregaveis
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (servicoEmEdicao) {
      await servicoRepository.update(servicoEmEdicao.id, {
        nome: formNome,
        descricao: formDescricao,
        area: formArea,
        valorBase: Number(formValorBase),
        formaCobranca: formFormaCobranca,
        prazoPadraoDiasUteis: Number(formPrazoDiasUteis),
        entregaveis: entregaveisArray.length > 0 ? entregaveisArray : servicoEmEdicao.entregaveis,
      });
    } else {
      await servicoRepository.create({
        nome: formNome,
        descricao: formDescricao,
        area: formArea,
        valorBase: Number(formValorBase),
        formaCobranca: formFormaCobranca,
        prazoPadraoDiasUteis: Number(formPrazoDiasUteis),
        entregaveis:
          entregaveisArray.length > 0
            ? entregaveisArray
            : ['Relatório pericial assinado digitalmente', 'Análise de viabilidade'],
        ativo: true,
      });
    }

    setModalNovoAberto(false);
    onRefresh();
  };

  const handleSalvarPrecoNegociado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoPrecoNegociado || !negClienteId) return;

    const cliente = escritorios.find((esc) => esc.id === negClienteId);
    if (!cliente) return;

    const precosAtuais = servicoPrecoNegociado.precosPorCliente || [];
    const novoPreco: PrecoNegociadoCliente = {
      clienteId: cliente.id,
      clienteNome: cliente.nomeFantasia || cliente.razaoSocial,
      valorNegociado: Number(negValor),
      condicoes: negCondicoes || 'Tabela conveniada de parceiro',
      dataAcordo: new Date().toISOString().split('T')[0],
    };

    // Substitui se já existia ou adiciona novo
    const atualizados = precosAtuais.filter((p) => p.clienteId !== cliente.id).concat(novoPreco);

    await servicoRepository.update(servicoPrecoNegociado.id, {
      precosPorCliente: atualizados,
    });

    setServicoPrecoNegociado(null);
    setNegClienteId('');
    setNegCondicoes('');
    onRefresh();
  };

  const handleRemoverPrecoNegociado = async (servicoId: string, clienteId: string) => {
    const srv = servicos.find((s) => s.id === servicoId);
    if (!srv) return;
    const atualizados = (srv.precosPorCliente || []).filter((p) => p.clienteId !== clienteId);
    await servicoRepository.update(srv.id, { precosPorCliente: atualizados });
    onRefresh();
  };

  const areasUnicas = Array.from(new Set(servicos.map((s) => s.area)));

  const servicosFiltrados = servicos.filter((s) => {
    const matchBusca =
      s.nome.toLowerCase().includes(busca.toLowerCase()) ||
      s.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      s.entregaveis.some((e) => e.toLowerCase().includes(busca.toLowerCase()));
    const matchArea = areaFiltro === 'todas' || s.area === areaFiltro;
    return matchBusca && matchArea;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12171f] p-5 rounded-2xl border border-[#1b222d]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif text-[#f4efe3] font-semibold">
              Catálogo de Serviços Periciais & Honorários
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#b8a47c]/20 text-[#c7b692] border border-[#b8a47c]/30">
              {servicos.length} Especialidades
            </span>
          </div>
          <p className="text-xs text-[#8c96a5] mt-1">
            Preços-base, prazos padrão em dias úteis, entregáveis do CPC e tabelas de honorários negociadas por escritório conveniado.
          </p>
        </div>

        <button
          onClick={abrirModalCriacao}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#545c6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por serviço, entregável ou palavra-chave..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12171f] border border-[#1b222d] text-xs text-[#f4efe3] placeholder-[#545c6b] focus:border-[#b8a47c] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setAreaFiltro('todas')}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              areaFiltro === 'todas'
                ? 'bg-[#b8a47c] text-[#0a0e14] font-semibold'
                : 'bg-[#12171f] text-[#8c96a5] hover:text-[#f4efe3] border border-[#1b222d]'
            }`}
          >
            Todas as Áreas
          </button>
          {areasUnicas.map((area) => (
            <button
              key={area}
              onClick={() => setAreaFiltro(area)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                areaFiltro === area
                  ? 'bg-[#b8a47c] text-[#0a0e14] font-semibold'
                  : 'bg-[#12171f] text-[#8c96a5] hover:text-[#f4efe3] border border-[#1b222d]'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {servicosFiltrados.map((srv) => {
          const temNegociado = srv.precosPorCliente && srv.precosPorCliente.length > 0;

          return (
            <div
              key={srv.id}
              className="p-5 rounded-2xl bg-[#12171f] border border-[#1b222d] hover:border-[#2d394b] transition-all flex flex-col justify-between space-y-4 group shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1a222f] text-[#b8a47c] border border-[#2d394b]">
                    {srv.area}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#161c26] text-[#8c96a5] border border-[#222a38]">
                    {srv.formaCobranca}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#f4efe3] group-hover:text-[#c7b692] transition-colors">
                    {srv.nome}
                  </h3>
                  <p className="text-xs text-[#8c96a5] mt-1.5 line-clamp-3 leading-relaxed">
                    {srv.descricao}
                  </p>
                </div>

                {/* Preço e Prazo */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1b222d]/70 text-xs">
                  <div className="bg-[#0b0e14]/60 p-2.5 rounded-xl border border-[#1a222d]">
                    <span className="text-[10px] text-[#545c6b] block">Valor Base</span>
                    <span className="text-sm font-semibold text-[#f4efe3]">
                      {formatCurrency(srv.valorBase)}
                    </span>
                  </div>
                  <div className="bg-[#0b0e14]/60 p-2.5 rounded-xl border border-[#1a222d]">
                    <span className="text-[10px] text-[#545c6b] block">Prazo Padrão</span>
                    <div className="flex items-center gap-1 text-sm font-medium text-[#c7b692]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{srv.prazoPadraoDiasUteis} dias úteis</span>
                    </div>
                  </div>
                </div>

                {/* Entregáveis */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#545c6b] block">
                    Entregáveis do Serviço:
                  </span>
                  <ul className="space-y-1">
                    {srv.entregaveis.slice(0, 3).map((ent, idx) => (
                      <li key={idx} className="text-[11px] text-[#8c96a5] flex items-start gap-1.5">
                        <CheckCircle className="w-3 h-3 text-[#b8a47c] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{ent}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tabela de Preço Negociada por Cliente */}
                {temNegociado && (
                  <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Preços Negociados ({srv.precosPorCliente!.length}):
                      </span>
                    </div>
                    {srv.precosPorCliente!.map((neg) => (
                      <div
                        key={neg.clienteId}
                        className="flex items-center justify-between text-[11px] text-[#c7b692] bg-[#12171f]/80 px-2 py-1 rounded border border-amber-900/30"
                      >
                        <span className="truncate max-w-[130px] font-medium">{neg.clienteNome}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(neg.valorNegociado)}</span>
                          <button
                            onClick={() => handleRemoverPrecoNegociado(srv.id, neg.clienteId)}
                            className="text-red-400/70 hover:text-red-300 text-[10px]"
                            title="Remover preço negociado"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-[#1b222d] flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setServicoPrecoNegociado(srv);
                    setNegValor(Math.round(srv.valorBase * 0.85));
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#161c26] text-[#c7b692] hover:bg-[#1f2735] text-[11px] font-medium border border-[#222a38] flex items-center gap-1.5 transition-colors"
                  title="Configurar preço especial por cliente"
                >
                  <DollarSign className="w-3 h-3 text-[#b8a47c]" />
                  Negociar por Cliente
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => abrirModalEdicao(srv)}
                    className="p-1.5 rounded-lg text-[#8c96a5] hover:text-[#f4efe3] hover:bg-[#1a222f] transition-colors"
                    title="Editar serviço"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {onCriarPropostaComServico && (
                    <button
                      onClick={() => onCriarPropostaComServico(srv)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#b8a47c]/20 text-[#c7b692] hover:bg-[#b8a47c] hover:text-[#0a0e14] text-[11px] font-semibold border border-[#b8a47c]/30 flex items-center gap-1 transition-all"
                      title="Gerar Proposta com este serviço"
                    >
                      <span>Proposta</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição de Serviço */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#12171f] border border-[#263040] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-[#1b222d] pb-4">
              <h3 className="text-lg font-serif text-[#f4efe3] font-semibold">
                {servicoEmEdicao ? 'Editar Serviço Pericial' : 'Novo Serviço no Catálogo'}
              </h3>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="text-[#8c96a5] hover:text-[#f4efe3] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarServico} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Formulação de quesitos estratégicos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">Descrição Técnica *</label>
                <textarea
                  rows={3}
                  required
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Detalhamento do escopo, fundamentação no CPC e metodologia pericial..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Área de Atuação</label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value as AreaDireito)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    <option value="Trabalhista">Trabalhista</option>
                    <option value="Previdenciário">Previdenciário</option>
                    <option value="Cível / Erro Médico">Cível / Erro Médico</option>
                    <option value="Securitário / DPVAT">Securitário / DPVAT</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Forma de Cobrança</label>
                  <select
                    value={formFormaCobranca}
                    onChange={(e) => setFormFormaCobranca(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    <option value="Fixo">Fixo</option>
                    <option value="Por Etapa">Por Etapa</option>
                    <option value="Por Hora">Por Hora</option>
                    <option value="Mensal">Mensal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Valor Base (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    required
                    value={formValorBase}
                    onChange={(e) => setFormValorBase(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Prazo Padrão (Dias Úteis)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formPrazoDiasUteis}
                    onChange={(e) => setFormPrazoDiasUteis(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">
                  Entregáveis (1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={formEntregaveis}
                  onChange={(e) => setFormEntregaveis(e.target.value)}
                  placeholder="Petição de quesitos fundamentada&#10;Relatório de consistência médica&#10;Reunião de alinhamento"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none resize-none font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-[#1b222d] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1b222d] text-[#8c96a5] hover:text-[#f4efe3] font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-semibold uppercase tracking-wider text-[11px] hover:bg-[#c7b692] transition-colors"
                >
                  {servicoEmEdicao ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Preço Negociado por Cliente */}
      {servicoPrecoNegociado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#12171f] border border-[#263040] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1b222d] pb-4">
              <div>
                <h3 className="text-base font-serif text-[#f4efe3] font-semibold">
                  Tabela Negociada por Cliente
                </h3>
                <p className="text-xs text-[#b8a47c] mt-0.5 font-medium">
                  {servicoPrecoNegociado.nome}
                </p>
              </div>
              <button
                onClick={() => setServicoPrecoNegociado(null)}
                className="text-[#8c96a5] hover:text-[#f4efe3] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarPrecoNegociado} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">
                  Selecionar Escritório Parceiro / Cliente *
                </label>
                <select
                  required
                  value={negClienteId}
                  onChange={(e) => setNegClienteId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                >
                  <option value="">Selecione um cliente...</option>
                  {escritorios.map((esc) => (
                    <option key={esc.id} value={esc.id}>
                      {esc.nomeFantasia || esc.razaoSocial}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[#8c96a5] font-medium">Valor Negociado (R$) *</label>
                  <span className="text-[10px] text-[#545c6b]">
                    Valor base: {formatCurrency(servicoPrecoNegociado.valorBase)}
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  step={50}
                  required
                  value={negValor}
                  onChange={(e) => setNegValor(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">
                  Condições Especiais / Observações
                </label>
                <textarea
                  rows={2}
                  value={negCondicoes}
                  onChange={(e) => setNegCondicoes(e.target.value)}
                  placeholder="Ex: Válido para mínimo de 3 análises/mês ou pagamento pontual..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#1b222d] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setServicoPrecoNegociado(null)}
                  className="px-4 py-2 rounded-xl bg-[#1b222d] text-[#8c96a5] hover:text-[#f4efe3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-semibold text-[11px] uppercase tracking-wider hover:bg-[#c7b692] transition-colors"
                >
                  Salvar Tabela
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
