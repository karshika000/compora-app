import React, { useState, useRef, useEffect } from 'react';
import {
  Trophy,
  RefreshCw,
  Sun,
  Moon,
  Menu,
  X,
  UserCircle2,
  LogOut,
  Settings,
  ChevronDown,
  Search,
} from 'lucide-react';
import { HouseStats, NotificationItem } from '../types';
import { getHouseTheme } from '../utils/houseTheme';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { ComporaLogo } from './ComporaLogo';

interface NavbarProps {
  houseStats: HouseStats[];
  studentCount: number;
  eventCount: number;
  achievementCount: number;
  onNavigateToAI: () => void;
  onRefresh: () => void;
  loading: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onSelectNotificationTab?: (tab: any) => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  houseStats = [],
  studentCount,
  eventCount,
  achievementCount,
  onNavigateToAI,
  onRefresh,
  loading,
  isDarkMode,
  onToggleDarkMode,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onSelectNotificationTab,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onOpenProfile,
  onOpenSettings,
  onOpenSearch,
}) => {
  const { currentUser, linkedStudent, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const roleColors = {
    ADMIN: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    TEACHER: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    STUDENT: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };

  const safeHouseStats = houseStats || [];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Identity & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="p-2 md:hidden rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* COMPORA Logo */}
            <div className="flex items-center gap-2">
              <ComporaLogo variant="full" size="sm" showTagline={false} />
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 uppercase">
                Campus
              </span>
            </div>
          </div>

          {/* Center Global Search Trigger Bar (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between pl-3.5 pr-2.5 py-2 bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl text-xs text-slate-500 dark:text-slate-400 transition cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                <span>Search students, events, notices...</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 shadow-2xs">
                  ⌘K
                </span>
              </div>
            </button>
          </div>

          {/* House Standings Ticker (Desktop only) */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-full px-3 py-1 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Houses:</span>
            </span>

            {safeHouseStats.map((h) => {
              const theme = getHouseTheme(h.house);
              const isLeader = h.rank === 1;

              return (
                <div
                  key={h.house}
                  className={`flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700 first:border-0 first:pl-0 ${
                    isLeader ? 'font-bold' : 'font-medium'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${theme.dotColor}`} />
                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {h.house}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                      isLeader
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {h.totalPoints}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Button */}
            <button
              onClick={onOpenSearch}
              className="p-2 md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Global Search (⌘K)"
              aria-label="Open Search"
            >
              <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Notification Bell Dropdown */}
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClearAll={onClearNotifications}
              onSelectNotificationTab={onSelectNotificationTab}
            />

            {/* Dark/Light Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Sync Database */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition disabled:opacity-50 cursor-pointer"
              title="Refresh & Sync Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''
                }`}
              />
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition cursor-pointer"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    roleColors[currentUser?.role || 'STUDENT']
                  }`}
                >
                  {initials}
                </div>
                <div className="hidden lg:block text-left">
                  <span className="block text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                    {currentUser?.name || 'User'}
                  </span>
                  <span className="block text-[9px] text-slate-400 font-medium">
                    {currentUser?.role === 'STUDENT'
                      ? `${linkedStudent?.house || ''} House • Student`
                      : currentUser?.role === 'TEACHER'
                      ? 'Faculty Advisor'
                      : 'Administrator'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {currentUser?.email}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Role: {currentUser?.role}
                    </span>
                  </div>

                  <div className="py-1 text-xs font-semibold">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        if (onOpenProfile) onOpenProfile();
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <UserCircle2 className="w-4 h-4 text-indigo-500" />
                      <span>{currentUser?.role === 'STUDENT' ? 'My Student Profile' : 'My Account'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        if (onOpenSettings) onOpenSettings();
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings & Preferences</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
