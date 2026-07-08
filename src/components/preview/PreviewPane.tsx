import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { Resume } from '../../types/resume';
import ResumeDocument, { pageGeometryFor } from './ResumeDocument';

export default function PreviewPane({ resume }: { resume: Resume }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [userZoom, setUserZoom] = useState<number | null>(null);
  const [innerHeight, setInnerHeight] = useState(0);
  const page = pageGeometryFor(resume);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const compute = () => {
      const avail = el.clientWidth - 48;
      setFitScale(Math.min(1, Math.max(0.2, avail / page.width)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.width]);

  // Track natural height of the (unscaled) document so we can reserve
  // scaled space and keep scrolling accurate.
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setInnerHeight(el.offsetHeight));
    ro.observe(el);
    setInnerHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, [resume]);

  const scale = userZoom ?? fitScale;

  return (
    <div className="relative flex h-full flex-col">
      <div className="no-print absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-black/10 bg-white/90 px-1.5 py-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-800/90">
        <button
          className="focusable rounded-full p-1.5 text-ink-soft hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          onClick={() => setUserZoom(Math.max(0.3, scale - 0.1))}
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="min-w-[3ch] text-center text-xs tabular-nums text-ink-soft dark:text-neutral-400">
          {Math.round(scale * 100)}%
        </span>
        <button
          className="focusable rounded-full p-1.5 text-ink-soft hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          onClick={() => setUserZoom(Math.min(2, scale + 0.1))}
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="focusable rounded-full p-1.5 text-ink-soft hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          onClick={() => setUserZoom(null)}
          aria-label="Fit to width"
          title="Fit to width"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="thin-scroll flex-1 overflow-auto" style={{ padding: 24 }}>
        <div
          style={{
            width: page.width * scale,
            height: innerHeight * scale,
            margin: '0 auto',
          }}
        >
          <div
            ref={innerRef}
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: page.width }}
          >
            <ResumeDocument resume={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}
