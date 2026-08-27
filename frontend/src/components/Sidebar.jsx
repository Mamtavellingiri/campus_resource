import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Sparkles,
  Search,
  Calendar as CalendarIcon,
  QrCode,
  Wrench,
  MessageSquare,
  Leaf,
  Layers,
  CheckSquare
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const studentNav = [
    { label: 'Dashboard', path: '/dashboard/student', icon: LayoutDashboard },
    { label: 'Smart Booking', path: '/booking/smart', icon: Sparkles, badge: 'AI' },
    { label: 'Resources', path: '/resources', icon: Search },
    { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { label: 'My Bookings & QR', path: '/history', icon: QrCode },
    { label: 'Feedback', path: '/feedback', icon: MessageSquare }
  ];

  const facultyNav = [
    { label: 'Dashboard', path: '/dashboard/faculty', icon: LayoutDashboard },
    { label: 'Class Booking', path: '/booking/smart', icon: Sparkles, badge: 'Smart' },
    { label: 'Resources', path: '/resources', icon: Search },
    { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { label: 'My Bookings & QR', path: '/history', icon: QrCode },
    { label: 'Student Clearances', path: '/admin/bookings', icon: CheckSquare },
    { label: 'Feedback', path: '/feedback', icon: MessageSquare }
  ];

  const adminNav = [
    { label: 'Dashboard', path: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Resource Management', path: '/admin/resources', icon: Layers },
    { label: 'Booking Approvals', path: '/admin/bookings', icon: CheckSquare },
    { label: 'Maintenance', path: '/admin/maintenance', icon: Wrench },
    { label: 'Energy Analytics', path: '/analytics/energy', icon: Leaf, badge: 'Eco' },
    { label: 'Smart Booking', path: '/booking/smart', icon: Sparkles },
    { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { label: 'Feedback', path: '/feedback', icon: MessageSquare }
  ];

  let navItems = studentNav;
  if (role === 'FACULTY') navItems = facultyNav;
  if (role === 'ADMIN') navItems = adminNav;

  return (
    <aside className="w-60 glass-panel border-r border-slate-800/80 min-h-[calc(100vh-61px)] p-3.5 flex flex-col justify-between hidden md:flex shrink-0">
      <div>
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {role} Navigation
        </div>

        <nav className="mt-1.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Subtle Eco Footer Note */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-0.5 text-[11px]">
          <Leaf className="w-3.5 h-3.5" />
          <span>Green Campus Status</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Allocation efficiency saved <strong className="text-emerald-400 font-semibold">18.4% energy</strong> this month.
        </p>
      </div>
    </aside>
  );
}
