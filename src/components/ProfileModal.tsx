import React from 'react';
import {
  X,
  User,
  Shield,
  Database,
  Moon,
  Sun,
  HardDrive,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigateToTab: (tab: NavTab) => void;
  studentCount: number;
  eventCount: number;
  achievementCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleDarkMode,
  onNavigateToTab,
  studentCount,
  eventCount,
  achievementCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                Dean / Campus Administrator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional Super-Admin Role
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Details */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Institutional ID:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              FAC-DEAN-2026
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Office / Wing:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Office of Student Affairs & Sports
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400">Access Tier:</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Full Ledger Access
            </span>
          </div>
        </div>

        {/* Preferences & Quick Controls */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Interface & Controls
          </span>

          {/* Dark / Light Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
            <div className="flex items-center gap-2.5">
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-purple-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Theme Appearance
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
                </span>
              </div>
            </div>

            <button
              onClick={onToggleDarkMode}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
            >
              Toggle
            </button>
          </div>

          {/* Quick link to Settings */}
          <button
            onClick={() => {
              onNavigateToTab('settings');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  System & Scalability Tools
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Manage database backups, scoring rules & seeder
                </span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Database Status */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Students</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-display">
              {studentCount}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Events</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-display">
              {eventCount}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Honors</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-display">
              {achievementCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
