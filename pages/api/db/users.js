import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const adminPassword = process.env.ADMIN_PASSWORD || 'sen-admin';
  const { password } = req.query;
  if (password !== adminPassword) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('coaching_users')
    .select('id, user_name, session_data, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ users: data });
}
