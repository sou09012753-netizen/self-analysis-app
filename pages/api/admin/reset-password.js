import { getSupabase } from '../../../lib/supabase';
import { verifyAdminCookie } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!verifyAdminCookie(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) return res.status(400).json({ error: 'userId と newPassword は必須です' });
  if (newPassword.length < 8) return res.status(400).json({ error: '8文字以上で設定してください' });

  const supabase = getSupabase();
  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ ok: true });
}
