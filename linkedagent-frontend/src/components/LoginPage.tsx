import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Loader2, ArrowRight, Sparkles, CheckCircle2, Shield, Zap } from 'lucide-react';

interface LoginPageProps {
  title?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  title = 'LinkedAgent 系统登录',
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/agent';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username, password });
      // In a real app, handle rememberMe here (e.g., set local vs session storage)
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请检查账号或密码';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-950 text-slate-200">
      {/* Left Pane - Branding & Features */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-slate-950 border-r border-white/5 tech-grid-bg p-12 lg:p-20">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px]" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">LinkedAgent</h1>
        </div>

        {/* Center Slogan */}
        <div className="relative z-10 max-w-lg mt-12">
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            Empowering AI-driven <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Customer Experiences
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            构建下一代智能坐席与管理中枢，无缝整合全渠道沟通，让每一次服务都精准高效。
          </p>
        </div>

        {/* Bottom Feature Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
            <Zap className="w-6 h-6 text-violet-400 mb-3" />
            <h3 className="font-semibold text-slate-200 mb-1">极速响应</h3>
            <p className="text-sm text-slate-500">毫秒级消息流转与智能分发</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
            <Shield className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="font-semibold text-slate-200 mb-1">企业级安全</h3>
            <p className="text-sm text-slate-500">端到端加密与严格权限控制</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
            <CheckCircle2 className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="font-semibold text-slate-200 mb-1">智能闭环</h3>
            <p className="text-sm text-slate-500">从工单到解决的数据洞察</p>
          </div>
        </div>
      </div>

      {/* Right Pane - Auth Form */}
      <div className="flex flex-col justify-center items-center p-8 sm:p-12 lg:p-20 bg-slate-950 relative">
        <div className="w-full max-w-[400px]">
          
          {/* Mobile Logo (hidden on desktop) */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">LinkedAgent</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{title}</h2>
            <p className="text-slate-400 text-sm font-light">欢迎回来，请登录以继续访问您的工作台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block">工作账号</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] text-sm"
                  placeholder="请输入您的账号"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block">登录密码</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Meta Row: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 rounded border border-slate-600 bg-slate-900 peer-checked:bg-violet-500 peer-checked:border-violet-500 transition-all"></div>
                  <div className="absolute opacity-0 peer-checked:opacity-100 transition-opacity">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
                <span className="ml-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">记住账号</span>
              </label>

              <a href="#" className="text-sm text-slate-400 hover:text-violet-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:bg-violet-400 after:transition-transform after:duration-300">
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full flex items-center justify-center py-3 px-4 mt-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_14px_0_rgba(139,92,246,0.39)]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              ) : (
                <>
                  登录系统
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} LinkedAgent System. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
