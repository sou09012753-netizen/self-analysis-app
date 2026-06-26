import { getSupabase } from '../../../lib/supabase';
import { validateCoachPasscode } from '../../../lib/coachAuth';

export default async function handler(req, res) {
  const passcode = req.headers['x-coach-passcode'];
  const coach = await validateCoachPasscode(passcode);
  if (!coach) return res.status(401).json({ error: 'Invalid passcode' });

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    try {
      const { data, error } = await supabase
        .from('coach_session_questions')
        .select('questions_text, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) return res.json({ questions: null });
      return res.json({ questions: data || null });
    } catch {
      return res.json({ questions: null });
    }
  }

  if (req.method === 'POST') {
    const { userId, questionsText } = req.body;
    if (!userId || !questionsText) return res.status(400).json({ error: 'Missing fields' });
    try {
      const { data: existing } = await supabase
        .from('coach_session_questions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('coach_session_questions')
          .update({ questions_text: questionsText, updated_at: new Date().toISOString() })
          .eq('user_id', userId));
      } else {
        ({ error } = await supabase
          .from('coach_session_questions')
          .insert({ user_id: userId, questions_text: questionsText }));
      }
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
