import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutDashboard,
  BrainCircuit,
  History,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'History & Reports', path: '/history', icon: History },
    { label: 'Resume Analyzer', path: '/resume', icon: FileText },
    { label: 'Profile Settings', path: '/profile', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans text-white">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-zinc-900 bg-zinc-950/65 backdrop-blur-xl z-20">
        {/* Branding */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-zinc-900">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <BrainCircuit className="w-4 h-4 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white font-mono">InterviewAI</span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? 'bg-purple-600/10 border border-purple-500/25 text-purple-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-purple-400' : 'text-zinc-400 group-hover:text-white'}`} />
                  {item.label}
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 opacity-0 group-hover:opacity-100 ${
                  active ? 'text-purple-400 opacity-100' : 'text-zinc-650'
                }`} />
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
          <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-zinc-900/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-500/30 flex items-center justify-center border border-purple-500/20 text-purple-300">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserIcon className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-550 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Nav Header */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between h-16 px-6 bg-zinc-950 border-b border-zinc-900 z-30">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg">
              <BrainCircuit className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="text-md font-bold tracking-tight text-white font-mono">InterviewAI</span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-white"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 bg-black z-40 md:hidden"
              />
              
              {/* Drawer Container */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-zinc-900 z-50 p-6 flex flex-col justify-between md:hidden"
              >
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold font-mono">InterviewAI</span>
                    <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-md hover:bg-zinc-900">
                      <X className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>
                  
                  <nav className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                            active
                              ? 'bg-purple-600/10 border border-purple-500/25 text-purple-400'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-950 flex items-center justify-center text-purple-300">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{user?.name}</p>
                      <p className="text-[10px] text-zinc-500">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/20 text-red-400 bg-red-950/10 hover:bg-red-950/20 text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3. Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-black relative">
          <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
