import React, { useState } from 'react';
import {
  X,
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Lead } from '../../types';
import { leadRepository, interacaoRepository, auditLogRepository } from '../../services';
import { formatCurrency, formatPhone, formatCpf, formatCnpj } from '../../utils/formatters';

interface DuplicateMergeModalProps {
  leadPrincipal: Lead;
  leadDuplicado: Lead;
  criterioMatch: string; // Ex: 'Telefone coincidente', 'E-mail idêntico', 'OAB correspondente'
  onClose: () => void;
  onMerged: () => void;
}

export const DuplicateMergeModal: React.FC<DuplicateMergeModalProps> = ({
  leadPrincipal,
  leadDuplicado,
  criterioMatch,
  onClose,
  onMerged,
}) => {
  // Escolha de valores consolidados
  const [nomeEscolhido, setNomeEscolhido] = useState(leadPrincipal.nome);
  const [telefoneEscolhido, setTelefoneEscolhido] = useState(leadPrincipal.whatsapp || leadPrincipal.telefone || leadDuplicado.whatsapp || '');
  const [emailEscolhido, setEmailEscolhido] = useState(leadPrincipal.email || leadDuplicado.email || '');
  const [responsavelEscolhido, setResponsavelEscolhido] = useState(leadPrincipal.responsavelId || leadDuplicado.responsavelId);
  const [etapaEscolhida, setEtapaEscolhida] = useState(leadPrincipal.statusFunil);
  const [valorEscolhido, setValorEscolhido] = useState(
    Math.max(leadPrincipal.valorEstimado || 0, leadDuplicado.valorEstimado || 0)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combina tags únicas
      const tagsCombinadas = Array.from(new Set([...(leadPrincipal.tags || []), ...(leadDuplicado.tags || [])]));

      // Observações consolidadas
      const observacoesCombinadas = [
        leadPrincipal.observacoes,
        leadDuplicado.observacoes ? `[Do duplicado (${leadDuplicado.id})]: ${leadDuplicado.observacoes}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      // 1. Atualiza o lead principal com as informações consolidadas
      await leadRepository.update(leadPrincipal.id, {
        nome: nomeEscolhido,
        whatsapp: telefoneEscolhido,
        telefone: telefoneEscolhido,
        email: emailEscolhido,
        responsavelId: responsavelEscolhido,
        statusFunil: etapaEscolhida,
        valorEstimado: valorEscolhido,
        tags: tagsCombinadas,
        observacoes: observacoesCombinadas,
      });

      // 2. Transfere interações do lead duplicado para o lead principal
      const interacoesDuplicado = await interacaoRepository.getByContato('lead', leadDuplicado.id);
      for (const inter of interacoesDuplicado) {
        await interacaoRepository.update(inter.id, {
          leadId: leadPrincipal.id,
        });
      }

      // 3. Registra interação de mesclagem no lead principal
      await interacaoRepository.create({
        tipo: 'Evento do Sistema',
        titulo: 'Registros de Leads Mesclados',
        descricao: `O lead "${leadDuplicado.nome}" (${leadDuplicado.id}) foi unificado com este registro devido a duplicidade de ${criterioMatch}. Histórico de interações incorporado.`,
        dataHora: new Date().toISOString(),
        usuarioId: 'user_karine',
        usuarioNome: 'Dra. Karine Reis',
        leadId: leadPrincipal.id,
      });

      // 4. Remove o lead duplicado
      await leadRepository.delete(leadDuplicado.id);

      // 5. Registra auditoria
      await auditLogRepository.logAccess({
        acao: 'Mesclagem e Deduplicação de Leads',
        entidade: 'Lead',
        entidadeId: leadPrincipal.id,
        detalhes: `Lead ${leadDuplicado.id} mesclado ao lead principal ${leadPrincipal.id} por critério: ${criterioMatch}.`,
        isDadoSensivelSaude: false,
      });

      onMerged();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e8e1d0]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#263040] bg-[#161c26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#f4efe3]">Mesclar Registros Duplicados</h3>
              <p className="text-xs text-amber-300/80">
                Duplicidade detectada por: <strong>{criterioMatch}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <form onSubmit={handleMerge} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          
          <div className="p-3.5 rounded-xl bg-[#161c26] border border-[#263040] text-[#e8e1d0]/80 leading-relaxed">
            Selecione quais valores deseja manter no registro unificado final. Todo o histórico de mensagens do WhatsApp, notas e tarefas do registro duplicado será incorporado ao registro principal automaticamente.
          </div>

          {/* Grid de Comparação Lado a Lado */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Coluna 1: Lead Principal */}
            <div className="p-4 rounded-xl bg-[#161c26] border-2 border-[#b8a47c]/60 space-y-3">
              <div className="flex items-center justify-between border-b border-[#263040] pb-2">
                <span className="font-semibold text-[#b8a47c] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-[#b8a47c]" />
                  Registro Principal (ID: {leadPrincipal.id})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#b8a47c]/15 text-[#b8a47c]">Manter ID</span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-[#545c6b] block">Nome</span>
                  <label className="flex items-center gap-2 mt-0.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nome"
                      checked={nomeEscolhido === leadPrincipal.nome}
                      onChange={() => setNomeEscolhido(leadPrincipal.nome)}
                      className="accent-[#b8a47c]"
                    />
                    <span className="font-semibold text-[#f4efe3]">{leadPrincipal.nome}</span>
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-[#545c6b] block">WhatsApp / Telefone</span>
                  <label className="flex items-center gap-2 mt-0.5 cursor-pointer">
                    <input
                      type="radio"
                      name="telefone"
                      checked={telefoneEscolhido === (leadPrincipal.whatsapp || leadPrincipal.telefone)}
                      onChange={() => setTelefoneEscolhido(leadPrincipal.whatsapp || leadPrincipal.telefone || '')}
                      className="accent-[#b8a47c]"
                    />
                    <span>{formatPhone(leadPrincipal.whatsapp || leadPrincipal.telefone)}</span>
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-[#545c6b] block">E-mail</span>
                  <label className="flex items-center gap-2 mt-0.5 cursor-pointer">
                    <input
                      type="radio"
                      name="email"
                      checked={emailEscolhido === leadPrincipal.email}
                      onChange={() => setEmailEscolhido(leadPrincipal.email)}
                      className="accent-[#b8a47c]"
                    />
                    <span className="truncate">{leadPrincipal.email}</span>
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-[#545c6b] block">Fase do Funil</span>
                  <span className="px-2 py-0.5 rounded bg-[#1b222d] text-[#b8a47c] font-semibold text-[11px] inline-block mt-0.5">
                    {leadPrincipal.statusFunil}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#545c6b] block">Valor Estimado</span>
                  <span className="font-mono font-bold text-[#b8a47c]">
                    {formatCurrency(leadPrincipal.valorEstimado)}
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna 2: Lead Duplicado */}
            <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
              <div className="flex items-center justify-between border-b border-[#263040] pb-2">
                <span className="font-semibold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Duplicado (ID: {leadDuplicado.id})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300">Será Fundido</span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-[#545c6b] block">Nome</span>
                  <label className="flex items-center gap-2 mt-0.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nome"
                      checked={nomeEscolhido === leadDuplicado.nome}
                      onChange={() => setNomeEscolhido(leadDuplicado.nome)}
                      className="accent-[#b8a47c]"
                    />
                    <span className="font-semibold text-[#f4efe3]">{leadDuplicado.nome}</span>
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-[#545c6b] block">WhatsApp / Telefone</span>
                  <label className="flex items-center gap-2 mt-0.5 cursor-pointer">
                    <input
                      type="radio"
                      name="telefone"
                      checked={telefoneEscolhido === (leadDuplicado.whatsapp || leadDuplicado.telefone)}
                      onChange={() => setTelefoneEscolhido(leadDuplicado.whatsapp || leadDuplicado.telefone || '')}
                      className="accent-[#b8a47c]"
                    />
                    <span>{formatPhone(leadDuplicado.whatsapp || leadDuplicado.telefone)}</span>
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-[#545c6b] block">E-mail</span>
                  <label className="flex items-center gap-2 mt-0.5 cursor-pointer">
                    <input
                      type="radio"
                      name="email"
                      checked={emailEscolhido === leadDuplicado.email}
                      onChange={() => setEmailEscolhido(leadDuplicado.email)}
                      className="accent-[#b8a47c]"
                    />
                    <span className="truncate">{leadDuplicado.email}</span>
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-[#545c6b] block">Fase do Funil</span>
                  <span className="px-2 py-0.5 rounded bg-[#1b222d] text-[#5b9cd9] font-semibold text-[11px] inline-block mt-0.5">
                    {leadDuplicado.statusFunil}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#545c6b] block">Valor Estimado</span>
                  <span className="font-mono font-bold text-[#b8a47c]">
                    {formatCurrency(leadDuplicado.valorEstimado)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#263040]">
            <span className="text-[11px] text-[#545c6b]">
              Tags e histórico de ambos os registros serão combinados sem perda de dados.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0] hover:bg-[#263040]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-bold text-xs tracking-wide uppercase hover:bg-[#c7b692] shadow-md transition-all"
              >
                <GitMerge className="w-4 h-4" />
                {isSubmitting ? 'Mesclando...' : 'Confirmar Mesclagem'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
