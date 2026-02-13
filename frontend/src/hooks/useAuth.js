import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

export default function useAuth() {
  const { user, token, loading, login, logout, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    user,
    token,
    loading,
    isAdmin: user?.is_admin ?? false,
    login,
    logout,
  };
}
