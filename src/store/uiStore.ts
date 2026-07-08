import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type EditorTab = 'edit' | 'preview';

interface UIState {
  theme: Theme;
  /** Mobile-only: which pane is shown in the editor. */
  editorTab: EditorTab;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setEditorTab: (t: EditorTab) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      editorTab: 'edit',
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
      setEditorTab: (editorTab) => set({ editorTab }),
    }),
    { name: 'craftcv-ui-v1' },
  ),
);
