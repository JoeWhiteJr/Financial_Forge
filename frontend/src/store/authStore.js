import { create } from 'zustand';
import { authApi } from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: true,

  login: async (email, password) => {
    const { data: res } = await authApi.login(email, password);
    if (res.success) {
      localStorage.setItem('token', res.data.token);
      set({ user: res.data.user, token: res.data.token });
    }
    return res;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { data: res } = await authApi.me();
      if (res.success) {
        set({ user: res.data, token, loading: false });
      } else {
        localStorage.removeItem('token');
        set({ loading: false });
      }
    } catch {
      localStorage.removeItem('token');
      set({ loading: false });
    }
  },
}));

export default useAuthStore;
