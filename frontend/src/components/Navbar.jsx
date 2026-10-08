import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  Search,
  User,
  LogOut,
  Leaf,
  Sparkles,
  Shield,
  GraduationCap,
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><Shield className="w-3 h-3"/> ADMIN</span>;
      case 'FACULTY':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Briefcase className="w-3 h-3"/> FACULTY</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><GraduationCap className="w-3 h-3"/> STUDENT</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">
                Campus<span className="text-emerald-400 font-semibold">Hub</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium">
                Resource & Energy Management
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Clean Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search classrooms, labs, equipment..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/resources?search=${encodeURIComponent(e.target.value)}`);
                }
              }}
              className="w-full bg-slate-900/90 border border-slate-800/90 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-3">
          
          <Link
            to="/booking/smart"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {user?.role === 'STUDENT' ? 'Year Schedule' : 'Smart Booking'}
          </Link>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifs && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-90 glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden z-50">
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-semibold text-xs text-slate-100">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-emerald-400 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                  {notifications.length === 0 ? (
                    <div className="p-5 text-center text-slate-500 text-xs">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-3 text-xs cursor-pointer transition-colors ${
                          n.isRead ? 'bg-transparent text-slate-400' : 'bg-emerald-500/5 text-slate-200 border-l-2 border-emerald-500'
                        } hover:bg-slate-900/60`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            {n.type === 'BOOKING_APPROVED' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                            {n.type === 'NO_SHOW' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-400 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-800 text-center bg-slate-950/40">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="text-xs text-slate-400 hover:text-emerald-400 font-medium"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left pr-1">
                  <div className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
                    {user.name}
                  </div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2.5 w-52 glass-panel rounded-2xl border border-slate-800 shadow-xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <div className="font-semibold text-xs text-slate-100">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate mb-1">{user.email}</div>
                    {getRoleBadge(user.role)}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white rounded-xl transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    My Profile
                  </Link>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all">
                Register
              </Link>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
