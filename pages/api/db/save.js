import { getSupabase } from '../../../lib/supabase';
import { mergeQuestionTexts, fillMissingQuestionTexts } from '../../../lib/questionTexts';

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
      .select('id, session_data')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing && !coachId) {
      return res.status(400).json({ error: 'coachId is required for initial save' });
    }

    // 回答保存時点の質問文（questionTexts）は、DBにあるものを必ず残す。
    // 本人のアプリは session_data を丸ごと送ってくるので、バックフィル前に開いていた画面の
    // 古い blob がそのまま来ても、既存の質問文が消えたり書き換わったりしないようにする。
    const existingSessions = existing?.session_data?.sessions || {};
    const mergedData = sessionData?.sessions
      ? {
          ...sessionData,
          sessions: Object.fromEntries(Object.entries(sessionData.sessions).map(([sid, s]) => {
            const prevQT = existingSessions[sid]?.questionTexts;
            const merged = prevQT ? { ...s, questionTexts: mergeQuestionTexts(prevQT, s?.questionTexts) } : s;
            // 質問文を送ってこない古い画面から保存された回答にも、問いの記録を残す（当時の文面かは不明扱い）
            return [sid, fillMissingQuestionTexts(sid, merged).session];
          })),
        }
      : sessionData;

    const payload = {
      id: user.id,
      user_name: userName,
      session_data: mergedData,
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
