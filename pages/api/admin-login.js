export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ ok: false, error: 'Server misconfiguration' });
  if (password === adminPassword) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false });
}
