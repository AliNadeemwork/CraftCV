import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a hashed URL for the worker bundle.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { reconstructText, type RawItem } from './reconstruct';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfExtractResult {
  text: string;
  pages: number;
  /** False when the PDF appears to be a scanned image with no selectable text. */
  hasTextLayer: boolean;
}

export async function extractPdfText(data: ArrayBuffer): Promise<PdfExtractResult> {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: { items: RawItem[]; width: number }[] = [];
  let glyphCount = 0;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const width = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    const items: RawItem[] = [];
    for (const it of content.items as { str: string; transform: number[]; width?: number }[]) {
      if (!it.str) continue;
      glyphCount += it.str.trim().length;
      items.push({ x: it.transform[4], y: Math.round(it.transform[5]), w: it.width ?? 0, s: it.str });
    }
    pages.push({ items, width });
  }

  return {
    text: reconstructText(pages),
    pages: pdf.numPages,
    // Fewer than ~20 characters across the whole document → almost certainly scanned.
    hasTextLayer: glyphCount >= 20,
  };
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}
