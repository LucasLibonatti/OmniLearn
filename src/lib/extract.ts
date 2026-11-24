// Extração de texto de PDF e PPTX, feita no navegador (sem enviar o conteúdo a servidores nossos).
// Bibliotecas pesadas (pdfjs-dist e jszip) são carregadas sob demanda apenas quando o usuário envia um arquivo.
import { tr } from '../i18n';

export const MAX_PDF_PAGES = 30;
export const MAX_PPTX_SLIDES = 40;
/** Limite seguro de texto puro enviado ao backend para nunca exceder o payload de 4,5 MB da Vercel Serverless. */
export const MAX_SAFE_TEXT_CHARS = 1_200_000;

export interface ExtractOptions {
  unlimitedPdf?: boolean;
}

export interface Extracted {
  text: string;
  pages: number;
  empty: boolean;
}

export interface FileInspection {
  text: string;
  pageCount: number;
  fileType: 'pdf' | 'pptx';
  error: string | null;
}

/** Amostra trechos uniformemente distribuídos caso o texto extraído ultrapasse o limite seguro de rede. */
export function capExtractedText(text: string, maxChars = MAX_SAFE_TEXT_CHARS): string {
  if (text.length <= maxChars) return text;
  const segments = 10;
  const perSeg = Math.floor(maxChars / segments) - 8;
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    const start = i === segments - 1 ? text.length - perSeg : Math.round((i * (text.length - perSeg)) / (segments - 1));
    parts.push(text.slice(start, start + perSeg).trim());
  }
  return parts.join('\n\n');
}

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

function clean(raw: string): string {
  return raw
    .replace(/\u0000/g, '')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .replace(/([A-Za-zÀ-ÿ])-\s*\n\s*([a-zà-ÿ])/g, '$1$2')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractPdf(file: File, opts?: ExtractOptions): Promise<Extracted> {
  const [pdfjs, data] = await Promise.all([loadPdfjs(), file.arrayBuffer()]);
  const doc = await pdfjs.getDocument({ data }).promise;
  if (!opts?.unlimitedPdf && doc.numPages > MAX_PDF_PAGES) {
    throw new Error(
      tr(
        'Este arquivo possui {n} páginas. O limite máximo permitido é de {max} páginas por arquivo.',
        { n: doc.numPages, max: MAX_PDF_PAGES },
      ),
    );
  }
  const chunks: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const line = content.items.map((it) => ('str' in it ? (it as { str: string }).str : '')).join(' ');
    chunks.push(line);
    page.cleanup();
    if (p % 25 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  const cleaned = capExtractedText(clean(chunks.join('\n\n')));
  return { text: cleaned, pages: doc.numPages, empty: cleaned.length < 200 };
}

export async function extractPptx(file: File): Promise<Extracted> {
  const [{ default: JSZip }, buf] = await Promise.all([import('jszip'), file.arrayBuffer()]);
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files)
    .map((name) => {
      const m = name.match(/^ppt\/slides\/slide(\d+)\.xml$/);
      return m ? { name, n: Number(m[1]) } : null;
    })
    .filter((s): s is { name: string; n: number } => s !== null)
    .sort((a, b) => a.n - b.n);

  if (slides.length > MAX_PPTX_SLIDES) {
    throw new Error(
      tr(
        'Este arquivo possui {n} slides. O limite máximo permitido é de {max} slides por arquivo.',
        { n: slides.length, max: MAX_PPTX_SLIDES },
      ),
    );
  }

  const parser = new DOMParser();
  let text = '';
  for (const slide of slides) {
    const xml = await zip.files[slide.name].async('string');
    const dom = parser.parseFromString(xml, 'application/xml');
    const nodes = Array.from(dom.getElementsByTagName('a:t'));
    text += nodes.map((n) => n.textContent ?? '').join(' ') + '\n\n';
  }
  const cleaned = clean(text);
  return { text: cleaned, pages: slides.length, empty: cleaned.length < 200 };
}

export async function extractText(file: File, opts?: ExtractOptions): Promise<Extracted> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractPdf(file, opts);
  if (name.endsWith('.pptx')) return extractPptx(file);
  throw new Error(tr('Formato não suportado. Envie PDF ou PPTX.'));
}

/** Inspeciona e extrai o arquivo, retornando metadados para o card visual. */
export async function inspectAndExtractFile(file: File, opts?: ExtractOptions): Promise<FileInspection> {
  const name = file.name.toLowerCase();
  const fileType = name.endsWith('.pptx') ? 'pptx' : 'pdf';
  try {
    const extracted = await extractText(file, opts);
    return {
      text: extracted.text,
      pageCount: extracted.pages,
      fileType,
      error: extracted.empty ? tr('Não conseguimos ler texto suficiente neste arquivo.') : null,
    };
  } catch (err) {
    return {
      text: '',
      pageCount: 0,
      fileType,
      error: (err as Error).message,
    };
  }
}
