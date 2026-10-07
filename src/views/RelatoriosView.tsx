import React from 'react';
import { BarChart3, TrendingUp, CheckCircle, PieChart, FileText, Download, Award } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const RelatoriosView: React.FC = () => {
  const rankingEscritorios = [
    { nome: 'Barros & Pimentel Direito à Saúde', processos: 4, faturamento: 28500, taxaConcordancia: '95%' },
    { nome: 'TMB Trabalhista - Toledo Mattos', processos: 5, faturamento: 24000, taxaConcordancia: '90%' },
    { nome: 'Silveira & Associados Previdenciário', processos: 4, faturamento: 16500, taxaConcordancia: '88%' },
    { nome: 'Oliveira & Arantes Advocacia (TO)', processos: 3, faturamento: 11200, taxaConcordancia: '85%' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Relatórios & Desempenho Médico-Pericial
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Métricas de êxito dos pareceres técnicos, cumprimento de prazos e receita por escritório parceiro.
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#b8a47c] text-xs font-semibold tracking-wide transition-colors self-start sm:self-auto">
          <Download className="w-4 h-4" />
          Exportar Relatório em PDF / Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-xs text-[#545c6b] uppercase font-semibold">Taxa de Adesão do Juízo</span>
          <div className="text-2xl font-serif text-emerald-400">89.4%</div>
          <p className="text-[11px] text-[#545c6b]">Laudos oficiais que acolheram os quesitos da Crivo</p>
        </div>

        <div className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-xs text-[#545c6b] uppercase font-semibold">Tempo Médio de Elaboração</span>
          <div className="text-2xl font-serif text-[#b8a47c]">3.2 dias</div>
          <p className="text-[11px] text-[#545c6b]">Elaboração de quesitos iniciais e manifestações</p>
        </div>

        <div className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-xs text-[#545c6b] uppercase font-semibold">Perícias Realizadas no Ano</span>
          <div className="text-2xl font-serif text-[#5b9cd9]">48 perícias</div>
          <p className="text-[11px] text-[#545c6b]">Comarcas de SP capital, interior e Tocantins</p>
        </div>
      </div>

      {/* Tabela de Escritórios Parceiros */}
      <div className="bg-[#12171f] border border-[#1b222d] rounded-xl overflow-hidden shadow-sm space-y-3 p-5">
        <h3 className="font-serif text-base text-[#f4efe3]">
          Desempenho por Escritório de Advocacia Parceiro
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161c26] text-[#b8a47c] uppercase tracking-wider font-semibold border-b border-[#1b222d]">
              <tr>
                <th className="px-4 py-3">Escritório Parceiro</th>
                <th className="px-4 py-3">Processos Atendidos</th>
                <th className="px-4 py-3">Faturamento Total</th>
                <th className="px-4 py-3">Êxito Técnico Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b222d] text-[#e8e1d0]">
              {rankingEscritorios.map((esc, i) => (
                <tr key={i} className="hover:bg-[#1b222d]/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#f4efe3]">{esc.nome}</td>
                  <td className="px-4 py-3 font-mono">{esc.processos} casos</td>
                  <td className="px-4 py-3 font-mono text-[#b8a47c] font-semibold">
                    {formatCurrency(esc.faturamento)}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-mono font-semibold">
                    {esc.taxaConcordancia}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
