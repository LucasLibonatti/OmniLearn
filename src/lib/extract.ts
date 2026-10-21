// Extração de texto de PDF e PPTX, feita no navegador (sem enviar o conteúdo a servidores nossos).
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import { tr } from '../i18n';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export const MAX_PDF_PAGES = 30;
export const MAX_PPTX_SLIDES = 40;

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

function clean(raw: string): string {
  return raw
    .replace(/([A-Za-zÀ-ÿ])-\s*\n\s*([a-zà-ÿ])/g, '$1$2')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractPdf(file: File): Promise<Extracted> {
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  if (doc.numPages > MAX_PDF_PAGES) {
    throw new Error(
      tr(
        'Este arquivo possui {n} páginas. O limite máximo permitido é de {max} páginas por arquivo.',
        { n: doc.numPages, max: MAX_PDF_PAGES },
      ),
    );
  }
  let text = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const line = content.items.map((it) => ('str' in it ? (it as { str: string }).str : '')).join(' ');
    text += line + '\n\n';
  }
  const cleaned = clean(text);
  return { text: cleaned, pages: doc.numPages, empty: cleaned.length < 200 };
}

export async function extractPptx(file: File): Promise<Extracted> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
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

export async function extractText(file: File): Promise<Extracted> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractPdf(file);
  if (name.endsWith('.pptx')) return extractPptx(file);
  throw new Error(tr('Formato não suportado. Envie PDF ou PPTX.'));
}

/** Inspeciona e extrai o arquivo, retornando metadados para o card visual. */
export async function inspectAndExtractFile(file: File): Promise<FileInspection> {
  const name = file.name.toLowerCase();
  const fileType = name.endsWith('.pptx') ? 'pptx' : 'pdf';
  try {
    const extracted = await extractText(file);
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
