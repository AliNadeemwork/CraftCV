import { create } from 'zustand';
import type { Resume, CoverLetter } from '../types/resume';

interface PrintState {
  resume: Resume | null;
  coverLetter: CoverLetter | null;
  printResume: (r: Resume) => void;
  printCoverLetter: (c: CoverLetter) => void;
  clear: () => void;
}

/** Ephemeral (non-persisted) store holding whatever is currently being printed. */
export const usePrintStore = create<PrintState>((set) => ({
  resume: null,
  coverLetter: null,
  printResume: (resume) => set({ resume, coverLetter: null }),
  printCoverLetter: (coverLetter) => set({ coverLetter, resume: null }),
  clear: () => set({ resume: null, coverLetter: null }),
}));
