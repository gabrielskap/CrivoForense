import React, { useEffect, useState } from 'react';
import {
  FileText,
  FileCheck,
  Send,
  Download,
  Plus,
  Lock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  documentoRepository,
  processoRepository,
  servicoRepository,
  modeloContratoRepository,
  propostaRepository,
  contratoRepository,
  escritorioRepository,
  advogadoRepository,
  periciandoRepository,
  oportunidadeRepository,
} from '../services';
import {
  Documento,
  Processo,
  Servico,
  ModeloContrato,
  Proposta,
  Contrato,
  Escritorio,
  Advogado,
  Periciando,
  Oportunidade,
} from '../types';
import { CatalogoServicosTab } from '../components/contratos/CatalogoServicosTab';
import { PropostasTab } from '../components/contratos/PropostasTab';
import { ContratosTab } from '../components/contratos/ContratosTab';
import { DocumentosTab } from '../components/contratos/DocumentosTab';
import { CronologiaClinicaModal } from '../components/contratos/CronologiaClinicaModal';

type TabAtiva = 'servicos' | 'propostas' | 'contratos' | 'documentos';

export const ContratosDocumentosView: React.FC = () => {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('servicos');

  // Estados de dados
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [modelos, setModelos] = useState<ModeloContrato[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [escritorios, setEscritorios] = useState<Escritorio[]>([]);
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [periciandos, setPericiandos] = useState<Periciando[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);

  const [modalCronologiaAberto, setModalCronologiaAberto] = useState(false);

  const carregarDados = async () => {
    const [srv, mod, prop, ctr, doc, proc, esc, adv, per, op] = await Promise.all([
      servicoRepository.getAll(),
      modeloContratoRepository.getAll(),
      propostaRepository.getAll(),
      contratoRepository.getAll(),
      documentoRepository.getAll(),
      processoRepository.getAll(),
      escritorioRepository.getAll(),
      advogadoRepository.getAll(),
      periciandoRepository.getAll(),
      oportunidadeRepository.getAll(),
    ]);

    setServicos(srv);
    setModelos(mod);
    setPropostas(prop);
    setContratos(ctr);
    setDocumentos(doc);
    setProcessos(proc);
    setEscritorios(esc);
    setAdvogados(adv);
    setPericiandos(per);
    setOportunidades(op);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const totalPropostasAtivas = propostas.filter((p) => p.status !== 'Recusada').length;
  const totalContratosAssinados = contratos.filter((c) => c.status === 'Assinado').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Título */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#f4efe3]">
            Contratos, Documentos & Serviços
          </h1>
          <p className="text-xs sm:text-sm text-[#8c96a5] mt-1">
            Gestão integrada do catálogo de serviços periciais, propostas com identidade visual, minutas contratuais e repositório LGPD com IA.
          </p>
        </div>

        {/* Botão rápido: Cronologia Clínica com IA */}
        <button
          onClick={() => setModalCronologiaAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-md self-start md:self-auto shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span>Cronologia Clínica IA</span>
        </button>
      </div>

      {/* Cards de Métricas do Módulo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-[10px] uppercase font-semibold text-[#545c6b] block">
            Catálogo de Serviços
          </span>
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#f4efe3]">
              {servicos.length}
            </span>
            <Briefcase className="w-4 h-4 text-[#b8a47c]" />
          </div>
          <span className="text-[10px] text-[#8c96a5] block">Preços base & negociados</span>
        </div>

        <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-[10px] uppercase font-semibold text-[#545c6b] block">
            Propostas Comerciais
          </span>
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#f4efe3]">
              {totalPropostasAtivas}
            </span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-[10px] text-[#8c96a5] block">Vinculadas ao funil</span>
        </div>

        <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-[10px] uppercase font-semibold text-[#545c6b] block">
            Contratos Assinados
          </span>
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-400">
              {totalContratosAssinados}
            </span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-[#8c96a5] block">Automação de cobranças & O.S.</span>
        </div>

        <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] space-y-1">
          <span className="text-[10px] uppercase font-semibold text-[#545c6b] block">
            Acervo Documental
          </span>
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#f4efe3]">
              {documentos.length}
            </span>
            <ShieldCheck className="w-4 h-4 text-[#b8a47c]" />
          </div>
          <span className="text-[10px] text-[#8c96a5] block">Protegido por LGPD Saúde</span>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="border-b border-[#1b222d] flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTabAtiva('servicos')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            tabAtiva === 'servicos'
              ? 'border-[#b8a47c] text-[#f4efe3] bg-[#12171f]/50'
              : 'border-transparent text-[#8c96a5] hover:text-[#f4efe3]'
          }`}
        >
          <Briefcase className="w-4 h-4 text-[#b8a47c]" />
          <span>Catálogo de Serviços</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#1a222f] text-[#c7b692] border border-[#2b3648]">
            {servicos.length}
          </span>
        </button>

        <button
          onClick={() => setTabAtiva('propostas')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            tabAtiva === 'propostas'
              ? 'border-[#b8a47c] text-[#f4efe3] bg-[#12171f]/50'
              : 'border-transparent text-[#8c96a5] hover:text-[#f4efe3]'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Propostas Comerciais</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#1a222f] text-blue-300 border border-[#2b3648]">
            {propostas.length}
          </span>
        </button>

        <button
          onClick={() => setTabAtiva('contratos')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            tabAtiva === 'contratos'
              ? 'border-[#b8a47c] text-[#f4efe3] bg-[#12171f]/50'
              : 'border-transparent text-[#8c96a5] hover:text-[#f4efe3]'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Contratos & Assinaturas</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#1a222f] text-emerald-300 border border-[#2b3648]">
            {contratos.length}
          </span>
        </button>

        <button
          onClick={() => setTabAtiva('documentos')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            tabAtiva === 'documentos'
              ? 'border-[#b8a47c] text-[#f4efe3] bg-[#12171f]/50'
              : 'border-transparent text-[#8c96a5] hover:text-[#f4efe3]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#b8a47c]" />
          <span>Documentos & LGPD</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#1a222f] text-[#c7b692] border border-[#2b3648]">
            {documentos.length}
          </span>
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div>
        {tabAtiva === 'servicos' && (
          <CatalogoServicosTab
            servicos={servicos}
            escritorios={escritorios}
            onRefresh={carregarDados}
            onCriarPropostaComServico={() => setTabAtiva('propostas')}
          />
        )}

        {tabAtiva === 'propostas' && (
          <PropostasTab
            propostas={propostas}
            oportunidades={oportunidades}
            escritorios={escritorios}
            advogados={advogados}
            processos={processos}
            periciandos={periciandos}
            servicos={servicos}
            onRefresh={carregarDados}
            onContratoGerado={() => setTabAtiva('contratos')}
          />
        )}

        {tabAtiva === 'contratos' && (
          <ContratosTab
            contratos={contratos}
            modelos={modelos}
            escritorios={escritorios}
            advogados={advogados}
            processos={processos}
            servicos={servicos}
            onRefresh={carregarDados}
          />
        )}

        {tabAtiva === 'documentos' && (
          <DocumentosTab
            documentos={documentos}
            processos={processos}
            escritorios={escritorios}
            periciandos={periciandos}
            onRefresh={carregarDados}
          />
        )}
      </div>

      {/* Modal Geral de Cronologia Clínica com IA */}
      {modalCronologiaAberto && (
        <CronologiaClinicaModal
          documentosDisponiveis={documentos}
          onClose={() => setModalCronologiaAberto(false)}
          onSalvo={carregarDados}
        />
      )}
    </div>
  );
};
