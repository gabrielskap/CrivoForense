import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  FileText,
  Clock,
  User,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { Documento, VersaoDocumento } from '../../types';
import { documentoRepository, authService } from '../../services';
import { formatDate } from '../../utils/formatters';

interface DocumentoPreviewModalProps {
  documento: Documento | null;
  onClose: () => void;
  onNovaVersao?: (doc: Documento) => void;
}

export const DocumentoPreviewModal: React.FC<DocumentoPreviewModalProps> = ({
  documento,
  onClose,
  onNovaVersao,
}) => {
  const [zoom, setZoom] = useState(100);
  const [versaoAtiva, setVersaoAtiva] = useState<number>(1);

  useEffect(() => {
    if (documento) {
      setVersaoAtiva(documento.versao || 1);
      // O documentoRepository.getById já registra o log de auditoria automaticamente se for sensível!
      documentoRepository.getById(documento.id);
    }
  }, [documento]);

  if (!documento) return null;

  const canAccessHealth = authService.canAccessSensitiveHealthData();

  if (documento.sensivelSaude && !canAccessHealth) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-[#12171f] border border-red-800/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800/50 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-semibold text-[#f4efe3]">
            Acesso Restrito - LGPD Artigo 11
          </h3>
          <p className="text-xs text-[#8c96a5] leading-relaxed">
            Este documento está classificado como <strong>Dado Sensível de Saúde</strong> (prontuário/exame médico) e seu perfil de acesso atual não possui privilégios de sigilo médico-legal.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1b222d] text-[#f4efe3] text-xs font-semibold hover:bg-[#253040]"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#10141c] border border-[#263040] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header do Visualizador */}
        <div className="p-4 bg-[#141a24] border-b border-[#222b3a] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-[#1a222f] border border-[#2b3648] flex items-center justify-center text-[#b8a47c] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#f4efe3] truncate">
                  {documento.nomeArquivo}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1b222d] text-[#b8a47c] border border-[#263040] shrink-0">
                  v{documento.versao}
                </span>
                {documento.sensivelSaude && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/50 text-red-300 border border-red-800/50 flex items-center gap-1 shrink-0">
                    <ShieldAlert className="w-3 h-3" />
                    Dado Sensível de Saúde
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8c96a5] truncate">
                Tipo: <strong className="text-[#f4efe3]">{documento.tipo}</strong> • {formatSize(documento.tamanhoBytes)} • {formatDate(documento.dataUpload)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-[#1a222f] p-1 rounded-lg border border-[#263040] text-xs">
              <button
                onClick={() => setZoom((z) => Math.max(z - 15, 60))}
                className="p-1 hover:text-[#f4efe3] text-[#8c96a5]"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[10px] text-[#c7b692]">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(z + 15, 160))}
                className="p-1 hover:text-[#f4efe3] text-[#8c96a5]"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {onNovaVersao && (
              <button
                onClick={() => onNovaVersao(documento)}
                className="px-3 py-1.5 rounded-lg bg-[#b8a47c]/20 text-[#c7b692] hover:bg-[#b8a47c] hover:text-[#0a0e14] text-xs font-semibold border border-[#b8a47c]/30 flex items-center gap-1.5 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Nova Versão
              </button>
            )}

            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = documento.urlMock;
                link.download = documento.nomeArquivo;
                link.click();
              }}
              className="p-1.5 rounded-lg bg-[#1a222f] text-[#f4efe3] hover:bg-[#253042] border border-[#263040] transition-colors"
              title="Download do documento"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8c96a5] hover:text-[#f4efe3] hover:bg-[#1a222f] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área Central: Metadados & Visualizador */}
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
          {/* Painel Esquerdo: Visualizador de Conteúdo / PDF */}
          <div className="lg:col-span-2 p-6 bg-[#090c10] overflow-y-auto flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r border-[#1b222d]">
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-xl transition-transform duration-150"
            >
              {/* Folha Simulada de Documento */}
              <div className="bg-[#faf8f5] text-[#1a1f26] p-8 rounded-lg shadow-xl border border-[#e2d9ca] min-h-[500px] space-y-4 font-sans text-xs">
                <div className="border-b border-[#d1c7b5] pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-sm tracking-wide text-[#8a754d]">
                      CRIVO FORENSE
                    </span>
                    <span className="text-[10px] text-[#6b7280]">| Repositório Pericial</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#6b7280]">
                    Pág 1 de {documento.paginas || 1}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#111827]">{documento.nomeArquivo}</h4>
                  <p className="text-[11px] text-[#4b5563]">
                    Vínculo: {documento.processoNumero || 'Sem processo'} • Periciando:{' '}
                    {documento.periciandoNome || 'N/A'}
                  </p>
                </div>

                {/* Texto Extraído / Pré-visualização Real */}
                <div className="p-4 rounded-lg bg-white border border-[#e5e7eb] font-mono text-[11px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {documento.conteudoTexto ||
                    `[CONTEÚDO SIMULADO DO DOCUMENTO PERICIAL]\n\nArquivo: ${documento.nomeArquivo}\nTipo Documental: ${documento.tipo}\nData de Digitalização: ${documento.dataUpload}\nAutor da Juntada: ${documento.autorNome}\n\nDocumento verificado e íntegro no acervo forense da Dra. Karine Reis.`}
                </div>

                {documento.cidMencionados && documento.cidMencionados.length > 0 && (
                  <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-[#786b53] uppercase">CIDs Identificados:</span>
                    {documento.cidMencionados.map((cid, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f0ebe1] text-[#8a754d] border border-[#d1c7b5] font-semibold"
                      >
                        {cid}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Painel Direito: Metadados & Histórico de Versões */}
          <div className="p-6 bg-[#12171f] overflow-y-auto space-y-6 text-xs">
            {/* Aviso de Auditoria LGPD */}
            {documento.sensivelSaude && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30 text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Rastreabilidade LGPD Registrada
                </div>
                <p className="text-[10px] text-amber-200/80 leading-relaxed">
                  Este acesso foi registrado no Log de Auditoria com seu usuário, papel e carimbo temporal (Art. 11 da LGPD).
                </p>
              </div>
            )}

            {/* Metadados Técnicos */}
            <div className="space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b8a47c] block">
                Metadados do Arquivo:
              </span>

              <div className="space-y-2 bg-[#0b0e14] p-3.5 rounded-xl border border-[#1a222d]">
                <div className="flex justify-between">
                  <span className="text-[#8c96a5]">Categoria:</span>
                  <span className="font-semibold text-[#f4efe3]">{documento.tipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8c96a5]">Tamanho:</span>
                  <span className="font-mono text-[#f4efe3]">{formatSize(documento.tamanhoBytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8c96a5]">Páginas:</span>
                  <span className="font-mono text-[#f4efe3]">{documento.paginas || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8c96a5]">Data de Envio:</span>
                  <span className="text-[#f4efe3]">{formatDate(documento.dataUpload)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8c96a5]">Responsável:</span>
                  <span className="text-[#f4efe3]">{documento.autorNome}</span>
                </div>
              </div>
            </div>

            {/* Vínculos */}
            <div className="space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b8a47c] block">
                Vínculos Processuais:
              </span>

              <div className="space-y-2 bg-[#0b0e14] p-3.5 rounded-xl border border-[#1a222d]">
                <div>
                  <span className="text-[#8c96a5] block text-[10px]">Processo Judicial</span>
                  <span className="font-mono text-[#f4efe3] font-medium">
                    {documento.processoNumero || 'Não vinculado a processo'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8c96a5] block text-[10px]">Periciando(a)</span>
                  <span className="text-[#f4efe3] font-medium">
                    {documento.periciandoNome || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8c96a5] block text-[10px]">Cliente / Escritório</span>
                  <span className="text-[#f4efe3] font-medium">
                    {documento.clienteNome || 'Geral'}
                  </span>
                </div>
              </div>
            </div>

            {/* Histórico de Versões */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b8a47c]">
                  Histórico de Versões:
                </span>
                <span className="text-[10px] text-[#8c96a5]">
                  {(documento.historicoVersoes?.length || 1)} versão(ões)
                </span>
              </div>

              <div className="space-y-2">
                {documento.historicoVersoes && documento.historicoVersoes.length > 0 ? (
                  documento.historicoVersoes.map((v) => (
                    <div
                      key={v.versao}
                      className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                        v.versao === versaoAtiva
                          ? 'bg-[#1b222d] border-[#b8a47c] text-[#f4efe3]'
                          : 'bg-[#0b0e14] border-[#1a222d] text-[#8c96a5]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#c7b692]">Versão {v.versao}</span>
                        <span className="text-[10px]">{formatDate(v.dataUpload)}</span>
                      </div>
                      <p className="text-[11px] text-[#cbd5e1]">{v.motivoRevisao || 'Sem notas de revisão'}</p>
                      <p className="text-[10px] text-[#545c6b]">
                        Por {v.autorNome} • {formatSize(v.tamanhoBytes)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-[#0b0e14] border border-[#1a222d] text-[11px] text-[#8c96a5]">
                    Versão original (v1) carregada em {formatDate(documento.dataUpload)} por{' '}
                    {documento.autorNome}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
