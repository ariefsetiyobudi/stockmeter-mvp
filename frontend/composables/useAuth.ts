import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export function useAuth() {
  const { user, token, isAuthenticated, setUser, setToken, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiClient.post('/auth/register', { email, password, name });
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    storeLogout();
    router.push('/login');
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      // Token might be invalid, logout
      logout();
    }
  };

  const isPro = user?.subscriptionTier === 'pro' && user?.subscriptionStatus === 'active';

  const checkAuth = async () => {
    await refreshUser();
  };

  return {
    user,
    token,
    isAuthenticated,
    isPro,
    login,
    register,
    logout,
    refreshUser,
    checkAuth,
  };
}
