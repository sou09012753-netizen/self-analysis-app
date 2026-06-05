import { createClient } from '@supabase/supabase-js';

let _client = null;
let _initPromise = null;

export const getSupabaseClient = async () => {
  if (_client) return _client;
  if (!_initPromise) {
    _initPromise = fetch('/api/config')
      .then(r => r.json())
      .then(({ url, anonKey, error }) => {
        if (error || !url || !anonKey) throw new Error(error || 'Supabase設定エラー');
        _client = createClient(url, anonKey);
        return _client;
      });
  }
  return _initPromise;
};
