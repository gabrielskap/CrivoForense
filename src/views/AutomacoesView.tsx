import React from 'react';
import { Cpu, Zap, CheckCircle2, Plus, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';

export const AutomacoesView: React.FC = () => {
  const automacoes = [
    {
      id: 'a1',
      nome: 'Lembrete de Perícia Médica Presencial (WhatsApp)',
      gatilho: 'Quando data/hora da perícia for agendada ou faltar 48h',
      acao: 'Disparar mensagem no WhatsApp do advogado e do periciando com lista de documentos originais e localização',
      ativo: true,
      execucoes: 34,
    },
    {
      id: 'a2',
      nome: 'Alerta de Prazo Fatal de 5 dias em Nomeação do Juízo',
      gatilho: 'Nova nomeação cadastrada ou detectada via Diário Oficial',
      acao: 'Criar tarefa urgente para a Dra. Karine Reis peticionar o aceite e proposta de honorários',
      ativo: true,
      execucoes: 12,
    },
    {
      id: 'a3',
      nome: 'Aviso de Juntada de Laudo do Juízo',
      gatilho: 'Quando status processual for alterado para "Laudo Entregue"',
      acao: 'Notificar advogado para envio do laudo e abrir prazo de 15 dias para impugnação / quesitos complementares',
      ativo: true,
      execucoes: 19,
    },
    {
      id: 'a4',
      nome: 'Geração Automática de Cobrança Pix após Aceite',
      gatilho: 'Quando proposta comercial de assistência for aceita pelo advogado',
      acao: 'Gerar link Pix de entrada (50%) e termo de compromisso via Clicksign',
      ativo: false,
      execucoes: 8,
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Automações & Regras Periciais
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Gatilhos inteligentes para não perder prazos judiciais e manter advogados informados.
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nova Regra / Fluxo
        </button>
      </div>

      <div className="space-y-4">
        {automacoes.map((aut) => (
          <div
            key={aut.id}
            className="p-5 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#1b222d] text-[#b8a47c]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3]">{aut.nome}</h3>
                  <span className="text-[11px] text-[#545c6b]">
                    {aut.execucoes} execuções registradas
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  aut.ativo
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {aut.ativo ? 'Ativo' : 'Pausado'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#1b222d]">
              <div className="p-3 rounded-lg bg-[#1b222d]">
                <span className="text-[#545c6b] block text-[10px] uppercase font-semibold">Gatilho</span>
                <span className="text-[#e8e1d0] mt-0.5 block">{aut.gatilho}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#1b222d]">
                <span className="text-[#545c6b] block text-[10px] uppercase font-semibold">Ação Executada</span>
                <span className="text-[#b8a47c] mt-0.5 block">{aut.acao}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
