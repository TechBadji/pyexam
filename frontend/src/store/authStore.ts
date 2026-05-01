import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "admin";
  student_number: string | null;
  preferred_language: "fr" | "en";
  avatar_url: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      login: (user, accessToken, refreshToken) => {
        localStorage.setItem("pyexam_access_token", accessToken);
        localStorage.setItem("pyexam_refresh_token", refreshToken);
        set({ user, accessToken, refreshToken });
      },

      logout: () => {
        localStorage.removeItem("pyexam_access_token");
        localStorage.removeItem("pyexam_refresh_token");
        set({ user: null, accessToken: null, refreshToken: null });
      },

      updateUser: (patch) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...patch } });
      },

      isAuthenticated: () => get().user !== null && get().accessToken !== null,
    }),
    {
      name: "pyexam_auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
