import type { Resume } from '../types/resume';
import { SCHEMA_VERSION } from '../config';

interface BackupEnvelope {
  app: 'CraftCV';
  schemaVersion: number;
  exportedAt: string;
  resume: Resume;
}

export function downloadResumeJson(resume: Resume): void {
  const envelope: BackupEnvelope = {
    app: 'CraftCV',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    resume,
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (resume.name || 'resume').replace(/[^a-z0-9-_]+/gi, '_');
  a.href = url;
  a.download = `${safeName}.craftcv.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Parse a previously exported backup (or a bare Resume object). Returns the
 * resume or throws a friendly error the UI can surface.
 */
export function parseResumeJson(text: string): Resume {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const maybe = data as Partial<BackupEnvelope> & Partial<Resume>;
  const resume = (maybe.resume ?? maybe) as Resume;
  if (!resume || typeof resume !== 'object' || !('sections' in resume)) {
    throw new Error('This does not look like a CraftCV resume file.');
  }
  return resume;
}
