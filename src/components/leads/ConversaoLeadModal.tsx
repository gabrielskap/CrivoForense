import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Building2,
  UserCheck,
  HeartPulse,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Lead, Escritorio, Advogado, Periciando, Oportunidade } from '../../types';
import {
  escritorioRepository,
  advogadoRepository,
  periciandoRepository,
  oportunidadeRepository,
  leadRepository,
  interacaoRepository,
  auditLogRepository,
} from '../../services';
import { formatCurrency, formatCpf, formatCnpj, formatPhone } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface ConversaoLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onConverted: (resultado: {
    escritorioId?: string;
    advogadoId?: string;
    periciandoId?: string;
    oportunidadeId?: string;
  }) => void;
}

export const ConversaoLeadModal: React.FC<ConversaoLeadModalProps> = ({
  lead,
  onClose,
  onConverted,
}) => {
  const { currentUser } = useAuth();
  const [escritoriosExistentes, setEscritoriosExistentes] = useState<Escritorio[]>([]);
  
  // Opções de conversão
  const [destinoEscritorio, setDestinoEscritorio] = useState<'novo' | 'existente'>(
    lead.tipo === 'Escritório' ? 'novo' : 'existente'
  );
  const [escritorioExistenteId, setEscritorioExistenteId] = useState<string>('');

  // Formulário pré-preenchido
  const [nomeEscritorio, setNomeEscritorio] = useState(
    lead.tipo === 'Escritório' ? lead.nome : `${lead.nome} Sociedade de Advogados`
  );
  const [cnpjEscritorio, setCnpjEscritorio] = useState(lead.cpfCnpj || '');
  const [cidade, setCidade] = useState(lead.cidade || 'São Paulo');
  const [uf, setUf] = useState(lead.uf || 'SP');

  // Advogado
  const [nomeAdvogado, setNomeAdvogado] = useState(lead.contatoNome || lead.nome);
  const [oabNumero, setOabNumero] = useState(lead.oabNumero || '289441');
  const [oabUf, setOabUf] = useState(lead.oabUf || lead.uf || 'SP');
  const [whatsapp, setWhatsapp] = useState(lead.whatsapp || lead.telefone || '');
  const [email, setEmail] = useState(lead.email || '');

  // Oportunidade Gerada
  const [servicoInteresse, setServicoInteresse] = useState(
    lead.necessidade || 'Elaboração de Quesitos e Acompanhamento Pericial'
  );
  const [valorOportunidade, setValorOportunidade] = useState(lead.valorEstimado || 4500);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversaoConcluida, setConversaoConcluida] = useState<{
    escritorioId?: string;
    advogadoId?: string;
    periciandoId?: string;
    oportunidadeId?: string;
  } | null>(null);

  useEffect(() => {
    escritorioRepository.getAll().then((list) => {
      setEscritoriosExistentes(list);
      if (list.length > 0) setEscritorioExistenteId(list[0].id);
    });
  }, []);

  const handleConverter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalEscritorioId: string | undefined;
      let finalAdvogadoId: string | undefined;
      let finalPericiandoId: string | undefined;
      let finalOportunidadeId: string | undefined;

      const agora = new Date().toISOString();

      if (lead.tipo === 'Paciente/Periciando') {
        // Converte diretamente em Periciando (com Prontuário e Consentimento LGPD)
        const novoPer = await periciandoRepository.create({
          nome: lead.nome,
          cpf: lead.cpfCnpj || '000.000.000-00',
          dataNascimento: '1985-05-12',
          sexo: 'M',
          telefone: whatsapp,
          email: email,
          endereco: `${cidade}/${uf}`,
          profissaoAtual: 'A definir no exame pericial',
          dadosSaude: {
            patologias: [lead.necessidade || 'Queixa médica em avaliação pericial'],
            historicoClinico: `Encaminhado via Crivo Forense (${lead.origem}). Aguardando exame físico preliminar.`,
            medicamentosEmUso: 'Em anamnese',
            restricoesFisicas: 'Em avaliação médica pericial',
            cid10Principais: ['M54.5'],
            consentimentoLgpdColetado: true,
          },
          dataCadastro: agora.split('T')[0],
        });
        finalPericiandoId = novoPer.id;

        // Cria oportunidade vinculada
        const novaOp = await oportunidadeRepository.create({
          leadId: lead.id,
          periciandoId: novoPer.id,
          titulo: `Perícia Médica - ${novoPer.nome}`,
          servicoInteresse: servicoInteresse,
          valorEstimado: valorOportunidade,
          probabilidade: 100,
          previsaoFechamento: agora.split('T')[0],
          fase: 'Ganho',
          status: 'Ganha',
          responsavelId: lead.responsavelId || currentUser.id,
          dataCriacao: agora.split('T')[0],
          dataFechamento: agora.split('T')[0],
          observacoes: `Convertido a partir do Lead "${lead.nome}" via Crivo CRM.`,
        });
        finalOportunidadeId = novaOp.id;

      } else {
        // Lead de Advogado ou Escritório
        if (destinoEscritorio === 'novo') {
          const novoEsc = await escritorioRepository.create({
            razaoSocial: nomeEscritorio,
            nomeFantasia: nomeEscritorio,
            cnpj: cnpjEscritorio || '00.000.000/0001-00',
            cidade: cidade,
            uf: uf,
            areasAtuacao: [lead.area !== 'Outro' ? lead.area : 'Trabalhista'],
            telefone: whatsapp,
            email: email,
            endereco: `Edifício Jurídico Central - ${cidade}/${uf}`,
            status: 'Ativo',
            dataCadastro: agora.split('T')[0],
          });
          finalEscritorioId = novoEsc.id;
        } else {
          finalEscritorioId = escritorioExistenteId;
        }

        // Cria Advogado
        const novoAdv = await advogadoRepository.create({
          escritorioId: finalEscritorioId!,
          nome: nomeAdvogado,
          oabNumero: oabNumero,
          oabUf: oabUf,
          whatsapp: whatsapp,
          email: email,
          eDecisor: true,
          cargo: 'Sócio',
          areasAtuacao: [lead.area !== 'Outro' ? lead.area : 'Previdenciário'],
          anotacoes: `Cadastrado na conversão do lead "${lead.nome}". Origem: ${lead.origem}.`,
          dataCadastro: agora.split('T')[0],
        });
        finalAdvogadoId = novoAdv.id;

        // Cria Oportunidade Fechada/Ganha
        const novaOp = await oportunidadeRepository.create({
          leadId: lead.id,
          escritorioId: finalEscritorioId,
          advogadoId: novoAdv.id,
          titulo: `Assistência Pericial - ${novoAdv.nome}`,
          servicoInteresse: servicoInteresse,
          valorEstimado: valorOportunidade,
          probabilidade: 100,
          previsaoFechamento: agora.split('T')[0],
          fase: 'Ganho',
          status: 'Ganha',
          responsavelId: lead.responsavelId || currentUser.id,
          dataCriacao: agora.split('T')[0],
          dataFechamento: agora.split('T')[0],
          observacoes: `Convertido em contratação oficial pela Dra. Karine Reis / Crivo Forense.`,
        });
        finalOportunidadeId = novaOp.id;
      }

      // Transfere interações do lead para as novas entidades
      const interacoesDoLead = await interacaoRepository.getByContato('lead', lead.id);
      for (const inter of interacoesDoLead) {
        await interacaoRepository.update(inter.id, {
          escritorioId: finalEscritorioId,
          advogadoId: finalAdvogadoId,
          periciandoId: finalPericiandoId,
        });
      }

      // Cria interação de conversão
      await interacaoRepository.create({
        tipo: 'Evento do Sistema',
        titulo: 'Lead Convertido com Sucesso',
        descricao: `Lead "${lead.nome}" convertido oficialmente em Escritório/Advogado + Oportunidade no valor de ${formatCurrency(valorOportunidade)}. Histórico preservado.`,
        dataHora: agora,
        usuarioId: currentUser.id,
        usuarioNome: currentUser.nome,
        escritorioId: finalEscritorioId,
        advogadoId: finalAdvogadoId,
        periciandoId: finalPericiandoId,
        leadId: lead.id,
      });

      // Atualiza Lead
      await leadRepository.update(lead.id, {
        statusFunil: 'Ganho',
        convertidoEm: {
          escritorioId: finalEscritorioId,
          advogadoId: finalAdvogadoId,
          periciandoId: finalPericiandoId,
          oportunidadeId: finalOportunidadeId,
          data: agora,
        },
      });

      // Registra no Log de Auditoria
      await auditLogRepository.logAccess({
        acao: 'Conversão de Lead em Contato/Oportunidade',
        entidade: 'Lead',
        entidadeId: lead.id,
        detalhes: `Lead "${lead.nome}" convertido em Escritório (${finalEscritorioId || '-'}), Advogado (${finalAdvogadoId || '-'}), Oportunidade (${finalOportunidadeId}).`,
        isDadoSensivelSaude: lead.tipo === 'Paciente/Periciando',
      });

      const resultado = {
        escritorioId: finalEscritorioId,
        advogadoId: finalAdvogadoId,
        periciandoId: finalPericiandoId,
        oportunidadeId: finalOportunidadeId,
      };

      setConversaoConcluida(resultado);
      onConverted(resultado);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e8e1d0]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#263040] bg-[#161c26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b8a47c]/20 border border-[#b8a47c]/40 text-[#b8a47c] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#f4efe3]">Converter Lead em 1 Clique</h3>
              <p className="text-xs text-[#545c6b]">
                Lead: <strong className="text-[#f4efe3] font-medium">{lead.nome}</strong> ({lead.tipo})
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

        {conversaoConcluida ? (
          /* Sucesso após conversão */
          <div className="p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-serif text-2xl text-[#f4efe3]">Lead Convertido com Sucesso!</h4>
              <p className="text-xs text-[#e8e1d0]/80 max-w-md mx-auto mt-2 leading-relaxed">
                As entidades foram criadas na base de contatos, a oportunidade foi registrada no pipeline como <strong className="text-emerald-400">Ganha</strong> e todo o histórico de interações foi migrado.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-[#545c6b]">
                <span>Status no Funil:</span>
                <span className="font-semibold text-emerald-400">✓ Fechado (Ganho)</span>
              </div>
              <div className="flex items-center justify-between text-[#545c6b]">
                <span>Honorários Contratados:</span>
                <span className="font-mono font-bold text-[#b8a47c]">{formatCurrency(valorOportunidade)}</span>
              </div>
              <div className="flex items-center justify-between text-[#545c6b]">
                <span>Histórico Migrado:</span>
                <span className="text-[#e8e1d0]">Linha do Tempo Preservada</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] shadow-sm transition-colors"
              >
                Concluir e Voltar
              </button>
            </div>
          </div>
        ) : (
          /* Formulário de Configuração da Conversão */
          <form onSubmit={handleConverter} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
            
            <div className="p-3.5 rounded-xl bg-[#161c26] border border-[#263040] text-xs text-[#e8e1d0]/90 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#b8a47c] shrink-0" />
              <span>
                Esta ação criará o cadastro permanente na base de contatos e transformará o lead em cliente contratante oficial.
              </span>
            </div>

            {lead.tipo !== 'Paciente/Periciando' ? (
              <div className="space-y-4">
                {/* Opção Escritório */}
                <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#b8a47c] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Building2 className="w-4 h-4" />
                      1. Escritório de Advocacia Parceiro
                    </span>
                    <div className="flex rounded-lg bg-[#12171f] p-0.5 border border-[#263040]">
                      <button
                        type="button"
                        onClick={() => setDestinoEscritorio('novo')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          destinoEscritorio === 'novo' ? 'bg-[#b8a47c] text-[#0a0e14]' : 'text-[#545c6b]'
                        }`}
                      >
                        Criar Novo
                      </button>
                      <button
                        type="button"
                        onClick={() => setDestinoEscritorio('existente')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          destinoEscritorio === 'existente' ? 'bg-[#b8a47c] text-[#0a0e14]' : 'text-[#545c6b]'
                        }`}
                      >
                        Vincular a Existente
                      </button>
                    </div>
                  </div>

                  {destinoEscritorio === 'novo' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="col-span-2">
                        <label className="block text-[#545c6b] mb-1 font-medium">Razão Social / Nome da Banca *</label>
                        <input
                          type="text"
                          required
                          value={nomeEscritorio}
                          onChange={(e) => setNomeEscritorio(e.target.value)}
                          className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#545c6b] mb-1 font-medium">CNPJ (Opcional)</label>
                        <input
                          type="text"
                          placeholder="00.000.000/0001-00"
                          value={cnpjEscritorio}
                          onChange={(e) => setCnpjEscritorio(e.target.value)}
                          className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[#545c6b] mb-1 font-medium">Cidade</label>
                          <input
                            type="text"
                            value={cidade}
                            onChange={(e) => setCidade(e.target.value)}
                            className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                          />
                        </div>
                        <div>
                          <label className="block text-[#545c6b] mb-1 font-medium">UF</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={uf}
                            onChange={(e) => setUf(e.target.value.toUpperCase())}
                            className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[#545c6b] mb-1 font-medium">Selecione o Escritório Cadastrado *</label>
                      <select
                        value={escritorioExistenteId}
                        onChange={(e) => setEscritorioExistenteId(e.target.value)}
                        className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                      >
                        {escritoriosExistentes.map((esc) => (
                          <option key={esc.id} value={esc.id}>
                            {esc.nomeFantasia} ({esc.cidade}/{esc.uf}) - CNPJ: {formatCnpj(esc.cnpj)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Advogado */}
                <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
                  <span className="font-semibold text-[#b8a47c] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <UserCheck className="w-4 h-4" />
                    2. Advogado Responsável / Contratante
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[#545c6b] mb-1 font-medium">Nome Completo do Advogado *</label>
                      <input
                        type="text"
                        required
                        value={nomeAdvogado}
                        onChange={(e) => setNomeAdvogado(e.target.value)}
                        className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[#545c6b] mb-1 font-medium">Nº OAB</label>
                        <input
                          type="text"
                          value={oabNumero}
                          onChange={(e) => setOabNumero(e.target.value)}
                          className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#545c6b] mb-1 font-medium">UF OAB</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={oabUf}
                          onChange={(e) => setOabUf(e.target.value.toUpperCase())}
                          className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#545c6b] mb-1 font-medium">WhatsApp</label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Periciando Particular */
              <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
                <span className="font-semibold text-[#b8a47c] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <HeartPulse className="w-4 h-4" />
                  Dados do Periciando (Paciente Examinado)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[#545c6b] mb-1 font-medium">Nome do Periciando</label>
                    <input
                      type="text"
                      value={nomeAdvogado}
                      onChange={(e) => setNomeAdvogado(e.target.value)}
                      className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#545c6b] mb-1 font-medium">WhatsApp</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#545c6b] mb-1 font-medium">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Oportunidade Gerada */}
            <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
              <span className="font-semibold text-[#b8a47c] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Briefcase className="w-4 h-4" />
                3. Oportunidade Contratada & Honorários
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Serviço Técnico Pericial</label>
                  <input
                    type="text"
                    value={servicoInteresse}
                    onChange={(e) => setServicoInteresse(e.target.value)}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3]"
                  />
                </div>
                <div>
                  <label className="block text-[#545c6b] mb-1 font-medium">Honorários Acordados (R$)</label>
                  <input
                    type="number"
                    step="100"
                    value={valorOportunidade}
                    onChange={(e) => setValorOportunidade(Number(e.target.value))}
                    className="w-full bg-[#1b222d] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#263040]">
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#b8a47c] hover:bg-[#c7b692] text-[#0a0e14] font-bold text-xs tracking-wide uppercase transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Convertendo...' : 'Converter Agora'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
