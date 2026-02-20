import { supabase } from '@/lib/supabase/client';

import type { SignInInput } from '../schemas/sign-in-schema';

interface SignInResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'SELLER' | null;
}

export async function signIn(input: SignInInput): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) throw error;
  if (!data.session) throw new Error('No se pudo crear la sesión');

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.user.id,
    role: null,
  };
}
