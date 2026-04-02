import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore, Role } from '../store/authStore';

interface LoginResponse {
  success: boolean;
  message: string;
  username: string;
  role: Role;
  token: string;
  email?: string; 
  userId?: number;
  avatar?: string;
}



export function useAuth() {
  const setAuth = useAuthStore((state) => state.setAuth);

  const login = useMutation({
    mutationFn: async (credentials: any) => {
      // Real API call
      return apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    onSuccess: (data, variables) => {
      if (data.success) {
        setAuth({
          id: data.email || variables.email, 
          email: data.email || variables.email,
          name: data.username,
          role: data.role,
          userId: data.userId,
          avatar: data.avatar
        }, data.token);
      }
    },


  });

  return { login };
}
