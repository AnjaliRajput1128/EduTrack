import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen, Layers,
  CalendarCheck, TrendingUp, FileBarChart, Megaphone, Settings, User,
  Clock, X, BookMarked,
} from 'lucide-react';
import type { Role } from '@/types';
import { APP_NAME } from '@/lib/config';
import { classNames } from '@/utils/format';

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; }

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/faculty', label: 'Faculty', icon: GraduationCap },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/courses', label: 'Courses', icon: BookMarked },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/performance', label: 'Performance', icon: TrendingUp },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
    { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  faculty: [
    { to: '/faculty', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/faculty/subjects', label: 'My Subjects', icon: Layers },
    { to: '/faculty/students', label: 'Students', icon: Users },
    { to: '/faculty/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/faculty/marks', label: 'Marks', icon: TrendingUp },
    { to: '/faculty/performance', label: 'Performance', icon: FileBarChart },
    { to: '/faculty/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/faculty/reports', label: 'Reports', icon: FileBarChart },
    { to: '/faculty/profile', label: 'Profile', icon: User },
  ],
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/attendance', label: 'My Attendance', icon: CalendarCheck },
    { to: '/student/performance', label: 'My Performance', icon: TrendingUp },
    { to: '/student/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/student/timetable', label: 'Timetable', icon: Clock },
    { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/student/reports', label: 'Reports', icon: FileBarChart },
    { to: '/student/profile', label: 'Profile', icon: User },
  ],
};

export default function Sidebar({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  const items = NAV[role];
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">ET</div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{APP_NAME}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role}`}
              onClick={onClose}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )
              }
            >
              <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400 dark:border-slate-800">
          v1.0.0 · {role.charAt(0).toUpperCase() + role.slice(1)} Portal
        </div>
      </aside>
    </>
  );
}
