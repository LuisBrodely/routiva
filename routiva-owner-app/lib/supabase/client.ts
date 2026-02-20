import { ENV } from '@/lib/env';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { secureStorage } from './storage';

export const supabase = createClient<Database>(ENV.supabaseUrl, ENV.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: secureStorage,
  },
});
