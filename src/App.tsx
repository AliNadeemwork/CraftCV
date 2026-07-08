import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import CoverLetterPage from './pages/CoverLetterPage';
import PrintMount from './components/preview/PrintMount';
import { useUIStore } from './store/uiStore';

export default function App() {
  const theme = useUIStore((s) => s.theme);

  // Reflect theme on <html> so Tailwind's `dark:` variants apply app-wide.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/cover-letter/:id" element={<CoverLetterPage />} />
      </Routes>
      <PrintMount />
    </HashRouter>
  );
}
