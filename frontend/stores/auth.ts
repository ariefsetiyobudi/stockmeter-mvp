import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  subscriptionExpiry?: Date | string;
  languagePreference?: string;
  currencyPreference?: string;
  createdAt?: Date | string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isPro: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isPro: false,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isPro: user?.subscriptionTier === 'pro' && user?.subscriptionStatus === 'active'
      }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, isPro: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
