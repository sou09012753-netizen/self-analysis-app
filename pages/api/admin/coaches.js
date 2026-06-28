import { getSupabase } from '../../../lib/supabase';
import { verifyAdminCookie } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  if (!verifyAdminCookie(req)) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('coaches')
      .select('id, name, passcode, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ coaches: data || [] });
  }

  if (req.method === 'POST') {
    const { name, passcode } = req.body;
    if (!name || !passcode) return res.status(400).json({ error: 'name と passcode は必須です' });
    if (passcode.length !== 4 || !/^\d+$/.test(passcode)) {
      return res.status(400).json({ error: 'パスコードは4桁の数字で設定してください' });
    }
    const { data, error } = await supabase.from('coaches').insert({ name, passcode }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, coach: data });
  }

  return res.status(405).end();
}
