import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getSupabaseClient } from '../../lib/supabaseClient';

const SENParticle = dynamic(() => import('../../components/SENParticle'), { ssr: false });

const C = {
  bg: '#0a0a0a', gold: '#c9a84c', text: '#f5f0e8',
  muted: '#888', dim: '#555',
  border: '#1e1e1e', red: '#c06060', green: '#6ca86c',
  font: "'Noto Serif JP', Georgia, serif",
};

export default function AuthCallback() {
  const [phase, setPhase]       = useState('loading'); // loading | form | success | error
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    document.title = 'パスワード再設定 — SEN';

    let sub;
    getSupabaseClient().then((client) => {
      setSupabase(client);

      const { data } = client.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setPhase('form');
        }
      });
      sub = data.subscription;

      // PKCEフロー：URLにcode paramsがある場合はexchangeCodeForSessionを試みる
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        client.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) setPhase('error');
          // 成功時はonAuthStateChangeのPASSWORD_RECOVERYで拾う
        });
        return;
      }

      // ハッシュフロー：#access_token&type=recovery
      const hash = window.location.hash;
      if (!hash.includes('type=recovery') && !code) {
        setPhase('error');
      }
    }).catch(() => setPhase('error'));

    return () => sub?.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirm || isLoading) return;
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (password.length < 8) { setError('8文字以上で設定してください'); return; }

    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPhase('success');
      setTimeout(() => { window.location.href = '/login'; }, 2500);
    } catch (err) {
      setError('再設定に失敗しました: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    position: 'relative', minHeight: '100vh', background: C.bg,
    overflow: 'hidden', fontFamily: C.font,
  };
  const centerStyle = {
    position: 'relative', zIndex: 10, minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
  };
  const inputStyle = {
    width: '100%', padding: '12px 14px', background: 'rgba(10,10,10,0.7)',
    border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', fontFamily: C.font,
  };

  return (
    <div style={containerStyle}>
      <div style={{ position: 'absolute', inset: 0 }}><SENParticle /></div>
      <div style={centerStyle}>
        <div style={{ maxWidth: '360px', width: '100%' }}>

          {phase === 'loading' && (
            <p style={{ color: C.muted, fontSize: '13px', textAlign: 'center' }}>確認中...</p>
          )}

          {phase === 'form' && (
            <>
              <p style={{ color: C.dim, fontSize: '12px', marginBottom: '28px' }}>パスワード再設定</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '4px' }}>
                <input
                  type="password" placeholder="新しいパスワード（8文字以上）"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  style={inputStyle}
                />
                <input
                  type="password" placeholder="もう一度入力"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  style={inputStyle}
                />
              </div>
              {error && <p style={{ color: C.red, fontSize: '12px', margin: '8px 0' }}>{error}</p>}
              <button
                onClick={handleReset}
                disabled={!password || !confirm || isLoading}
                style={{
                  width: '100%', padding: '13px', border: 'none', borderRadius: '4px', marginTop: '12px',
                  background: (password && confirm) ? C.gold : '#1a1a1a',
                  color: (password && confirm) ? '#0a0a0a' : C.dim,
                  cursor: (password && confirm && !isLoading) ? 'pointer' : 'not-allowed',
                  fontSize: '13px', letterSpacing: '0.12em', fontFamily: C.font,
                }}
              >
                {isLoading ? '更新中...' : '設定する'}
              </button>
            </>
          )}

          {phase === 'success' && (
            <p style={{ color: C.green, fontSize: '14px', textAlign: 'center', lineHeight: '1.8' }}>
              パスワードを再設定しました。<br />ログイン画面へ移動します...
            </p>
          )}

          {phase === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: C.red, fontSize: '13px', marginBottom: '20px', lineHeight: '1.8' }}>
                リンクが無効または期限切れです。<br />コーチに再送を依頼してください。
              </p>
              <a href="/login" style={{ color: C.gold, fontSize: '12px', textDecoration: 'none' }}>
                ログインへ戻る
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
