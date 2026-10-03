import React, { useState } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  PlusCircle,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Download,
  User,
  Lock,
  Sun,
  Moon,
  Laptop,
  Bell,
  LogOut,
  AlertCircle,
  KeyRound,
  Shield,
  Phone,
  Mail,
  Check,
  Eye,
  EyeOff,
  Calendar,
  BookOpen,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeMode, NotificationPreferences } from '../types';
import { POINT_SYSTEM } from '../data/initialData';

interface SettingsViewProps {
  studentCount: number;
  eventCount: number;
  achievementCount: number;
  participationCount: number;
  onSeedBatch: (count: number) => Promise<void>;
  onResetData: () => Promise<void>;
  fullDatabase: any;
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
  notificationPrefs: NotificationPreferences;
  onUpdateNotificationPrefs: (prefs: NotificationPreferences) => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  studentCount,
  eventCount,
  achievementCount,
  participationCount,
  onSeedBatch,
  onResetData,
  fullDatabase,
  themeMode,
  onSetThemeMode,
  notificationPrefs,
  onUpdateNotificationPrefs,
  onAddToast,
}) => {
  const { currentUser, linkedStudent, linkedTeacher, updateProfile, changePassword, logout } = useAuth();

  // Active Settings Sub-Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'security' | 'system'>('profile');

  // Profile Form State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // System Database State
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      onAddToast('Name and email are required.', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    const res = await updateProfile({
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
    });
    setIsUpdatingProfile(false);

    if (res.success) {
      onAddToast('Your profile details have been updated.', 'success', 'Profile Saved');
    } else {
      onAddToast(res.error || 'Failed to update profile.', 'error');
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      onAddToast('Please fill in both current and new password.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      onAddToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      onAddToast('New password and confirmation do not match.', 'error');
      return;
    }

    setIsChangingPass(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsChangingPass(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onAddToast('Your password was updated successfully.', 'success', 'Security Updated');
    } else {
      onAddToast(res.error || 'Failed to change password.', 'error');
    }
  };

  // Handle Seed
  const handleSeed = async (count: number) => {
    setSeeding(true);
    try {
      await onSeedBatch(count);
      onAddToast(`Successfully added ${count} new student benchmark records.`, 'success', 'Dataset Seeded');
    } catch (e) {
      onAddToast('Failed to seed batch.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  // Handle Reset
  const handleReset = async () => {
    if (!window.confirm('Reset database back to initial collegiate benchmark? User accounts will be preserved.')) return;
    setResetting(true);
    try {
      await onResetData();
      onAddToast('Database benchmark restored to official starter data.', 'info', 'Database Reset');
    } catch (e) {
      onAddToast('Failed to reset database.', 'error');
    } finally {
      setResetting(false);
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullDatabase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `compora_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onAddToast('Database JSON backup downloaded.', 'info', 'Backup Generated');
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Settings & Preferences</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your account credentials, dark mode themes, institutional notifications, and system parameters.
          </p>
        </div>

        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100/70 dark:hover:bg-rose-900/40 transition shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Account</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Appearance & Theme</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Password & Security</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'system'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>System & Scalability</span>
          </button>
        )}
      </div>

      {/* Tab 1: Profile & Account */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              User Profile & Identity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your personal contact details. Your role and official institutional credentials are managed by the campus administration.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Username</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.username || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-mono"
                />
                <span className="text-[10px] text-slate-400">Institutional identifier cannot be changed</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">System Role</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.role || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Institutional Email</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="+91 98400..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {linkedStudent && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 space-y-2">
                <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Linked Enrolled Student Credentials:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-indigo-800 dark:text-indigo-300/80 font-mono">
                  <div>Roll Number: <strong>{linkedStudent.student_id}</strong></div>
                  <div>Assigned House: <strong>{linkedStudent.house} House</strong></div>
                  <div>Department: <strong>{linkedStudent.department}</strong></div>
                  <div>Academic Year: <strong>{linkedStudent.year}</strong></div>
                  {linkedStudent.date_of_birth && (
                    <div className="col-span-2">
                      Date of Birth: <strong>{new Date(linkedStudent.date_of_birth + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {linkedTeacher && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                  <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Faculty Official Institutional Profile:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-900 dark:text-amber-200">
                  <div>Staff ID: <strong className="font-mono">{linkedTeacher.staff_id || currentUser?.username}</strong></div>
                  <div>Department: <strong>{linkedTeacher.department}</strong></div>
                  <div>Designation: <strong>{linkedTeacher.designation}</strong></div>
                  <div>
                    Date of Birth:{' '}
                    <strong>
                      {linkedTeacher.date_of_birth
                        ? new Date(linkedTeacher.date_of_birth + 'T00:00:00').toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Not Provided'}
                    </strong>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    Assigned Subjects:{' '}
                    <strong>
                      {linkedTeacher.assigned_subjects?.length > 0
                        ? linkedTeacher.assigned_subjects.join(', ')
                        : 'None'}
                    </strong>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    Assigned Classes:{' '}
                    <strong>
                      {linkedTeacher.assigned_classes?.length > 0
                        ? linkedTeacher.assigned_classes.join(', ')
                        : 'None'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50"
              >
                {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Appearance & Theme */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Display & Color Theme
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select how COMPORA renders across your workstation or mobile device.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Mode */}
            <button
              onClick={() => onSetThemeMode('light')}
              className={`p-5 rounded-2xl border text-left transition relative cursor-pointer ${
                themeMode === 'light'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <Sun className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Light Mode
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                High-contrast collegiate daylight theme with crisp slate borders.
              </p>
              {themeMode === 'light' && (
                <div className="absolute top-4 right-4 text-indigo-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => onSetThemeMode('dark')}
              className={`p-5 rounded-2xl border text-left transition relative cursor-pointer ${
                themeMode === 'dark'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center mb-3">
                <Moon className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Dark Mode
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Deep obsidian canvas for evening campus work and reduced eye strain.
              </p>
              {themeMode === 'dark' && (
                <div className="absolute top-4 right-4 text-indigo-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </button>

            {/* System Mode */}
            <button
              onClick={() => onSetThemeMode('system')}
              className={`p-5 rounded-2xl border text-left transition relative cursor-pointer ${
                themeMode === 'system'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mb-3">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                System Sync
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Automatically matches your operating system's light/dark setting.
              </p>
              {themeMode === 'system' && (
                <div className="absolute top-4 right-4 text-indigo-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Notification Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control the notification toasts and in-app alerts you receive.
            </p>
          </div>

          <div className="space-y-4 max-w-xl text-xs">
            {/* Master Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  Enable In-App Notifications
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                  Show bell indicators and alert toasts for campus updates.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPrefs.enabled}
                  onChange={(e) =>
                    onUpdateNotificationPrefs({ ...notificationPrefs, enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Event Alerts */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  New Event Announcements
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Notify when faculty adds new symposiums, sports meets, or workshops.
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!notificationPrefs.enabled}
                checked={notificationPrefs.events}
                onChange={(e) =>
                  onUpdateNotificationPrefs({ ...notificationPrefs, events: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Achievement Alerts */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Verified Honors & Achievements
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Notify when a student or house records new competition points.
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!notificationPrefs.enabled}
                checked={notificationPrefs.achievements}
                onChange={(e) =>
                  onUpdateNotificationPrefs({ ...notificationPrefs, achievements: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Event Reminders */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Upcoming Event Reminders
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Alerts for events occurring within the next 48 hours.
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!notificationPrefs.enabled}
                checked={notificationPrefs.reminders}
                onChange={(e) =>
                  onUpdateNotificationPrefs({ ...notificationPrefs, reminders: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Password & Security */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Change Account Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ensure your account uses a strong password with at least 6 characters. Passwords are encrypted on the server.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurPass(!showCurPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCurPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                New Password * (minimum 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new secure password"
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50"
              >
                {isChangingPass ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 5: System & Scalability (Admin Only) */}
      {isAdmin && activeTab === 'system' && (
        <div className="space-y-6">
          {/* Database Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">Students Loaded</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
                {studentCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Scalable to 1000+</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">College Events</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
                {eventCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Campus activities</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">Verified Achievements</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
                {achievementCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Points calculated</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">Event Registrations</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
                {participationCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">5 pts per registration</div>
            </div>
          </div>

          {/* Scalability Batch Seeding & Resetting */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Scalability & Volume Benchmarking (1000+ Students Target)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stress-test data virtualization, search filters, and house score aggregation under heavy volume.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => handleSeed(25)}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Generate +25 Random Students</span>
              </button>

              <button
                onClick={() => handleSeed(100)}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Generate +100 Students Batch</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Database JSON Backup</span>
              </button>

              <button
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition disabled:opacity-50 ml-auto cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset Starter Collegiate Dataset</span>
              </button>
            </div>
          </div>

          {/* Official Scoring Matrix Rules */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>COMPORA Point Allocation Rules</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Active scoring multipliers that govern House Championship rankings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                  Achievement Point Values
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">National Level</span>
                  <strong className="text-purple-700 dark:text-purple-400 font-mono">+40 pts</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">State Level</span>
                  <strong className="text-blue-700 dark:text-blue-400 font-mono">+30 pts</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">District Level</span>
                  <strong className="text-amber-700 dark:text-amber-400 font-mono">+20 pts</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">College Level</span>
                  <strong className="text-slate-700 dark:text-slate-300 font-mono">+10 pts</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                  Participation & House Rules
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Event Participation Multiplier</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono">+5 pts per student entry</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">House Point Rollup</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">Real-time aggregate</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Houses Competing</span>
                  <strong className="text-slate-800 dark:text-slate-200">Red, Blue, Green, Yellow</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Tie-Breaking Hierarchy</span>
                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">1. Total Pts → 2. Achievements → 3. Participations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
