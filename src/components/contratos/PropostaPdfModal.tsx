import React from 'react';
import { X, Printer, Shield, CheckCircle, Clock, FileText, Calendar } from 'lucide-react';
import { Proposta } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface PropostaPdfModalProps {
  proposta: Proposta | null;
  onClose: () => void;
  onAprovar?: (propostaId: string) => void;
}

export const PropostaPdfModal: React.FC<PropostaPdfModalProps> = ({
  proposta,
  onClose,
  onAprovar,
}) => {
  if (!proposta) return null;

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
              Proposta Comercial em PDF
            </span>
            <span className="text-xs text-[#8c96a5] font-mono">{proposta.numeroProposta}</span>
          </div>

          <div className="flex items-center gap-2">
            {proposta.status !== 'Aceita' && onAprovar && (
              <button
                onClick={() => onAprovar(proposta.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold shadow-sm transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Aprovar & Gerar Contrato
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

        {/* Folha A4 da Proposta Comercial */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-[#faf8f5] text-[#1a1f26] font-sans print:p-0 print:bg-white print:text-black">
          {/* Cabeçalho com Identidade Visual */}
          <div className="border-b-2 border-[#b8a47c] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#1a1f26]">
                  CRIVO FORENSE
                </span>
                <span className="text-[11px] font-semibold text-[#8a754d] tracking-widest uppercase border-l-2 border-[#b8a47c] pl-2">
                  Medicina Legal & Perícias
                </span>
              </div>
              <p className="text-xs text-[#4b5563] mt-1 font-medium">
                Dra. Karine Reis • Médica Perita Judicial & Assistente Técnica Forense
              </p>
              <p className="text-[11px] text-[#6b7280]">
                CRM/SP 123.456 • RQE Medicina Legal e Perícias Médicas
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded bg-[#1a1f26] text-[#faf8f5] font-mono text-xs font-semibold">
                {proposta.numeroProposta}
              </span>
              <p className="text-[11px] text-[#4b5563]">
                Emissão: <strong>{formatDate(proposta.dataCriacao)}</strong>
              </p>
              <p className="text-[11px] text-[#b45309] font-medium">
                Válida até: <strong>{formatDate(proposta.validadeAte)}</strong>
              </p>
            </div>
          </div>

          {/* Dados do Cliente / Escritório / Processo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-[#f0ebe1] border border-[#e2d9ca] text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#786b53] block">
                Contratante / Patrono
              </span>
              <p className="text-sm font-semibold text-[#1a1f26]">
                {proposta.escritorioNome || 'Escritório Parceiro'}
              </p>
              <p className="text-[#4b5563]">
                Advogado: <strong>{proposta.advogadoNome || 'Patrono'}</strong>{' '}
                {proposta.advogadoOab && `(${proposta.advogadoOab})`}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#786b53] block">
                Processo & Periciando
              </span>
              <p className="text-xs font-mono font-medium text-[#1a1f26]">
                {proposta.processoNumero || 'Processo a indicar'}
              </p>
              {proposta.periciandoNome && (
                <p className="text-[#4b5563]">
                  Periciando(a): <strong>{proposta.periciandoNome}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Objeto e Tabela de Serviços */}
          <div className="space-y-3 my-6">
            <h4 className="font-serif text-sm font-bold text-[#1a1f26] uppercase tracking-wide border-b border-[#e2d9ca] pb-1">
              Escopo dos Serviços Periciais Contratados
            </h4>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#d1c7b5] text-[#786b53] text-[11px]">
                  <th className="py-2.5 font-semibold">Descrição do Serviço</th>
                  <th className="py-2.5 font-semibold text-center w-16">Qtd</th>
                  <th className="py-2.5 font-semibold text-center w-24">Prazo</th>
                  <th className="py-2.5 font-semibold text-right w-28">Valor Unit.</th>
                  <th className="py-2.5 font-semibold text-right w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e2d5]">
                {proposta.itens.map((it, idx) => (
                  <tr key={idx} className="hover:bg-[#f7f4ed]">
                    <td className="py-3 pr-2">
                      <p className="font-semibold text-[#1a1f26]">{it.descricao}</p>
                      <span className="text-[10px] text-[#6b7280]">
                        Forma de cobrança: {it.formaCobranca || 'Fixo'}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono">{it.quantidade}</td>
                    <td className="py-3 text-center text-[#786b53]">
                      {it.prazoDiasUteis ? `${it.prazoDiasUteis} d. úteis` : '5 d. úteis'}
                    </td>
                    <td className="py-3 text-right font-mono text-[#4b5563]">
                      {formatCurrency(it.valorUnitario)}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-[#1a1f26]">
                      {formatCurrency(it.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumo Financeiro & Condições */}
          <div className="my-6 p-4 rounded-xl bg-[#f0ebe1] border border-[#e2d9ca] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#786b53] block">
                Condições de Pagamento
              </span>
              <p className="font-medium text-[#1a1f26]">{proposta.condicoesPagamento}</p>
              <p className="text-[11px] text-[#6b7280]">
                Parcelamento em {proposta.parcelas || 1}x sem juros (Pix ou Boleto Bancário).
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-[#d1c7b5] sm:pl-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#786b53] block">
                Valor Total Proposto
              </span>
              <span className="font-serif text-2xl font-bold text-[#8a754d]">
                {formatCurrency(proposta.valorTotal)}
              </span>
            </div>
          </div>

          {/* Cláusulas e Observações */}
          <div className="space-y-2 text-[11px] text-[#555f6d] leading-relaxed border-t border-[#e2d9ca] pt-4">
            <p>
              <strong>1. Confidencialidade e LGPD:</strong> Em cumprimento à Lei nº 13.709/2018 (LGPD) e ao Código de Ética Médica, todos os dados clínicos e prontuários fornecidos serão tratados com sigilo profissional estrito.
            </p>
            <p>
              <strong>2. Prazos Processuais:</strong> A contagem dos prazos em dias úteis tem início a partir da entrega integral da documentação médica indispensável à elaboração do parecer ou quesitos.
            </p>
            <p>
              <strong>3. Aceite:</strong> O aceite desta proposta ensejará a formalização do contrato de prestação de serviços periciais e a emissão das respectivas ordens de serviço.
            </p>
          </div>

          {/* Assinatura */}
          <div className="mt-12 pt-6 border-t border-[#d1c7b5] flex flex-col sm:flex-row items-center justify-between text-center gap-6">
            <div>
              <p className="font-serif text-sm font-bold text-[#1a1f26]">Dra. Karine Reis</p>
              <p className="text-[11px] text-[#6b7280]">CRM/SP 123.456 • RQE Medicina Forense</p>
              <p className="text-[10px] text-[#8a754d] font-semibold mt-0.5">
                Crivo Forense Assessoria Médico-Pericial
              </p>
            </div>

            <div className="text-[11px] text-[#6b7280] text-center sm:text-right">
              <p>São Paulo/SP</p>
              <p>Validade: {formatDate(proposta.validadeAte)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
