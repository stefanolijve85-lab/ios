import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore.js';
import { OFFLINE } from './lib/offline.js';
import AuthModal from './components/AuthModal.js';
import GamePage from './pages/GamePage.js';
import VerifyPage from './pages/VerifyPage.js';
import AdminPage from './pages/AdminPage.js';

// On the static GitHub Pages demo a hash router is refresh-safe under the
// /ios/ subpath; the real (single-origin) deploy uses a normal browser router.
const Router = OFFLINE ? HashRouter : BrowserRouter;
const routerProps = OFFLINE ? {} : { basename: import.meta.env.BASE_URL };

export default function App() {
  const { user, bootstrap } = useStore();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <Router {...routerProps}>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        {!user && <AuthModal />}
      </div>
    </Router>
  );
}
