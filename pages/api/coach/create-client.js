import { getSupabase } from '../../../lib/supabase';
import { validateCoachPasscode } from '../../../lib/coachAuth';

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
