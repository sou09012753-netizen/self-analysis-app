import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const adminPassword = process.env.ADMIN_PASSWORD || 'sen-admin';
  const { adminPassword: pw, email, userPassword, userName, coachId } = req.body;
  if (pw !== adminPassword) return res.status(401).json({ error: 'Unauthorized' });
  if (!email || !userPassword) return res.status(400).json({ error: 'email と userPassword は必須です' });

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: userPassword,
    email_confirm: true,
  });
  if (error) return res.status(400).json({ error: error.message });

  if (userName) {
    const payload = { id: data.user.id, user_name: userName };
    if (coachId) payload.coach_id = coachId;
    await supabase.from('coaching_users').insert(payload);
  }

  return res.json({ ok: true, userId: data.user.id, email: data.user.email });
}
