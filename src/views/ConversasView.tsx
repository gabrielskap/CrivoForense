import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  Paperclip,
  CheckCheck,
  Search,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { advogadoRepository, leadRepository } from '../services';
import { Advogado } from '../types';
import { formatPhone } from '../utils/formatters';
import { whatsappAdapter } from '../integrations/whatsapp';

interface MensagemSimulada {
  id: string;
  autor: 'dra_karine' | 'advogado';
  texto: string;
  hora: string;
}

export const ConversasView: React.FC = () => {
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [selectedAdv, setSelectedAdv] = useState<Advogado | null>(null);
  const [mensagens, setMensagens] = useState<MensagemSimulada[]>([
    {
      id: 'm1',
      autor: 'advogado',
      texto: 'Dra. Karine, boa tarde! Acabamos de juntar a procuração nos autos. Já temos a data da perícia pelo IMESC?',
      hora: '14:20',
    },
    {
      id: 'm2',
      autor: 'dra_karine',
      texto: 'Boa tarde, Dr.! Sim, foi agendada para o dia 24/10 às 15:00. Já estou com os prontuários e formulando os quesitos específicos para protocolarmos no prazo.',
      hora: '14:25',
    },
    {
      id: 'm3',
      autor: 'advogado',
      texto: 'Perfeito! Se puder frisar bem a limitação funcional da mão direita na quesitação, vai nos ajudar muito.',
      hora: '14:32',
    }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    advogadoRepository.getAll().then((advs) => {
      setAdvogados(advs);
      if (advs.length > 0) setSelectedAdv(advs[0]);
    });
  }, []);

  const handleEnviarMensagem = async (textoParaEnviar?: string) => {
    const texto = textoParaEnviar || inputTexto;
    if (!texto.trim() || !selectedAdv) return;

    setIsSending(true);
    await whatsappAdapter.enviarMensagem({
      telefone: selectedAdv.whatsapp,
      mensagem: texto,
      advogadoNome: selectedAdv.nome,
    });

    setMensagens((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        autor: 'dra_karine',
        texto,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setInputTexto('');
    setIsSending(false);
  };

  const aplicarModelo = (modeloId: string) => {
    const modelo = whatsappAdapter.modelosPreDefinidos.find((m) => m.id === modeloId);
    if (!modelo || !selectedAdv) return;

    const textoFormatado = modelo.texto
      .replace('{advogado}', selectedAdv.nome)
      .replace('{processo}', '1001429-87.2023.5.02.0042')
      .replace('{data_hora}', '18/10 às 14:00')
      .replace('{local}', 'Consultório Judicial');

    setInputTexto(textoFormatado);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
          Central de Conversas & WhatsApp
        </h1>
        <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
          Comunicação direta com advogados, envio rápido de quesitos e alinhamentos de perícia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[650px] bg-[#12171f] border border-[#1b222d] rounded-2xl overflow-hidden shadow-xl">
        {/* Left Col: Lista de Conversas com Advogados */}
        <div className="border-r border-[#1b222d] flex flex-col bg-[#0e1219]">
          <div className="p-3 border-b border-[#1b222d]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#545c6b] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar advogado ou OAB..."
                className="w-full bg-[#1b222d] text-xs text-[#f4efe3] placeholder-[#545c6b] rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#b8a47c]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1b222d]/40">
            {advogados.map((adv) => {
              const isSelected = selectedAdv?.id === adv.id;
              return (
                <div
                  key={adv.id}
                  onClick={() => setSelectedAdv(adv)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#1b222d]' : 'hover:bg-[#161c26]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#f4efe3] truncate">
                      {adv.nome}
                    </span>
                    <span className="text-[10px] text-[#545c6b]">14:32</span>
                  </div>
                  <div className="text-[11px] text-[#b8a47c] mt-0.5">
                    OAB/{adv.oabUf} nº {adv.oabNumero}
                  </div>
                  <div className="text-[11px] text-[#545c6b] truncate mt-1">
                    {formatPhone(adv.whatsapp)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Chat Interativo */}
        <div className="md:col-span-2 flex flex-col h-full bg-[#12171f]">
          {selectedAdv ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-[#1b222d] bg-[#161c26] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#f4efe3] flex items-center gap-2">
                    {selectedAdv.nome}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                      WhatsApp Conectado
                    </span>
                  </h3>
                  <p className="text-xs text-[#545c6b]">
                    OAB/{selectedAdv.oabUf} nº {selectedAdv.oabNumero} • {formatPhone(selectedAdv.whatsapp)}
                  </p>
                </div>

                <a
                  href={whatsappAdapter.gerarLinkDireto(
                    selectedAdv.whatsapp,
                    'Olá Dr., aqui é da equipe da Dra. Karine Reis (Crivo Forense).'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir no WhatsApp Web
                </a>
              </div>

              {/* Mensagens do Histórico */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {mensagens.map((msg) => {
                  const isKarine = msg.autor === 'dra_karine';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isKarine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-xl text-xs space-y-1 shadow-sm ${
                          isKarine
                            ? 'bg-[#b8a47c]/20 text-[#f4efe3] border border-[#b8a47c]/30 rounded-tr-none'
                            : 'bg-[#1b222d] text-[#e8e1d0] border border-[#263040] rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.texto}</p>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-[#545c6b]">
                          <span>{msg.hora}</span>
                          {isKarine && <CheckCheck className="w-3 h-3 text-[#b8a47c]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modelos Rápidos Periciais */}
              <div className="px-4 py-2 border-t border-[#1b222d] bg-[#161c26] flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-[#545c6b] shrink-0 font-medium">Modelos:</span>
                {whatsappAdapter.modelosPreDefinidos.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => aplicarModelo(mod.id)}
                    className="px-2.5 py-1 rounded bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#e8e1d0] whitespace-nowrap transition-colors"
                  >
                    {mod.titulo}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-[#1b222d] bg-[#12171f] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem pericial..."
                  value={inputTexto}
                  onChange={(e) => setInputTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEnviarMensagem();
                  }}
                  className="flex-1 bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-xs text-[#f4efe3] placeholder-[#545c6b] focus:outline-none focus:border-[#b8a47c]"
                />
                <button
                  onClick={() => handleEnviarMensagem()}
                  disabled={isSending || !inputTexto.trim()}
                  className="p-2 rounded-lg bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#545c6b]">
              Selecione um advogado na lista para iniciar
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
