import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import AnnotationWorkspace from './components/AnnotationWorkspace';
import Toast from './components/Toast';
import { health } from './api/client';

export default function App() {
  const [backendOffline, setBackendOffline] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    health().then(() => setBackendOffline(false)).catch(() => setBackendOffline(true));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-tight hover:text-white transition-colors">
          CourtClip <span className="text-gray-500 font-normal text-sm ml-2">Badminton Video Annotation</span>
        </Link>
      </header>

      {/* Backend offline banner */}
      {backendOffline && (
        <div className="bg-yellow-900/40 border-b border-yellow-800 text-yellow-300 px-6 py-2 text-sm text-center">
          Backend is offline. Changes will not be saved.
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/:id" element={<AnnotationWorkspace />} />
      </Routes>
    </div>
  );
}
