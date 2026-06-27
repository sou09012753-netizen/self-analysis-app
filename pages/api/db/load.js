import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data, error } = await supabase
      .from('coaching_users')
      .select('session_data')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    const sd = data?.session_data;
    const isEmpty = !sd || Object.keys(sd).length === 0;
    return res.json({ sessionData: isEmpty ? null : sd });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
