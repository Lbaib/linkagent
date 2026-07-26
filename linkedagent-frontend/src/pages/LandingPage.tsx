import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot, Zap, Menu, X, ArrowRight, MessageCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { name: '功能特权', href: '#features' },
    { name: '解决方案', href: '#solution' },
    { name: '价格方案', href: '#pricing' },
    { name: '关于我们', href: '#about' },
];

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated, loading } = useAuth();

    // Route Guard: If logged in, automatically go to /agent
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/agent', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const handleCTA = () => {
        if (isAuthenticated) {
            navigate('/agent');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-body selection:bg-[var(--color-accent)] selection:text-white">
            
            {/* Navbar */}
            <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-3xl border-b border-gray-200/50 transition-all">
                <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center shadow-premium">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900">LinkedAgent</span>
                        </div>

                        {/* Desktop Menu */}
                        <nav className="hidden md:flex gap-8">
                            {menuItems.map((item, idx) => (
                                <a key={idx} href={item.href} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors relative group">
                                    {item.name}
                                    <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
                                </a>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <button onClick={handleCTA} className="text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer">
                                免费注册
                            </button>
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-bold shadow-premium hover:shadow-premium-lg transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                            >
                                登录 <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button className="md:hidden p-2 text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Dropdown */}
            {menuOpen && (
                <div className="md:hidden fixed top-20 left-0 w-full bg-white border-b border-gray-200 z-40 p-4 shadow-xl animate-in slide-in-from-top-4">
                    <nav className="flex flex-col gap-4">
                        {menuItems.map((item, idx) => (
                            <a key={idx} href={item.href} className="text-lg font-semibold text-gray-700 p-2 hover:bg-gray-50 rounded-lg">
                                {item.name}
                            </a>
                        ))}
                        <div className="h-px bg-gray-100 my-2"></div>
                        <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white font-bold text-center">
                            登录 / Login
                        </button>
                    </nav>
                </div>
            )}

            <main className="flex-1 mt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-32">
                    {/* Background Glows */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--color-accent)]/20 blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="mx-auto max-w-[1400px] px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
                            
                            {/* Left Text */}
                            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold text-sm mb-8 border border-[var(--color-accent)]/20">
                                    <Zap className="w-4 h-4" /> B2B SaaS Enterprise V2
                                </div>
                                
                                <h1 className="text-5xl lg:text-6xl xl:text-[68px] font-bold tracking-tight text-gray-900 leading-[1.15]">
                                    下一代 AI 驱动的 <br className="hidden lg:block"/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-[#a855f7]">全渠道智能客服系统</span>
                                </h1>
                                
                                <p className="mt-6 text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
                                    连接每一个客户，赋能每一位坐席。通过强大的 AI 意图识别与自动化流，大幅提升转化率与客户满意度，将您的支持中心转化为增长引擎。
                                </p>
                                
                                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                    <button
                                        onClick={handleCTA}
                                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-lg shadow-premium-lg hover:shadow-[0_15px_30px_-5px_rgba(124,59,237,0.4)] transition-all hover:-translate-y-1 cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        免费试用 <ArrowRight className="w-5 h-5" />
                                    </button>
                                    <button
                                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-gray-200 hover:border-[var(--color-accent)]/50 hover:bg-gray-50 text-gray-700 font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Bot className="w-5 h-5 text-gray-500" /> 观看演示
                                    </button>
                                </div>
                            </div>

                            {/* Right Illustration */}
                            <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center lg:justify-end animate-in fade-in zoom-in duration-1000 delay-200">
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/50 to-blue-100/50 rounded-[40px] transform rotate-3 blur-3xl opacity-50"></div>
                                <img 
                                    src="/hero-bg.png" 
                                    alt="LinkedAgent Console 3D Illustration" 
                                    className="relative z-10 w-full max-w-[600px] h-auto object-contain drop-shadow-2xl"
                                    onError={(e) => {
                                        // Fallback if image not uploaded yet
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                {/* Fallback Mockup if image is missing */}
                                <div className="hidden relative z-10 w-full max-w-[500px] bg-white border border-gray-200 rounded-[32px] p-6 shadow-premium-lg">
                                    <div className="flex flex-col gap-4">
                                        <div className="h-6 w-32 bg-gray-100 rounded-md"></div>
                                        <div className="h-48 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center">
                                            <span className="text-gray-400 font-medium">请将 3D 插画放置于 public/hero-bg.png</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1 h-20 bg-purple-50 rounded-xl"></div>
                                            <div className="flex-1 h-20 bg-blue-50 rounded-xl"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-white">
                    <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">为什么选择 LinkedAgent？</h2>
                            <p className="text-lg text-gray-500">重新定义企业级客户服务的标准，我们将 AI 能力融入到每一次交互中。</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="group glass-card rounded-[32px] p-8 hover:-translate-y-1 cursor-default">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-7 h-7 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">全渠道接入</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    无缝整合网页、微信、邮件及自有 App，提供统一的工作台高效处理所有渠道的客户来访，绝不漏掉任何商机。
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="group glass-card rounded-[32px] p-8 hover:-translate-y-1 cursor-default relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-7 h-7 text-[var(--color-accent)]" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">AI 智能辅助</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    基于大模型的意图识别，自动生成高情商回复建议，提供实时话术推荐与知识库检索，大幅降低人工坐席成本。
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="group glass-card rounded-[32px] p-8 hover:-translate-y-1 cursor-default">
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="w-7 h-7 text-orange-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">坐席控制台</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    强大的管理后端，支持实时流量监听、客服状态监控、并发额度灵活管理以及丰富的数据 BI 报表，决策更有依据。
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white pt-16 pb-8">
                <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold">LinkedAgent</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                致力于为现代企业提供最智能、最高效的客户联络中心解决方案。
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">产品</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">在线客服</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">AI 机器人</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">工单系统</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">数据分析</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">资源</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">帮助文档</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">开发者 API</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">博客</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">最佳实践</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">关于</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">公司介绍</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">联系我们</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">隐私政策</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">服务条款</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} LinkedAgent Inc. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Icons Placeholder */}
                            <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"></div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
