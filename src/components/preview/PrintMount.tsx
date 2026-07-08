import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrintStore } from '../../store/printStore';
import ResumeDocument from './ResumeDocument';
import CoverLetterDocument from './CoverLetterDocument';

/**
 * Renders whatever is queued for printing into #print-root, waits for layout +
 * fonts, then invokes the browser print dialog. The @media print CSS hides the
 * rest of the app so only this mount is captured — producing a text-based,
 * selectable, ATS-friendly PDF.
 */
export default function PrintMount() {
  const { resume, coverLetter, clear } = usePrintStore();
  const active = resume || coverLetter;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    // Set the @page size to match the document.
    const size = (resume?.design.pageSize ?? coverLetter?.design.pageSize ?? 'A4') === 'A4' ? 'A4' : 'letter';
    document.documentElement.style.setProperty('--print-size', size);

    const run = async () => {
      await document.fonts?.ready;
      // Two rAFs to ensure pagination layout effects have flushed.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;
      const after = () => {
        window.removeEventListener('afterprint', after);
        clear();
      };
      window.addEventListener('afterprint', after);
      window.print();
      // Safari/edge fallback: clear shortly after if afterprint never fires.
      setTimeout(() => {
        if (!cancelled) clear();
      }, 1000);
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  const root = document.getElementById('print-root');
  if (!root) return null;

  return createPortal(
    resume ? (
      <ResumeDocument resume={resume} mode="print" />
    ) : coverLetter ? (
      <CoverLetterDocument letter={coverLetter} mode="print" />
    ) : null,
    root,
  );
}
