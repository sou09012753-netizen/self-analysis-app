import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, userName, sessionData } = req.body;
  if (!userId || !userName) return res.status(400).json({ error: 'Missing fields' });

  const { error } = await supabase
    .from('coaching_users')
    .upsert({
      id: userId,
      user_name: userName,
      session_data: sessionData,
      updated_at: new Date().toISOString(),
    });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}
