import { useEffect, useRef, useState } from 'react';
import type { Resume } from '../../types/resume';
import ResumeDocument, { pageGeometryFor } from './ResumeDocument';

/** A small, non-interactive first-page preview for the dashboard grid. */
export default function Thumbnail({ resume, width = 220 }: { resume: Resume; width?: number }) {
  const page = pageGeometryFor(resume);
  const scale = width / page.width;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="overflow-hidden rounded-md bg-white"
      style={{ width, height: page.height * scale }}
      aria-hidden
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: page.width,
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        <ResumeDocument resume={resume} />
      </div>
    </div>
  );
}
