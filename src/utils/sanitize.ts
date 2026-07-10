// Lightweight allow-list sanitiser for the rich-text subset we support.
// Content is the user's own and stays local, but we still strip anything that
// could break layout or execute (scripts, event handlers, inline styles).

const ALLOWED = new Set(['P', 'BR', 'UL', 'OL', 'LI', 'B', 'STRONG', 'I', 'EM', 'U', 'A', 'SPAN', 'DIV']);

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED.has(child.tagName)) {
        // Unwrap disallowed element, keeping its children/text.
        const parent = child.parentNode!;
        while (child.firstChild) parent.insertBefore(child.firstChild, child);
        parent.removeChild(child);
        continue;
      }
      // Preserve a text-align value (set by the alignment buttons) so it
      // survives into the preview and the exported PDF.
      const align = child.getAttribute('align') || /text-align:\s*(left|center|right|justify)/i.exec(child.getAttribute('style') || '')?.[1];
      // Strip every attribute except href on anchors.
      for (const attr of Array.from(child.attributes)) {
        if (child.tagName === 'A' && attr.name === 'href') {
          const val = attr.value.trim();
          if (/^\s*javascript:/i.test(val)) child.removeAttribute('href');
          continue;
        }
        child.removeAttribute(attr.name);
      }
      if (align && /^(P|DIV|LI|H[1-6])$/.test(child.tagName)) {
        child.setAttribute('style', `text-align:${align.toLowerCase()}`);
      }
      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noreferrer noopener');
      }
      walk(child);
    }
  };
  walk(root);
  return root.innerHTML;
}

/** True when the HTML has no visible text or media. */
export function isRichTextEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return text.length === 0;
}
