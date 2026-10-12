// Extração de texto de PDF e PPTX, feita no navegador (sem enviar o conteúdo a servidores nossos).
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface Extracted {
  text: string;
  pages: number;
  empty: boolean;
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
  throw new Error('Formato não suportado. Envie PDF ou PPTX.');
}
