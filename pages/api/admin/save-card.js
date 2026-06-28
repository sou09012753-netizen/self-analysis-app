import { getSupabase } from '../../../lib/supabase';
import { validateCoachPasscode } from '../../../lib/coachAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const passcode = req.headers['x-coach-passcode'];
  const coach = await validateCoachPasscode(passcode);
  if (!coach) return res.status(401).json({ error: 'Invalid passcode' });

  const { userId, sessionId, summary } = req.body;
  if (!userId || !sessionId || !summary) return res.status(400).json({ error: 'Missing params' });

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('coaching_users')
    .select('session_data')
    .eq('id', userId)
    .eq('coach_id', coach.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const sessionData = data.session_data || {};
  if (!sessionData.sessions) sessionData.sessions = {};
  sessionData.sessions[sessionId] = {
    ...(sessionData.sessions[sessionId] || {}),
    status: 'completed',
    summary,
    completedAt: new Date().toISOString(),
    unlocked: true,
  };

  const { error: updateError } = await supabase
    .from('coaching_users')
    .update({ session_data: sessionData, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .eq('coach_id', coach.id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.json({ ok: true });
}
