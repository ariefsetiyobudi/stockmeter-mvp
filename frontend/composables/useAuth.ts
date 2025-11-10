import { useAuthStore } from '~/stores/auth';
import type { User } from '~/types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const useAuth = () => {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  const router = useRouter();

  // Auto-refresh token interval (45 minutes - before 1 hour expiry)
  let refreshInterval: NodeJS.Timeout | null = null;

  const startTokenRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Refresh token every 45 minutes
    refreshInterval = setInterval(async () => {
      await refreshToken();
    }, 45 * 60 * 1000);
  };

  const stopTokenRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    authStore.setLoading(true);
    const toast = useToast();
    try {
      const response = await $fetch<AuthResult>('/api/auth/login', {
        baseURL: config.public.apiBaseUrl,
        method: 'POST',
        body: credentials,
        credentials: 'include', // Include cookies
      });

      authStore.setUser(response.user);
      authStore.setAccessToken(response.accessToken);
      
      // Start auto-refresh
      startTokenRefresh();
      
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.data?.error?.message || 'Login failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      authStore.setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    authStore.setLoading(true);
    const toast = useToast();
    try {
      const response = await $fetch<AuthResult>('/api/auth/register', {
        baseURL: config.public.apiBaseUrl,
        method: 'POST',
        body: credentials,
        credentials: 'include',
      });

      authStore.setUser(response.user);
      authStore.setAccessToken(response.accessToken);
      
      // Start auto-refresh
      startTokenRefresh();
      
      toast.success('Registration successful! Welcome to Stockmeter.');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.data?.error?.message || 'Registration failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      authStore.setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    authStore.setLoading(true);
    const toast = useToast();
    try {
      await $fetch('/api/auth/logout', {
        baseURL: config.public.apiBaseUrl,
        method: 'POST',
        credentials: 'include',
        headers: authStore.accessToken
          ? { Authorization: `Bearer ${authStore.accessToken}` }
          : {},
      });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't show error toast for logout - still clear auth
    } finally {
      stopTokenRefresh();
      authStore.clearAuth();
      authStore.setLoading(false);
      await router.push('/');
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await $fetch<AuthResult>('/api/auth/refresh', {
        baseURL: config.public.apiBaseUrl,
        method: 'POST',
        credentials: 'include',
      });

      authStore.setUser(response.user);
      authStore.setAccessToken(response.accessToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      stopTokenRefresh();
      authStore.clearAuth();
      await router.push('/login');
    }
  };

  const loginWithGoogle = (): void => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${config.public.apiBaseUrl}/api/auth/google`;
  };

  const loginWithFacebook = (): void => {
    // Redirect to backend Facebook OAuth endpoint
    window.location.href = `${config.public.apiBaseUrl}/api/auth/facebook`;
  };

  const checkAuth = async (): Promise<void> => {
    // Try to refresh token on app load to restore session
    if (!authStore.isAuthenticated) {
      try {
        await refreshToken();
        startTokenRefresh();
      } catch (error) {
        // User not authenticated, that's okay
      }
    }
  };

  return {
    // State
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isPro: computed(() => authStore.isPro),
    isFree: computed(() => authStore.isFree),
    isLoading: computed(() => authStore.isLoading),
    
    // Methods
    login,
    register,
    logout,
    refreshToken,
    loginWithGoogle,
    loginWithFacebook,
    checkAuth,
  };
};
