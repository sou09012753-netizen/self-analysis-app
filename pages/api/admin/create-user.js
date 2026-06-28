import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ error: 'Server misconfiguration' });
  const { adminPassword: pw, email, userPassword, userName, coachId } = req.body;
  if (pw !== adminPassword) return res.status(401).json({ error: 'Unauthorized' });
  if (!email || !userPassword) return res.status(400).json({ error: 'email と userPassword は必須です' });
  if (!userName || !userName.trim()) return res.status(400).json({ error: 'userName は必須です' });
  if (!coachId) return res.status(400).json({ error: '担当コーチの選択は必須です' });

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: userPassword,
    email_confirm: true,
  });
  if (error) return res.status(400).json({ error: error.message });

  const { error: insertError } = await supabase
    .from('coaching_users')
    .insert({ id: data.user.id, user_name: userName.trim(), coach_id: coachId });

  if (insertError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    return res.status(500).json({ error: 'ユーザー登録に失敗しました。もう一度試してください。' });
  }

  return res.json({ ok: true, userId: data.user.id, email: data.user.email });
}
