import { getAdminSessionToken } from '../../lib/adminAuth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ ok: false, error: 'Server misconfiguration' });
  if (password !== adminPassword) return res.status(401).json({ ok: false });

  const token = getAdminSessionToken();
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `admin_session=${token}; HttpOnly${secure}; SameSite=Strict; Max-Age=3600; Path=/`
  );
  return res.json({ ok: true });
}
