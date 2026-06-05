export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(500).json({ error: 'Supabase環境変数が未設定です (SUPABASE_URL, SUPABASE_ANON_KEY)' });
  }

  return res.json({ url, anonKey });
}
