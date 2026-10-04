import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            set({ user: res.data.user, token: res.data.token, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error.response?.data?.error || 'Login failed';
        }
    },

    register: async (name, email, password) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('token', res.data.token);
            set({ user: res.data.user, token: res.data.token, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error.response?.data?.error || 'Registration failed';
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const res = await api.get('/auth/me');
            set({ user: res.data.user, isAuthenticated: true });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    }
}));

export default useAuthStore;
