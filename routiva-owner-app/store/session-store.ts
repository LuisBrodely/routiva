import { create } from 'zustand';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  username: string | null;
  empresaId: string | null;
  empresaNombre: string | null;
  role: 'OWNER' | 'ADMIN' | 'SELLER' | null;
  setSession: (params: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'SELLER' | null;
  }) => void;
  setUserContext: (params: {
    username: string | null;
    empresaId: string | null;
    empresaNombre: string | null;
    role: 'OWNER' | 'ADMIN' | 'SELLER' | null;
  }) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  username: null,
  empresaId: null,
  empresaNombre: null,
  role: null,
  setSession: ({ accessToken, refreshToken, userId, role }) =>
    set({ accessToken, refreshToken, userId, role }),
  setUserContext: ({ username, empresaId, empresaNombre, role }) =>
    set({ username, empresaId, empresaNombre, role }),
  clearSession: () =>
    set({
      accessToken: null,
      refreshToken: null,
      userId: null,
      username: null,
      empresaId: null,
      empresaNombre: null,
      role: null,
    }),
}));
