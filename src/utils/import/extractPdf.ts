import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a hashed URL for the worker bundle.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfExtractResult {
  text: string;
  pages: number;
  /** False when the PDF appears to be a scanned image with no selectable text. */
  hasTextLayer: boolean;
}

interface TextItemLike {
  str: string;
  transform: number[];
  hasEOL?: boolean;
}

/**
 * Extract a readable text layer from a PDF, reconstructing lines from glyph
 * positions (pdf.js returns positioned text runs, not lines). Groups runs by
 * their y coordinate into lines, orders lines top-to-bottom, and inserts blank
 * lines between paragraphs when the vertical gap is large.
 */
export async function extractPdfText(data: ArrayBuffer): Promise<PdfExtractResult> {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pageTexts: string[] = [];
  let glyphCount = 0;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as TextItemLike[];

    // Bucket items into lines keyed by rounded y.
    const lineMap = new Map<number, { x: number; str: string }[]>();
    for (const it of items) {
      if (!it.str) continue;
      glyphCount += it.str.trim().length;
      const y = Math.round(it.transform[5]);
      const x = it.transform[4];
      // Merge near-identical y values (within 2px) into an existing bucket.
      let key = y;
      for (const k of lineMap.keys()) {
        if (Math.abs(k - y) <= 2) {
          key = k;
          break;
        }
      }
      if (!lineMap.has(key)) lineMap.set(key, []);
      lineMap.get(key)!.push({ x, str: it.str });
    }

    const ys = [...lineMap.keys()].sort((a, b) => b - a); // top → bottom
    const lines: string[] = [];
    let prevY: number | null = null;
    for (const y of ys) {
      const parts = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const line = parts
        .map((p2) => p2.str)
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (prevY !== null && prevY - y > 18) lines.push(''); // paragraph gap
      if (line) lines.push(line);
      prevY = y;
    }
    pageTexts.push(lines.join('\n'));
  }

  const text = pageTexts.join('\n\n');
  return {
    text,
    pages: pdf.numPages,
    // Fewer than ~20 characters across the whole document → almost certainly scanned.
    hasTextLayer: glyphCount >= 20,
  };
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}
