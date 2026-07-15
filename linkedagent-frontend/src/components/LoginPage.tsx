import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { AuthCard } from './AuthCard';

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
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请检查账号或密码';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden tech-grid-bg">
      {/* Decorative tech glow (Static, no flashing) */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full px-4">
        <AuthCard>
          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4 border border-white/10">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{title}</h2>
            <p className="text-slate-400 text-sm">欢迎回来，请验证您的身份进入系统</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 block ml-1">账号</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                  placeholder="请输入您的账号"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 block ml-1">密码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                  placeholder="请输入您的密码"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-2.5 px-4 mt-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              ) : (
                <>
                  登录
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70" />
                </>
              )}
            </button>
          </form>
        </AuthCard>
      </div>
      
      <div className="absolute bottom-6 text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} LinkedAgent System. All rights reserved.
      </div>
    </div>
  );
};
