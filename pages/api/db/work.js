import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  if (req.method === 'GET') {
    const { session_no } = req.query;
    if (!session_no) return res.status(400).json({ error: 'Missing session_no' });
    const { data, error } = await supabase
      .from('work_responses')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_no', Number(session_no))
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ work: data || null });
  }

  if (req.method === 'POST') {
    const { session_no, work_text, response_text } = req.body;
    if (!session_no || !work_text) return res.status(400).json({ error: 'Missing fields' });
    const { data: existing } = await supabase
      .from('work_responses')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_no', session_no)
      .maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase
        .from('work_responses')
        .update({ work_text, response_text: response_text || null, updated_at: new Date().toISOString() })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('work_responses')
        .insert({ user_id: user.id, session_no, work_text, response_text: response_text || null }));
    }
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
