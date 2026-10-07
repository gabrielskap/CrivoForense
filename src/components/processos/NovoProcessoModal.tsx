import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  HeartPulse,
  Scale,
  Calendar,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Processo,
  Escritorio,
  Advogado,
  Periciando,
  Usuario,
  AreaDireito,
  ModalidadeAtuacao,
  PoloRepresentado,
  StatusProcessual,
  MarcoCpc,
} from '../../types';
import {
  escritorioRepository,
  advogadoRepository,
  periciandoRepository,
  usuarioRepository,
  processoRepository,
  auditLogRepository,
} from '../../services';
import { validarCnj, mascararCnjInput } from '../../utils/cnjValidator';
import { calcularPrazoDiasUteis, toIsoDate } from '../../utils/calculadoraPrazos';

interface NovoProcessoModalProps {
  onClose: () => void;
  onSuccess: (processo: Processo) => void;
  processoParaEditar?: Processo;
}

export const NovoProcessoModal: React.FC<NovoProcessoModalProps> = ({
  onClose,
  onSuccess,
  processoParaEditar,
}) => {
  // Lista de entidades para vínculos
  const [escritorios, setEscritorios] = useState<Escritorio[]>([]);
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [periciandos, setPericiandos] = useState<Periciando[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Campos do Processo
  const [numeroCnj, setNumeroCnj] = useState(processoParaEditar?.numeroCnj || '');
  const [vara, setVara] = useState(processoParaEditar?.vara || '14ª Vara Cível');
  const [comarca, setComarca] = useState(processoParaEditar?.comarca || 'São Paulo');
  const [uf, setUf] = useState(processoParaEditar?.uf || 'SP');
  const [classe, setClasse] = useState(processoParaEditar?.classe || 'Procedimento Comum Cível');
  const [assunto, setAssunto] = useState(processoParaEditar?.assunto || 'Erro Médico / Cirurgia Plástica');
  const [area, setArea] = useState<AreaDireito>(processoParaEditar?.area || 'Cível - Erro Médico');
  const [modalidade, setModalidade] = useState<ModalidadeAtuacao>(
    processoParaEditar?.modalidadeAtuacao || 'Assistente Técnica'
  );
  const [poloAtivo, setPoloAtivo] = useState(processoParaEditar?.poloAtivo || '');
  const [poloPassivo, setPoloPassivo] = useState(processoParaEditar?.poloPassivo || '');
  const [poloRepresentado, setPoloRepresentado] = useState<PoloRepresentado>(
    processoParaEditar?.poloRepresentado || 'Autor'
  );
  const [escritorioId, setEscritorioId] = useState(processoParaEditar?.escritorioId || '');
  const [advogadoId, setAdvogadoId] = useState(processoParaEditar?.advogadoId || '');
  const [periciandoId, setPericiandoId] = useState(processoParaEditar?.periciandoId || '');
  const [juiz, setJuiz] = useState(processoParaEditar?.juiz || '');
  const [peritoJuizoNome, setPeritoJuizoNome] = useState(processoParaEditar?.peritoJuizoNome || '');
  const [valorCausa, setValorCausa] = useState<number>(processoParaEditar?.valorCausa || 150000);
  const [honorariosAcordados, setHonorariosAcordados] = useState<number>(
    processoParaEditar?.honorariosAcordados || 5000
  );
  const [statusProcessual, setStatusProcessual] = useState<StatusProcessual>(
    processoParaEditar?.statusProcessual || 'Inicial / Quesitos'
  );
  const [responsavelId, setResponsavelId] = useState(
    processoParaEditar?.responsavelId || 'user_karine'
  );
  const [dataDistribuicao, setDataDistribuicao] = useState(
    processoParaEditar?.dataDistribuicao || toIsoDate(new Date())
  );

  // Validação em tempo real do CNJ
  const cnjValidacao = validarCnj(numeroCnj);

  useEffect(() => {
    Promise.all([
      escritorioRepository.getAll(),
      advogadoRepository.getAll(),
      periciandoRepository.getAll(),
      usuarioRepository.getAll(),
    ]).then(([e, a, p, u]) => {
      setEscritorios(e);
      setAdvogados(a);
      setPericiandos(p);
      setUsuarios(u);

      if (!processoParaEditar) {
        if (e.length > 0 && !escritorioId) setEscritorioId(e[0].id);
        if (p.length > 0 && !periciandoId) setPericiandoId(p[0].id);
      }
    });
  }, []);

  // Filtrar advogados pelo escritório selecionado
  const advogadosFiltrados = advogados.filter(
    (adv) => !escritorioId || adv.escritorioId === escritorioId
  );

  const handleCnjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = mascararCnjInput(e.target.value);
    setNumeroCnj(formatado);

    // Auto-preencher comarca/tribunal se detectado
    const check = validarCnj(formatado);
    if (check.valido) {
      if (check.tribunalSigla === 'TJSP' || check.tribunalSigla === 'TRT-2') {
        setUf('SP');
        if (!comarca) setComarca('São Paulo');
      } else if (check.tribunalSigla === 'TJTO') {
        setUf('TO');
        if (!comarca) setComarca('Palmas');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!poloAtivo.trim() || !poloPassivo.trim()) {
      alert('Por favor, informe o Pólo Ativo (Autor) e o Pólo Passivo (Réu).');
      return;
    }

    const tribunalFinal = cnjValidacao.valido
      ? cnjValidacao.tribunalSigla
      : processoParaEditar?.tribunal || 'TJSP';
    const ramoFinal = cnjValidacao.valido ? cnjValidacao.ramoJustica : 'Justiça Estadual';

    // Gerar marcos iniciais do CPC
    const dataHoje = toIsoDate(new Date());
    const prazo15Quesitos = calcularPrazoDiasUteis(dataHoje, 15, comarca);

    const marcosIniciais: MarcoCpc[] = processoParaEditar?.marcosCpc || [
      {
        id: 'marco_1',
        tipo: 'nomeacao_perito',
        nome: 'Nomeação do Perito Oficial pelo Juiz',
        artigoCpc: 'Art. 465 caput do CPC',
        dataInicio: dataHoje,
        dataConclusao: dataHoje,
        status: 'Concluído',
        observacoes: 'Despacho judicial com fixação de prazo para quesitos e assistentes.',
      },
      {
        id: 'marco_2',
        tipo: 'quesitos_assistente',
        nome: 'Apresentação de Quesitos e Indicação de Assistente Técnico',
        artigoCpc: 'Art. 465 § 1º do CPC',
        prazoDiasUteis: 15,
        dataInicio: dataHoje,
        dataLimite: prazo15Quesitos.dataVencimento,
        status: 'Em Andamento',
        observacoes: 'Prazo comum preclusivo de 15 dias para impugnar perito e formular quesitos.',
      },
      {
        id: 'marco_3',
        tipo: 'pericia_agendada',
        nome: 'Agendamento e Intimação da Perícia Médica',
        artigoCpc: 'Art. 474 do CPC',
        status: 'Pendente',
        observacoes: 'Aguardando publicação com data, horário e local designados pelo perito.',
      },
      {
        id: 'marco_4',
        tipo: 'pericia_realizada',
        nome: 'Realização do Exame Pericial Clínico',
        artigoCpc: 'Art. 473 do CPC',
        status: 'Pendente',
        observacoes: 'Acompanhamento do exame e vistoria técnica.',
      },
      {
        id: 'marco_5',
        tipo: 'laudo_juntado',
        nome: 'Juntada do Laudo Pericial Oficial',
        artigoCpc: 'Art. 477 caput do CPC',
        status: 'Pendente',
        observacoes: 'Protocolo da perícia nos autos pelo perito do juízo.',
      },
      {
        id: 'marco_6',
        tipo: 'parecer_assistente',
        nome: 'Manifestação e Parecer Técnico do Assistente',
        artigoCpc: 'Art. 477 § 1º do CPC',
        prazoDiasUteis: 15,
        status: 'Pendente',
        observacoes: 'Prazo comum de 15 dias para parecer técnico concordante ou divergente.',
      },
      {
        id: 'marco_7',
        tipo: 'esclarecimentos',
        nome: 'Esclarecimentos e Quesitos Suplementares',
        artigoCpc: 'Art. 477 § 2º e § 3º do CPC',
        status: 'Pendente',
        observacoes: 'Impugnação ao laudo e intimação do perito para resposta aos pontos controvertidos.',
      },
      {
        id: 'marco_8',
        tipo: 'encerrado',
        nome: 'Encerramento da Fase Pericial',
        artigoCpc: 'Fase Instrutória',
        status: 'Pendente',
        observacoes: 'Homologação judicial ou julgamento do mérito.',
      },
    ];

    const novoProcesso: Processo = {
      id: processoParaEditar?.id || `proc_${Date.now()}`,
      numeroCnj: numeroCnj || '0000000-00.2024.8.26.0100',
      tribunal: tribunalFinal,
      ramoJustica: ramoFinal,
      comarca,
      uf,
      vara,
      classe,
      assunto,
      area,
      modalidadeAtuacao: modalidade,
      poloAtivo,
      poloPassivo,
      poloRepresentado,
      escritorioId: escritorioId || undefined,
      advogadoId: advogadoId || undefined,
      periciandoId: periciandoId || 'per_1',
      juiz: juiz || undefined,
      peritoJuizoNome: peritoJuizoNome || undefined,
      valorCausa: Number(valorCausa),
      honorariosAcordados: Number(honorariosAcordados),
      statusProcessual,
      responsavelId,
      dataDistribuicao,
      proximaDataImportante: prazo15Quesitos.dataVencimento,
      marcosCpc: marcosIniciais,
    };

    if (processoParaEditar) {
      await processoRepository.update(processoParaEditar.id, novoProcesso);
    } else {
      await processoRepository.create(novoProcesso);
    }

    await auditLogRepository.logAccess({
      acao: processoParaEditar ? 'Edição de Processo Judicial' : 'Cadastro de Novo Processo Judicial',
      entidade: 'Processo',
      entidadeId: novoProcesso.id,
      detalhes: `Nº CNJ ${novoProcesso.numeroCnj} (${novoProcesso.tribunal} - ${novoProcesso.vara}). Modalidade: ${novoProcesso.modalidadeAtuacao}.`,
      isDadoSensivelSaude: false,
    });

    onSuccess(novoProcesso);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#12171f] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263040] bg-[#161c26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b8a47c]/15 border border-[#b8a47c]/40 text-[#b8a47c] flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#b8a47c]" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#f4efe3]">
                {processoParaEditar ? 'Editar Processo Judicial' : 'Cadastrar Novo Processo Judicial'}
              </h2>
              <p className="text-xs text-[#545c6b]">
                Validação estrita de dígito CNJ, identificação automática do tribunal e marcos do CPC.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#545c6b] hover:text-[#f4efe3] hover:bg-[#1b222d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-[#e8e1d0]">
          {/* Seção 1: Número CNJ e Validação de Dígito */}
          <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#b8a47c] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#b8a47c]" />
                Número Único CNJ (Resolução 65/2008):
              </label>
              {numeroCnj && (
                <div>
                  {cnjValidacao.valido ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Dígito Verificador Válido (DV: {cnjValidacao.digitoInformado})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      {cnjValidacao.erro || 'Dígito Incorreto'}
                    </span>
                  )}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="0000000-00.0000.0.00.0000"
              value={numeroCnj}
              onChange={handleCnjChange}
              maxLength={25}
              className={`w-full bg-[#12171f] border rounded-lg px-3.5 py-2.5 font-mono text-sm tracking-wider text-[#f4efe3] placeholder-[#545c6b] focus:outline-none transition-colors ${
                numeroCnj
                  ? cnjValidacao.valido
                    ? 'border-emerald-600 focus:border-emerald-500'
                    : 'border-rose-600 focus:border-rose-500'
                  : 'border-[#263040] focus:border-[#b8a47c]'
              }`}
            />

            {/* Metadados Extraídos Automaticamente do CNJ */}
            {cnjValidacao.valido && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] animate-in fade-in">
                <div className="p-2 rounded bg-[#12171f] border border-[#263040]">
                  <span className="text-[#545c6b] block text-[10px]">Ramo da Justiça</span>
                  <span className="font-semibold text-[#5b9cd9]">{cnjValidacao.ramoJustica}</span>
                </div>
                <div className="p-2 rounded bg-[#12171f] border border-[#263040]">
                  <span className="text-[#545c6b] block text-[10px]">Tribunal Identificado</span>
                  <span className="font-semibold text-[#b8a47c]">{cnjValidacao.tribunalSigla}</span>
                </div>
                <div className="p-2 rounded bg-[#12171f] border border-[#263040]">
                  <span className="text-[#545c6b] block text-[10px]">Ano de Distribuição</span>
                  <span className="font-semibold text-[#f4efe3]">{cnjValidacao.anoDistribuicao}</span>
                </div>
                <div className="p-2 rounded bg-[#12171f] border border-[#263040]">
                  <span className="text-[#545c6b] block text-[10px]">Unidade / Origem</span>
                  <span className="font-mono text-[#f4efe3]">{cnjValidacao.unidadeOrigem}</span>
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Localização e Atuação Forense */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
                Modalidade de Atuação:
              </label>
              <select
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value as ModalidadeAtuacao)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
              >
                <option value="Assistente Técnica">Assistente Técnica (Advogado/Banca)</option>
                <option value="Perita do Juízo">Perita do Juízo (Nomeada pelo Magistrado)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
                Área do Direito:
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as AreaDireito)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
              >
                <option value="Trabalhista">Trabalhista (Insalubridade / Acidente / LER)</option>
                <option value="Previdenciário">Previdenciário (Incapacidade / INSS)</option>
                <option value="Cível - Erro Médico">Cível - Erro Médico / Responsabilidade</option>
                <option value="DPVAT / Securitário">DPVAT / Securitário</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#b8a47c] block mb-1">
                Status Processual:
              </label>
              <select
                value={statusProcessual}
                onChange={(e) => setStatusProcessual(e.target.value as StatusProcessual)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none focus:border-[#b8a47c]"
              >
                <option value="Inicial / Quesitos">Inicial / Quesitos Iniciais</option>
                <option value="Perícia Agendada">Perícia Agendada</option>
                <option value="Laudo Pericial Entregue">Laudo Pericial Entregue</option>
                <option value="Impugnação / Quesitos Suplementares">Impugnação / Esclarecimentos</option>
                <option value="Sentença">Sentença</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Vara:</label>
              <input
                type="text"
                placeholder="Ex: 42ª Vara do Trabalho"
                value={vara}
                onChange={(e) => setVara(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Comarca:</label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={comarca}
                onChange={(e) => setComarca(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">UF:</label>
              <input
                type="text"
                placeholder="SP"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] uppercase focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Classe Processual:</label>
              <input
                type="text"
                placeholder="Ex: Ação Trabalhista - Rito Ordinário"
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Assunto Principal:</label>
              <input
                type="text"
                placeholder="Ex: Doença Ocupacional (LER/DORT) / Nexo Causal"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>
          </div>

          {/* Seção 3: Partes e Pólos da Ação */}
          <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3">
            <span className="font-semibold text-xs text-[#b8a47c] block">Partes do Processo:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#545c6b] block mb-1">
                  Pólo Ativo (Autor / Reclamante):
                </label>
                <input
                  type="text"
                  placeholder="Nome do autor"
                  value={poloAtivo}
                  onChange={(e) => setPoloAtivo(e.target.value)}
                  required
                  className="w-full bg-[#12171f] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#545c6b] block mb-1">
                  Pólo Passivo (Réu / Reclamada):
                </label>
                <input
                  type="text"
                  placeholder="Nome do réu / empresa"
                  value={poloPassivo}
                  onChange={(e) => setPoloPassivo(e.target.value)}
                  required
                  className="w-full bg-[#12171f] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#545c6b] block mb-1">
                  Pólo Representado por nós:
                </label>
                <select
                  value={poloRepresentado}
                  onChange={(e) => setPoloRepresentado(e.target.value as PoloRepresentado)}
                  className="w-full bg-[#12171f] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
                >
                  <option value="Autor">Autor / Reclamante</option>
                  <option value="Réu">Réu / Reclamada (Empresa)</option>
                  <option value="Terceiro Interessado">Terceiro Interessado / Seguradora</option>
                  <option value="Juízo (Imparcial)">Juízo (Atuação Imparcial como Perita)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 4: Vínculos com Escritório, Advogado, Periciando e Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Escritório Contratante:
              </label>
              <select
                value={escritorioId}
                onChange={(e) => setEscritorioId(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="">Nenhum / Particular</option>
                {escritorios.map((esc) => (
                  <option key={esc.id} value={esc.id}>
                    {esc.razaoSocial}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Advogado Responsável:
              </label>
              <select
                value={advogadoId}
                onChange={(e) => setAdvogadoId(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                <option value="">Selecione o advogado...</option>
                {advogadosFiltrados.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.nome} (OAB/{adv.oabUf} {adv.oabNumero})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Periciando Examinado:
              </label>
              <select
                value={periciandoId}
                onChange={(e) => setPericiandoId(e.target.value)}
                required
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                {periciandos.map((per) => (
                  <option key={per.id} value={per.id}>
                    {per.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Perito do Juízo Oficial:</label>
              <input
                type="text"
                placeholder="Nome do perito judicial"
                value={peritoJuizoNome}
                onChange={(e) => setPeritoJuizoNome(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Magistrado(a):</label>
              <input
                type="text"
                placeholder="Nome do juiz"
                value={juiz}
                onChange={(e) => setJuiz(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Valor da Causa (R$):</label>
              <input
                type="number"
                value={valorCausa}
                onChange={(e) => setValorCausa(Number(e.target.value))}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Honorários Acordados (R$):</label>
              <input
                type="number"
                value={honorariosAcordados}
                onChange={(e) => setHonorariosAcordados(Number(e.target.value))}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#b8a47c] font-mono font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">
                Responsável Técnico Interno:
              </label>
              <select
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.papelNome})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#545c6b] block mb-1">Data de Distribuição:</label>
              <input
                type="date"
                value={dataDistribuicao}
                onChange={(e) => setDataDistribuicao(e.target.value)}
                className="w-full bg-[#161c26] border border-[#263040] rounded-lg px-3 py-2 text-[#f4efe3] focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/30 text-purple-200/90 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-purple-100">
                Geração Automática de Linha do Tempo CPC:
              </span>{' '}
              Ao cadastrar, o sistema inicializa os 8 marcos regulatórios do CPC (Art. 465 §1º, Perícia, Art. 477 §1º e Esclarecimentos) com calculadora de prazos em dias úteis integrada.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263040]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1b222d] text-[#e8e1d0] border border-[#263040] font-semibold text-xs hover:bg-[#232c3a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#b8a47c] text-[#0a0e14] font-semibold text-xs hover:bg-[#c7b692] transition-colors flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              {processoParaEditar ? 'Salvar Alterações' : 'Cadastrar Processo & Gerar Marcos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
