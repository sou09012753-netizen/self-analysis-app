import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'sen-admin';

  if (req.method === 'GET') {
    const { password } = req.query;
    if (password !== adminPassword) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('coaches')
      .select('id, name, passcode, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ coaches: data || [] });
  }

  if (req.method === 'POST') {
    const { adminPassword: pw, name, passcode } = req.body;
    if (pw !== adminPassword) return res.status(401).json({ error: 'Unauthorized' });
    if (!name || !passcode) return res.status(400).json({ error: 'name と passcode は必須です' });
    if (passcode.length !== 4 || !/^\d+$/.test(passcode)) {
      return res.status(400).json({ error: 'パスコードは4桁の数字で設定してください' });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase.from('coaches').insert({ name, passcode }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, coach: data });
  }

  return res.status(405).end();
}
