import { getSupabase } from '../../../lib/supabase';
import { normalizeScores } from '../../../lib/radar';

// 五角形レーダーのスコアを radar_scores 列にだけ書く。
// session_data には一切触れない（/api/db/save.js の blob 丸ごと上書きに巻き込まれないため）。
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { sessionId, scores } = req.body;
    if (!sessionId || !['1', '2', '3'].includes(String(sessionId))) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    // 5軸すべてが揃っているかだけを検証する。保存するのは受け取った形のまま
    // （reason 付きの形も保持する。reason はコーチ画面にだけ出す）
    if (!normalizeScores(scores)) return res.status(400).json({ error: 'Invalid scores' });

    const { data: row, error: readError } = await supabase
      .from('coaching_users')
      .select('radar_scores')
      .eq('id', user.id)
      .single();
    if (readError) return res.status(500).json({ error: readError.message });

    // 該当セッションのキーだけを差し替える。他セッションのスコアは保持する。
    const merged = { ...(row?.radar_scores || {}), [String(sessionId)]: scores };

    const { error } = await supabase
      .from('coaching_users')
      .update({ radar_scores: merged })
      .eq('id', user.id);
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
