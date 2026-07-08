import type { Resume, CoverLetter } from '../types/resume';
import { usePrintStore } from '../store/printStore';

/** Queue a resume for printing (PrintMount handles the rest). */
export function exportResumePdf(resume: Resume): void {
  usePrintStore.getState().printResume(resume);
}

export function exportCoverLetterPdf(letter: CoverLetter): void {
  usePrintStore.getState().printCoverLetter(letter);
}
