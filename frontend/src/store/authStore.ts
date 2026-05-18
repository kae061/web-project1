import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null, refreshToken?: string | null) => void;
  getToken: () => string | null;
  getRefreshToken: () => string | null;
  logout: () => void;
  loadFromStorage: () => void;
  checkTokenExpiration: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('kaeapp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kaeapp_user');
    }
    set({ user });
  },

  setToken: (token, refreshToken) => {
    if (token) {
      localStorage.setItem('kaeapp_token', token);
    } else {
      localStorage.removeItem('kaeapp_token');
    }
    
    if (refreshToken !== undefined) {
      if (refreshToken) {
        localStorage.setItem('kaeapp_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('kaeapp_refresh_token');
      }
      set({ token, refreshToken });
    } else {
      set({ token });
    }
  },

  getToken: () => {
    return get().token || localStorage.getItem('kaeapp_token');
  },
  
  getRefreshToken: () => {
    return get().refreshToken || localStorage.getItem('kaeapp_refresh_token');
  },
  
  logout: () => {
    localStorage.removeItem('kaeapp_token');
    localStorage.removeItem('kaeapp_refresh_token');
    localStorage.removeItem('kaeapp_user');
    localStorage.removeItem('accessToken'); // Legacy cleanup
    localStorage.removeItem('user');
    set({ user: null, token: null, refreshToken: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('kaeapp_token');
    const refreshToken = localStorage.getItem('kaeapp_refresh_token');
    const userJson = localStorage.getItem('kaeapp_user');
    
    if (token && userJson) {
      try {
        set({ 
          token, 
          refreshToken,
          user: JSON.parse(userJson), 
          isLoading: false 
        });
        get().checkTokenExpiration();
      } catch (e) {
        localStorage.removeItem('kaeapp_user');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  checkTokenExpiration: () => {
    const token = get().token;
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check if token will expire in the next 10 seconds
      const isExpired = payload.exp * 1000 < Date.now() + 10000;
      if (isExpired) {
        get().logout();
        return true;
      }
      return false;
    } catch (e) {
      get().logout();
      return true;
    }
  },
}));
