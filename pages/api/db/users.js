import { getSupabase } from '../../../lib/supabase';
import { verifyAdminCookie } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!verifyAdminCookie(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('coaching_users')
      .select('id, user_name, session_data, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ users: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
