import React, { useState } from 'react';
import { X, AlertOctagon, HelpCircle } from 'lucide-react';
import { MotivoPerda, Lead } from '../../types';

interface MotivoPerdaModalProps {
  lead: Lead;
  onConfirm: (motivo: MotivoPerda, detalhe: string) => Promise<void>;
  onClose: () => void;
}

const MOTIVOS: { id: MotivoPerda; label: string; desc: string }[] = [
  { id: 'Preço', label: 'Preço / Honorários', desc: 'Cliente considerou o valor dos honorários periciais acima do orçamento.' },
  { id: 'Prazo inviável', label: 'Prazo Processual Inviável', desc: 'Prazo fatal judicial muito exíguo sem tempo hábil para análise técnica segura.' },
  { id: 'Sem viabilidade técnica', label: 'Sem Viabilidade Técnica', desc: 'Análise prévia constatou ausência de nexo causal ou inexistência de incapacidade.' },
  { id: 'Fechou com concorrente', label: 'Fechou com Concorrente', desc: 'Advogado contratou outro assistente técnico ou médico perito da região.' },
  { id: 'Sem resposta', label: 'Sem Resposta / Sumiu', desc: 'Tentativas de contato via WhatsApp, ligação e e-mail sem retorno do advogado.' },
  { id: 'Fora da área', label: 'Fora da Área de Atuação', desc: 'Demanda médica em especialidade não atendida pela Crivo Forense.' },
  { id: 'Outro', label: 'Outro Motivo', desc: 'Desistência da ação judicial, acordo precoce nos autos ou outra justificativa.' },
];

export const MotivoPerdaModal: React.FC<MotivoPerdaModalProps> = ({
  lead,
  onConfirm,
  onClose,
}) => {
  const [motivoSelecionado, setMotivoSelecionado] = useState<MotivoPerda>('Sem viabilidade técnica');
  const [detalhe, setDetalhe] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(motivoSelecionado, detalhe);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e8e1d0]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#263040] bg-[#161c26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#f4efe3]">Registrar Motivo de Perda</h3>
              <p className="text-xs text-[#545c6b]">Lead: <span className="text-[#f4efe3] font-medium">{lead.nome}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-300/90 leading-relaxed">
            Para mantermos a inteligência de negócios da Crivo Forense e futuras campanhas de reativação, indique o motivo pelo qual este caso não foi convertido.
          </div>

          <div className="space-y-2">
            <label className="block text-[#545c6b] font-semibold uppercase tracking-wider text-[11px]">
              Selecione o Motivo Principal *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOTIVOS.map((m) => (
                <label
                  key={m.id}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    motivoSelecionado === m.id
                      ? 'bg-[#1b222d] border-[#b8a47c] text-[#f4efe3] shadow-sm'
                      : 'bg-[#161c26] border-[#263040] text-[#545c6b] hover:text-[#e8e1d0] hover:border-[#38455a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="motivoPerda"
                      value={m.id}
                      checked={motivoSelecionado === m.id}
                      onChange={() => setMotivoSelecionado(m.id)}
                      className="accent-[#b8a47c]"
                    />
                    <span className="font-semibold text-xs text-[#f4efe3]">{m.label}</span>
                  </div>
                  <span className="text-[10px] text-[#545c6b] mt-1 pl-5 leading-tight">{m.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#545c6b] font-semibold mb-1">
              Observações Adicionais / Justificativa
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Advogado informou que o periciando aceitou acordo na audiência inaugural; ou laudo médico anterior demonstrou incapacidade temporária já cessada..."
              value={detalhe}
              onChange={(e) => setDetalhe(e.target.value)}
              className="w-full bg-[#1b222d] border border-[#263040] rounded-xl px-3 py-2 text-[#f4efe3] placeholder-[#545c6b] focus:outline-none focus:border-[#b8a47c]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#263040]">
            <span className="text-[11px] text-[#545c6b]">
              Poderá ser reativado na aba &quot;Reativação&quot; a qualquer momento.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0] hover:bg-[#263040] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-sm transition-colors"
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Perda'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
