import crypto from 'crypto';

export function getAdminSessionToken() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHmac('sha256', pw).update('admin-session').digest('hex');
}

export function verifyAdminCookie(req) {
  const token = getAdminSessionToken();
  if (!token) return false;
  const raw = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    raw.split(';').filter(Boolean).map(c => {
      const [k, ...v] = c.trim().split('=');
      return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
    })
  );
  return cookies['admin_session'] === token;
}
