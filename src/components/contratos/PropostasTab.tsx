import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Send,
  Trash2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Proposta, Oportunidade, Escritorio, Advogado, Processo, Servico, Periciando } from '../../types';
import { propostaRepository } from '../../services';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PropostaPdfModal } from './PropostaPdfModal';

interface PropostasTabProps {
  propostas: Proposta[];
  oportunidades: Oportunidade[];
  escritorios: Escritorio[];
  advogados: Advogado[];
  processos: Processo[];
  periciandos?: Periciando[];
  servicos: Servico[];
  onRefresh: () => void;
  onContratoGerado?: (contratoId: string) => void;
}

export const PropostasTab: React.FC<PropostasTabProps> = ({
  propostas,
  oportunidades,
  escritorios,
  advogados,
  processos,
  periciandos = [],
  servicos,
  onRefresh,
  onContratoGerado,
}) => {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [propostaPdfVisualizar, setPropostaPdfVisualizar] = useState<Proposta | null>(null);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);

  // Estados do formulário de nova proposta
  const [formOportunidadeId, setFormOportunidadeId] = useState('');
  const [formEscritorioId, setFormEscritorioId] = useState('');
  const [formAdvogadoId, setFormAdvogadoId] = useState('');
  const [formProcessoId, setFormProcessoId] = useState('');
  const [formPericiandoNome, setFormPericiandoNome] = useState('');
  const [formServicoSelecionadoId, setFormServicoSelecionadoId] = useState('');
  const [formItens, setFormItens] = useState<
    { servicoId: string; descricao: string; quantidade: number; valorUnitario: number; subtotal: number; prazoDiasUteis: number }[]
  >([]);
  const [formParcelas, setFormParcelas] = useState(2);
  const [formCondicoes, setFormCondicoes] = useState('50% na indicação e 50% após o protocolo');
  const [formValidadeDias, setFormValidadeDias] = useState(20);

  // Quando escolhe uma oportunidade, pré-preenche escritório, processo, etc.
  const handleSelecionarOportunidade = (opId: string) => {
    setFormOportunidadeId(opId);
    if (!opId) return;

    const op = oportunidades.find((o) => o.id === opId);
    if (op) {
      if (op.escritorioId) setFormEscritorioId(op.escritorioId);
      if (op.advogadoId) setFormAdvogadoId(op.advogadoId);

      // Tenta achar processo
      if (op.numeroProcesso) {
        const proc = processos.find((p) => p.numeroCnj === op.numeroProcesso);
        if (proc) {
          setFormProcessoId(proc.id);
          const per = periciandos.find((pe) => pe.id === proc.periciandoId);
          if (per) setFormPericiandoNome(per.nome);
          else if (proc.poloAtivo) setFormPericiandoNome(proc.poloAtivo);
        }
      }

      // Adiciona serviço padrão da oportunidade se houver
      const srvCorrespondente = servicos.find((s) =>
        s.nome.toLowerCase().includes(op.servicoInteresse.toLowerCase())
      ) || servicos[0];

      if (srvCorrespondente && formItens.length === 0) {
        adicionarServicoNaProposta(srvCorrespondente, op.escritorioId);
      }
    }
  };

  const adicionarServicoNaProposta = (srv: Servico, clienteId?: string) => {
    const cId = clienteId || formEscritorioId;
    // Checa se há preço negociado para o cliente
    let valorUnit = srv.valorBase;
    if (cId && srv.precosPorCliente) {
      const precoNeg = srv.precosPorCliente.find((p) => p.clienteId === cId);
      if (precoNeg) valorUnit = precoNeg.valorNegociado;
    }

    setFormItens((prev) => [
      ...prev,
      {
        servicoId: srv.id,
        descricao: srv.nome,
        quantidade: 1,
        valorUnitario: valorUnit,
        subtotal: valorUnit,
        prazoDiasUteis: srv.prazoPadraoDiasUteis || 5,
      },
    ]);
  };

  const removerItem = (index: number) => {
    setFormItens((prev) => prev.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return formItens.reduce((acc, it) => acc + it.subtotal, 0);
  };

  const handleCriarProposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEscritorioId || formItens.length === 0) return;

    const esc = escritorios.find((e) => e.id === formEscritorioId);
    const adv = advogados.find((a) => a.id === formAdvogadoId);
    const proc = processos.find((p) => p.id === formProcessoId);
    const op = oportunidades.find((o) => o.id === formOportunidadeId);

    const validade = new Date();
    validade.setDate(validade.getDate() + formValidadeDias);

    const novaProp = await propostaRepository.create({
      numeroProposta: `PROP-${new Date().getFullYear()}/${String(propostas.length + 1).padStart(3, '0')}`,
      oportunidadeId: op?.id,
      oportunidadeTitulo: op?.titulo,
      escritorioId: formEscritorioId,
      escritorioNome: esc ? (esc.nomeFantasia || esc.razaoSocial) : undefined,
      advogadoId: formAdvogadoId,
      advogadoNome: adv?.nome,
      advogadoOab: adv ? `OAB/${adv.oabUf} ${adv.oabNumero}` : undefined,
      processoId: proc?.id,
      processoNumero: proc?.numeroCnj,
      periciandoNome: formPericiandoNome || (proc ? periciandos.find((pe) => pe.id === proc.periciandoId)?.nome || proc.poloAtivo : undefined),
      itens: formItens.map((it) => ({
        servicoId: it.servicoId,
        descricao: it.descricao,
        quantidade: it.quantidade,
        valorUnitario: it.valorUnitario,
        subtotal: it.subtotal,
        prazoDiasUteis: it.prazoDiasUteis,
      })),
      valorTotal: calcularTotal(),
      parcelas: formParcelas,
      condicoesPagamento: formCondicoes,
      validadeAte: validade.toISOString().split('T')[0],
      dataCriacao: new Date().toISOString().split('T')[0],
      status: 'Rascunho',
    });

    setModalNovaAberto(false);
    setFormItens([]);
    setFeedbackSucesso(`Proposta ${novaProp.numeroProposta} criada com sucesso em status Rascunho.`);
    setTimeout(() => setFeedbackSucesso(null), 6000);
    onRefresh();
  };

  const handleAprovarProposta = async (propostaId: string) => {
    try {
      const res = await propostaRepository.aprovarProposta(propostaId);
      setFeedbackSucesso(
        `Proposta ${res.proposta.numeroProposta} ACEITA! Oportunidade convertida em Ganha e Contrato ${res.contrato.numeroContrato} gerado automaticamente.`
      );
      if (propostaPdfVisualizar?.id === propostaId) {
        setPropostaPdfVisualizar(null);
      }
      onRefresh();
      if (onContratoGerado) {
        onContratoGerado(res.contrato.id);
      }
    } catch (err: any) {
      console.error('Erro ao aprovar proposta:', err);
    }
  };

  const handleMudarStatus = async (propostaId: string, novoStatus: Proposta['status']) => {
    if (novoStatus === 'Aceita') {
      await handleAprovarProposta(propostaId);
      return;
    }
    await propostaRepository.update(propostaId, { status: novoStatus });
    onRefresh();
  };

  const propostasFiltradas = propostas.filter((p) => {
    const matchBusca =
      p.numeroProposta.toLowerCase().includes(busca.toLowerCase()) ||
      (p.escritorioNome && p.escritorioNome.toLowerCase().includes(busca.toLowerCase())) ||
      (p.advogadoNome && p.advogadoNome.toLowerCase().includes(busca.toLowerCase())) ||
      (p.processoNumero && p.processoNumero.toLowerCase().includes(busca.toLowerCase())) ||
      (p.periciandoNome && p.periciandoNome.toLowerCase().includes(busca.toLowerCase()));
    const matchStatus = statusFiltro === 'todos' || p.status === statusFiltro;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: Proposta['status']) => {
    switch (status) {
      case 'Aceita':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
      case 'Enviada':
        return 'bg-blue-950/40 text-blue-300 border-blue-800/40';
      case 'Rascunho':
        return 'bg-slate-800/50 text-slate-300 border-slate-700/50';
      case 'Recusada':
        return 'bg-red-950/40 text-red-300 border-red-800/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Feedback */}
      {feedbackSucesso && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedbackSucesso}</span>
          </div>
          <button onClick={() => setFeedbackSucesso(null)} className="text-emerald-400 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12171f] p-5 rounded-2xl border border-[#1b222d]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif text-[#f4efe3] font-semibold">
              Propostas Comerciais Periciais
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#b8a47c]/20 text-[#c7b692] border border-[#b8a47c]/30">
              {propostas.length} Propostas
            </span>
          </div>
          <p className="text-xs text-[#8c96a5] mt-1">
            Geradas a partir de oportunidades comerciais com serviços, honorários, condições e validade. Aceite automático gera o Contrato e marca a oportunidade como Ganha.
          </p>
        </div>

        <button
          onClick={() => {
            setFormItens([]);
            setFormOportunidadeId('');
            setFormEscritorioId('');
            setFormAdvogadoId('');
            setFormProcessoId('');
            setFormPericiandoNome('');
            setModalNovaAberto(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Proposta
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#545c6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número, escritório, patrono, processo ou periciando..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12171f] border border-[#1b222d] text-xs text-[#f4efe3] placeholder-[#545c6b] focus:border-[#b8a47c] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['todos', 'Rascunho', 'Enviada', 'Aceita', 'Recusada'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFiltro(st)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                statusFiltro === st
                  ? 'bg-[#b8a47c] text-[#0a0e14] font-semibold'
                  : 'bg-[#12171f] text-[#8c96a5] hover:text-[#f4efe3] border border-[#1b222d]'
              }`}
            >
              {st === 'todos' ? 'Todos os Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Propostas */}
      <div className="grid grid-cols-1 gap-4">
        {propostasFiltradas.map((prop) => {
          return (
            <div
              key={prop.id}
              className="p-5 rounded-2xl bg-[#12171f] border border-[#1b222d] hover:border-[#263040] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              {/* Info Principal */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#b8a47c] bg-[#1a222f] px-2.5 py-1 rounded-lg border border-[#263040]">
                    {prop.numeroProposta}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(
                      prop.status
                    )}`}
                  >
                    {prop.status}
                  </span>
                  {prop.contratoGeradoId && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-800/40">
                      Contrato Gerado
                    </span>
                  )}
                  <span className="text-[11px] text-[#545c6b] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Validade: {formatDate(prop.validadeAte)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">
                    {prop.escritorioNome || 'Escritório Parceiro'}
                  </h3>
                  <p className="text-xs text-[#8c96a5] mt-0.5">
                    {prop.advogadoNome && <span>Patrono: {prop.advogadoNome} • </span>}
                    {prop.processoNumero && <span>Autos: {prop.processoNumero} • </span>}
                    {prop.periciandoNome && <span>Periciando: {prop.periciandoNome}</span>}
                  </p>
                </div>

                {/* Serviços Inclusos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {prop.itens.map((it, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] bg-[#0b0e14] text-[#c7b692] border border-[#1b222d]"
                    >
                      {it.descricao} ({formatCurrency(it.subtotal)})
                    </span>
                  ))}
                </div>
              </div>

              {/* Valores & Ações */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-[#1b222d] pt-3 md:pt-0 md:pl-6 shrink-0 gap-3">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-[#545c6b] block">Valor Total</span>
                  <span className="font-serif text-lg font-bold text-[#f4efe3]">
                    {formatCurrency(prop.valorTotal)}
                  </span>
                  <span className="text-[10px] text-[#8c96a5] block">
                    {prop.parcelas}x • {prop.condicoesPagamento}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPropostaPdfVisualizar(prop)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a222f] text-[#c7b692] hover:bg-[#253042] text-xs font-semibold border border-[#263040] transition-colors"
                    title="Visualizar Proposta em PDF com identidade visual"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  {prop.status !== 'Aceita' && (
                    <button
                      onClick={() => handleAprovarProposta(prop.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      title="Aprovar proposta, marcar oportunidade como Ganha e gerar contrato"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Aceitar</span>
                    </button>
                  )}

                  {prop.status === 'Rascunho' && (
                    <button
                      onClick={() => handleMudarStatus(prop.id, 'Enviada')}
                      className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-950/30 transition-colors"
                      title="Marcar como Enviada"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação de Proposta */}
      {modalNovaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#12171f] border border-[#263040] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-[#1b222d] pb-4">
              <div>
                <h3 className="text-lg font-serif text-[#f4efe3] font-semibold">
                  Elaborar Nova Proposta Comercial
                </h3>
                <p className="text-xs text-[#8c96a5] mt-0.5">
                  Preencha os serviços e condições para gerar a proposta em PDF e vincular à oportunidade.
                </p>
              </div>
              <button
                onClick={() => setModalNovaAberto(false)}
                className="text-[#8c96a5] hover:text-[#f4efe3] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarProposta} className="space-y-4 text-xs">
              {/* Oportunidade (Opcional para autocompletar) */}
              <div className="p-3 rounded-xl bg-[#0b0e14] border border-[#1a222d] space-y-2">
                <label className="block text-[#b8a47c] font-semibold">
                  Vincular a uma Oportunidade do Funil Comercial (Opcional):
                </label>
                <select
                  value={formOportunidadeId}
                  onChange={(e) => handleSelecionarOportunidade(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#12171f] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                >
                  <option value="">Selecione uma oportunidade para pré-preencher...</option>
                  {oportunidades.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.titulo} (Valor: {formatCurrency(op.valorEstimado)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Partes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Escritório Contratante *</label>
                  <select
                    required
                    value={formEscritorioId}
                    onChange={(e) => setFormEscritorioId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    <option value="">Selecione o escritório...</option>
                    {escritorios.map((esc) => (
                      <option key={esc.id} value={esc.id}>
                        {esc.nomeFantasia || esc.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Advogado Patrono</label>
                  <select
                    value={formAdvogadoId}
                    onChange={(e) => setFormAdvogadoId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    <option value="">Selecione o advogado...</option>
                    {advogados
                      .filter((a) => !formEscritorioId || a.escritorioId === formEscritorioId)
                      .map((adv) => (
                        <option key={adv.id} value={adv.id}>
                          {adv.nome} ({adv.oabUf} {adv.oabNumero})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Processo Judicial</label>
                  <select
                    value={formProcessoId}
                    onChange={(e) => {
                      setFormProcessoId(e.target.value);
                      const p = processos.find((pr) => pr.id === e.target.value);
                      if (p) {
                        const per = periciandos.find((pe) => pe.id === p.periciandoId);
                        if (per) setFormPericiandoNome(per.nome);
                        else if (p.poloAtivo) setFormPericiandoNome(p.poloAtivo);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none font-mono text-[11px]"
                  >
                    <option value="">Vincular processo (opcional)...</option>
                    {processos.map((proc) => (
                      <option key={proc.id} value={proc.id}>
                        {proc.numeroCnj} ({proc.tribunal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Nome do Periciando</label>
                  <input
                    type="text"
                    value={formPericiandoNome}
                    onChange={(e) => setFormPericiandoNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  />
                </div>
              </div>

              {/* Seletor de Serviços para inclusão */}
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1a222d] space-y-3">
                <label className="block text-[#f4efe3] font-semibold">
                  Serviços Incluídos na Proposta:
                </label>

                <div className="flex gap-2">
                  <select
                    value={formServicoSelecionadoId}
                    onChange={(e) => setFormServicoSelecionadoId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#12171f] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    <option value="">Selecione um serviço do catálogo...</option>
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.area}) - Base: {formatCurrency(s.valorBase)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const s = servicos.find((srv) => srv.id === formServicoSelecionadoId);
                      if (s) {
                        adicionarServicoNaProposta(s);
                        setFormServicoSelecionadoId('');
                      }
                    }}
                    disabled={!formServicoSelecionadoId}
                    className="px-3.5 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold uppercase tracking-wider text-[11px] disabled:opacity-40"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Tabela de itens adicionados */}
                {formItens.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {formItens.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#12171f] border border-[#1b222d]"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-[#f4efe3]">{it.descricao}</p>
                          <span className="text-[10px] text-[#8c96a5]">
                            Prazo: {it.prazoDiasUteis} dias úteis
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-[#c7b692]">
                            {formatCurrency(it.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removerItem(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-2 border-t border-[#1b222d] font-semibold text-sm text-[#f4efe3]">
                      <span>Subtotal da Proposta:</span>
                      <span className="font-serif text-[#b8a47c] text-base">
                        {formatCurrency(calcularTotal())}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#545c6b] italic">
                    Nenhum serviço adicionado. Selecione no catálogo acima.
                  </p>
                )}
              </div>

              {/* Condições de Pagamento e Parcelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Número de Parcelas</label>
                  <select
                    value={formParcelas}
                    onChange={(e) => setFormParcelas(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    <option value={1}>1x (À Vista)</option>
                    <option value={2}>2x Parcelas</option>
                    <option value={3}>3x Parcelas</option>
                    <option value={4}>4x Parcelas</option>
                    <option value={5}>5x Parcelas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Validade da Proposta (Dias)</label>
                  <input
                    type="number"
                    min={5}
                    value={formValidadeDias}
                    onChange={(e) => setFormValidadeDias(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">Condições de Pagamento</label>
                <input
                  type="text"
                  value={formCondicoes}
                  onChange={(e) => setFormCondicoes(e.target.value)}
                  placeholder="Ex: Entrada de 50% via Pix + saldo após entrega do parecer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#1b222d] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovaAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1b222d] text-[#8c96a5] hover:text-[#f4efe3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formItens.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-semibold uppercase tracking-wider text-[11px] hover:bg-[#c7b692] transition-colors disabled:opacity-40"
                >
                  Criar Proposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Pré-visualização de Proposta em PDF */}
      <PropostaPdfModal
        proposta={propostaPdfVisualizar}
        onClose={() => setPropostaPdfVisualizar(null)}
        onAprovar={handleAprovarProposta}
      />
    </div>
  );
};
