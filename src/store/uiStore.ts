import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type EditorTab = 'edit' | 'preview';
type WorkTab = 'content' | 'design';

/** Per-resume editor UI state, persisted so a reload restores exactly. */
interface ResumeUi {
  /** Section ids that are collapsed in the Content tab. */
  collapsed: string[];
  /** Whether first-visit collapse has been applied. */
  initialized: boolean;
  workTab: WorkTab;
  designGroup: string;
}

interface UIState {
  theme: Theme;
  /** Mobile-only: which pane is shown in the editor. */
  editorTab: EditorTab;
  perResume: Record<string, ResumeUi>;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setEditorTab: (t: EditorTab) => void;
  getResumeUi: (id: string) => ResumeUi;
  /** Apply first-visit rule: collapse all sections except the given ids. */
  initResumeUi: (id: string, collapseIds: string[]) => void;
  toggleCollapsed: (id: string, sectionId: string) => void;
  setWorkTab: (id: string, tab: WorkTab) => void;
  setDesignGroup: (id: string, group: string) => void;
}

const DEFAULT_UI: ResumeUi = { collapsed: [], initialized: false, workTab: 'content', designGroup: 'template' };

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      editorTab: 'edit',
      perResume: {},
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
      setEditorTab: (editorTab) => set({ editorTab }),

      getResumeUi: (id) => get().perResume[id] ?? DEFAULT_UI,
      initResumeUi: (id, collapseIds) =>
        set((s) => {
          const cur = s.perResume[id];
          if (cur?.initialized) return s;
          return { perResume: { ...s.perResume, [id]: { ...DEFAULT_UI, ...cur, collapsed: collapseIds, initialized: true } } };
        }),
      toggleCollapsed: (id, sectionId) =>
        set((s) => {
          const cur = s.perResume[id] ?? DEFAULT_UI;
          const has = cur.collapsed.includes(sectionId);
          const collapsed = has ? cur.collapsed.filter((x) => x !== sectionId) : [...cur.collapsed, sectionId];
          return { perResume: { ...s.perResume, [id]: { ...cur, collapsed } } };
        }),
      setWorkTab: (id, workTab) =>
        set((s) => ({ perResume: { ...s.perResume, [id]: { ...(s.perResume[id] ?? DEFAULT_UI), workTab } } })),
      setDesignGroup: (id, designGroup) =>
        set((s) => ({ perResume: { ...s.perResume, [id]: { ...(s.perResume[id] ?? DEFAULT_UI), designGroup } } })),
    }),
    { name: 'craftcv-ui-v1', version: 2 },
  ),
);
