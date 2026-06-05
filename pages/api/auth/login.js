import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email, password は必須です' });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    return res.json({
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
      user_id: data.user.id,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
