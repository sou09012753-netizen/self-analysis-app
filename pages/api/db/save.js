import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { userName, sessionData, coachId } = req.body;
    if (!userName) return res.status(400).json({ error: 'Missing userName' });

    const { data: existing } = await supabase
      .from('coaching_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing && !coachId) {
      return res.status(400).json({ error: 'coachId is required for initial save' });
    }

    const payload = {
      id: user.id,
      user_name: userName,
      session_data: sessionData,
      updated_at: new Date().toISOString(),
    };
    if (coachId) payload.coach_id = coachId;

    const { error } = await supabase.from('coaching_users').upsert(payload);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
