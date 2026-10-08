import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCircle2, Clock, AlertTriangle, Shield, Check } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-400" />
            System Notifications Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time updates regarding booking clearances, check-in reminders, and no-show releases
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30 shrink-0"
          >
            Mark All as Read
          </button>
        )}
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800 divide-y divide-slate-800/80">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No system notifications found.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`py-4 flex items-start justify-between gap-4 text-xs cursor-pointer transition-colors ${
                n.isRead ? 'opacity-70' : 'bg-emerald-500/5 -mx-6 px-6 border-l-4 border-emerald-500'
              }`}
            >
              <div className="space-y-1">
                <div className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                  {n.type === 'BOOKING_APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {n.type === 'NO_SHOW' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {n.title}
                </div>
                <p className="text-slate-300 leading-relaxed">{n.message}</p>
              </div>

              <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
