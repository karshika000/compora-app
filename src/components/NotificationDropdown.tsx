import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Award,
  Users,
  Trophy,
  Info,
  CheckCheck,
  Trash2,
  X,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotificationTab?: (tab: any) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotificationTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'event_created':
      case 'event_reminder':
        return <Calendar className="w-4 h-4 text-sky-500" />;
      case 'participation_updated':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'achievement_created':
      case 'achievement_updated':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'house_rank_update':
        return <Trophy className="w-4 h-4 text-purple-500" />;
      case 'system_announcement':
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getBgForType = (type: NotificationType) => {
    switch (type) {
      case 'event_created':
      case 'event_reminder':
        return 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800';
      case 'participation_updated':
        return 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
      case 'achievement_created':
      case 'achievement_updated':
        return 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
      case 'house_rank_update':
        return 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800';
      case 'system_announcement':
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800';
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      onMarkAsRead(item.id);
    }
    if (item.targetTab && onSelectNotificationTab) {
      onSelectNotificationTab(item.targetTab);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  title="Mark all as read"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  title="Clear all"
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  No active notifications at this time.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition relative hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    !item.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Status Indicator Dot */}
                  {!item.read && (
                    <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}

                  {/* Icon Box */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${getBgForType(
                      item.type
                    )}`}
                  >
                    {getIconForType(item.type)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs font-bold truncate ${
                          !item.read
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {item.targetTab && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        <span>View in {item.targetTab}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              COMPORA Institutional Activity Stream
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
