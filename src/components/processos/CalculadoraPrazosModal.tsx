import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Scale,
  ShieldAlert,
  ArrowRight,
  Info,
  CalendarDays,
} from 'lucide-react';
import {
  calcularPrazoDiasUteis,
  toIsoDate,
  parseIsoDate,
  FERIADOS_LOCAIS_PADRAO,
  ResultadoCalculoPrazo,
} from '../../utils/calculadoraPrazos';
import { formatDate } from '../../utils/formatters';
import { FeriadoLocal, Processo } from '../../types';
import { feriadoLocalRepository, tarefaRepository, auditLogRepository } from '../../services';

interface CalculadoraPrazosModalProps {
  onClose: () => void;
  processoPreSelecionado?: Processo;
  processos?: Processo[];
  onTarefaCriada?: () => void;
}

export const CalculadoraPrazosModal: React.FC<CalculadoraPrazosModalProps> = ({
  onClose,
  processoPreSelecionado,
  processos = [],
  onTarefaCriada,
}) => {
  const [dataIntimacao, setDataIntimacao] = useState<string>(toIsoDate(new Date()));
  const [diasUteis, setDiasUteis] = useState<number>(15);
  const [comarca, setComarca] = useState<string>(processoPreSelecionado?.comarca || 'São Paulo');
  const [artigoCpc, setArtigoCpc] = useState<string>('Art. 465 § 1º (Quesitos e Assistente - 15 dias)');
  const [processoId, setProcessoId] = useState<string>(processoPreSelecionado?.id || '');
  const [feriadosLocais, setFeriadosLocais] = useState<FeriadoLocal[]>(FERIADOS_LOCAIS_PADRAO);

  // Modal Novo Feriado Local
  const [isNovoFeriadoOpen, setIsNovoFeriadoOpen] = useState(false);
  const [novoFeriadoNome, setNovoFeriadoNome] = useState('');
  const [novoFeriadoData, setNovoFeriadoData] = useState('2026-06-24');
  const [novoFeriadoComarca, setNovoFeriadoComarca] = useState(comarca);
  const [novoFeriadoRecorrente, setNovoFeriadoRecorrente] = useState(true);

  // Feedback de criação de tarefa
  const [tarefaCriadaSucesso, setTarefaCriadaSucesso] = useState(false);

  // Opções predefinidas do CPC
  const prazosPredefinidos = [
    { label: 'Art. 465 §1º - Quesitos e Assistente Técnico (15 dias)', dias: 15, ref: 'Art. 465 § 1º' },
    { label: 'Art. 477 §1º - Parecer do Assistente Técnico (15 dias)', dias: 15, ref: 'Art. 477 § 1º' },
    { label: 'Art. 465 caput - Aceite e Honorários da Perita Nomeada (5 dias)', dias: 5, ref: 'Art. 465 caput' },
    { label: 'Art. 477 §2º - Esclarecimentos do Perito (15 dias)', dias: 15, ref: 'Art. 477 § 2º' },
    { label: 'Art. 1.003 §5º - Agravo / Embargos / Recurso (15 dias)', dias: 15, ref: 'Art. 1.003 § 5º' },
    { label: 'Art. 1.023 - Embargos de Declaração (5 dias)', dias: 5, ref: 'Art. 1.023' },
  ];

  // Cálculo reativo
  const resultado: ResultadoCalculoPrazo = useMemo(() => {
    return calcularPrazoDiasUteis(dataIntimacao, diasUteis, comarca, feriadosLocais);
  }, [dataIntimacao, diasUteis, comarca, feriadosLocais]);

  const handleSalvarFeriado = async () => {
    if (!novoFeriadoNome.trim()) return;
    const novo: FeriadoLocal = {
      id: `fer_${Date.now()}`,
      comarca: novoFeriadoComarca,
      uf: novoFeriadoComarca.toLowerCase().includes('palmas') ? 'TO' : 'SP',
      nome: novoFeriadoNome.trim(),
      data: novoFeriadoData,
      recorrenteAnual: novoFeriadoRecorrente,
    };
    await feriadoLocalRepository.create(novo);
    setFeriadosLocais((prev) => [...prev, novo]);
    setIsNovoFeriadoOpen(false);
    setNovoFeriadoNome('');
  };

  const handleCriarTarefaEAlerta = async () => {
    const proc = processos.find((p) => p.id === processoId) || processoPreSelecionado;
    const titulo = `Prazo Fatal: ${artigoCpc} [${diasUteis} dias úteis]`;

    await tarefaRepository.create({
      titulo,
      descricao: `Prazo calculado com regras do CPC (Art. 219, 220 e 224). Intimação em ${formatDate(
        resultado.dataInicio
      )}, início em ${formatDate(resultado.dataPrimeiroDiaUtil)} e vencimento em ${formatDate(
        resultado.dataVencimento
      )}. Comarca: ${comarca}. ${
        resultado.houveRecessoForense ? 'Houve suspensão pelo recesso forense (20/12 a 20/01).' : ''
      }`,
      dataLimite: resultado.dataVencimento,
      prioridade: 'Alta',
      status: 'A Fazer',
      responsavelId: proc?.responsavelId || 'user_karine',
      processoId: proc?.id,
    });

    await auditLogRepository.logAccess({
      acao: 'Criação de Tarefa via Calculadora de Prazos CPC',
      entidade: 'Tarefa',
      entidadeId: proc?.id || 'avulso',
      detalhes: `Vencimento em ${resultado.dataVencimento} para ${proc?.numeroCnj || 'sem processo'} (${artigoCpc})`,
      isDadoSensivelSaude: false,
    });

    setTarefaCriadaSucesso(true);
    if (onTarefaCriada) onTarefaCriada();
    setTimeout(() => setTarefaCriadaSucesso(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b8a47c]/15 border border-[#b8a47c]/40 text-[#b8a47c] flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[#b8a47c]" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#f4efe3] flex items-center gap-2">
                Calculadora de Prazos em Dias Úteis
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1b222d] text-[#b8a47c] border border-[#b8a47c]/30 font-sans font-medium">
                  CPC/2015 Art. 219, 220 e 224
                </span>
              </h2>
              <p className="text-xs text-[#545c6b]">
                Exclusão do dia de início, recesso forense (20/12 a 20/01), feriados nacionais e locais.
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#e8e1d0]">
          {/* Top Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#161c26] border border-[#263040]">
            {/* Data da Intimação */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#b8a47c] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Data da Intimação / Publicação:
              </label>
              <input
                type="date"
                value={dataIntimacao}
                onChange={(e) => setDataIntimacao(e.target.value)}
                className="w-full bg-[#12171f] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
              />
              <span className="text-[10px] text-[#545c6b]">
                Art. 224: o dia da publicação é excluído da contagem.
              </span>
            </div>

            {/* Dias Úteis e Marco Predefinido */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#b8a47c] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Marco Legal / Artigo CPC:
              </label>
              <select
                value={artigoCpc}
                onChange={(e) => {
                  const sel = prazosPredefinidos.find((p) => p.label === e.target.value);
                  setArtigoCpc(e.target.value);
                  if (sel) setDiasUteis(sel.dias);
                }}
                className="w-full bg-[#12171f] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
              >
                {prazosPredefinidos.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
                <option value="Personalizado">Prazo Personalizado</option>
              </select>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-[#545c6b]">Prazo em dias úteis:</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={diasUteis}
                  onChange={(e) => setDiasUteis(Math.max(1, Number(e.target.value)))}
                  className="w-20 bg-[#12171f] border border-[#263040] rounded px-2 py-0.5 text-center font-bold text-[#b8a47c]"
                />
              </div>
            </div>

            {/* Comarca & Feriados Locais */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#b8a47c] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Comarca Forense:
                </label>
                <button
                  type="button"
                  onClick={() => setIsNovoFeriadoOpen(true)}
                  className="text-[10px] text-[#5b9cd9] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Feriado Local
                </button>
              </div>
              <input
                type="text"
                placeholder="Ex: São Paulo, Santos, Palmas, Campinas..."
                value={comarca}
                onChange={(e) => {
                  setNovoFeriadoComarca(e.target.value);
                  setComarca(e.target.value);
                }}
                className="w-full bg-[#12171f] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
              />
              <span className="text-[10px] text-[#545c6b]">
                Feriados locais cadastrados: {feriadosLocais.filter((f) => f.comarca.toLowerCase().includes(comarca.toLowerCase())).length}
              </span>
            </div>
          </div>

          {/* Modal Adicionar Feriado Local */}
          {isNovoFeriadoOpen && (
            <div className="p-4 rounded-xl bg-[#1b222d] border border-amber-900/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300 text-xs flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Feriado Local da Comarca
                </span>
                <button
                  onClick={() => setIsNovoFeriadoOpen(false)}
                  className="text-[#545c6b] hover:text-[#f4efe3]"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-[#545c6b] block">Nome do Feriado / Padroeiro</label>
                  <input
                    type="text"
                    value={novoFeriadoNome}
                    onChange={(e) => setNovoFeriadoNome(e.target.value)}
                    placeholder="Ex: Aniversário Municipal"
                    className="w-full bg-[#12171f] border border-[#263040] rounded p-1.5 text-xs text-[#f4efe3]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#545c6b] block">Data (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={novoFeriadoData}
                    onChange={(e) => setNovoFeriadoData(e.target.value)}
                    className="w-full bg-[#12171f] border border-[#263040] rounded p-1.5 text-xs text-[#f4efe3]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#545c6b] block">Comarca</label>
                  <input
                    type="text"
                    value={novoFeriadoComarca}
                    onChange={(e) => setNovoFeriadoComarca(e.target.value)}
                    className="w-full bg-[#12171f] border border-[#263040] rounded p-1.5 text-xs text-[#f4efe3]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-[11px] text-[#e8e1d0]/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novoFeriadoRecorrente}
                    onChange={(e) => setNovoFeriadoRecorrente(e.target.checked)}
                    className="rounded text-[#b8a47c]"
                  />
                  Repetir anualmente nesta data
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsNovoFeriadoOpen(false)}
                    className="px-3 py-1 rounded bg-[#263040] text-xs hover:bg-[#323d4f]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarFeriado}
                    className="px-3 py-1 rounded bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692]"
                  >
                    Salvar Feriado
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Destaque do Resultado Calculado */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#161c26] via-[#1a222f] to-[#161c26] border border-[#b8a47c]/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-[#545c6b] uppercase tracking-wider block">
                  Data Fatal de Vencimento do Prazo:
                </span>
                <div className="font-serif text-2xl sm:text-3xl text-[#f4efe3] font-bold mt-0.5 flex items-center gap-2">
                  <span className="text-[#b8a47c]">{formatDate(resultado.dataVencimento)}</span>
                  <span className="text-xs font-mono font-normal text-[#545c6b]">
                    ({resultado.cronologia[resultado.cronologia.length - 1]?.diaSemana})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:text-right flex-wrap">
                <div className="p-2.5 rounded-xl bg-[#12171f] border border-[#263040] text-center min-w-[100px]">
                  <span className="text-[10px] text-[#545c6b] block">Dias Úteis</span>
                  <span className="font-bold text-sm text-[#b8a47c]">{resultado.diasUteisSolicitados}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#12171f] border border-[#263040] text-center min-w-[100px]">
                  <span className="text-[10px] text-[#545c6b] block">Dias Corridos</span>
                  <span className="font-bold text-sm text-[#5b9cd9]">{resultado.diasCorridosTotais}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#12171f] border border-[#263040] text-center min-w-[100px]">
                  <span className="text-[10px] text-[#545c6b] block">Dias Suspensos</span>
                  <span className="font-bold text-sm text-amber-400">{resultado.diasSuspensosTotal}</span>
                </div>
              </div>
            </div>

            {/* Avisos Legais Críticos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#263040]">
              <div className="flex items-start gap-2 text-[11px] text-[#e8e1d0]/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#f4efe3]">Início da Contagem:</span>{' '}
                  {formatDate(resultado.dataPrimeiroDiaUtil)} (primeiro dia útil seguinte à intimação).
                </div>
              </div>

              {resultado.houveRecessoForense ? (
                <div className="flex items-start gap-2 text-[11px] text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Recesso Forense Aplicado:</span> suspensão automática de 20/12 a 20/01 nos termos do Art. 220 do CPC.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-[11px] text-[#e8e1d0]/80">
                  <Info className="w-4 h-4 text-[#5b9cd9] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#f4efe3]">Fundamentação:</span> Art. 219, Art. 224 do CPC e Provimentos do TJ/TRT/TRF.
                  </div>
                </div>
              )}
            </div>

            {/* Ação de Vincular a Processo e Gerar Tarefa */}
            <div className="pt-3 border-t border-[#263040] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[11px] text-[#545c6b] shrink-0">Processo Alvo:</span>
                <select
                  value={processoId}
                  onChange={(e) => setProcessoId(e.target.value)}
                  className="bg-[#12171f] border border-[#263040] rounded-lg px-2.5 py-1.5 text-xs text-[#f4efe3] focus:outline-none focus:border-[#b8a47c] flex-1 max-w-sm"
                >
                  <option value="">Selecione um processo cadastrado...</option>
                  {processos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numeroCnj} - {p.poloAtivo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {tarefaCriadaSucesso && (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 animate-in fade-in">
                    ✓ Tarefa e Alerta Criados!
                  </span>
                )}
                <button
                  onClick={handleCriarTarefaEAlerta}
                  className="px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <CalendarDays className="w-4 h-4" />
                  Gerar Tarefa com Prazo e Alerta
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Memória de Cálculo / Linha do Tempo Dia-a-Dia */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm text-[#f4efe3] font-semibold">
                Memória de Cálculo e Auditoria da Contagem ({resultado.cronologia.length} dias analisados):
              </span>
              <span className="text-[10px] text-[#545c6b]">
                Conforme Art. 224 do CPC (exclui início, inclui vencimento)
              </span>
            </div>

            <div className="rounded-xl border border-[#263040] overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161c26] text-[#b8a47c] sticky top-0 border-b border-[#263040] text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Dia da Semana</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Motivo / Fundamentação Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b222d] bg-[#12171f]">
                  {resultado.cronologia.map((dia, idx) => {
                    const isUltimo = idx === resultado.cronologia.length - 1;
                    return (
                      <tr
                        key={dia.data}
                        className={`hover:bg-[#161c26]/60 transition-colors ${
                          isUltimo ? 'bg-[#b8a47c]/10 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-[#f4efe3]">
                          {formatDate(dia.data)}
                        </td>
                        <td className="py-2 px-3 text-[#545c6b]">{dia.diaSemana}</td>
                        <td className="py-2 px-3">
                          {dia.util ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Útil
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-rose-950/40 text-rose-300 border border-rose-800/40 font-medium">
                              <AlertTriangle className="w-3 h-3 text-rose-400" /> Suspenso
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[#e8e1d0]/80">
                          {dia.motivo}
                          {isUltimo && (
                            <span className="ml-2 text-[#b8a47c] font-bold uppercase text-[10px]">
                              [Data Fatal de Vencimento]
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#263040] bg-[#161c26]">
          <span className="text-[11px] text-[#545c6b]">
            Dra. Karine Reis • Assessoria Pericial Médico-Legal • Prazos certificados pelo CPC/2015
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0] border border-[#263040] font-semibold text-xs hover:bg-[#232c3a] transition-colors"
          >
            Fechar Calculadora
          </button>
        </div>
      </div>
    </div>
  );
};
