import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TopNav: React.FC = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 fixed top-0 z-50 w-full border-b border-gray-200 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900">
            LinkedAgent
          </h1>
        </div>

        {/* Navigation */}
        <nav className="hidden sm:flex gap-6">
          <NavLink
            to="/agent"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-900'
              } pb-[22px] pt-[22px]`
            }
          >
            客服工作台
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-900'
              } pb-[22px] pt-[22px]`
            }
          >
            管理中心
          </NavLink>
        </nav>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span className="font-medium">{userInfo?.username || 'Admin'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            退出
          </button>
        </div>
      </div>
    </header>
  );
};
