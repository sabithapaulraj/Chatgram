import { create } from 'zustand';
import { AuthState } from '../types';
import { jwtDecode } from 'jwt-decode';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Mock API function for login
const loginApi = async (email: string, password: string) => {
  // In a real app, this would be an API call
  return new Promise<{ token: string; user: { id: string; username: string; email: string } }>((resolve, reject) => {
    setTimeout(() => {
      if (email === 'demo@example.com' && password === 'password') {
        resolve({
          token: 'mock-jwt-token',
          user: {
            id: '1',
            username: 'demouser',
            email: 'demo@example.com'
          }
        });
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 800);
  });
};

// Mock API function for registration
const registerApi = async (username: string, email: string, password: string) => {
  // In a real app, this would be an API call
  return new Promise<{ token: string; user: { id: string; username: string; email: string } }>((resolve, reject) => {
    setTimeout(() => {
      if (email && username && password) {
        resolve({
          token: 'mock-jwt-token',
          user: {
            id: '1',
            username,
            email
          }
        });
      } else {
        reject(new Error('Please fill all fields'));
      }
    }, 800);
  });
};

export const useAuthStore = create<AuthStore>((set) => {
  // Check for existing token in localStorage
  const token = localStorage.getItem('token');
  let user = null;
  
  if (token) {
    try {
      user = jwtDecode(token);
    } catch (error) {
      localStorage.removeItem('token');
    }
  }

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading: false,
    error: null,

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await loginApi(email, password);
        localStorage.setItem('token', response.token);
        
        set({
          isLoading: false,
          isAuthenticated: true,
          user: response.user,
          token: response.token
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred during login'
        });
      }
    },

    register: async (username, email, password) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await registerApi(username, email, password);
        localStorage.setItem('token', response.token);
        
        set({
          isLoading: false,
          isAuthenticated: true,
          user: response.user,
          token: response.token
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred during registration'
        });
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      });
    },

    clearError: () => set({ error: null })
  };
});
