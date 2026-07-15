import { Routes, Route, Navigate } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { RequireAuth } from './components/RequireAuth';
import { AgentWorkbench } from './components/AgentWorkbench';
import { AdminConsole } from './components/AdminConsole';
import { TopNav } from './components/TopNav'; // Ignore missing import error for now, we'll build it in Task 2
import { VisitorClient } from './components/VisitorClient';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

function AppShell() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-body">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes wrapped in RequireAuth */}
        <Route path="/agent" element={
          <RequireAuth>
            <TopNav />
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-8 flex flex-col mt-16">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">坐席工作台</h2>
                <p className="text-sm text-gray-500">高效处理全渠道客户咨询</p>
              </div>
              <div className="flex-1 flex min-h-[700px]">
                <AgentWorkbench />
              </div>
            </main>
          </RequireAuth>
        } />

        <Route path="/admin" element={
          <RequireAuth>
            <TopNav />
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-8 flex flex-col mt-16">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">系统配置</h2>
                <p className="text-sm text-gray-500">知识库与业务规则</p>
              </div>
              <div className="flex-1 flex min-h-[700px]">
                <AdminConsole />
              </div>
            </main>
          </RequireAuth>
        } />

        {/* Redirect root and unknowns to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <VisitorClient isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:bg-purple-700 transition-all z-40 cursor-pointer"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
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
