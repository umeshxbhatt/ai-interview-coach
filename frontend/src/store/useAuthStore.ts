import { create } from 'zustand';
import { api } from '../services/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  targetCompany?: string;
  experienceLevel?: 'Junior' | 'Mid' | 'Senior';
  preferredStack?: string;
  resumeUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: UserProfile | null) => void;
  checkAuth: () => Promise<UserProfile | null>;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for forced logouts from Axios token refresh failure
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout-required', () => {
      set({ user: null, isAuthenticated: false, error: 'Session expired. Please sign in again.' });
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    
    clearError: () => set({ error: null }),

    checkAuth: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get('/auth/me');
        const user = response.data.data.user;
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      } catch (err: any) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return null;
      }
    },

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/login', { email, password });
        const user = response.data.data.user;
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Login failed';
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    signup: async (name, email, password) => {
      set({ isLoading: true, error: null });
      try {
        await api.post('/auth/signup', { name, email, password });
        set({ isLoading: false });
      } catch (err: any) {
        const message = err.response?.data?.message || 'Registration failed';
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.error('Logout error on server:', err);
      } finally {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },
  };
});
