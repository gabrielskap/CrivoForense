import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Sparkles,
  Plus,
  CheckCircle2,
  Calendar,
  Lock,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { Documento, Processo, Escritorio, Periciando, TipoDocumento } from '../../types';
import { documentoRepository, authService } from '../../services';
import { formatDate } from '../../utils/formatters';
import { DocumentoPreviewModal } from './DocumentoPreviewModal';
import { CronologiaClinicaModal } from './CronologiaClinicaModal';

interface DocumentosTabProps {
  documentos: Documento[];
  processos: Processo[];
  escritorios: Escritorio[];
  periciandos: Periciando[];
  onRefresh: () => void;
}

export const DocumentosTab: React.FC<DocumentosTabProps> = ({
  documentos,
  processos,
  escritorios,
  periciandos,
  onRefresh,
}) => {
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [apenasSensiveis, setApenasSensiveis] = useState(false);

  // Drag & drop e upload
  const [isDragging, setIsDragging] = useState(false);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [modalNovaVersaoDoc, setModalNovaVersaoDoc] = useState<Documento | null>(null);
  const [arquivoUploadNome, setArquivoUploadNome] = useState('');
  const [arquivoUploadTamanho, setArquivoUploadTamanho] = useState(250000);

  // Form Upload
  const [formTipo, setFormTipo] = useState<TipoDocumento>('prontuario');
  const [formClienteId, setFormClienteId] = useState('');
  const [formProcessoId, setFormProcessoId] = useState('');
  const [formPericiandoId, setFormPericiandoId] = useState('');
  const [formSensivelSaude, setFormSensivelSaude] = useState(true);
  const [formConteudoTexto, setFormConteudoTexto] = useState('');

  // Form Nova Versão
  const [novaVersaoMotivo, setNovaVersaoMotivo] = useState('');
  const [novaVersaoArquivoNome, setNovaVersaoArquivoNome] = useState('');

  // Modais de preview e cronologia IA
  const [documentoPreview, setDocumentoPreview] = useState<Documento | null>(null);
  const [modalCronologiaAberto, setModalCronologiaAberto] = useState(false);
  const [documentosParaCronologia, setDocumentosParaCronologia] = useState<Documento[]>([]);
  const [documentosSelecionadosIds, setDocumentosSelecionadosIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canAccessHealth = authService.canAccessSensitiveHealthData();

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setArquivoUploadNome(file.name);
      setArquivoUploadTamanho(file.size);
      // Auto-identifica se é dado sensível por nome
      if (/prontu[aá]rio|exame|laudo|resson[aâ]ncia|tomografia|receita|bi[oó]psia/i.test(file.name)) {
        setFormSensivelSaude(true);
      }
      setModalUploadAberto(true);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setArquivoUploadNome(file.name);
      setArquivoUploadTamanho(file.size);
      setModalUploadAberto(true);
    }
  };

  const handleSalvarUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoUploadNome) return;

    const proc = processos.find((p) => p.id === formProcessoId);
    const esc = escritorios.find((e) => e.id === formClienteId);
    const peri = periciandos.find((p) => p.id === formPericiandoId);
    const user = authService.getCurrentUser();

    await documentoRepository.create({
      nomeArquivo: arquivoUploadNome,
      tipo: formTipo,
      processoId: proc?.id,
      processoNumero: proc?.numeroCnj,
      clienteId: esc?.id,
      clienteNome: esc ? (esc.nomeFantasia || esc.razaoSocial) : undefined,
      periciandoId: peri?.id || proc?.periciandoId,
      periciandoNome: peri?.nome || (proc ? periciandos.find((pe) => pe.id === proc.periciandoId)?.nome || proc.poloAtivo : undefined),
      tamanhoBytes: arquivoUploadTamanho,
      dataUpload: new Date().toISOString().split('T')[0],
      urlMock: `https://crivoforense.com.br/docs/${Date.now()}_${arquivoUploadNome}`,
      autorNome: user.nome,
      versao: 1,
      sensivelSaude: formSensivelSaude,
      paginas: 4,
      conteudoTexto: formConteudoTexto || `Conteúdo do arquivo ${arquivoUploadNome} digitalizado em ${new Date().toLocaleDateString('pt-BR')}.`,
      previewTipo: 'pdf',
    });

    setModalUploadAberto(false);
    setArquivoUploadNome('');
    setFeedback(`Documento "${arquivoUploadNome}" carregado com sucesso.`);
    setTimeout(() => setFeedback(null), 5000);
    onRefresh();
  };

  const handleSalvarNovaVersao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNovaVersaoDoc) return;

    const user = authService.getCurrentUser();
    const versaoNovaNum = (modalNovaVersaoDoc.versao || 1) + 1;
    const historicoAtual = modalNovaVersaoDoc.historicoVersoes || [
      {
        versao: modalNovaVersaoDoc.versao || 1,
        dataUpload: modalNovaVersaoDoc.dataUpload,
        tamanhoBytes: modalNovaVersaoDoc.tamanhoBytes,
        autorNome: modalNovaVersaoDoc.autorNome,
        urlMock: modalNovaVersaoDoc.urlMock,
        motivoRevisao: 'Versão inicial carregada',
      },
    ];

    const novaEntrada = {
      versao: versaoNovaNum,
      dataUpload: new Date().toISOString().split('T')[0],
      tamanhoBytes: modalNovaVersaoDoc.tamanhoBytes + 15000,
      autorNome: user.nome,
      urlMock: `https://crivoforense.com.br/docs/v${versaoNovaNum}_${modalNovaVersaoDoc.nomeArquivo}`,
      motivoRevisao: novaVersaoMotivo || 'Revisão técnica com acréscimo de elementos',
    };

    await documentoRepository.update(modalNovaVersaoDoc.id, {
      versao: versaoNovaNum,
      nomeArquivo: novaVersaoArquivoNome || modalNovaVersaoDoc.nomeArquivo,
      historicoVersoes: [...historicoAtual, novaEntrada],
    });

    setModalNovaVersaoDoc(null);
    setNovaVersaoMotivo('');
    setNovaVersaoArquivoNome('');
    setFeedback(`Nova versão v${versaoNovaNum} do documento criada.`);
    setTimeout(() => setFeedback(null), 5000);
    onRefresh();
  };

  const toggleSelecaoDocParaCronologia = (id: string) => {
    setDocumentosSelecionadosIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const abrirCronologiaComSelecionados = () => {
    const selecionados = documentos.filter((d) => documentosSelecionadosIds.includes(d.id));
    setDocumentosParaCronologia(selecionados.length > 0 ? selecionados : documentos);
    setModalCronologiaAberto(true);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const tiposPermitidos: { valor: TipoDocumento; label: string }[] = [
    { valor: 'exame', label: 'Exame Complementar' },
    { valor: 'prontuario', label: 'Prontuário Médico' },
    { valor: 'laudo_oficial', label: 'Laudo Pericial Oficial' },
    { valor: 'parecer', label: 'Parecer Técnico Assistencial' },
    { valor: 'quesitos', label: 'Quesitos' },
    { valor: 'peticao', label: 'Petição' },
    { valor: 'procuracao', label: 'Procuração' },
    { valor: 'contrato', label: 'Contrato' },
    { valor: 'comprovante', label: 'Comprovante / Alvará' },
    { valor: 'outro', label: 'Outro' },
  ];

  const documentosFiltrados = documentos.filter((doc) => {
    const matchBusca =
      doc.nomeArquivo.toLowerCase().includes(busca.toLowerCase()) ||
      (doc.processoNumero && doc.processoNumero.toLowerCase().includes(busca.toLowerCase())) ||
      (doc.periciandoNome && doc.periciandoNome.toLowerCase().includes(busca.toLowerCase())) ||
      (doc.clienteNome && doc.clienteNome.toLowerCase().includes(busca.toLowerCase())) ||
      (doc.cidMencionados && doc.cidMencionados.some((c) => c.toLowerCase().includes(busca.toLowerCase())));
    const matchTipo = tipoFiltro === 'todos' || doc.tipo === tipoFiltro;
    const matchSensivel = !apenasSensiveis || doc.sensivelSaude;
    return matchBusca && matchTipo && matchSensivel;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Banner / Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12171f] p-5 rounded-2xl border border-[#1b222d]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif text-[#f4efe3] font-semibold">
              Gestão Documental & LGPD de Saúde
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#b8a47c]/20 text-[#c7b692] border border-[#b8a47c]/30">
              {documentos.length} Arquivos
            </span>
          </div>
          <p className="text-xs text-[#8c96a5] mt-1">
            Upload drag & drop, versionamento (v1/v2), controle estrito de dados sensíveis de saúde (Art. 11 LGPD) e auditoria de visualizações.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botão de Destaque: Cronologia Clínica com IA */}
          <button
            onClick={abrirCronologiaComSelecionados}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-md"
            title="Extrair linha do tempo clínica com Gemini a partir dos prontuários selecionados"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Cronologia Clínica IA</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#b8a47c] text-[#0a0e14] hover:bg-[#c7b692] font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Dropzone com Arrastar e Soltar (Drag & Drop) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
          isDragging
            ? 'border-[#b8a47c] bg-[#b8a47c]/10 scale-[1.01]'
            : 'border-[#263040] bg-[#0c1017] hover:border-[#b8a47c]/60 hover:bg-[#12171f]'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-[#161c26] border border-[#2b3648] flex items-center justify-center mx-auto text-[#b8a47c]">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#f4efe3]">
            {isDragging ? 'Solte o arquivo aqui para enviar' : 'Arraste e solte documentos aqui ou clique para selecionar'}
          </p>
          <p className="text-xs text-[#8c96a5]">
            Suporta prontuários em PDF, exames de imagem (RM/TC), laudos, quesitos e contratos (até 50MB).
          </p>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#545c6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por arquivo, processo CNJ, periciando, cliente ou CID..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12171f] border border-[#1b222d] text-xs text-[#f4efe3] placeholder-[#545c6b] focus:border-[#b8a47c] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTipoFiltro('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              tipoFiltro === 'todos'
                ? 'bg-[#b8a47c] text-[#0a0e14] font-semibold'
                : 'bg-[#12171f] text-[#8c96a5] hover:text-[#f4efe3] border border-[#1b222d]'
            }`}
          >
            Todos os Tipos
          </button>
          {tiposPermitidos.map((t) => (
            <button
              key={t.valor}
              onClick={() => setTipoFiltro(t.valor)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                tipoFiltro === t.valor
                  ? 'bg-[#b8a47c] text-[#0a0e14] font-semibold'
                  : 'bg-[#12171f] text-[#8c96a5] hover:text-[#f4efe3] border border-[#1b222d]'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setApenasSensiveis(!apenasSensiveis)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              apenasSensiveis
                ? 'bg-red-950/60 text-red-300 border border-red-800'
                : 'bg-[#12171f] text-[#8c96a5] hover:text-[#f4efe3] border border-[#1b222d]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Apenas Saúde (LGPD)
          </button>
        </div>
      </div>

      {/* Grid de Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentosFiltrados.map((doc) => {
          const isSelectedForCronologia = documentosSelecionadosIds.includes(doc.id);

          return (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-[#12171f] border border-[#1b222d] hover:border-[#263040] transition-colors flex flex-col justify-between space-y-3.5 shadow-sm group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1a222f] text-[#b8a47c] border border-[#2b3648]">
                      {doc.tipo}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0b0e14] text-[#8c96a5] border border-[#1a222d]">
                      v{doc.versao}
                    </span>
                    {doc.sensivelSaude && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-950/40 text-red-400 border border-red-800/40 flex items-center gap-1"
                        title="Dado Sensível de Saúde (Art. 11 LGPD)"
                      >
                        <ShieldAlert className="w-2.5 h-2.5" />
                        Saúde
                      </span>
                    )}
                  </div>

                  {/* Checkbox para inclusão na cronologia IA */}
                  <label
                    className="flex items-center gap-1 text-[10px] text-[#8c96a5] cursor-pointer hover:text-[#c7b692]"
                    title="Selecionar para a Cronologia Clínica IA"
                  >
                    <input
                      type="checkbox"
                      checked={isSelectedForCronologia}
                      onChange={() => toggleSelecaoDocParaCronologia(doc.id)}
                      className="rounded accent-[#b8a47c]"
                    />
                    <span className="hidden sm:inline">IA</span>
                  </label>
                </div>

                <div>
                  <h3
                    onClick={() => setDocumentoPreview(doc)}
                    className="text-sm font-semibold text-[#f4efe3] group-hover:text-[#c7b692] transition-colors cursor-pointer line-clamp-1"
                    title={doc.nomeArquivo}
                  >
                    {doc.nomeArquivo}
                  </h3>
                  <p className="text-[11px] text-[#8c96a5] mt-1 line-clamp-2">
                    {doc.processoNumero && <span>Autos: {doc.processoNumero} • </span>}
                    {doc.periciandoNome && <span>Periciando: {doc.periciandoNome}</span>}
                  </p>
                </div>

                <div className="text-[10px] text-[#545c6b] flex items-center justify-between pt-1 border-t border-[#1b222d]/70">
                  <span>{formatSize(doc.tamanhoBytes)}</span>
                  <span>{formatDate(doc.dataUpload)}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="pt-2 border-t border-[#1b222d] flex items-center justify-between gap-2">
                <button
                  onClick={() => setDocumentoPreview(doc)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1a222f] text-[#f4efe3] hover:bg-[#253042] text-xs font-medium border border-[#263040] flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#b8a47c]" />
                  <span>Visualizar</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setModalNovaVersaoDoc(doc);
                      setNovaVersaoArquivoNome(doc.nomeArquivo);
                    }}
                    className="p-1.5 rounded-lg text-[#8c96a5] hover:text-[#f4efe3] hover:bg-[#1a222f] transition-colors"
                    title="Carregar nova versão deste documento"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = doc.urlMock;
                      link.download = doc.nomeArquivo;
                      link.click();
                    }}
                    className="p-1.5 rounded-lg text-[#8c96a5] hover:text-[#f4efe3] hover:bg-[#1a222f] transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Conclusão do Upload com Metadados */}
      {modalUploadAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#12171f] border border-[#263040] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b222d] pb-4">
              <div>
                <h3 className="text-base font-serif text-[#f4efe3] font-semibold">
                  Classificar Documento Pericial
                </h3>
                <p className="text-xs text-[#8c96a5] mt-0.5 truncate max-w-sm">
                  {arquivoUploadNome} ({formatSize(arquivoUploadTamanho)})
                </p>
              </div>
              <button
                onClick={() => setModalUploadAberto(false)}
                className="text-[#8c96a5] hover:text-[#f4efe3] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarUpload} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">Nome do Arquivo *</label>
                <input
                  type="text"
                  required
                  value={arquivoUploadNome}
                  onChange={(e) => setArquivoUploadNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Tipo do Documento *</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    {tiposPermitidos.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Processo Vinculado</label>
                  <select
                    value={formProcessoId}
                    onChange={(e) => setFormProcessoId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none font-mono text-[11px]"
                  >
                    <option value="">Nenhum processo...</option>
                    {processos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.numeroCnj}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Escritório / Cliente</label>
                  <select
                    value={formClienteId}
                    onChange={(e) => setFormClienteId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    <option value="">Selecione escritório...</option>
                    {escritorios.map((esc) => (
                      <option key={esc.id} value={esc.id}>
                        {esc.nomeFantasia || esc.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8c96a5] mb-1 font-medium">Periciando</label>
                  <select
                    value={formPericiandoId}
                    onChange={(e) => setFormPericiandoId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                  >
                    <option value="">Selecione periciando...</option>
                    {periciandos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Flag LGPD Sensível de Saúde */}
              <div className="p-3.5 rounded-xl bg-[#0b0e14] border border-[#1a222d] flex items-start gap-3">
                <input
                  type="checkbox"
                  id="sensivelCheck"
                  checked={formSensivelSaude}
                  onChange={(e) => setFormSensivelSaude(e.target.checked)}
                  className="mt-1 rounded accent-red-500"
                />
                <label htmlFor="sensivelCheck" className="cursor-pointer space-y-0.5">
                  <span className="font-semibold text-[#f4efe3] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Dado Sensível de Saúde (LGPD Artigo 11)
                  </span>
                  <p className="text-[11px] text-[#8c96a5] leading-relaxed">
                    Documentos médicos, diagnósticos, laudos e prontuários só poderão ser visualizados por quem tem permissão explícita, e cada abertura será registrada no log de auditoria.
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">
                  Texto / Resumo Extraído do Documento (para busca e IA)
                </label>
                <textarea
                  rows={3}
                  value={formConteudoTexto}
                  onChange={(e) => setFormConteudoTexto(e.target.value)}
                  placeholder="Cole trechos clínicos, datas de atendimento ou laudos para enriquecer a cronologia por IA..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none resize-none font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-[#1b222d] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalUploadAberto(false)}
                  className="px-4 py-2 rounded-xl bg-[#1b222d] text-[#8c96a5] hover:text-[#f4efe3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-semibold uppercase tracking-wider text-[11px] hover:bg-[#c7b692] transition-colors"
                >
                  Confirmar Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Carregamento de Nova Versão (v+1) */}
      {modalNovaVersaoDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#12171f] border border-[#263040] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b222d] pb-4">
              <div>
                <h3 className="text-base font-serif text-[#f4efe3] font-semibold">
                  Carregar Nova Versão (v{(modalNovaVersaoDoc.versao || 1) + 1})
                </h3>
                <p className="text-xs text-[#8c96a5] mt-0.5 truncate">
                  {modalNovaVersaoDoc.nomeArquivo}
                </p>
              </div>
              <button
                onClick={() => setModalNovaVersaoDoc(null)}
                className="text-[#8c96a5] hover:text-[#f4efe3] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarNovaVersao} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">Nome do Arquivo Atualizado</label>
                <input
                  type="text"
                  required
                  value={novaVersaoArquivoNome}
                  onChange={(e) => setNovaVersaoArquivoNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8c96a5] mb-1 font-medium">Motivo da Nova Versão *</label>
                <textarea
                  rows={3}
                  required
                  value={novaVersaoMotivo}
                  onChange={(e) => setNovaVersaoMotivo(e.target.value)}
                  placeholder="Ex: Juntada de quesitos complementares após laudo pericial oficial..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1b222d] text-[#f4efe3] focus:border-[#b8a47c] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#1b222d] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovaVersaoDoc(null)}
                  className="px-4 py-2 rounded-xl bg-[#1b222d] text-[#8c96a5] hover:text-[#f4efe3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#b8a47c] text-[#0a0e14] font-semibold uppercase tracking-wider text-[11px] hover:bg-[#c7b692] transition-colors"
                >
                  Salvar Nova Versão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Pré-visualização de Documento */}
      <DocumentoPreviewModal
        documento={documentoPreview}
        onClose={() => setDocumentoPreview(null)}
        onNovaVersao={(doc) => {
          setDocumentoPreview(null);
          setModalNovaVersaoDoc(doc);
          setNovaVersaoArquivoNome(doc.nomeArquivo);
        }}
      />

      {/* Modal de Cronologia Clínica com IA */}
      {modalCronologiaAberto && (
        <CronologiaClinicaModal
          documentosDisponiveis={documentos}
          documentosPreSelecionados={documentosParaCronologia}
          onClose={() => setModalCronologiaAberto(false)}
          onSalvo={onRefresh}
        />
      )}
    </div>
  );
};
