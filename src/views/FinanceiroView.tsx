import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  QrCode,
  FileCheck,
  Plus,
  CheckCircle,
  Clock,
  Car,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { cobrancaRepository, despesaRepository, processoRepository } from '../services';
import { Cobranca, Despesa, Processo } from '../types';
import { formatCurrency, formatDate, formatProcesso } from '../utils/formatters';
import { pagamentosAdapter, GerarCobrancaResult } from '../integrations/pagamentos';

export const FinanceiroView: React.FC = () => {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);

  // Pix / Boleto modal state
  const [modalPixResult, setModalPixResult] = useState<GerarCobrancaResult | null>(null);
  const [copiadoPix, setCopiadoPix] = useState(false);

  useEffect(() => {
    Promise.all([
      cobrancaRepository.getAll(),
      despesaRepository.getAll(),
      processoRepository.getAll(),
    ]).then(([c, d, p]) => {
      setCobrancas(c);
      setDespesas(d);
      setProcessos(p);
    });
  }, []);

  const totalRecebido = cobrancas
    .filter((c) => c.status === 'Paga')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPendente = cobrancas
    .filter((c) => c.status === 'Pendente')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);

  const handleGerarPixBoleto = async (cobranca: Cobranca) => {
    const res = await pagamentosAdapter.gerarCobrancaPixEBoleto({
      valor: cobranca.valor,
      descricao: cobranca.titulo,
      clienteNome: cobranca.devedorNome,
      clienteCpfCnpj: '12.345.678/0001-90',
      dataVencimento: cobranca.vencimento,
    });
    setModalPixResult(res);
  };

  const handleCopiarPix = (pixText: string) => {
    navigator.clipboard.writeText(pixText);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
          Gestão Financeira & Honorários Periciais
        </h1>
        <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
          Controle de honorários contratuais de assistência técnica, honorários fixados pelo juízo e despesas de deslocamento pericial.
        </p>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-xs text-[#545c6b] uppercase font-semibold">Total Recebido</span>
          <div className="text-2xl font-serif text-emerald-400">
            {formatCurrency(totalRecebido)}
          </div>
          <p className="text-[11px] text-[#545c6b]">Honorários compensados via Pix / TED</p>
        </div>

        <div className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-xs text-[#545c6b] uppercase font-semibold">A Receber / Em Aberto</span>
          <div className="text-2xl font-serif text-[#b8a47c]">
            {formatCurrency(totalPendente)}
          </div>
          <p className="text-[11px] text-[#545c6b]">Escritórios e depósitos judiciais pendentes</p>
        </div>

        <div className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-xs text-[#545c6b] uppercase font-semibold">Despesas de Deslocamento</span>
          <div className="text-2xl font-serif text-[#e8e1d0]">
            {formatCurrency(totalDespesas)}
          </div>
          <p className="text-[11px] text-[#545c6b]">Km rodado, pedágios e diárias periciais</p>
        </div>
      </div>

      {/* Cobranças de Honorários */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-[#f4efe3]">
            Cobranças & Honorários Periciais
          </h2>
        </div>

        <div className="bg-[#12171f] border border-[#1b222d] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161c26] text-[#b8a47c] uppercase tracking-wider font-semibold border-b border-[#1b222d]">
                <tr>
                  <th className="px-4 py-3">Descrição / Título</th>
                  <th className="px-4 py-3">Devedor</th>
                  <th className="px-4 py-3">Tipo Devedor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b222d] text-[#e8e1d0]">
                {cobrancas.map((cob) => {
                  const isPaga = cob.status === 'Paga';

                  return (
                    <tr key={cob.id} className="hover:bg-[#1b222d]/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#f4efe3]">
                        {cob.titulo}
                      </td>
                      <td className="px-4 py-3">{cob.devedorNome}</td>
                      <td className="px-4 py-3 text-[#545c6b]">{cob.devedorTipo}</td>
                      <td className="px-4 py-3">{formatDate(cob.vencimento)}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-[#b8a47c]">
                        {formatCurrency(cob.valor)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isPaga
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                              : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                          }`}
                        >
                          {cob.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isPaga && (
                          <button
                            onClick={() => handleGerarPixBoleto(cob)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#b8a47c] text-[11px] font-medium transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Gerar Pix / Boleto
                          </button>
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

      {/* Despesas de Deslocamento Pericial */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg text-[#f4efe3]">
          Despesas de Deslocamento & Logística de Exames
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {despesas.map((desp) => (
            <div
              key={desp.id}
              className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-[#545c6b]">
                <span className="flex items-center gap-1.5 font-medium text-[#e8e1d0]">
                  <Car className="w-3.5 h-3.5 text-[#b8a47c]" />
                  {desp.categoria}
                </span>
                <span>{formatDate(desp.data)}</span>
              </div>
              <p className="text-[#f4efe3] font-semibold">{desp.descricao}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#1b222d] font-mono">
                <span className="text-[#b8a47c] font-semibold">
                  {formatCurrency(desp.valor)}
                </span>
                <span className={`text-[10px] ${desp.reembolsavel ? 'text-[#5b9cd9]' : 'text-[#545c6b]'}`}>
                  {desp.reembolsavel ? 'Reembolsável p/ Advogado' : 'Custo Operacional Crivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Pix & Boleto */}
      {modalPixResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#12171f] border border-[#263040] rounded-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#263040] pb-3">
              <h2 className="font-serif text-lg text-[#f4efe3] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#b8a47c]" />
                Cobrança Integrada (Asaas / Pix)
              </h2>
              <button onClick={() => setModalPixResult(null)} className="text-[#545c6b] hover:text-[#f4efe3]">
                ✕
              </button>
            </div>

            <div className="text-center space-y-3">
              <img
                src={modalPixResult.pixQrCodeUrl}
                alt="QR Code Pix"
                className="w-48 h-48 mx-auto rounded-lg border border-[#263040] bg-white p-2"
              />
              <p className="text-[11px] text-[#545c6b]">
                Aponte o app do banco para pagar instantaneamente ou copie a chave Pix.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#1b222d] border border-[#263040] space-y-1">
              <span className="text-[#545c6b] block text-[10px]">Pix Copia e Cola:</span>
              <div className="font-mono text-[11px] text-[#e8e1d0] truncate">
                {modalPixResult.pixCopiaECola}
              </div>
              <button
                onClick={() => handleCopiarPix(modalPixResult.pixCopiaECola)}
                className="w-full mt-2 py-1.5 rounded bg-[#b8a47c] text-[#0a0e14] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#c7b692] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiadoPix ? 'Chave Pix Copiada!' : 'Copiar Código Pix'}
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#1b222d] border border-[#263040] space-y-1">
              <span className="text-[#545c6b] block text-[10px]">Linha Digitável do Boleto Bancário:</span>
              <div className="font-mono text-[11px] text-[#e8e1d0] truncate">
                {modalPixResult.linhaDigitavel}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalPixResult(null)}
                className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0] hover:bg-[#232c3a]"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
