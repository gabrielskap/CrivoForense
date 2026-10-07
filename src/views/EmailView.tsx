import React, { useState } from 'react';
import { Mail, Send, Paperclip, CheckCircle, FileText, Inbox } from 'lucide-react';
import { emailAdapter } from '../integrations/email';

export const EmailView: React.FC = () => {
  const [destinatario, setDestinatario] = useState('rodrigo@silveiraadv.com.br');
  const [assunto, setAssunto] = useState('Crivo Forense - Parecer Técnico Conclusivo - Autos 5002148-12');
  const [corpo, setCorpo] = useState(
    'Prezado Dr. Rodrigo Silveira,\n\nEm anexo, encaminhamos o Parecer Técnico Médico-Pericial conclusivo elaborado pela Dra. Karine Reis (CRM/SP 235.821 | CRM/TO 6.385).\n\nConcluímos pela incapacidade laboral permanente do periciando Antônio Carlos da Silva para atividades habituais pesadas com nexo técnico.\n\nAtenciosamente,\nEquipe Crivo Forense'
  );
  const [enviadoComSucesso, setEnviadoComSucesso] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    await emailAdapter.enviarEmail({
      destinatarioEmail: destinatario,
      destinatarioNome: 'Dr. Rodrigo Silveira',
      assunto,
      corpoTexto: corpo,
    });
    setIsSending(false);
    setEnviadoComSucesso(true);
    setTimeout(() => setEnviadoComSucesso(false), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
          Central de E-mails & Pareceres
        </h1>
        <p className="text-xs sm:text-sm text-[#545c6b] mt-1">
          Envio formal de laudos, propostas contratuais e manifestações ao juízo.
        </p>
      </div>

      <div className="max-w-3xl bg-[#12171f] border border-[#1b222d] rounded-2xl p-6 shadow-xl space-y-4">
        {enviadoComSucesso && (
          <div className="p-3 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            E-mail enviado com sucesso com comprovante digital!
          </div>
        )}

        <form onSubmit={handleEnviar} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#545c6b] mb-1">Destinatário (Advogado ou Cartório Judicial)</label>
            <input
              type="email"
              required
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
            />
          </div>

          <div>
            <label className="block text-[#545c6b] mb-1">Assunto</label>
            <input
              type="text"
              required
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
            />
          </div>

          <div>
            <label className="block text-[#545c6b] mb-1">Mensagem Formal</label>
            <textarea
              rows={8}
              required
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              className="w-full bg-[#1b222d] border border-[#263040] rounded-lg p-3 text-[#f4efe3] font-mono leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#1b222d] border border-[#263040] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#e8e1d0]">
              <Paperclip className="w-4 h-4 text-[#b8a47c]" />
              <span>Parecer_Tecnico_Conclusivo_Assinado_ICP_Brasil.pdf (890 KB)</span>
            </div>
            <span className="text-[10px] text-emerald-400">Assinado Digitalmente</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold flex items-center gap-2 hover:bg-[#c7b692] disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Enviando...' : 'Enviar Parecer por E-mail'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
