export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/');
  return res.json({ ok: true });
}
