import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut, User, ChevronDown, Bell, Database, HardDrive } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { initials } from '@/utils/format';

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, isSupabaseConfigured } = useAuth();
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const crumbs = location.pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <nav className="hidden min-w-0 flex-1 items-center gap-1 text-sm text-slate-500 dark:text-slate-400 sm:flex">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            <span className={i === crumbs.length - 1 ? 'font-medium text-slate-800 dark:text-slate-200' : 'capitalize'}>{c}</span>
          </span>
        ))}
      </nav>
      <div className="flex-1 sm:hidden" />

      {/* Mode Indicator Badge */}
      <div className="flex items-center">
        {isSupabaseConfigured ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="h-3 w-3" />
            <span className="hidden md:inline">Supabase Mode</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <HardDrive className="h-3 w-3" />
            <span className="hidden md:inline">Demo Mode</span>
          </span>
        )}
      </div>

      <button onClick={toggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" title="Toggle dark mode">
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" title="Announcements">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>

      <div className="relative">
        <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
            {initials(user?.email.split('@')[0].replace('.', ' ') || 'U')}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-medium leading-tight text-slate-800 dark:text-slate-200">{user?.email}</p>
            <p className="text-[11px] capitalize leading-tight text-slate-500 dark:text-slate-400">{user?.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <Link to={`/${user?.role}/profile`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                <User className="h-4 w-4" /> Profile
              </Link>
              <button onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
