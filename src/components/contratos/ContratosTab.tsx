import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  CheckCircle,
  Eye,
  Send,
  Edit3,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Contrato, ModeloContrato, Escritorio, Advogado, Processo, Servico } from '../../types';
import { contratoRepository, modeloContratoRepository } from '../../services';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { assinaturaAdapter, ProvedorAssinatura } from '../../integrations/assinatura';
import { ContratoPdfModal } from './ContratoPdfModal';

interface ContratosTabProps {
  contratos: Contrato[];
  modelos: ModeloContrato[];
  escritorios: Escritorio[];
  advogados: Advogado[];
  processos: Processo[];
  servicos: Servico[];
  onRefresh: () => void;
}

export const ContratosTab: React.FC<ContratosTabProps> = ({
  contratos,
  modelos,
  escritorios,
  advogados,
  processos,
  servicos,
  onRefresh,
}) => {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [contratoPdfVisualizar, setContratoPdfVisualizar] = useState<Contrato | null>(null);
  const [contratoEmEdicao, setContratoEmEdicao] = useState<Contrato | null>(null);
  const [contratoParaAssinatura, setContratoParaAssinatura] = useState<Contrato | null>(null);
  const [provedorSelecionado, setProvedorSelecionado] = useState<ProvedorAssinatura>('Clicksign');
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'info'; texto: string } | null>(null);

  // Estados do editor de minuta rich-text
  const [editorTexto, setEditorTexto] = useState('');

  // Variaveis disponíveis para inserção rápida
  const variaveisTemplate = [
    { tag: '{{escritorio.razao_social}}', label: 'Escritório' },
    { tag: '{{advogado.nome}}', label: 'Nome Advogado' },
    { tag: '{{advogado.oab}}', label: 'OAB Advogado' },
    { tag: '{{processo.numero}}', label: 'Nº Processo' },
    { tag: '{{servicos}}', label: 'Lista de Serviços' },
    { tag: '{{valor_total}}', label: 'Valor Total' },
    { tag: '{{parcelas}}', label: 'Parcelas' },
    { tag: '{{data}}', label: 'Data Extenso' },
  ];

  const abrirEditor = (c: Contrato) => {
    setContratoEmEdicao(c);
    setEditorTexto(c.corpoConteudo);
  };

  const inserirVariavel = (tag: string) => {
    setEditorTexto((prev) => prev + ' ' + tag);
  };

  const salvarEditor = async () => {
    if (!contratoEmEdicao) return;
    await contratoRepository.update(contratoEmEdicao.id, {
      corpoConteudo: editorTexto,
    });
    setContratoEmEdicao(null);
    setFeedbackMsg({ tipo: 'sucesso', texto: 'Minuta do contrato atualizada com sucesso.' });
    setTimeout(() => setFeedbackMsg(null), 5000);
    onRefresh();
  };

  // Envio para assinatura eletrônica
  const handleEnviarParaAssinatura = async () => {
    if (!contratoParaAssinatura) return;

    const res = await assinaturaAdapter.enviarContrato({
      contratoId: contratoParaAssinatura.id,
      tituloDocumento: `Contrato ${contratoParaAssinatura.numeroContrato}`,
      provedor: provedorSelecionado,
      signatarios: [
        {
          nome: contratoParaAssinatura.advogadoNome || contratoParaAssinatura.escritorioNome || 'Contratante',
          email: 'advogado@parceiro.com.br',
          papel: 'Contratante',
        },
        {
          nome: 'Dra. Karine Reis',
          email: 'karine@crivoforense.com.br',
          papel: 'Contratada',
        },
      ],
    });

    setContratoParaAssinatura(null);
    setFeedbackMsg({
      tipo: 'sucesso',
      texto: `Contrato enviado via ${provedorSelecionado}! Link simulado gerado: ${res.linkAssinatura}`,
    });
    setTimeout(() => setFeedbackMsg(null), 8000);
    onRefresh();
  };

  // Simular assinatura concluída via Webhook
  const handleSimularAssinaturaConcluida = async (contratoId: string, provedor: ProvedorAssinatura = 'Clicksign') => {
    try {
      const contratoAssinado = await assinaturaAdapter.simularWebhookAssinaturaConcluida(contratoId, provedor);
      setFeedbackMsg({
        tipo: 'sucesso',
        texto: `CONTRATO ASSINADO (${provedor})! Cobranças no Financeiro e Ordens de Serviço periciais foram geradas automaticamente.`,
      });
      if (contratoPdfVisualizar?.id === contratoId) {
        setContratoPdfVisualizar(null);
      }
      onRefresh();
    } catch (err: any) {
      console.error(err);
    }
  };

  const contratosFiltrados = contratos.filter((c) => {
    const matchBusca =
      c.numeroContrato.toLowerCase().includes(busca.toLowerCase()) ||
      (c.escritorioNome && c.escritorioNome.toLowerCase().includes(busca.toLowerCase())) ||
      (c.advogadoNome && c.advogadoNome.toLowerCase().includes(busca.toLowerCase())) ||
      (c.processoNumero && c.processoNumero.toLowerCase().includes(busca.toLowerCase())) ||
      c.objeto.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFiltro === 'todos' || c.status === statusFiltro;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: Contrato['status']) => {
    switch (status) {
      case 'Assinado':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
      case 'Enviado':
        return 'bg-blue-950/40 text-blue-300 border-blue-800/40';
      case 'Rascunho':
        return 'bg-slate-800/50 text-slate-300 border-slate-700/50';
      case 'Cancelado':
        return 'bg-red-950/40 text-red-300 border-red-800/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedbackMsg.texto}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12171f] p-5 rounded-2xl border border-[#1b222d]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif text-[#f4efe3] font-semibold">
              Contratos & Assinatura Eletrônica
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#b8a47c]/20 text-[#c7b692] border border-[#b8a47c]/30">
              {contratos.length} Instrumentos
            </span>
          </div>
          <p className="text-xs text-[#8c96a5] mt-1">
            Modelos com variáveis dinâmicas, editor de cláusulas, pré-visualização, assinatura digital via ZapSign, Clicksign ou D4Sign e automação contábil/operacional.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#545c6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número, escritório, patrono, processo ou objeto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12171f] border border-[#1b222d] text-xs text-[#f4efe3] placeholder-[#545c6b] focus:border-[#b8a47c] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['todos', 'Rascunho', 'Enviado', 'Assinado', 'Cancelado'] as const).map((st) => (
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

      {/* Lista de Contratos */}
      <div className="grid grid-cols-1 gap-4">
        {contratosFiltrados.map((ctr) => {
          return (
            <div
              key={ctr.id}
              className="p-5 rounded-2xl bg-[#12171f] border border-[#1b222d] hover:border-[#263040] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              {/* Informações */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#b8a47c] bg-[#1a222f] px-2.5 py-1 rounded-lg border border-[#263040]">
                    {ctr.numeroContrato}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(
                      ctr.status
                    )}`}
                  >
                    {ctr.status}
                  </span>
                  {ctr.provedorAssinatura && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#161c26] text-[#8c96a5] border border-[#222a38]">
                      {ctr.provedorAssinatura}
                    </span>
                  )}
                  {ctr.cobrancasGeradas && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                      Cobranças Geradas
                    </span>
                  )}
                  {ctr.ordensServicoGeradas && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950/40 text-blue-400 border border-blue-800/40">
                      O.S. Criadas
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">
                    {ctr.escritorioNome || 'Escritório Contratante'}
                  </h3>
                  <p className="text-xs text-[#8c96a5] mt-0.5">
                    {ctr.advogadoNome && <span>Patrono: {ctr.advogadoNome} • </span>}
                    {ctr.processoNumero && <span>Autos: {ctr.processoNumero} • </span>}
                    <span>Objeto: {ctr.objeto}</span>
                  </p>
                </div>

                {/* Serviços Contratados */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {ctr.servicos.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] bg-[#0b0e14] text-[#c7b692] border border-[#1b222d]"
                    >
                      {s.nome} ({formatCurrency(s.valor)})
                    </span>
                  ))}
                </div>
              </div>

              {/* Valores & Ações */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-[#1b222d] pt-3 md:pt-0 md:pl-6 shrink-0 gap-3">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-[#545c6b] block">Honorários Globais</span>
                  <span className="font-serif text-lg font-bold text-[#f4efe3]">
                    {formatCurrency(ctr.valorTotal)}
                  </span>
                  <span className="text-[10px] text-[#8c96a5] block">
                    {ctr.parcelas}x • {ctr.formaPagamento}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => abrirEditor(ctr)}
                    className="p-1.5 rounded-lg text-[#8c96a5] hover:text-[#f4efe3] hover:bg-[#1a222f] transition-colors"
                    title="Editar cláusulas / minuta do contrato"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setContratoPdfVisualizar(ctr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a222f] text-[#c7b692] hover:bg-[#253042] text-xs font-semibold border border-[#263040] transition-colors"
                    title="Pré-visualizar e imprimir contrato"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  {ctr.status !== 'Assinado' ? (
                    <button
                      onClick={() => setContratoParaAssinatura(ctr)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                      title="Disparar para assinatura digital (ZapSign/Clicksign/D4Sign)"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Assinar</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      Assinado
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Editor Rich-Text / Minuta */}
      {contratoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-[#12171f] border border-[#263040] rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b222d] pb-4">
              <div>
                <h3 className="text-lg font-serif text-[#f4efe3] font-semibold">
                  Editor de Minuta Contratual
                </h3>
                <p className="text-xs text-[#8c96a5] mt-0.5">
                  Contrato nº {contratoEmEdicao.numeroContrato} • Insira variáveis dinâmicas com 1 clique.
                </p>
              </div>
              <button
                onClick={() => setContratoEmEdicao(null)}
                className="text-[#8c96a5] hover:text-[#f4efe3] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Barra de Variáveis Rápidas */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b8a47c] block">
                Variáveis do Contrato (Clique para inserir na minuta):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {variaveisTemplate.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => inserirVariavel(v.tag)}
                    className="px-2 py-1 rounded bg-[#0b0e14] hover:bg-[#1a222f] text-[11px] font-mono text-[#c7b692] border border-[#1b222d] transition-colors"
                    title={`Inserir ${v.tag}`}
                  >
                    + {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de Texto */}
            <div>
              <textarea
                rows={16}
                value={editorTexto}
                onChange={(e) => setEditorTexto(e.target.value)}
                className="w-full p-4 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] text-xs font-mono leading-relaxed focus:border-[#b8a47c] focus:outline-none resize-none"
              />
            </div>

            <div className="pt-3 border-t border-[#1b222d] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setContratoEmEdicao(null)}
                className="px-4 py-2.5 rounded-xl bg-[#1b222d] text-[#8c96a5] hover:text-[#f4efe3] text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarEditor}
                className="px-5 py-2.5 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-semibold uppercase tracking-wider text-[11px] hover:bg-[#c7b692] transition-colors"
              >
                Salvar Alterações na Minuta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Disparo de Assinatura Eletrônica (ZapSign / Clicksign / D4Sign) */}
      {contratoParaAssinatura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#12171f] border border-[#263040] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1b222d] pb-4">
              <div>
                <h3 className="text-base font-serif text-[#f4efe3] font-semibold">
                  Enviar para Assinatura Digital
                </h3>
                <p className="text-xs text-[#8c96a5] mt-0.5">
                  {contratoParaAssinatura.numeroContrato} • {contratoParaAssinatura.escritorioNome}
                </p>
              </div>
              <button
                onClick={() => setContratoParaAssinatura(null)}
                className="text-[#8c96a5] hover:text-[#f4efe3] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8c96a5] mb-2 font-medium">
                  Selecione o Provedor de Assinatura Eletrônica:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Clicksign', 'ZapSign', 'D4Sign'] as ProvedorAssinatura[]).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setProvedorSelecionado(prov)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        provedorSelecionado === prov
                          ? 'bg-[#b8a47c]/20 border-[#b8a47c] text-[#c7b692] font-semibold'
                          : 'bg-[#0b0e14] border-[#1b222d] text-[#8c96a5] hover:border-[#263040]'
                      }`}
                    >
                      <span className="block text-xs">{prov}</span>
                      <span className="text-[9px] text-[#545c6b] block mt-0.5">Integrado</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0e14] border border-[#1a222d] space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#786b53] block">
                  Signatários que receberão o link de assinatura:
                </span>
                <p className="text-[#f4efe3]">
                  1. {contratoParaAssinatura.advogadoNome || contratoParaAssinatura.escritorioNome} (Contratante)
                </p>
                <p className="text-[#f4efe3]">2. Dra. Karine Reis (Contratada)</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-300">
                ⚡ <strong>Automação Pós-Assinatura:</strong> Quando o contrato for assinado pelo cliente, o Crivo CRM gerará automaticamente as parcelas no Financeiro e as Ordens de Serviço periciais da equipe.
              </div>

              <div className="pt-3 border-t border-[#1b222d] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSimularAssinaturaConcluida(contratoParaAssinatura.id, provedorSelecionado)}
                  className="px-3 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-[11px] transition-colors"
                  title="Simular que o cliente acabou de assinar o documento via Webhook"
                >
                  ⚡ Simular Assinatura Imediata
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setContratoParaAssinatura(null)}
                    className="px-3 py-2 rounded-xl bg-[#1b222d] text-[#8c96a5] hover:text-[#f4efe3]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleEnviarParaAssinatura}
                    className="px-4 py-2 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-semibold text-[11px] uppercase tracking-wider hover:bg-[#c7b692] transition-colors"
                  >
                    Disparar Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pré-visualização de Contrato em PDF */}
      <ContratoPdfModal
        contrato={contratoPdfVisualizar}
        onClose={() => setContratoPdfVisualizar(null)}
        onAssinar={(id) => handleSimularAssinaturaConcluida(id, 'Clicksign')}
      />
    </div>
  );
};
