import React from 'react';
import { InfiniteSlider } from './InfiniteSlider';
import { Bot, Zap, Cloud, Database, Layout, Smartphone, Globe, Code, Lock } from 'lucide-react';

interface HeroSectionProps {
  onStartChat: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartChat }) => {
    return (
        <main className="w-full flex-1 mt-20 bg-gray-50/30">
            {/* Hero Top */}
            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-[1400px] px-8 pt-20 pb-24 md:pt-32 md:pb-32 lg:pt-44 lg:pb-56 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="w-full lg:w-1/2 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 font-bold text-sm mb-8 border border-purple-100 shadow-sm">
                                <Zap className="w-4 h-4 fill-purple-600" /> v2.0 Enterprise Release
                            </div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.15]">
                                Ship 10x Faster <br/>
                                <span className="text-purple-600">with LinkedAgent</span>
                            </h1>
                            <p className="mt-8 text-lg text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                Highly customizable AI-driven customer support components for building modern websites and applications that look and feel the way you mean it.
                            </p>

                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <button
                                    onClick={onStartChat}
                                    className="px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg transition-all shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer">
                                    <Bot className="w-5 h-5" /> Start Chatting
                                </button>
                                <button
                                    className="px-8 py-4 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-lg transition-all shadow-sm hover:shadow-premium cursor-pointer">
                                    Request a Demo
                                </button>
                            </div>
                        </div>
                        
                        {/* Fake UI mockup inside */}
                        <div className="w-full lg:w-1/2 relative hidden lg:block">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-blue-100 rounded-[40px] transform rotate-3 blur-3xl opacity-50"></div>
                            <div className="relative bg-white border border-gray-200 rounded-[32px] p-8 shadow-premium-lg">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-md h-6 flex items-center justify-center px-3">
                                            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
                                              <Lock className="w-3 h-3" /> linkedagent.app
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-[280px] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center relative overflow-hidden">
                                         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-50/50"></div>
                                         <Bot className="w-24 h-24 text-purple-200 relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="h-24 flex-1 bg-gray-50 rounded-xl border border-gray-100"></div>
                                        <div className="h-24 flex-1 bg-purple-50 border border-purple-100 rounded-xl"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slider Section */}
            <section className="bg-white border-y border-gray-200 py-16">
                <div className="mx-auto max-w-[1400px] px-8">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-56 md:border-r border-gray-200 md:pr-8 mb-8 md:mb-0 text-center md:text-right">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Powering the best teams</p>
                        </div>
                        <div className="flex-1 relative overflow-hidden py-4 ml-0 md:ml-8">
                            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
                            
                            <InfiniteSlider speed={40} gap={80}>
                                <div className="flex items-center gap-2 text-gray-400 font-bold text-2xl hover:text-gray-900 transition-colors"><Cloud className="w-8 h-8"/> Vertex AI</div>
                                <div className="flex items-center gap-2 text-gray-400 font-bold text-2xl hover:text-gray-900 transition-colors"><Database className="w-8 h-8"/> Supabase</div>
                                <div className="flex items-center gap-2 text-gray-400 font-bold text-2xl hover:text-gray-900 transition-colors"><Layout className="w-8 h-8"/> Vercel</div>
                                <div className="flex items-center gap-2 text-gray-400 font-bold text-2xl hover:text-gray-900 transition-colors"><Smartphone className="w-8 h-8"/> Stripe</div>
                                <div className="flex items-center gap-2 text-gray-400 font-bold text-2xl hover:text-gray-900 transition-colors"><Globe className="w-8 h-8"/> OpenAI</div>
                                <div className="flex items-center gap-2 text-gray-400 font-bold text-2xl hover:text-gray-900 transition-colors"><Code className="w-8 h-8"/> GitHub</div>
                            </InfiniteSlider>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};
