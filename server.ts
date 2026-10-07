import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Cliente compartilhado GoogleGenAI no servidor com header User-Agent para telemetria
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint seguro de IA: Cronologia Clínica Pericial (Gemini 3.8 Flash)
app.post('/api/gemini/cronologia-clinica', async (req, res) => {
  try {
    const { documentos } = req.body;
    if (!documentos || !Array.isArray(documentos) || documentos.length === 0) {
      return res.status(400).json({ error: 'Nenhum documento médico fornecido para extração.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY não configurada no ambiente.',
        fallbackAvailable: true,
      });
    }

    const docsText = documentos
      .map((d: any, idx: number) => {
        return `--- DOCUMENTO ${idx + 1}: ${d.nomeArquivo} (Tipo: ${d.tipo}, Páginas: ${d.paginas || 1}) ---\n${
          d.conteudoTexto || d.nomeArquivo
        }`;
      })
      .join('\n\n');

    const prompt = `Você é um assistente pericial sênior de medicina legal e perícia judicial trabalhando com a Dra. Karine Reis (Crivo Forense).
Sua missão é ler com extremo rigor os documentos médicos e prontuários abaixo e gerar uma CRONOLOGIA CLÍNICA pericial estruturada.

Para cada evento clínico detectado (admissão hospitalar, consulta, queixa, exame de imagem/laboratório, cirurgia, intercorrência pós-operatória, prescrição, alta, perícia judicial/INSS):
1. data: Formato DD/MM/AAAA ou ISO (AAAA-MM-DD).
2. evento: Descrição precisa e técnica do evento médico ou conduta adotada.
3. cid: Código CID-10 mencionado ou evidenciado no evento (ex: M54.5, G56.0, T81.4, L03.1); caso não citado, envie vazio "".
4. documentoOrigem: Nome do arquivo de onde o fato foi extraído.
5. pagina: Número da página (ex: "pág. 1", "pág. 12", "1") onde o evento está registrado.
6. observacao: Comentário sobre relevância médico-legal ou nexo causal (opcional).

Ordene a lista cronologicamente do evento mais antigo para o mais recente.

Retorne EXCLUSIVAMENTE um objeto JSON válido no formato:
{
  "cronologia": [
    {
      "data": "10/01/2024",
      "evento": "Admissão cirúrgica eletiva para mamoplastia e lipoabdominoplastia...",
      "cid": "Z98.8",
      "documentoOrigem": "Prontuario_Integral_Hospital_Santa_Clara.pdf",
      "pagina": "1",
      "observacao": "Procedimento realizado sob anestesia peridural e sedação."
    }
  ]
}

DOCUMENTOS:
${docsText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro na chamada Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Erro ao processar documentos com Gemini.',
      fallbackAvailable: true,
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
