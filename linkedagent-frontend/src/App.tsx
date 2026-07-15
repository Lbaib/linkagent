import { useState } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import { VisitorClient } from './components/VisitorClient';
import { AgentWorkbench } from './components/AgentWorkbench';
import { AdminConsole } from './components/AdminConsole';
import { HeroHeader } from './components/HeroHeader';
import { HeroSection } from './components/HeroSection';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageCircle } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'home' | 'agent' | 'admin'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const { isAuthenticated, loading } = useAuth();

  // 保护路由的简易鉴权包装
  const renderProtectedRoute = (Component: React.ReactNode, title: string) => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }
    if (!isAuthenticated) {
      return <LoginPage title={title} />;
    }
    return Component;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-body">
      {/* Shared Hero Header */}
      <HeroHeader 
        onLoginClick={() => setActiveTab('agent')}
        onAdminClick={() => setActiveTab('admin')}
        onHomeClick={() => setActiveTab('home')}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 w-full flex flex-col">
        {activeTab === 'home' && (
           <div className="w-full h-full flex flex-col">
               <HeroSection onStartChat={() => setIsChatOpen(true)} />
           </div>
        )}

        {activeTab === 'agent' && (
          <div className="flex-1 w-full flex flex-col">
            {renderProtectedRoute(
              <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10 flex flex-col z-10 mt-20">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">坐席工作台</h2>
                  <p className="text-lg text-gray-500">高效处理全渠道客户咨询，实时掌控全局。</p>
                </div>
                <div className="flex-1 min-h-[700px] flex">
                  <AgentWorkbench />
                </div>
              </main>,
              "坐席工作台登录"
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="flex-1 w-full flex flex-col">
            {renderProtectedRoute(
              <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10 flex flex-col z-10 mt-20">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">系统配置</h2>
                  <p className="text-lg text-gray-500">自定义知识库与业务规则。</p>
                </div>
                <div className="flex-1 min-h-[700px] flex">
                  <AdminConsole />
                </div>
              </main>,
              "管理员登录"
            )}
          </div>
        )}
      </div>

      {/* Floating Chat Widget */}
      <VisitorClient isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Floating trigger button */}
      {!isChatOpen && activeTab === 'home' && (
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

export default function App() {
  return (
    <SimulationProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SimulationProvider>
  );
}
