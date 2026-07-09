// DOCX text extraction via mammoth. Unlike PDFs, DOCX preserves paragraph and
// list structure, so we convert to lightly-marked plain text (bullets prefixed
// with "• ") and feed it straight through the shared resume parser.

export async function extractDocxText(data: ArrayBuffer): Promise<{ text: string; hasText: boolean }> {
  const mammoth = await import('mammoth');
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: data });
  const text = htmlToLines(html);
  return { text, hasText: text.trim().length >= 20 };
}

function htmlToLines(html: string): string {
  if (typeof window === 'undefined') {
    // Fallback (non-DOM) — strip tags crudely.
    return html
      .replace(/<li>/gi, '\n• ')
      .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out: string[] = [];
  const walk = (node: Element) => {
    for (const el of Array.from(node.children)) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'li') {
        out.push('• ' + (el.textContent ?? '').replace(/\s+/g, ' ').trim());
      } else if (/^h[1-6]$/.test(tag) || tag === 'p') {
        const t = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (t) out.push(t);
      } else if (tag === 'ul' || tag === 'ol' || tag === 'div' || tag === 'table' || tag === 'tbody' || tag === 'tr' || tag === 'td') {
        walk(el);
      } else {
        const t = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (t) out.push(t);
      }
    }
  };
  walk(doc.body);
  return out.join('\n');
}
