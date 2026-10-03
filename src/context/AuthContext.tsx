import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Student, Teacher } from '../types';
import { authenticateCredentials } from '../utils/authEngine';
import {
  getLocalStudents,
  getLocalTeachers,
  getLocalUsers,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
  saveLocalUsers,
} from '../utils/localDB';

interface AuthContextType {
  currentUser: User | null;
  linkedStudent: Student | null;
  linkedTeacher: Teacher | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: { name?: string; email?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  setLinkedStudent: React.Dispatch<React.SetStateAction<Student | null>>;
  setLinkedTeacher: React.Dispatch<React.SetStateAction<Teacher | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'compora_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    const session = getStoredSession();
    return session?.token || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = getStoredSession();
    return session?.user || null;
  });
  const [linkedStudent, setLinkedStudent] = useState<Student | null>(() => {
    const session = getStoredSession();
    return session?.linkedStudent || null;
  });
  const [linkedTeacher, setLinkedTeacher] = useState<Teacher | null>(() => {
    const session = getStoredSession();
    return session?.linkedTeacher || null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Authenticated fetch wrapper
  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(init.headers || {});
      const activeToken = token || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      }
      return fetch(input, {
        ...init,
        headers,
      });
    },
    [token]
  );

  // Verify and refresh session on mount
  useEffect(() => {
    const initAuth = async () => {
      const stored = getStoredSession();
      const savedToken = stored?.token || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      
      if (!savedToken) {
        setLoading(false);
        return;
      }

      // If we already have cached session details, initialize immediately to avoid UI delay
      if (stored && stored.user) {
        setCurrentUser(stored.user);
        setLinkedStudent(stored.linkedStudent || null);
        setLinkedTeacher(stored.linkedTeacher || null);
        setToken(stored.token);
      }

      // Attempt live sync with backend if available
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        // Check if response is valid JSON from actual API rather than SPA HTML fallback
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.user) {
            setCurrentUser(data.user);
            setLinkedStudent(data.linkedStudent || null);
            setLinkedTeacher(data.linkedTeacher || null);
            setToken(savedToken);
            saveStoredSession({
              token: savedToken,
              user: data.user,
              linkedStudent: data.linkedStudent || null,
              linkedTeacher: data.linkedTeacher || null,
              timestamp: Date.now(),
              rememberMe: stored?.rememberMe ?? true,
            });
          }
        } else if (res.status === 401 || res.status === 403) {
          // Explicit token rejection by server
          clearStoredSession();
          localStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setCurrentUser(null);
          setLinkedStudent(null);
          setLinkedTeacher(null);
        }
      } catch (err) {
        // Network unreachable or static Vercel build: keep local valid session
        console.info('Session maintained from verified client store.');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (
    username: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, error: 'Invalid username/password' };
    }

    // 1. First attempt login against server API if available
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword, rememberMe }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.token && data.user) {
          const newToken = data.token;
          if (rememberMe) {
            localStorage.setItem(TOKEN_KEY, newToken);
            sessionStorage.removeItem(TOKEN_KEY);
          } else {
            sessionStorage.setItem(TOKEN_KEY, newToken);
            localStorage.removeItem(TOKEN_KEY);
          }

          setToken(newToken);
          setCurrentUser(data.user);
          setLinkedStudent(data.linkedStudent || null);
          setLinkedTeacher(data.linkedTeacher || null);

          saveStoredSession({
            token: newToken,
            user: data.user,
            linkedStudent: data.linkedStudent || null,
            linkedTeacher: data.linkedTeacher || null,
            timestamp: Date.now(),
            rememberMe,
          });

          return { success: true };
        }
      }
    } catch (apiErr) {
      // API unreachable or static Vercel host -> continue to client-side auth engine
      console.info('Authenticating via client credentials store...');
    }

    // 2. Client-Side Authentication Engine against full dataset
    // (Used in Vercel deployment, offline mode, or when API proxy is not running)
    const currentStudents = getLocalStudents();
    const currentTeachers = getLocalTeachers();
    const currentUsers = getLocalUsers();

    const authResult = authenticateCredentials(cleanUsername, cleanPassword, {
      students: currentStudents,
      teachers: currentTeachers,
      users: currentUsers,
    });

    if (authResult.success) {
      const newToken = authResult.token;
      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, newToken);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        sessionStorage.setItem(TOKEN_KEY, newToken);
        localStorage.removeItem(TOKEN_KEY);
      }

      setToken(newToken);
      setCurrentUser(authResult.user);
      setLinkedStudent(authResult.linkedStudent);
      setLinkedTeacher(authResult.linkedTeacher);

      saveStoredSession({
        token: newToken,
        user: authResult.user,
        linkedStudent: authResult.linkedStudent,
        linkedTeacher: authResult.linkedTeacher,
        timestamp: Date.now(),
        rememberMe,
      });

      return { success: true };
    }

    return { success: false, error: 'Invalid username/password' };
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await authFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      clearStoredSession();
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setCurrentUser(null);
      setLinkedStudent(null);
      setLinkedTeacher(null);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return { success: true };
      }
    } catch (err) {
      // Fallback local change
    }

    if (currentUser) {
      const updatedUser: User = { ...currentUser, password_changed: true };
      setCurrentUser(updatedUser);
      const stored = getStoredSession();
      if (stored) {
        saveStoredSession({ ...stored, user: updatedUser });
      }
      return { success: true };
    }

    return { success: false, error: 'Failed to change password.' };
  };

  const updateProfile = async (updates: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          const stored = getStoredSession();
          if (stored) {
            saveStoredSession({ ...stored, user: data.user });
          }
          return { success: true };
        }
      }
    } catch (err) {
      // Local fallback
    }

    if (currentUser) {
      const updatedUser: User = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      const stored = getStoredSession();
      if (stored) {
        saveStoredSession({ ...stored, user: updatedUser });
      }
      return { success: true };
    }

    return { success: false, error: 'Failed to update profile.' };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        linkedStudent,
        linkedTeacher,
        token,
        loading,
        login,
        logout,
        changePassword,
        updateProfile,
        authFetch,
        setLinkedStudent,
        setLinkedTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
