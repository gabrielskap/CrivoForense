import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Stethoscope,
  Save,
} from 'lucide-react';
import { Documento, CronologiaClinicaItem } from '../../types';
import { gerarCronologiaClinicaComIA } from '../../services/geminiService';
import { documentoRepository } from '../../services';

interface CronologiaClinicaModalProps {
  documentosDisponiveis: Documento[];
  documentosPreSelecionados?: Documento[];
  onClose: () => void;
  onSalvo?: () => void;
}

export const CronologiaClinicaModal: React.FC<CronologiaClinicaModalProps> = ({
  documentosDisponiveis,
  documentosPreSelecionados,
  onClose,
  onSalvo,
}) => {
  const [selecionadosIds, setSelecionadosIds] = useState<string[]>(() => {
    if (documentosPreSelecionados && documentosPreSelecionados.length > 0) {
      return documentosPreSelecionados.map((d) => d.id);
    }
    // Seleciona prontuários e exames por padrão
    return documentosDisponiveis
      .filter((d) => ['prontuario', 'exame', 'laudo_oficial', 'Prontuário Médico', 'Exames Complementares'].includes(d.tipo))
      .slice(0, 4)
      .map((d) => d.id);
  });

  const [carregando, setCarregando] = useState(false);
  const [cronologia, setCronologia] = useState<CronologiaClinicaItem[]>([]);
  const [origemIA, setOrigemIA] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [salvandoDocumento, setSalvandoDocumento] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const toggleDocumento = (id: string) => {
    setSelecionadosIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleGerarCronologia = async () => {
    const docs = documentosDisponiveis.filter((d) => selecionadosIds.includes(d.id));
    if (docs.length === 0) return;

    setCarregando(true);
    setFeedback(null);
    try {
      const res = await gerarCronologiaClinicaComIA(docs);
      setCronologia(res.cronologia);
      setOrigemIA(
        res.origem === 'gemini_api'
          ? 'Processado por IA (Gemini 3.8 Flash)'
          : 'Processado por analisador pericial estruturado'
      );
    } catch (err: any) {
      console.error('Erro ao gerar cronologia:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleEditarCampo = (index: number, campo: keyof CronologiaClinicaItem, valor: string) => {
    setCronologia((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const handleAdicionarLinha = () => {
    const nova: CronologiaClinicaItem = {
      id: `crono_nova_${Date.now()}`,
      data: new Date().toLocaleDateString('pt-BR'),
      evento: 'Novo evento clínico documentado',
      cid: '',
      documentoOrigem: documentosDisponiveis[0]?.nomeArquivo || 'Prontuário',
      pagina: '1',
    };
    setCronologia((prev) => [...prev, nova]);
  };

  const handleRemoverLinha = (index: number) => {
    setCronologia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopiarTabela = () => {
    if (cronologia.length === 0) return;
    const header = 'Data\tEvento Clínico\tCID-10\tDocumento de Origem\tPágina\n';
    const rows = cronologia
      .map((c) => `${c.data}\t${c.evento}\t${c.cid || '-'}\t${c.documentoOrigem}\t${c.pagina}`)
      .join('\n');
    navigator.clipboard.writeText(header + rows);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleSalvarComoDocumento = async () => {
    if (cronologia.length === 0) return;
    setSalvandoDocumento(true);

    const docReferencia = documentosDisponiveis.find((d) => selecionadosIds.includes(d.id));

    const textoFormatado =
      `CRONOLOGIA CLÍNICA MÉDICO-PERICIAL CONSOLIDADA\n` +
      `[Rascunho gerado por IA — revisão médica obrigatória]\n\n` +
      cronologia
        .map(
          (c) =>
            `• ${c.data} | ${c.evento} ${c.cid ? `(CID ${c.cid})` : ''} - Fonte: ${c.documentoOrigem} (pág. ${c.pagina})`
        )
        .join('\n');

    await documentoRepository.create({
      nomeArquivo: `Cronologia_Clinica_Consolidada_${Date.now().toString().slice(-4)}.pdf`,
      tipo: 'parecer',
      processoId: docReferencia?.processoId,
      processoNumero: docReferencia?.processoNumero,
      periciandoId: docReferencia?.periciandoId,
      periciandoNome: docReferencia?.periciandoNome,
      clienteId: docReferencia?.clienteId,
      clienteNome: docReferencia?.clienteNome,
      tamanhoBytes: 420000,
      dataUpload: new Date().toISOString().split('T')[0],
      urlMock: 'https://crivoforense.com.br/docs/cronologia_clinica.pdf',
      autorNome: 'Dra. Karine Reis (IA Copilot)',
      versao: 1,
      sensivelSaude: true,
      paginas: Math.ceil(cronologia.length / 5),
      conteudoTexto: textoFormatado,
      cidMencionados: Array.from(new Set(cronologia.map((c) => c.cid).filter(Boolean) as string[])),
    });

    setSalvandoDocumento(false);
    setFeedback('Cronologia consolidada salva com sucesso no repositório documental!');
    setTimeout(() => setFeedback(null), 5000);
    if (onSalvo) onSalvo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#10141c] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 bg-[#141a24] border-b border-[#222b3a] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-600/40 flex items-center justify-center text-[#c7b692] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif text-[#f4efe3] font-semibold">
                  Cronologia Clínica com IA (Gemini)
                </h3>
                {origemIA && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#b8a47c]/20 text-[#c7b692] border border-[#b8a47c]/30">
                    {origemIA}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8c96a5] mt-0.5">
                Extração e ordenação temporal de eventos médicos, queixas, cirurgias e CIDs a partir dos prontuários selecionados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c96a5] hover:text-[#f4efe3] hover:bg-[#1a222f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AVISO FIXO E OBRIGATÓRIO (Exigência do Requisito) */}
        <div className="px-5 py-3 bg-amber-950/40 border-b border-amber-700/40 flex items-center justify-between text-amber-200 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold tracking-wide">
              Rascunho gerado por IA — revisão médica obrigatória
            </span>
          </div>
          <span className="text-[11px] text-amber-300/80 hidden sm:inline">
            CFM Res. 2.314/2022 • Responsabilidade técnica da médica perita
          </span>
        </div>

        {/* Feedback Bar */}
        {feedback && (
          <div className="px-5 py-2.5 bg-emerald-950/50 border-b border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Seletor de Documentos Médicos */}
          <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1a222d] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#f4efe3] flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-[#b8a47c]" />
                1. Selecione os documentos médicos para extração ({selecionadosIds.length} selecionados):
              </span>
              <button
                type="button"
                onClick={handleGerarCronologia}
                disabled={selecionadosIds.length === 0 || carregando}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm disabled:opacity-40"
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analisando Prontuários...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Cronologia Clínica</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {documentosDisponiveis.map((doc) => {
                const checked = selecionadosIds.includes(doc.id);
                return (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#1a222f] border-[#b8a47c]/60 text-[#f4efe3]'
                        : 'bg-[#12171f] border-[#1b222d] text-[#8c96a5] hover:border-[#263040]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDocumento(doc.id)}
                      className="mt-0.5 rounded accent-[#b8a47c]"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-xs truncate">{doc.nomeArquivo}</p>
                      <p className="text-[10px] text-[#545c6b] truncate">
                        {doc.tipo} • {doc.paginas || 1} pág(s)
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tabela Interativa de Cronologia */}
          {carregando ? (
            <div className="p-12 text-center space-y-4 bg-[#0b0e14] rounded-2xl border border-[#1a222d]">
              <Loader2 className="w-8 h-8 text-[#b8a47c] animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-sm text-[#f4efe3]">
                  Gemini analisando registros clínicos e exames de imagem...
                </p>
                <p className="text-xs text-[#8c96a5]">
                  Extraindo datas de atendimentos, procedimentos cirúrgicos, laudos e CIDs associados.
                </p>
              </div>
            </div>
          ) : cronologia.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-xs text-[#f4efe3]">
                  2. Linha do Tempo Clínica Estruturada ({cronologia.length} eventos identificados):
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAdicionarLinha}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a222f] text-[#c7b692] hover:bg-[#253042] text-[11px] font-semibold border border-[#263040]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Linha
                  </button>

                  <button
                    onClick={handleCopiarTabela}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a222f] text-[#f4efe3] hover:bg-[#253042] text-[11px] font-medium border border-[#263040]"
                    title="Copiar para área de transferência"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Tabela</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSalvarComoDocumento}
                    disabled={salvandoDocumento}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] text-[11px] font-semibold uppercase tracking-wider shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar no Processo</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Eventos */}
              <div className="overflow-x-auto rounded-xl border border-[#1b222d] bg-[#0b0e14]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#12171f] border-b border-[#1b222d] text-[#b8a47c] font-semibold">
                      <th className="py-2.5 px-3 w-28">Data</th>
                      <th className="py-2.5 px-3">Evento Clínico / Conduta</th>
                      <th className="py-2.5 px-3 w-24">CID-10</th>
                      <th className="py-2.5 px-3 w-52">Documento de Origem</th>
                      <th className="py-2.5 px-3 w-20 text-center">Página</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161c26]">
                    {cronologia.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-[#12171f]/50 transition-colors">
                        {/* Data */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.data}
                            onChange={(e) => handleEditarCampo(idx, 'data', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-[#12171f] border border-[#1b222d] text-[#f4efe3] font-mono text-[11px] focus:border-[#b8a47c] focus:outline-none"
                          />
                        </td>

                        {/* Evento */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.evento}
                            onChange={(e) => handleEditarCampo(idx, 'evento', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-[#12171f] border border-[#1b222d] text-[#f4efe3] text-xs focus:border-[#b8a47c] focus:outline-none"
                          />
                        </td>

                        {/* CID */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.cid || ''}
                            onChange={(e) => handleEditarCampo(idx, 'cid', e.target.value)}
                            placeholder="ex: M54.5"
                            className="w-full px-2 py-1 rounded bg-[#12171f] border border-[#1b222d] text-amber-300 font-mono text-[11px] uppercase focus:border-[#b8a47c] focus:outline-none"
                          />
                        </td>

                        {/* Documento Origem */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.documentoOrigem}
                            onChange={(e) =>
                              handleEditarCampo(idx, 'documentoOrigem', e.target.value)
                            }
                            className="w-full px-2 py-1 rounded bg-[#12171f] border border-[#1b222d] text-[#8c96a5] text-[11px] truncate focus:border-[#b8a47c] focus:outline-none"
                          />
                        </td>

                        {/* Página */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="text"
                            value={String(item.pagina)}
                            onChange={(e) => handleEditarCampo(idx, 'pagina', e.target.value)}
                            className="w-14 px-2 py-1 rounded bg-[#12171f] border border-[#1b222d] text-[#f4efe3] text-center font-mono text-[11px] focus:border-[#b8a47c] focus:outline-none mx-auto"
                          />
                        </td>

                        {/* Remover */}
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleRemoverLinha(idx)}
                            className="p-1 text-red-400 hover:text-red-300 rounded"
                            title="Remover linha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#0b0e14] rounded-2xl border border-[#1a222d] space-y-2 text-[#8c96a5]">
              <FileText className="w-8 h-8 mx-auto text-[#545c6b]" />
              <p className="font-medium text-xs text-[#f4efe3]">
                Nenhuma cronologia gerada ainda.
              </p>
              <p className="text-[11px]">
                Selecione os documentos médicos acima e clique em &ldquo;Gerar Cronologia Clínica&rdquo; para que o Gemini elabore a linha do tempo pericial.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
