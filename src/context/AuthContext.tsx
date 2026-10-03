import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Student, Teacher } from '../types';

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

const TOKEN_KEY = 'titan_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [linkedStudent, setLinkedStudent] = useState<Student | null>(null);
  const [linkedTeacher, setLinkedTeacher] = useState<Teacher | null>(null);
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
      const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setLinkedStudent(data.linkedStudent || null);
          setLinkedTeacher(data.linkedTeacher || null);
          setToken(savedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setCurrentUser(null);
          setLinkedStudent(null);
          setLinkedTeacher(null);
        }
      } catch (err) {
        console.warn('Session verification fallback:', err);
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
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to authenticate.' };
      }

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
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error during login.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await authFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (e) {
      console.warn('Logout notification failed:', e);
    } finally {
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
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to change password' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error changing password' };
    }
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
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }
      setCurrentUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating profile' };
    }
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
