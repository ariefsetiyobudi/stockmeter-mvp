import { defineStore } from 'pinia';
import type { User } from '~/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user && !!state.accessToken,
    isPro: (state) => state.user?.subscriptionStatus === 'pro',
    isFree: (state) => state.user?.subscriptionStatus === 'free',
  },

  actions: {
    setUser(user: User | null) {
      this.user = user;
    },

    setAccessToken(token: string | null) {
      this.accessToken = token;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
    },
  },
});
