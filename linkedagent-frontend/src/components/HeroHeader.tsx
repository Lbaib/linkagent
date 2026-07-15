import React, { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';

const menuItems = [
    { name: 'Features', href: '#' },
    { name: 'Solution', href: '#' },
    { name: 'Pricing', href: '#' },
    { name: 'About', href: '#' },
];

interface HeroHeaderProps {
  onLoginClick: () => void;
  onAdminClick: () => void;
  onHomeClick: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ onLoginClick, onAdminClick, onHomeClick }) => {
    const [menuState, setMenuState] = useState(false);
    return (
        <header>
            <nav className="bg-white/70 fixed top-0 z-50 w-full border-b border-gray-200 backdrop-blur-3xl">
                <div className="mx-auto max-w-[1400px] px-8 transition-all duration-300">
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-4 lg:gap-0">
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={onHomeClick}>
                                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm">
                                  <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                                  LinkedAgent
                                </h1>
                            </div>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                className="relative z-20 block p-2 lg:hidden text-gray-600 hover:text-gray-900 cursor-pointer">
                                {menuState ? <X className="size-6" /> : <Menu className="size-6" />}
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-8 text-sm font-medium">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <a href={item.href} className="text-gray-500 hover:text-purple-600 transition-colors">
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className={`w-full lg:w-fit lg:flex items-center space-y-6 lg:space-y-0 lg:gap-4 ${menuState ? 'block pb-6' : 'hidden'}`}>
                            <div className="lg:hidden">
                                <ul className="space-y-4 text-base font-medium">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <a href={item.href} className="text-gray-500 hover:text-purple-600">
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 lg:pt-0 border-t border-gray-100 lg:border-none">
                                <button
                                    onClick={onLoginClick}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-sm transition-all cursor-pointer">
                                    客服工作台
                                </button>
                                <button
                                    onClick={onAdminClick}
                                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-all shadow-sm cursor-pointer">
                                    管理中心
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};
