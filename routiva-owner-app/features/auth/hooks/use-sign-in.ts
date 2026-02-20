import { useSessionStore } from '@/store/session-store';
import { useMutation } from '@tanstack/react-query';

import { signIn } from '../api/sign-in';
import type { SignInInput } from '../schemas/sign-in-schema';

export function useSignIn() {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: SignInInput) => signIn(input),
    onSuccess: ({ accessToken, refreshToken, userId, role }) => {
      setSession({ accessToken, refreshToken, userId, role });
    },
  });
}
