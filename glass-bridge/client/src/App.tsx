import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore.js';
import TopBar from './components/TopBar.js';
import AuthModal from './components/AuthModal.js';
import GamePage from './pages/GamePage.js';
import VerifyPage from './pages/VerifyPage.js';
import AdminPage from './pages/AdminPage.js';

export default function App() {
  const { user, bootstrap } = useStore();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <TopBar />
        <main>
          <Routes>
            <Route path="/" element={<GamePage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        {!user && <AuthModal />}
      </div>
    </BrowserRouter>
  );
}
