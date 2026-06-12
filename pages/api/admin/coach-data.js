import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const passcode = req.headers['x-coach-passcode'];
  if (!passcode || passcode !== process.env.COACH_PASSCODE) {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  const supabase = getSupabase();
  const { action } = req.query;

  if (action === 'clients') {
    const { data, error } = await supabase
      .from('coaching_users')
      .select('id, user_name, updated_at')
      .order('updated_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ clients: data || [] });
  }

  if (action === 'answers') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data, error } = await supabase
      .from('coaching_users')
      .select('user_name, session_data')
      .eq('id', userId)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ client: data });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
