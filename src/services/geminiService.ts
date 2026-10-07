import { Documento, CronologiaClinicaItem } from '../types';

export interface ExtrairCronologiaResponse {
  sucesso: boolean;
  cronologia: CronologiaClinicaItem[];
  origem: 'gemini_api' | 'parser_local';
  mensagem?: string;
}

/**
 * Chama o backend para extrair a Cronologia Clínica via Gemini 3.8 Flash.
 * Caso o servidor esteja temporariamente offline ou a chave não esteja disponível,
 * realiza uma análise heurística médica avançada sobre o texto dos prontuários.
 */
export async function gerarCronologiaClinicaComIA(
  documentos: Documento[]
): Promise<ExtrairCronologiaResponse> {
  try {
    const response = await fetch('/api/gemini/cronologia-clinica', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentos: documentos.map((d) => ({
          id: d.id,
          nomeArquivo: d.nomeArquivo,
          tipo: d.tipo,
          paginas: d.paginas || 1,
          cidMencionados: d.cidMencionados || [],
          conteudoTexto: d.conteudoTexto || d.nomeArquivo,
        })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.cronologia) && data.cronologia.length > 0) {
        return {
          sucesso: true,
          cronologia: data.cronologia.map((item: any, idx: number) => ({
            id: `crono_${Date.now()}_${idx}`,
            data: item.data || '',
            evento: item.evento || '',
            cid: item.cid || '',
            documentoOrigem: item.documentoOrigem || documentos[0]?.nomeArquivo || 'Documento',
            pagina: item.pagina || '1',
            observacao: item.observacao || '',
          })),
          origem: 'gemini_api',
        };
      }
    }
  } catch (err) {
    console.warn('Endpoint Gemini não respondeu diretamente. Acionando analisador pericial local:', err);
  }

  // Fallback determinístico médico
  const itensFallback = extrairCronologiaHeuristica(documentos);
  return {
    sucesso: true,
    cronologia: itensFallback,
    origem: 'parser_local',
    mensagem: 'Cronologia estruturada a partir do conteúdo textual dos documentos.',
  };
}

/**
 * Analisador heurístico pericial para extração de datas e eventos de prontuários
 */
function extrairCronologiaHeuristica(documentos: Documento[]): CronologiaClinicaItem[] {
  const eventos: CronologiaClinicaItem[] = [];

  documentos.forEach((doc, docIdx) => {
    const texto = doc.conteudoTexto || '';

    // Procura por padrões de "Data: DD/MM/AAAA - Descrição"
    const linhas = texto.split('\n');
    let encontrouLinhasComData = false;

    linhas.forEach((linha) => {
      const match = linha.match(/(?:Data:\s*)?(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*[-–:]\s*(.+)/i);
      if (match) {
        encontrouLinhasComData = true;
        const dataStr = match[1];
        let desc = match[2].trim();

        // Extrai CID se citado
        const cidMatch = desc.match(/(CID(?:-10)?\s*[A-Z]\d{2}(?:\.\d+)?)/i);
        const cid = cidMatch ? cidMatch[1].replace(/CID(?:-10)?\s*/i, '').trim() : '';

        // Extrai página se citada (ex: pág. 12)
        const pagMatch = desc.match(/\(pág\.\s*(\d+)\)/i);
        const pagina = pagMatch ? pagMatch[1] : String(docIdx + 1);

        eventos.push({
          id: `crono_fb_${Date.now()}_${eventos.length}`,
          data: dataStr,
          evento: desc.replace(/\(pág\.\s*\d+\)/i, '').trim(),
          cid: cid || (doc.cidMencionados && doc.cidMencionados[0]) || '',
          documentoOrigem: doc.nomeArquivo,
          pagina,
          observacao: 'Extraído do registro de prontuário.',
        });
      }
    });

    // Se o documento não tinha linhas formatadas com "Data: ...", gera um marco principal
    if (!encontrouLinhasComData) {
      eventos.push({
        id: `crono_fb_${Date.now()}_${eventos.length}`,
        data: doc.dataUpload,
        evento: `Juntada de ${doc.tipo}: ${doc.nomeArquivo}`,
        cid: (doc.cidMencionados && doc.cidMencionados[0]) || '',
        documentoOrigem: doc.nomeArquivo,
        pagina: '1',
        observacao: `Documento com ${doc.paginas || 1} página(s).`,
      });
    }
  });

  // Ordena por data
  return eventos.sort((a, b) => {
    const dA = normalizarDataParaComparacao(a.data);
    const dB = normalizarDataParaComparacao(b.data);
    return dA.localeCompare(dB);
  });
}

function normalizarDataParaComparacao(d: string): string {
  if (d.includes('/')) {
    const [dia, mes, ano] = d.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return d;
}
