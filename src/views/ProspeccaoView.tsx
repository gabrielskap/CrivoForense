import React from 'react';
import { Compass, Users, Send, Target, TrendingUp, Sparkles, Plus } from 'lucide-react';

export const ProspeccaoView: React.FC = () => {
  const campanhas = [
    {
      id: 'c1',
      nome: 'Parceria Assistência Médica em Erro Médico (OAB/SP Capital)',
      canal: 'E-mail + LinkedIn',
      publico: 'Advogados especialistas em Direito à Saúde e Cível',
      enviados: 120,
      abertura: '68%',
      leadsGerados: 12,
      status: 'Em Disparo',
    },
    {
      id: 'c2',
      nome: 'Quesitação Estratégica Previdenciária Rural e Urbana (Tocantins)',
      canal: 'WhatsApp',
      publico: 'Escritórios de Advocacia Previdenciária (Palmas e Interior)',
      enviados: 85,
      abertura: '92%',
      leadsGerados: 18,
      status: 'Ativa',
    },
    {
      id: 'c3',
      nome: 'Defesa Técnica Pericial em LER/DORT para Bancários (Campinas/SP)',
      canal: 'LinkedIn',
      publico: 'Sócios de escritórios trabalhistas',
      enviados: 60,
      abertura: '54%',
      leadsGerados: 6,
      status: 'Finalizada',
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Prospecção Ativa & Parcerias Jurídicas
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Campanhas segmentadas de assistência técnica para bancas de advocacia em SP e TO.
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campanhas.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-3 flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                {c.status}
              </span>
              <h3 className="text-sm font-semibold text-[#f4efe3]">{c.nome}</h3>
              <p className="text-xs text-[#545c6b]">Público: {c.publico}</p>
              <div className="text-[11px] text-[#5b9cd9]">Canal: {c.canal}</div>
            </div>

            <div className="pt-3 border-t border-[#1b222d] grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[#545c6b] block text-[10px]">Contatados</span>
                <span className="font-semibold text-[#f4efe3] font-mono">{c.enviados}</span>
              </div>
              <div>
                <span className="text-[#545c6b] block text-[10px]">Engajamento</span>
                <span className="font-semibold text-[#b8a47c] font-mono">{c.abertura}</span>
              </div>
              <div>
                <span className="text-[#545c6b] block text-[10px]">Leads CRM</span>
                <span className="font-semibold text-emerald-400 font-mono">{c.leadsGerados}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
