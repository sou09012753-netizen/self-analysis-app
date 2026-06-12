import { getSupabase } from '../../../lib/supabase';

const checkPasscode = (req) =>
  req.headers['x-coach-passcode'] === process.env.COACH_PASSCODE;

export default async function handler(req, res) {
  if (!checkPasscode(req)) return res.status(401).json({ error: 'Invalid passcode' });

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const { data, error } = await supabase
      .from('coach_reports')
      .select('report_text, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ report: data || null });
  }

  if (req.method === 'POST') {
    const { userId, reportText } = req.body;
    if (!userId || !reportText) return res.status(400).json({ error: 'Missing fields' });

    const { data: existing } = await supabase
      .from('coach_reports')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('coach_reports')
        .update({ report_text: reportText, updated_at: new Date().toISOString() })
        .eq('user_id', userId));
    } else {
      ({ error } = await supabase
        .from('coach_reports')
        .insert({ user_id: userId, report_text: reportText }));
    }

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
