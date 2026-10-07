import React, { useState } from 'react';
import { Globe, ArrowUpRight, CheckCircle2, ShieldCheck, Stethoscope, Send } from 'lucide-react';
import { leadRepository } from '../services';

export const SiteView: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [criadoComSucesso, setCriadoComSucesso] = useState(false);

  const handleSimularCaptura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    const agora = new Date().toISOString().split('T')[0];
    await leadRepository.create({
      tipo: 'Advogado',
      nome,
      contatoNome: nome,
      whatsapp: telefone,
      telefone,
      email,
      cidade: 'São Paulo',
      uf: 'SP',
      area: 'Cível - Erro Médico',
      areaDireito: 'Cível - Erro Médico',
      modalidade: 'Assistente Técnica',
      faseProcesso: 'Pré-ajuizamento',
      necessidade: `Demanda recebida via site crivoforense.com.br: "${mensagem}"`,
      prazoEmCurso: false,
      origem: 'Formulário do site',
      canalOrigem: 'Formulário do site',
      statusFunil: 'Novo',
      funilId: 'funil_assistencia',
      etapaId: 'Novo',
      score: 85,
      tags: ['Site', 'Lead Web'],
      valorEstimado: 5000,
      dataCriacao: agora,
      dataUltimoContato: agora,
      dataEntradaEtapa: agora,
      responsavelId: 'user_karine',
      observacoes: `Captura via formulário do site: "${mensagem}"`,
    });

    setCriadoComSucesso(true);
    setNome('');
    setEmail('');
    setTelefone('');
    setMensagem('');
    setTimeout(() => setCriadoComSucesso(false), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Site & Formulários de Captura (crivoforense.com.br)
          </h1>
          <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
            Integração nativa com a página institucional da Dra. Karine Reis. Leads entram diretamente no funil.
          </p>
        </div>

        <a
          href="https://crivoforense.com.br"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#b8a47c] text-xs font-semibold tracking-wide transition-colors self-start sm:self-auto"
        >
          <Globe className="w-4 h-4" />
          Acessar Site Institucional
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simulador do Formulário do Site */}
        <div className="bg-[#12171f] border border-[#1b222d] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1b222d] pb-3">
            <Globe className="w-5 h-5 text-[#b8a47c]" />
            <div>
              <h3 className="font-serif text-base text-[#f4efe3]">
                Simular Envio do Formulário do Site
              </h3>
              <p className="text-[11px] text-[#545c6b]">
                Teste a entrada automática do lead no CRM
              </p>
            </div>
          </div>

          {criadoComSucesso && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Lead inserido com sucesso na coluna &quot;Novo Lead&quot; do Funil!
            </div>
          )}

          <form onSubmit={handleSimularCaptura} className="space-y-3 text-xs">
            <div>
              <label className="block text-[#545c6b] mb-1">Nome do Advogado / Solicitante *</label>
              <input
                type="text"
                required
                placeholder="Dr. Fernando Brandão"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#545c6b] mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="advogado@escritorio.adv.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>
              <div>
                <label className="block text-[#545c6b] mb-1">WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 98888-7777"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#545c6b] mb-1">Dúvida / Resumo do Caso</label>
              <textarea
                rows={3}
                placeholder="Preciso de quesitos para um processo de erro médico cirúrgico..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold hover:bg-[#c7b692] flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              Enviar Solicitação de Orçamento
            </button>
          </form>
        </div>

        {/* Informações da Marca Crivo Forense */}
        <div className="bg-[#12171f] border border-[#1b222d] rounded-2xl p-6 shadow-xl space-y-4 text-xs text-[#e8e1d0]">
          <h3 className="font-serif text-base text-[#f4efe3] border-b border-[#1b222d] pb-3">
            Identidade & Credenciais Técnicas
          </h3>

          <div className="space-y-3 leading-relaxed">
            <div className="p-3.5 rounded-lg bg-[#1b222d] border border-[#263040] space-y-1">
              <span className="text-[#b8a47c] font-semibold block text-sm">
                Dra. Karine Reis
              </span>
              <p className="text-[#545c6b]">
                Médica Perita Judicial e Assistente Técnica Forense.
              </p>
              <div className="text-xs text-[#f4efe3] pt-1">
                <strong>CRM/SP 235.821</strong> • <strong>CRM/TO 6.385</strong>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#1b222d] space-y-1">
              <span className="text-[#545c6b] block font-semibold uppercase text-[10px]">
                Pilares da Crivo Forense
              </span>
              <ul className="list-disc list-inside space-y-1 text-[#e8e1d0]/80">
                <li>Rigor científico fundamentado no Código de Processo Civil (CPC/15)</li>
                <li>Quesitação técnica cirúrgica para instrução probatória</li>
                <li>Cumprimento estrito de prazos processuais fatais</li>
                <li>Atuação presencial em São Paulo e no Tocantins</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
