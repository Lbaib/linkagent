import { Routes, Route, Navigate } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { RequireAuth } from './components/RequireAuth';
import { AgentWorkbench } from './components/AgentWorkbench';
import { AdminConsole } from './components/AdminConsole';
import { HeroHeader } from './components/HeroHeader';
import { HeroSection } from './components/HeroSection';
import { VisitorClient } from './components/VisitorClient';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

function HomePage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-body">
      <HeroSection onStartChat={() => setIsChatOpen(true)} />
      <VisitorClient isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-premium-lg hover:scale-110 hover:bg-purple-700 transition-all z-40 cursor-pointer"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-body">
      <HeroHeader />
      <div className="flex-1 w-full flex flex-col">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Home — public landing */}
          <Route path="/home" element={<HomePage />} />

          {/* Protected */}
          <Route
            path="/agent"
            element={
              <RequireAuth>
                <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10 flex flex-col z-10 mt-20">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">坐席工作台</h2>
                    <p className="text-lg text-gray-500">高效处理全渠道客户咨询，实时掌控全局。</p>
                  </div>
                  <div className="flex-1 min-h-[700px] flex">
                    <AgentWorkbench />
                  </div>
                </main>
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10 flex flex-col z-10 mt-20">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">系统配置</h2>
                    <p className="text-lg text-gray-500">自定义知识库与业务规则。</p>
                  </div>
                  <div className="flex-1 min-h-[700px] flex">
                    <AdminConsole />
                  </div>
                </main>
              </RequireAuth>
            }
          />

          {/* Default: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SimulationProvider>
  );
}
