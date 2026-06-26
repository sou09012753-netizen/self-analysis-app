import { useState, useEffect } from 'react';

const SESSION_KEY = 'coaching_sen_token';

const C = {
  bg: '#0a0a0a', gold: '#c9a84c', text: '#f5f0e8',
  muted: '#888', dim: '#555',
  border: '#1e1e1e', red: '#c06060',
  font: "'Noto Serif JP', Georgia, serif",
};

const parseJwt = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};

const isTokenValid = (token) => {
  const payload = parseJwt(token);
  if (!payload) return false;
  return Date.now() / 1000 < payload.exp - 60;
};

export default function LoginPage() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    document.title = 'ログイン — SEN';
    try {
      const token = localStorage.getItem(SESSION_KEY);
      if (token && isTokenValid(token)) {
        window.location.href = '/';
        return;
      }
    } catch {}
    setChecking(false);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'ログインに失敗しました');

      localStorage.setItem(SESSION_KEY, json.access_token);
      window.location.href = '/';
    } catch (err) {
      if (err.message.includes('Invalid login credentials') || err.message.includes('invalid_credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError('ログインに失敗しました: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) return null;

  return (
    <>
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, padding: '24px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ width: '40px', height: '2px', background: C.gold, margin: '0 0 36px' }} />
          <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.4em', marginBottom: '10px' }}>SEN</p>
          <h1 style={{ color: C.text, fontSize: '22px', fontWeight: '300', marginBottom: '8px' }}>SEN</h1>
          <p style={{ color: C.dim, fontSize: '13px', marginBottom: '40px' }}>自己分析プログラム</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '6px' }}>
            <input
              type="email" placeholder="メールアドレス"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: C.font }}
            />
            <input
              type="password" placeholder="パスワード"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: C.font }}
            />
          </div>

          {error && <p style={{ color: C.red, fontSize: '12px', margin: '10px 0' }}>{error}</p>}

          <button
            onClick={handleLogin}
            disabled={!email.trim() || !password || isLoading}
            style={{
              width: '100%', padding: '15px', border: 'none', borderRadius: '4px', marginTop: '14px',
              background: (email.trim() && password) ? C.gold : '#1a1a1a',
              color: (email.trim() && password) ? '#0a0a0a' : C.dim,
              cursor: (email.trim() && password && !isLoading) ? 'pointer' : 'not-allowed',
              fontSize: '14px', letterSpacing: '0.12em', fontFamily: C.font,
            }}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>

          <p style={{ color: '#2a2a2a', fontSize: '11px', marginTop: '28px', textAlign: 'center' }}>
            アカウントはコーチから発行されます
          </p>
        </div>
      </div>
    </>
  );
}

