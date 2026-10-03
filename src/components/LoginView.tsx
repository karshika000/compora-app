import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  X,
  Sparkles,
  Sun,
  Moon,
  GraduationCap,
  Building2,
  CheckCircle2,
  BookOpen,
  Award,
  Users,
  School,
  Layers,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeMode, UserRole } from '../types';
import { ComporaLogo } from './ComporaLogo';

interface LoginViewProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  themeMode,
  onToggleTheme,
  onLoginSuccess,
}) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'TEACHER') {
      setUsername('STF001');
      setPassword('arun@1985');
    } else {
      setUsername('26CSE001');
      setPassword('yoga@2005');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Invalid username/password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const res = await login(username.trim(), password, rememberMe);
    setLoading(false);

    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setErrorMessage(res.error || 'Invalid username/password');
    }
  };

  const handleQuickFill = (role: UserRole, u: string, p: string) => {
    setSelectedRole(role);
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* Top Floating/Sticky Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ComporaLogo variant="full" size="md" showTagline={false} />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 uppercase tracking-wider">
            Campus Platform
          </span>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200 dark:border-slate-800"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {themeMode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </header>

      {/* Main Split-Screen Authentication Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT: Branding, Tagline & Technology Illustration */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <School className="w-3.5 h-3.5" />
                <span>Next-Generation College Management System</span>
              </div>
              
              <div className="space-y-2">
                <ComporaLogo variant="full" size="xl" showTagline={true} />
                <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-tight mt-3">
                  One unified platform for your entire campus.
                </h1>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                COMPORA connects students, faculty, and collegiate leadership across Continuous Internal Assessments, coursework grading, event registrations, verified honors, and inter-house championships.
              </p>
            </div>

            {/* Subtle Academic / Technology Illustration & Feature Matrix */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 border border-indigo-800/40 text-white shadow-xl relative overflow-hidden space-y-5">
              <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-300" />
                  </div>
                  <span className="font-bold text-sm font-display text-white">
                    Integrated Institutional Ledger
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live & Connected
                </span>
              </div>

              {/* 4 Feature Items */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Academics</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    CIA 1 & 2 marks, SGPA/CGPA, and transcripts.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Honors & House</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Verified awards and house championship points.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Faculty Suite</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Class rosters, gradebooks, and assignment grading.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure Access</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Role-based database persistence and protection.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Login Card Form */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl dark:shadow-black/50 p-6 sm:p-8 space-y-6">
              
              {/* Card Header */}
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your role and enter your institutional credentials.
                </p>
              </div>

              {/* Role Switcher Tabs (Administrator, Teacher, Student) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('ADMIN')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'ADMIN'
                        ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('TEACHER')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'TEACHER'
                        ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('STUDENT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'STUDENT'
                        ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username / Identifier */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedRole === 'ADMIN' ? 'Admin Username' : selectedRole === 'TEACHER' ? 'Staff ID / Username' : 'Registration Number / Username'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={
                        selectedRole === 'ADMIN'
                          ? 'admin'
                          : selectedRole === 'TEACHER'
                          ? 'e.g. STF001'
                          : 'e.g. 26CSE001'
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Remember this device
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to COMPORA</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Account Quick-Fill Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Quick-Fill Demo Credentials
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('ADMIN', 'admin', 'admin123')}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer text-center"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('TEACHER', 'STF001', 'arun@1985')}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer text-center"
                  >
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('STUDENT', '26CSE001', 'yoga@2005')}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer text-center"
                  >
                    Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400">
        COMPORA Collegiate Academic & Institutional System • Secured by Role-Based Access Control
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                Credentials Help
              </h3>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Default student password format: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">&lt;first_4_letters_name&gt;@&lt;birth_year&gt;</span> (e.g. <span className="font-mono font-bold">aara@2004</span> for Aarav Sharma).
              For faculty: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">&lt;first_4_letters_name&gt;@&lt;birth_year&gt;</span> (e.g. <span className="font-mono font-bold">arun@1985</span>).
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
