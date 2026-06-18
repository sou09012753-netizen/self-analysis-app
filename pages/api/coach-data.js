import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY が未設定です');
  return createClient(url, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { passcode, action, userId } = req.body || {};

  if (!passcode) return res.status(400).json({ error: 'passcode is required' });

  const supabase = getServiceClient();

  // パスコードでコーチを検索
  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .select('id, name')
    .eq('passcode', passcode)
    .single();

  if (coachError || !coach) return res.status(401).json({ error: 'Invalid passcode' });

  // 単一ユーザー取得
  if (action === 'getUser') {
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const { data: user, error } = await supabase
      .from('coaching_users')
      .select('*')
      .eq('id', userId)
      .eq('coach_id', coach.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user, coachName: coach.name, coachId: coach.id });
  }

  // デフォルト：コーチのクライアント一覧
  const { data: users, error: usersError } = await supabase
    .from('coaching_users')
    .select('*')
    .eq('coach_id', coach.id)
    .order('updated_at', { ascending: false });

  if (usersError) return res.status(500).json({ error: usersError.message });

  return res.json({ users: users || [], coachName: coach.name, coachId: coach.id });
}
