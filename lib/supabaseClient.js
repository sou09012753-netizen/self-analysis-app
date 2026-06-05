import { createClient } from '@supabase/supabase-js';

let _client = null;

export const getSupabaseClient = () => {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return _client;
};
