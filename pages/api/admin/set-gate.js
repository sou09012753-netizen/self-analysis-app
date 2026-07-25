import { getSupabase } from '../../../lib/supabase';
import { validateCoachPasscode } from '../../../lib/coachAuth';
import { GATE_FIELDS } from '../../../lib/gates';

// コーチが解放ゲートを立て/降ろしする。coach_gates 列にだけ書く。
// session_data には一切触れない（本人の blob 丸ごと上書きに巻き込まれないため）。
//
// body: { userId, sessionId, gate: 'sessionOpen'|'cardReleased', value: boolean }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const passcode = req.headers['x-coach-passcode'];
  const coach = await validateCoachPasscode(passcode);
  if (!coach) return res.status(401).json({ error: 'Invalid passcode' });

  const { userId, sessionId, gate, value } = req.body;
  if (!userId || !sessionId) return res.status(400).json({ error: 'Missing params' });
  if (!GATE_FIELDS.includes(gate)) return res.status(400).json({ error: 'Invalid gate' });

  const sid = String(sessionId);
  if (!['1', '2', '3'].includes(sid)) return res.status(400).json({ error: 'Invalid sessionId' });

  const supabase = getSupabase();

  // 所有チェックを兼ねて現在の gates を読む
  const { data, error } = await supabase
    .from('coaching_users')
    .select('coach_gates')
    .eq('id', userId)
    .eq('coach_id', coach.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const gates = data.coach_gates || {};
  const next = {
    ...gates,
    [sid]: { ...(gates[sid] || {}), [gate]: !!value },
  };

  const { error: updateError } = await supabase
    .from('coaching_users')
    .update({ coach_gates: next })
    .eq('id', userId)
    .eq('coach_id', coach.id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.json({ ok: true, coach_gates: next });
}
