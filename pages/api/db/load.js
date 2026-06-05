import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const { data, error } = await supabase
    .from('coaching_users')
    .select('session_data')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  return res.json({ sessionData: data?.session_data || null });
}
