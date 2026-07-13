import { getSupabase } from '../../../lib/supabase';
import { validateCoachPasscode } from '../../../lib/coachAuth';
import { MAX_CLIENTS_PER_COACH } from '../../../lib/limits';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const passcode = req.headers['x-coach-passcode'];
  const coach = await validateCoachPasscode(passcode);
  if (!coach) return res.status(401).json({ error: 'パスコードが違います' });

  const { email, userPassword, userName } = req.body;
  if (!email || !userPassword || !userName) {
    return res.status(400).json({ error: 'email, userPassword, userName は必須です' });
  }

  const supabase = getSupabase();

  // 登録上限チェック。アーカイブ済みは数えない。
  // Auth ユーザーを作る前に判定する（後で弾くと Auth 側に孤児が残るため）
  const { count, error: countError } = await supabase
    .from('coaching_users')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', coach.id)
    .is('archived_at', null);
  if (countError) return res.status(500).json({ error: countError.message });
  if (count >= MAX_CLIENTS_PER_COACH) {
    return res.status(409).json({
      error: `クライアント登録は${MAX_CLIENTS_PER_COACH}人までです。不要なクライアントをアーカイブしてください。`,
    });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: userPassword,
    email_confirm: true,
  });
  if (error) return res.status(400).json({ error: error.message });

  const { error: insertError } = await supabase.from('coaching_users').insert({
    id: data.user.id,
    user_name: userName,
    coach_id: coach.id,
  });
  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.json({ ok: true, userId: data.user.id });
}
