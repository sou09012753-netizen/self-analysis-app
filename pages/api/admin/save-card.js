import { getSupabase } from '../../../lib/supabase';
import { validateCoachPasscode } from '../../../lib/coachAuth';
import { normalizeScores } from '../../../lib/radar';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const passcode = req.headers['x-coach-passcode'];
  const coach = await validateCoachPasscode(passcode);
  if (!coach) return res.status(401).json({ error: 'Invalid passcode' });

  const { userId, sessionId, summary, scores } = req.body;
  if (!userId || !sessionId || !summary) return res.status(400).json({ error: 'Missing params' });

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('coaching_users')
    .select('session_data, radar_scores')
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

  // スコアは radar_scores 列に書く。session_data には入れない
  // （クライアントの blob 丸ごと上書きに巻き込まれて消えるため）
  // 5軸が揃っているかだけ検証し、保存は受け取った形のまま（reason 付きも保持する）
  const payload = { session_data: sessionData, updated_at: new Date().toISOString() };
  if (normalizeScores(scores)) {
    payload.radar_scores = { ...(data.radar_scores || {}), [String(sessionId)]: scores };
  }

  const { error: updateError } = await supabase
    .from('coaching_users')
    .update(payload)
    .eq('id', userId)
    .eq('coach_id', coach.id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.json({ ok: true });
}
