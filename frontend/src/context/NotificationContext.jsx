import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { Bell, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationToast, setNotificationToast] = useState(null);
  const knownNotificationIds = useRef(new Set());
  const hasLoadedNotifications = useRef(false);
  const toastTimer = useRef(null);

  const fetchNotifications = async () => {
    if (!token || !user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        const incoming = res.data.notifications;
        if (hasLoadedNotifications.current) {
          const freshNotification = incoming.find((notification) =>
            !notification.isRead && !knownNotificationIds.current.has(notification.id)
          );
          if (freshNotification) {
            setNotificationToast(freshNotification);
            clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setNotificationToast(null), 7000);
          }
        }
        incoming.forEach((notification) => knownNotificationIds.current.add(notification.id));
        hasLoadedNotifications.current = true;
        setNotifications(incoming);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15s
    return () => {
      clearInterval(interval);
      clearTimeout(toastTimer.current);
    };
  }, [token, user]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markRead,
      markAllRead
    }}>
      {notificationToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-20 z-[60] w-[min(24rem,calc(100vw-2rem))] border border-emerald-500/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-100">{notificationToast.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{notificationToast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotificationToast(null)}
              className="text-slate-500 hover:text-slate-200"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
