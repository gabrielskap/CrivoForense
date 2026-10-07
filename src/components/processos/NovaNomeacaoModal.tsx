import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileCheck,
} from 'lucide-react';
import { Nomeacao, Processo } from '../../types';
import {
  nomeacaoRepository,
  processoRepository,
  auditLogRepository,
} from '../../services';
import { toIsoDate, calcularPrazoDiasUteis } from '../../utils/calculadoraPrazos';
import { formatProcesso } from '../../utils/formatters';

interface NovaNomeacaoModalProps {
  onClose: () => void;
  onSuccess: (nomeacao: Nomeacao) => void;
  nomeacaoParaEditar?: Nomeacao;
}

export const NovaNomeacaoModal: React.FC<NovaNomeacaoModalProps> = ({
  onClose,
  onSuccess,
  nomeacaoParaEditar,
}) => {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [processoId, setProcessoId] = useState<string>(
    nomeacaoParaEditar?.processoId || ''
  );
  const [vara, setVara] = useState(
    nomeacaoParaEditar?.vara || '2ª Vara Cível de Palmas'
  );
  const [comarca, setComarca] = useState(
    nomeacaoParaEditar?.comarca || 'Palmas/TO'
  );
  const [juizNome, setJuizNome] = useState(
    nomeacaoParaEditar?.juizNome || 'Dr. Frederico Paiva Rezende'
  );

  const hoje = toIsoDate(new Date());
  const [dataNomeacao, setDataNomeacao] = useState(
    nomeacaoParaEditar?.dataNomeacao || hoje
  );
  const [prazoDias, setPrazoDias] = useState<number>(
    nomeacaoParaEditar?.prazoManifestacaoDias || 5
  );

  const prazo5dias = calcularPrazoDiasUteis(dataNomeacao, prazoDias, comarca);
  const [dataLimiteAceite, setDataLimiteAceite] = useState(
    nomeacaoParaEditar?.dataLimiteAceite || prazo5dias.dataVencimento
  );

  const [honorariosPropostos, setHonorariosPropostos] = useState<number>(
    nomeacaoParaEditar?.honorariosPropostos || 3500
  );
  const [honorariosFixados, setHonorariosFixados] = useState<number>(
    nomeacaoParaEditar?.honorariosFixados || 3500
  );

  const [justicaGratuita, setJusticaGratuita] = useState<boolean>(
    nomeacaoParaEditar?.justicaGratuita ?? false
  );
  const [valorTabelaJg, setValorTabelaJg] = useState<number>(
    nomeacaoParaEditar?.valorTabelaJg || 650
  );

  const [depositoJudicial, setDepositoJudicial] = useState<
    'Pendente' | 'Efetuado' | 'Comprovado'
  >(nomeacaoParaEditar?.depositoJudicial || 'Pendente');

  const [alvaraStatus, setAlvaraStatus] = useState<
    'Não expedido' | 'Expedido' | 'Levantado'
  >(nomeacaoParaEditar?.alvaraStatus || 'Não expedido');

  const [status, setStatus] = useState<Nomeacao['status']>(
    nomeacaoParaEditar?.status || 'Aguardando Aceite'
  );
  const [observacoes, setObservacoes] = useState(
    nomeacaoParaEditar?.observacoes || ''
  );

  useEffect(() => {
    processoRepository.getAll().then((p) => {
      setProcessos(p);
      if (!processoId && p.length > 0) {
        setProcessoId(p[0].id);
        setVara(p[0].vara);
        setComarca(`${p[0].comarca}/${p[0].uf || 'SP'}`);
        if (p[0].juiz) setJuizNome(p[0].juiz);
      }
    });
  }, []);

  const handleProcessoChange = (id: string) => {
    setProcessoId(id);
    const proc = processos.find((p) => p.id === id);
    if (proc) {
      setVara(proc.vara);
      setComarca(`${proc.comarca}/${proc.uf || 'SP'}`);
      if (proc.juiz) setJuizNome(proc.juiz);
    }
  };

  const handleDataNomeacaoChange = (d: string) => {
    setDataNomeacao(d);
    const calc = calcularPrazoDiasUteis(d, prazoDias, comarca);
    setDataLimiteAceite(calc.dataVencimento);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processoId) return;

    const nova: Nomeacao = {
      id: nomeacaoParaEditar?.id || `nom_${Date.now()}`,
      processoId,
      vara,
      comarca,
      juizNome,
      dataNomeacao,
      prazoManifestacaoDias: Number(prazoDias),
      dataLimiteAceite,
      honorariosPropostos: Number(honorariosPropostos),
      honorariosFixados: Number(honorariosFixados),
      justicaGratuita,
      valorTabelaJg: justicaGratuita ? Number(valorTabelaJg) : undefined,
      depositoJudicial,
      alvaraStatus,
      status,
      observacoes,
    };

    if (nomeacaoParaEditar) {
      await nomeacaoRepository.update(nomeacaoParaEditar.id, nova);
    } else {
      await nomeacaoRepository.create(nova);
    }

    const proc = processos.find((p) => p.id === processoId);

    await auditLogRepository.logAccess({
      acao: nomeacaoParaEditar ? 'Edição de Nomeação Judicial' : 'Registro de Nomeação Judicial (Perita do Juízo)',
      entidade: 'Nomeacao',
      entidadeId: nova.id,
      detalhes: `Nomeação na ${vara} (${comarca}). Honorários: R$ ${nova.honorariosPropostos}. JG: ${justicaGratuita ? 'Sim' : 'Não'}. Status: ${status}.`,
      isDadoSensivelSaude: false,
    });

    onSuccess(nova);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-800/40 text-purple-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#f4efe3]">
                {nomeacaoParaEditar ? 'Editar Nomeação Judicial' : 'Cadastrar Nomeação Judicial do Juízo'}
              </h2>
              <p className="text-xs text-[#545c6b]">
                Atuação de Dra. Karine Reis como Perita Oficial Nomeada pelo Magistrado.
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
          <div>
            <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
              Processo Judicial da Nomeação:
            </label>
            <select
              value={processoId}
              onChange={(e) => handleProcessoChange(e.target.value)}
              className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
            >
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatProcesso(p.numeroCnj)} • {p.vara} ({p.comarca})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Vara:</label>
              <input
                type="text"
                value={vara}
                onChange={(e) => setVara(e.target.value)}
                required
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Comarca/UF:</label>
              <input
                type="text"
                value={comarca}
                onChange={(e) => setComarca(e.target.value)}
                required
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#545c6b] block mb-1">Magistrado(a) Nomeante:</label>
            <input
              type="text"
              value={juizNome}
              onChange={(e) => setJuizNome(e.target.value)}
              required
              className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
            />
          </div>

          {/* Datas e Prazos CPC */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Data da Nomeação:</label>
              <input
                type="date"
                value={dataNomeacao}
                onChange={(e) => handleDataNomeacaoChange(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Prazo Aceite (CPC):</label>
              <input
                type="number"
                value={prazoDias}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPrazoDias(val);
                  const calc = calcularPrazoDiasUteis(dataNomeacao, val, comarca);
                  setDataLimiteAceite(calc.dataVencimento);
                }}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] text-center focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#b8a47c] block mb-1 font-semibold">
                Data Limite Aceite:
              </label>
              <input
                type="date"
                value={dataLimiteAceite}
                onChange={(e) => setDataLimiteAceite(e.target.value)}
                className="w-full bg-[#161c26] border border-[#b8a47c]/50 rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>
          </div>

          {/* Honorários e Justiça Gratuita */}
          <div className="p-3.5 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#b8a47c]">
                Proposta de Honorários & Benefício da Justiça Gratuita (JG):
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={justicaGratuita}
                  onChange={(e) => setJusticaGratuita(e.target.checked)}
                  className="rounded text-[#b8a47c]"
                />
                <span className={justicaGratuita ? 'text-amber-300 font-semibold' : 'text-[#545c6b]'}>
                  Justiça Gratuita (JG)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[#545c6b] block">Honorários Propostos (R$):</label>
                <input
                  type="number"
                  value={honorariosPropostos}
                  onChange={(e) => setHonorariosPropostos(Number(e.target.value))}
                  className="w-full bg-[#12171f] border border-[#263040] rounded p-1.5 text-xs text-[#f4efe3] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#545c6b] block">Honorários Fixados (R$):</label>
                <input
                  type="number"
                  value={honorariosFixados}
                  onChange={(e) => setHonorariosFixados(Number(e.target.value))}
                  className="w-full bg-[#12171f] border border-[#263040] rounded p-1.5 text-xs text-[#b8a47c] font-mono font-semibold"
                />
              </div>
              {justicaGratuita && (
                <div>
                  <label className="text-[10px] text-amber-300 block">Tabela Tribunal JG (R$):</label>
                  <input
                    type="number"
                    value={valorTabelaJg}
                    onChange={(e) => setValorTabelaJg(Number(e.target.value))}
                    className="w-full bg-[#12171f] border border-amber-800/40 rounded p-1.5 text-xs text-amber-300 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Depósito Judicial e Alvará */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Depósito Judicial:</label>
              <select
                value={depositoJudicial}
                onChange={(e) => setDepositoJudicial(e.target.value as any)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="Pendente">Pendente de Depósito</option>
                <option value="Efetuado">Efetuado pela Parte</option>
                <option value="Comprovado">Comprovado nos Autos</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Alvará Judicial:</label>
              <select
                value={alvaraStatus}
                onChange={(e) => setAlvaraStatus(e.target.value as any)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="Não expedido">Não Expedido</option>
                <option value="Expedido">Expedido pela Vara</option>
                <option value="Levantado">Levantado / Pago</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Status da Nomeação:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="Aguardando Aceite">Aguardando Aceite (5 dias)</option>
                <option value="Aceita">Aceita (Petição Protocolada)</option>
                <option value="Recusada">Recusada (Motivo Justificado)</option>
                <option value="Honorários Depositados">Honorários Depositados</option>
                <option value="Alvará Solicitado">Alvará Solicitado</option>
                <option value="Pago">Pago / Concluída</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#545c6b] block mb-1">Anotações da Perita:</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções sobre o laudo, escopo e manifestações..."
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
              {nomeacaoParaEditar ? 'Salvar Nomeação' : 'Cadastrar Nomeação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
