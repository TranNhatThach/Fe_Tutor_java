import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCookie, setCookie, deleteCookie } from "../utils/cookie";

export type Role = "HOC_VIEN" | "GIA_SU" | "ADMIN";

interface User {
  id: string;
  userId?: number;
  email: string;
  name: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: getCookie("accessToken") || null,
      setAuth: (user, token) => {
        setCookie("accessToken", token, 1);
        set({ user, token });
      },
      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }));
      },
      logout: () => {
        deleteCookie("accessToken");
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
