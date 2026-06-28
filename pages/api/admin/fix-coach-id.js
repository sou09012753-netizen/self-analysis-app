import { getSupabase } from '../../../lib/supabase';

// 一時エンドポイント：使用後即削除
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ error: 'Server misconfiguration' });
  const { password, targetId, newCoachId } = req.body;
  if (password !== adminPassword) return res.status(401).json({ error: 'Unauthorized' });

  // 対象IDとcoach_idをリクエストボディで受け取るが、
  // 安全のためこのエンドポイントが触れるIDをハードコードで制限する
  const ALLOWED_TARGET  = 'a1545214-6164-4208-98a2-dbb1db7ba071';
  const ALLOWED_COACH   = '03b38181-228e-4a6a-b10b-030c4c90fd15';

  if (targetId !== ALLOWED_TARGET || newCoachId !== ALLOWED_COACH) {
    return res.status(400).json({ error: 'このエンドポイントは特定の1件にのみ使用できます' });
  }

  const supabase = getSupabase();

  const { data: before } = await supabase
    .from('coaching_users')
    .select('id, user_name, coach_id, updated_at')
    .eq('id', ALLOWED_TARGET)
    .single();

  const { data, error } = await supabase
    .from('coaching_users')
    .update({ coach_id: ALLOWED_COACH, updated_at: new Date().toISOString() })
    .eq('id', ALLOWED_TARGET)
    .select('id, user_name, coach_id, updated_at');

  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    rows_affected: data.length,
    before: { coach_id: before.coach_id, updated_at: before.updated_at },
    after:  { coach_id: data[0].coach_id, updated_at: data[0].updated_at },
  });
}
