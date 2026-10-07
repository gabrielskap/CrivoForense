import React, { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import { Pericia, Processo, Periciando, StatusPericia, ResultadoPericia } from '../../types';
import {
  periciaRepository,
  processoRepository,
  periciandoRepository,
  auditLogRepository,
} from '../../services';
import { formatProcesso } from '../../utils/formatters';

interface NovaPericiaModalProps {
  onClose: () => void;
  onSuccess: (pericia: Pericia) => void;
  processoIdFixo?: string;
  periciaParaEditar?: Pericia;
}

export const NovaPericiaModal: React.FC<NovaPericiaModalProps> = ({
  onClose,
  onSuccess,
  processoIdFixo,
  periciaParaEditar,
}) => {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [periciandos, setPericiandos] = useState<Periciando[]>([]);

  const [processoId, setProcessoId] = useState<string>(
    periciaParaEditar?.processoId || processoIdFixo || ''
  );
  const [periciandoId, setPericiandoId] = useState<string>(
    periciaParaEditar?.periciandoId || ''
  );
  const [formato, setFormato] = useState<'Presencial' | 'On-line / Teleperícia'>(
    periciaParaEditar?.formatoAtendimento || 'Presencial'
  );
  const [dataHora, setDataHora] = useState(
    periciaParaEditar?.dataHora
      ? periciaParaEditar.dataHora.slice(0, 16)
      : '2026-10-25T14:00'
  );
  const [local, setLocal] = useState(
    periciaParaEditar?.local ||
      'Consultório Pericial Oficial do Juízo - Rua Vergueiro, 1600, Paraíso, São Paulo/SP'
  );
  const [linkVideochamada, setLinkVideochamada] = useState(
    periciaParaEditar?.linkVideochamada || ''
  );
  const [cidade, setCidade] = useState(periciaParaEditar?.cidade || 'São Paulo');
  const [uf, setUf] = useState(periciaParaEditar?.uf || 'SP');
  const [tipoLocal, setTipoLocal] = useState(
    periciaParaEditar?.tipoLocal || 'Consultório Médico'
  );
  const [peritoJuizoNome, setPeritoJuizoNome] = useState(
    periciaParaEditar?.peritoJuizoNome || ''
  );
  const [comparecimentoAssistente, setComparecimentoAssistente] = useState(
    periciaParaEditar?.comparecimentoAssistente ?? true
  );
  const [status, setStatus] = useState<StatusPericia>(
    periciaParaEditar?.status || 'Agendada'
  );
  const [resultado, setResultado] = useState<ResultadoPericia>(
    periciaParaEditar?.resultado || 'Aguardando Sentença'
  );
  const [observacoes, setObservacoes] = useState(periciaParaEditar?.observacoes || '');

  // Checklist de Preparação
  const [checklistDocs, setChecklistDocs] = useState(
    periciaParaEditar?.checklist?.documentosRevisados ?? true
  );
  const [checklistQuesitos, setChecklistQuesitos] = useState(
    periciaParaEditar?.checklist?.quesitosProtocolados ?? true
  );
  const [checklistDeslocamento, setChecklistDeslocamento] = useState(
    periciaParaEditar?.checklist?.deslocamentoConfirmado ?? false
  );
  const [checklistPericiando, setChecklistPericiando] = useState(
    periciaParaEditar?.checklist?.periciandoOrientado ?? true
  );
  const [checklistKit, setChecklistKit] = useState(
    periciaParaEditar?.checklist?.kitExamePreparado ?? true
  );

  useEffect(() => {
    Promise.all([processoRepository.getAll(), periciandoRepository.getAll()]).then(([pr, pe]) => {
      setProcessos(pr);
      setPericiandos(pe);
      if (!processoId && pr.length > 0) {
        setProcessoId(pr[0].id);
        setPericiandoId(pr[0].periciandoId);
        setPeritoJuizoNome(pr[0].peritoJuizoNome || '');
      }
    });
  }, []);

  const handleProcessoChange = (id: string) => {
    setProcessoId(id);
    const proc = processos.find((p) => p.id === id);
    if (proc) {
      setPericiandoId(proc.periciandoId);
      if (proc.peritoJuizoNome) setPeritoJuizoNome(proc.peritoJuizoNome);
      setCidade(proc.comarca);
      setUf(proc.uf || 'SP');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processoId) return;

    const proc = processos.find((p) => p.id === processoId);

    const novaPericia: Pericia = {
      id: periciaParaEditar?.id || `peri_${Date.now()}`,
      processoId,
      periciandoId: periciandoId || proc?.periciandoId || 'per_1',
      modalidade: proc?.modalidadeAtuacao || 'Assistente Técnica',
      formatoAtendimento: formato,
      dataHora: `${dataHora}:00Z`,
      local: formato === 'Presencial' ? local : 'Teleperícia Online',
      linkVideochamada: formato === 'On-line / Teleperícia' ? linkVideochamada : undefined,
      tipoLocal: formato === 'On-line / Teleperícia' ? 'Teleperícia' : (tipoLocal as any),
      cidade,
      uf,
      peritoJuizoNome,
      comparecimentoAssistente,
      checklist: {
        documentosRevisados: checklistDocs,
        quesitosProtocolados: checklistQuesitos,
        deslocamentoConfirmado: checklistDeslocamento,
        periciandoOrientado: checklistPericiando,
        kitExamePreparado: checklistKit,
      },
      status,
      resultado,
      quesitosEnviados: checklistQuesitos,
      acompanhamentoPresencial: comparecimentoAssistente,
      parecerEmitido: status === 'Concluída',
      observacoes,
    };

    if (periciaParaEditar) {
      await periciaRepository.update(periciaParaEditar.id, novaPericia);
    } else {
      await periciaRepository.create(novaPericia);
    }

    await auditLogRepository.logAccess({
      acao: periciaParaEditar ? 'Edição de Perícia Médica' : 'Agendamento de Perícia Médica',
      entidade: 'Pericia',
      entidadeId: novaPericia.id,
      detalhes: `Perícia marcada para ${novaPericia.dataHora} no processo ${proc?.numeroCnj}. Formato: ${formato}. Status: ${status}.`,
      isDadoSensivelSaude: false,
    });

    onSuccess(novaPericia);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#b8a47c]/15 border border-[#b8a47c]/40 text-[#b8a47c] flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-[#b8a47c]" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#f4efe3]">
                {periciaParaEditar ? 'Editar Perícia Médica' : 'Agendar Nova Perícia Médica'}
              </h2>
              <p className="text-xs text-[#545c6b]">
                Data/hora, endereço/link, checklist de preparação e resultado.
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-[#e8e1d0]">
          {/* Processo Vinculado */}
          <div>
            <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
              Processo Judicial:
            </label>
            <select
              value={processoId}
              onChange={(e) => handleProcessoChange(e.target.value)}
              disabled={!!processoIdFixo}
              className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
            >
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatProcesso(p.numeroCnj)} • {p.poloAtivo} vs {p.poloPassivo}
                </option>
              ))}
            </select>
          </div>

          {/* Formato, Data/Hora e Comparecimento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
                Formato de Exame:
              </label>
              <select
                value={formato}
                onChange={(e) => setFormato(e.target.value as any)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="Presencial">Presencial (Consultório/Vara)</option>
                <option value="On-line / Teleperícia">On-line (Teleperícia / PJe)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
                Data e Horário:
              </label>
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                required
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
                Assistente Dra. Karine:
              </label>
              <select
                value={comparecimentoAssistente ? 'sim' : 'nao'}
                onChange={(e) => setComparecimentoAssistente(e.target.value === 'sim')}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="sim">Sim, comparecerá ao exame</option>
                <option value="nao">Não (Apenas análise documental)</option>
              </select>
            </div>
          </div>

          {/* Endereço ou Link */}
          {formato === 'Presencial' ? (
            <div className="space-y-3 p-3.5 rounded-xl bg-[#161c26] border border-[#263040]">
              <div>
                <label className="text-[11px] text-[#545c6b] block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#b8a47c]" /> Endereço Completo do Exame:
                </label>
                <input
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  required
                  placeholder="Rua, número, bairro, sala do consultório pericial"
                  className="w-full bg-[#12171f] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#545c6b] block">Tipo de Local:</label>
                  <select
                    value={tipoLocal}
                    onChange={(e) => setTipoLocal(e.target.value as any)}
                    className="w-full bg-[#12171f] border border-[#263040] rounded p-1.5 text-xs text-[#f4efe3]"
                  >
                    <option value="Consultório Médico">Consultório Médico</option>
                    <option value="Clínica Dra. Karine">Clínica Dra. Karine</option>
                    <option value="Fórum / Vara">Fórum / Vara Judicial</option>
                    <option value="Posto INSS">Posto INSS</option>
                    <option value="Empresa (In Loco)">Empresa (Vistoria In Loco)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#545c6b] block">Cidade:</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full bg-[#12171f] border border-[#263040] rounded p-1.5 text-xs text-[#f4efe3]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#545c6b] block">UF:</label>
                  <input
                    type="text"
                    value={uf}
                    maxLength={2}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    className="w-full bg-[#12171f] border border-[#263040] rounded p-1.5 text-xs text-[#f4efe3] uppercase"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#161c26] border border-[#263040] space-y-2">
              <label className="text-[11px] text-[#545c6b] block flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-[#5b9cd9]" /> Link da Videochamada / Sala Virtual:
              </label>
              <input
                type="text"
                value={linkVideochamada}
                onChange={(e) => setLinkVideochamada(e.target.value)}
                placeholder="https://meet.google.com/... ou link da sala PJe/Zoom do tribunal"
                className="w-full bg-[#12171f] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>
          )}

          {/* Perito e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Perito Oficial do Juízo:</label>
              <input
                type="text"
                placeholder="Dr(a). Perito Judicial"
                value={peritoJuizoNome}
                onChange={(e) => setPeritoJuizoNome(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Status da Perícia:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusPericia)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="Agendada">Agendada</option>
                <option value="Realizada - Em Análise">Realizada - Em Análise</option>
                <option value="Aguardando Laudo do Juízo">Aguardando Laudo do Juízo</option>
                <option value="Laudo Protocolado">Laudo Protocolado</option>
                <option value="Remarcada">Remarcada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Concluída">Concluída</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Resultado Pericial:</label>
              <select
                value={resultado}
                onChange={(e) => setResultado(e.target.value as ResultadoPericia)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="Aguardando Sentença">Aguardando Laudo / Sentença</option>
                <option value="Favorável">Favorável ao Cliente</option>
                <option value="Parcialmente Favorável">Parcialmente Favorável</option>
                <option value="Desfavorável">Desfavorável (Necessita Impugnação)</option>
              </select>
            </div>
          </div>

          {/* Checklist de Preparação */}
          <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-2.5">
            <span className="font-semibold text-xs text-[#b8a47c] block">
              Checklist de Preparação Pericial (Auditoria & Risco):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded bg-[#12171f] cursor-pointer hover:bg-[#1b222d] transition-colors">
                <input
                  type="checkbox"
                  checked={checklistDocs}
                  onChange={(e) => setChecklistDocs(e.target.checked)}
                  className="rounded text-[#b8a47c]"
                />
                <span>Documentos médicos revisados e cronologia pronta</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-[#12171f] cursor-pointer hover:bg-[#1b222d] transition-colors">
                <input
                  type="checkbox"
                  checked={checklistQuesitos}
                  onChange={(e) => setChecklistQuesitos(e.target.checked)}
                  className="rounded text-[#b8a47c]"
                />
                <span>Quesitos iniciais protocolados nos autos</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-[#12171f] cursor-pointer hover:bg-[#1b222d] transition-colors">
                <input
                  type="checkbox"
                  checked={checklistDeslocamento}
                  onChange={(e) => setChecklistDeslocamento(e.target.checked)}
                  className="rounded text-[#b8a47c]"
                />
                <span>Deslocamento / rota / logística confirmados</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-[#12171f] cursor-pointer hover:bg-[#1b222d] transition-colors">
                <input
                  type="checkbox"
                  checked={checklistPericiando}
                  onChange={(e) => setChecklistPericiando(e.target.checked)}
                  className="rounded text-[#b8a47c]"
                />
                <span>Periciando orientado sobre o exame físico e postura</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-[#12171f] cursor-pointer hover:bg-[#1b222d] transition-colors col-span-1 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={checklistKit}
                  onChange={(e) => setChecklistKit(e.target.checked)}
                  className="rounded text-[#b8a47c]"
                />
                <span>Kit pericial, anamnese impressa e CRM médico preparados</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#545c6b] block mb-1">Observações da Perita:</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções particulares para a equipe..."
              className="w-full bg-[#161c26] border border-[#263040] rounded-lg p-2.5 text-[#f4efe3] focus:outline-none"
            />
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
              {periciaParaEditar ? 'Salvar Perícia' : 'Agendar Perícia Médica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
