import Constants from 'expo-constants';

interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function getRuntimeEnv(): AppEnv {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl;
  const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    extra?.supabaseKey ??
    extra?.supabaseAnonKey;

  if (!supabaseUrl) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL env var');
  if (!supabaseAnonKey) throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY env var');

  return { supabaseUrl, supabaseAnonKey };
}

export const ENV = getRuntimeEnv();
