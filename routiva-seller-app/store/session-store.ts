import { create } from 'zustand';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: 'OWNER' | 'ADMIN' | 'SELLER' | null;
  setSession: (params: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'SELLER' | null;
  }) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  role: null,
  setSession: ({ accessToken, refreshToken, userId, role }) =>
    set({ accessToken, refreshToken, userId, role }),
  clearSession: () => set({ accessToken: null, refreshToken: null, userId: null, role: null }),
}));
