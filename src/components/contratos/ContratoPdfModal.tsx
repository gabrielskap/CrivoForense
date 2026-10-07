import React from 'react';
import { X, Printer, Shield, CheckCircle, FileText } from 'lucide-react';
import { Contrato } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ContratoPdfModalProps {
  contrato: Contrato | null;
  onClose: () => void;
  onAssinar?: (contratoId: string) => void;
}

export const ContratoPdfModal: React.FC<ContratoPdfModalProps> = ({
  contrato,
  onClose,
  onAssinar,
}) => {
  if (!contrato) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#0e1218] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Não sai na impressão) */}
        <div className="p-4 bg-[#141a24] border-b border-[#222b3a] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#b8a47c]/20 text-[#c7b692] border border-[#b8a47c]/30">
              Contrato de Prestação de Serviços
            </span>
            <span className="text-xs text-[#8c96a5] font-mono">{contrato.numeroContrato}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                contrato.status === 'Assinado'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
              }`}
            >
              {contrato.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {contrato.status !== 'Assinado' && onAssinar && (
              <button
                onClick={() => onAssinar(contrato.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold shadow-sm transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Simular Assinatura Digital
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2735] text-[#f4efe3] hover:bg-[#2b3648] text-xs font-medium border border-[#2b3648] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8c96a5] hover:text-[#f4efe3] hover:bg-[#1f2735] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Folha A4 do Contrato */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-[#faf8f5] text-[#1a1f26] font-serif leading-relaxed print:p-0 print:bg-white print:text-black">
          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-[#b8a47c] pb-6 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1f26]">
              CRIVO FORENSE ASSESSORIA MÉDICO-PERICIAL
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#8a754d] font-sans font-semibold mt-1">
              Direção Técnica: Dra. Karine Reis • CRM/SP 123.456 • RQE Forense
            </p>
            <p className="text-xs font-mono text-[#555f6d] mt-2 font-sans">
              Instrumento Contratual nº {contrato.numeroContrato}
            </p>
          </div>

          {/* Corpo do Contrato (interpolado com variáveis) */}
          <div className="whitespace-pre-wrap text-xs sm:text-sm text-[#2b323c] leading-7 font-sans">
            {contrato.corpoConteudo}
          </div>

          {/* Bloco de Assinaturas Digitais e Certificado */}
          <div className="mt-12 pt-8 border-t-2 border-[#b8a47c]/60 font-sans">
            {contrato.status === 'Assinado' ? (
              <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-700/30 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span className="font-semibold text-emerald-800">
                    Documento Assinado Eletronicamente ({contrato.provedorAssinatura || 'Clicksign'})
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Em conformidade com a MP 2.200-2/2001 e Lei Federal nº 14.063/2020.
                  Token de Validação Criptográfica: <span className="font-mono">{contrato.tokenAssinatura || 'sig_71829481'}</span>.
                </p>
                <p className="text-[10px] text-emerald-600">
                  Data e hora do registro de firma digital: {formatDate(contrato.dataAssinatura || contrato.dataCriacao)} às 15:42:19 BRT.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs pt-4">
                <div className="border-t border-[#4b5563] pt-2">
                  <p className="font-semibold text-[#1a1f26]">
                    {contrato.escritorioNome || 'Contratante'}
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    {contrato.advogadoNome ? `${contrato.advogadoNome} (${contrato.advogadoOab})` : 'Representante Legal'}
                  </p>
                </div>

                <div className="border-t border-[#4b5563] pt-2">
                  <p className="font-semibold text-[#1a1f26]">Dra. Karine Reis</p>
                  <p className="text-[11px] text-[#6b7280]">CRM/SP 123.456 • Médica Assistente Técnica</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
