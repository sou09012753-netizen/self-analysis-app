import crypto from 'crypto';
import { getAdminSessionToken } from '../../lib/adminAuth';

// Hash both to fixed-length buffers before comparing, preventing length-based timing leak
function safeCompare(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const MAX_ATTEMPTS = 10;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes

// module-scope: persists across warm invocations on the same instance
const attempts = new Map(); // ip -> { count: number, lockedUntil: number | null }

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded ? forwarded.split(',')[0] : req.socket?.remoteAddress) || 'unknown';
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getClientIp(req);
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, lockedUntil: null };

  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMin = Math.ceil((record.lockedUntil - now) / 60000);
    return res.status(429).json({ ok: false, error: `Too many attempts. Try again in ${remainingMin} minutes.` });
  }

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ ok: false, error: 'Server misconfiguration' });

  if (!safeCompare(password, adminPassword)) {
    const newCount = record.count + 1;
    const lockedUntil = newCount >= MAX_ATTEMPTS ? now + LOCK_MS : null;
    attempts.set(ip, { count: newCount, lockedUntil });
    if (lockedUntil) {
      return res.status(429).json({ ok: false, error: 'Too many attempts. Try again in 15 minutes.' });
    }
    return res.status(401).json({ ok: false });
  }

  attempts.delete(ip);

  const token = getAdminSessionToken();
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `admin_session=${token}; HttpOnly${secure}; SameSite=Strict; Max-Age=3600; Path=/`
  );
  return res.json({ ok: true });
}
