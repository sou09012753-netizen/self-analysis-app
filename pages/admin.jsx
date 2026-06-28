import { useState, useEffect } from 'react';
import Head from 'next/head';
import { SESSIONS } from '../components/SelfAnalysisApp';



const C = {
  bg: '#0a0a0a', gold: '#c9a84c', text: '#f5f0e8',
  muted: '#888', dim: '#555', surface: '#111',
  border: '#1e1e1e', border2: '#2a2a2a',
  green: '#6b9b6b', red: '#9b6b6b',
  font: "'Noto Serif JP', Georgia, serif",
};

const csvCell = (val) => {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('\n') || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const buildUserCSV = (userName, sd) => {
  const rows = [['ユーザー名', 'セッションID', 'セッション名', 'フェーズ', '質問番号', '質問', '回答', '完了日時']];
  SESSIONS.forEach((cfg) => {
    const session = sd?.sessions?.[String(cfg.id)];
    if (!session) return;
    cfg.phases.forEach((phase, pi) => {
      phase.questions.forEach((q, qi) => {
        rows.push([
          userName, `SESSION ${cfg.id}`, cfg.title, phase.title, `${pi + 1}-${qi + 1}`, q,
          session.answers?.[`${pi}-${qi}`] ?? '',
          session.completedAt ? new Date(session.completedAt).toLocaleString('ja-JP') : '',
        ]);
      });
    });
  });
  return rows.map(r => r.map(csvCell).join(',')).join('\n');
};

const buildAllUsersCSV = (users) => {
  const rows = [['ユーザー名', 'セッションID', 'セッション名', 'フェーズ', '質問番号', '質問', '回答', '完了日時']];
  users.forEach(u => {
    const sd = u.session_data;
    if (!sd) return;
    SESSIONS.forEach((cfg) => {
      const session = sd.sessions?.[String(cfg.id)];
      if (!session) return;
      cfg.phases.forEach((phase, pi) => {
        phase.questions.forEach((q, qi) => {
          rows.push([
            u.user_name, `SESSION ${cfg.id}`, cfg.title, phase.title, `${pi + 1}-${qi + 1}`, q,
            session.answers?.[`${pi}-${qi}`] ?? '',
            session.completedAt ? new Date(session.completedAt).toLocaleString('ja-JP') : '',
          ]);
        });
      });
    });
  });
  return rows.map(r => r.map(csvCell).join(',')).join('\n');
};

const downloadCSV = (filename, content) => {
  const bom = '﻿';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const statusLabel = (s) => {
  if (s === 'completed')   return { text: '完了',   color: C.gold };
  if (s === 'in_progress') return { text: '進行中', color: C.green };
  return { text: '未開始', color: C.dim };
};

const inputStyle = {
  padding: '12px 14px', background: 'transparent', border: '1px solid #333',
  borderRadius: '4px', color: '#f5f0e8', fontSize: '14px', outline: 'none',
  fontFamily: "'Noto Serif JP', Georgia, serif",
};

export default function AdminPage() {
  const [authed, setAuthed]           = useState(false);
  const [pw, setPw]                   = useState('');
  const [loginError, setLoginError]   = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [users, setUsers]             = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [loadError, setLoadError]     = useState('');
  const [expandedUser, setExpandedUser]       = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);

  // クライアント作成
  const [newEmail, setNewEmail]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [isCreating, setIsCreating]   = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // コーチ管理
  const [coaches, setCoaches]         = useState([]);
  const [showCreateCoachForm, setShowCreateCoachForm] = useState(false);
  const [newCoachName, setNewCoachName]     = useState('');
  const [newCoachPasscode, setNewCoachPasscode] = useState('');
  const [isCreatingCoach, setIsCreatingCoach]   = useState(false);
  const [createCoachError, setCreateCoachError] = useState('');
  const [createCoachSuccess, setCreateCoachSuccess] = useState('');
  const [coachSectionOpen, setCoachSectionOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('admin_authed');
    const savedPw = sessionStorage.getItem('admin_pw');
    if (saved === '1' && savedPw) {
      setPw(savedPw);
      setAuthed(true);
      fetchUsers(savedPw);
      fetchCoaches(savedPw);
    }
  }, []);

  const fetchUsers = async (password) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/db/users?password=${encodeURIComponent(password)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'データの取得に失敗しました');
      setUsers(json.users || []);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoaches = async (password) => {
    try {
      const res = await fetch(`/api/admin/coaches?password=${encodeURIComponent(password)}`);
      const json = await res.json();
      setCoaches(json.coaches || []);
    } catch {}
  };

  const handleLogin = async () => {
    if (!pw.trim() || isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        sessionStorage.setItem('admin_authed', '1');
        sessionStorage.setItem('admin_pw', pw);
        setAuthed(true);
        fetchUsers(pw);
        fetchCoaches(pw);
      } else {
        setLoginError('パスワードが違います');
      }
    } catch {
      setLoginError('通信エラーが発生しました');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authed');
    sessionStorage.removeItem('admin_pw');
    setAuthed(false);
    setPw('');
    setUsers([]);
    setCoaches([]);
  };

  const handleCreateUser = async () => {
    if (!newEmail.trim() || !newPassword || !selectedCoachId || isCreating) return;
    setIsCreating(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: pw,
          email: newEmail.trim(),
          userPassword: newPassword,
          userName: newUserName.trim() || undefined,
          coachId: selectedCoachId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'ユーザー作成に失敗しました');
      setCreateSuccess(`${newEmail.trim()} を作成しました`);
      setNewEmail(''); setNewPassword(''); setNewUserName(''); setSelectedCoachId('');
      setShowCreateForm(false);
      fetchUsers(pw);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCoach = async () => {
    if (!newCoachName.trim() || newCoachPasscode.length !== 4 || isCreatingCoach) return;
    setIsCreatingCoach(true);
    setCreateCoachError('');
    setCreateCoachSuccess('');
    try {
      const res = await fetch('/api/admin/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: pw, name: newCoachName.trim(), passcode: newCoachPasscode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'コーチ作成に失敗しました');
      setCreateCoachSuccess(`${newCoachName.trim()} を作成しました（パスコード: ${newCoachPasscode}）`);
      setNewCoachName(''); setNewCoachPasscode('');
      setShowCreateCoachForm(false);
      fetchCoaches(pw);
    } catch (err) {
      setCreateCoachError(err.message);
    } finally {
      setIsCreatingCoach(false);
    }
  };

  // ── ログイン画面 ──────────────────────────────────────────────────────
  if (!authed) {
    return (
      <>
        <Head><title>管理画面 — SEN</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, padding: '24px' }}>
          <div style={{ maxWidth: '360px', width: '100%' }}>
            <div style={{ width: '32px', height: '2px', background: C.gold, marginBottom: '32px' }} />
            <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.4em', marginBottom: '8px' }}>SEN</p>
            <h1 style={{ color: C.text, fontSize: '18px', fontWeight: '300', marginBottom: '32px' }}>管理画面</h1>
            <input
              type="password" placeholder="パスワードを入力"
              value={pw} onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '15px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', fontFamily: C.font }}
            />
            {loginError && <p style={{ color: C.red, fontSize: '12px', marginBottom: '10px' }}>{loginError}</p>}
            <button
              onClick={handleLogin} disabled={!pw.trim() || isLoggingIn}
              style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '4px', background: pw.trim() ? C.gold : '#1a1a1a', color: pw.trim() ? '#0a0a0a' : C.dim, cursor: pw.trim() ? 'pointer' : 'not-allowed', fontSize: '13px', letterSpacing: '0.1em', fontFamily: C.font }}
            >
              {isLoggingIn ? '認証中...' : 'ログイン'}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── 管理画面（認証後） ────────────────────────────────────────────────
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  return (
    <>
      <Head><title>管理画面 — SEN</title></Head>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '6px' }}>SEN — ADMIN</p>
              <h1 style={{ color: C.text, fontSize: '20px', fontWeight: '300', margin: '0 0 4px' }}>回答データ管理</h1>
              <p style={{ color: C.dim, fontSize: '11px', margin: 0 }}>{users.length} 名のユーザー</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {users.length > 0 && (
                <button
                  onClick={() => downloadCSV(`全ユーザー_自己分析_${dateStr}.csv`, buildAllUsersCSV(users))}
                  style={{ padding: '10px 18px', border: 'none', borderRadius: '4px', background: C.gold, color: '#0a0a0a', fontSize: '12px', letterSpacing: '0.08em', cursor: 'pointer', fontFamily: C.font, whiteSpace: 'nowrap' }}
                >
                  全ユーザーCSV
                </button>
              )}
              <button
                onClick={() => { fetchUsers(pw); fetchCoaches(pw); }}
                style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: '4px', color: C.muted, fontSize: '12px', cursor: 'pointer', fontFamily: C.font }}
              >
                更新
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: '4px', color: C.dim, fontSize: '12px', cursor: 'pointer', fontFamily: C.font }}
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* ── コーチ管理 ── */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', marginBottom: '28px', overflow: 'hidden' }}>
            <div
              onClick={() => setCoachSectionOpen(o => !o)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: C.surface, userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', margin: 0 }}>COACH MANAGEMENT</p>
                <span style={{ color: C.dim, fontSize: '11px' }}>{coaches.length} 名</span>
              </div>
              <span style={{ color: C.dim, fontSize: '14px' }}>{coachSectionOpen ? '▲' : '▼'}</span>
            </div>

            {coachSectionOpen && (
              <div style={{ padding: '20px', borderTop: `1px solid ${C.border}` }}>
                {/* コーチ一覧 */}
                {coaches.length === 0 ? (
                  <p style={{ color: C.dim, fontSize: '12px', marginBottom: '16px' }}>コーチがいません</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {coaches.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#0a0a0a', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <span style={{ color: C.text, fontSize: '14px' }}>{c.name}</span>
                          <span style={{ color: C.dim, fontSize: '11px' }}>
                            パスコード: <span style={{ color: C.gold, fontFamily: 'monospace', letterSpacing: '0.3em' }}>{c.passcode}</span>
                          </span>
                        </div>
                        <span style={{ color: '#333', fontSize: '10px' }}>{new Date(c.created_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* コーチ追加フォーム */}
                {!showCreateCoachForm ? (
                  <button
                    onClick={() => { setShowCreateCoachForm(true); setCreateCoachError(''); setCreateCoachSuccess(''); }}
                    style={{ padding: '10px 18px', border: `1px solid ${C.gold}66`, borderRadius: '4px', background: 'transparent', color: C.gold, fontSize: '12px', cursor: 'pointer', fontFamily: C.font }}
                  >
                    ＋ コーチを追加
                  </button>
                ) : (
                  <div style={{ padding: '20px', border: `1px solid ${C.gold}33`, borderRadius: '8px', background: '#0c0c0c' }}>
                    <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '14px' }}>新規コーチ</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                      <input
                        type="text" placeholder="コーチ名"
                        value={newCoachName} onChange={e => setNewCoachName(e.target.value)}
                        style={inputStyle}
                      />
                      <input
                        type="text" placeholder="パスコード（4桁の数字）" maxLength={4}
                        value={newCoachPasscode} onChange={e => setNewCoachPasscode(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={e => e.key === 'Enter' && handleCreateCoach()}
                        style={{ ...inputStyle, letterSpacing: '0.4em', fontFamily: 'monospace' }}
                      />
                    </div>
                    {createCoachError && <p style={{ color: C.red, fontSize: '12px', marginBottom: '10px' }}>{createCoachError}</p>}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleCreateCoach}
                        disabled={!newCoachName.trim() || newCoachPasscode.length !== 4 || isCreatingCoach}
                        style={{ padding: '10px 20px', border: 'none', borderRadius: '4px', background: (newCoachName.trim() && newCoachPasscode.length === 4) ? C.gold : '#1a1a1a', color: (newCoachName.trim() && newCoachPasscode.length === 4) ? '#0a0a0a' : C.dim, cursor: (newCoachName.trim() && newCoachPasscode.length === 4) ? 'pointer' : 'not-allowed', fontSize: '12px', fontFamily: C.font }}
                      >
                        {isCreatingCoach ? '作成中...' : '追加'}
                      </button>
                      <button
                        onClick={() => { setShowCreateCoachForm(false); setCreateCoachError(''); }}
                        style={{ padding: '10px 16px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: '4px', color: C.dim, fontSize: '12px', cursor: 'pointer', fontFamily: C.font }}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
                {createCoachSuccess && <p style={{ color: C.green, fontSize: '12px', marginTop: '10px' }}>{createCoachSuccess}</p>}
              </div>
            )}
          </div>

          {/* ── クライアント追加フォーム ── */}
          <div style={{ marginBottom: '28px' }}>
            {!showCreateForm ? (
              <button
                onClick={() => { setShowCreateForm(true); setCreateError(''); setCreateSuccess(''); }}
                style={{ padding: '11px 20px', border: `1px solid ${C.gold}66`, borderRadius: '4px', background: 'transparent', color: C.gold, fontSize: '12px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: C.font }}
              >
                ＋ 新規クライアント追加
              </button>
            ) : (
              <div style={{ padding: '24px', border: `1px solid ${C.gold}33`, borderRadius: '8px', background: '#0c0c0c' }}>
                <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '16px' }}>新規クライアント</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  <input
                    type="text" placeholder="クライアント名（表示名）"
                    value={newUserName} onChange={e => setNewUserName(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="email" placeholder="メールアドレス"
                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="password" placeholder="初期パスワード（8文字以上）"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateUser()}
                    style={inputStyle}
                  />
                  {coaches.length > 0 && (
                    <select
                      value={selectedCoachId} onChange={e => setSelectedCoachId(e.target.value)}
                      style={{ ...inputStyle, color: selectedCoachId ? '#f5f0e8' : C.dim }}
                    >
                      <option value="" disabled>-- 担当コーチを選択（必須）</option>
                      {coaches.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                {createError && <p style={{ color: C.red, fontSize: '12px', marginBottom: '10px' }}>{createError}</p>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCreateUser}
                    disabled={!newEmail.trim() || !newPassword || !selectedCoachId || isCreating}
                    style={{ padding: '11px 22px', border: 'none', borderRadius: '4px', background: (newEmail.trim() && newPassword && selectedCoachId) ? C.gold : '#1a1a1a', color: (newEmail.trim() && newPassword && selectedCoachId) ? '#0a0a0a' : C.dim, cursor: (newEmail.trim() && newPassword && selectedCoachId) ? 'pointer' : 'not-allowed', fontSize: '12px', fontFamily: C.font }}
                  >
                    {isCreating ? '作成中...' : '追加'}
                  </button>
                  <button
                    onClick={() => { setShowCreateForm(false); setCreateError(''); }}
                    style={{ padding: '11px 16px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: '4px', color: C.dim, fontSize: '12px', cursor: 'pointer', fontFamily: C.font }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
            {createSuccess && (
              <p style={{ color: C.green, fontSize: '12px', marginTop: '10px' }}>{createSuccess}</p>
            )}
          </div>

          {/* ローディング / エラー */}
          {isLoading && (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: C.dim, fontSize: '13px' }}>読み込み中...</p>
            </div>
          )}
          {loadError && (
            <div style={{ padding: '24px', border: `1px solid ${C.red}33`, borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ color: C.red, fontSize: '13px', margin: 0 }}>{loadError}</p>
            </div>
          )}

          {/* ユーザーリスト */}
          {!isLoading && !loadError && users.length === 0 && (
            <div style={{ padding: '48px', border: `1px solid ${C.border}`, borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: C.dim, fontSize: '14px' }}>データがありません</p>
            </div>
          )}

          {users.map((u) => {
            const sd = u.session_data;
            const isExpanded = expandedUser === u.id;

            return (
              <div key={u.id} style={{ border: `1px solid ${C.border}`, borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                {/* ユーザー行 */}
                <div
                  onClick={() => { setExpandedUser(isExpanded ? null : u.id); setExpandedSession(null); }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', cursor: 'pointer', background: isExpanded ? '#131313' : C.surface, userSelect: 'none', flexWrap: 'wrap', gap: '12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: C.text, fontSize: '16px', fontWeight: '300', margin: '0 0 3px' }}>{u.user_name}</p>
                      <p style={{ color: '#333', fontSize: '10px', margin: 0 }}>
                        {new Date(u.created_at).toLocaleDateString('ja-JP')} 登録 · 最終更新 {new Date(u.updated_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {SESSIONS.map((cfg) => {
                        const s = sd?.sessions?.[String(cfg.id)];
                        const info = statusLabel(s?.status ?? 'not_started');
                        return (
                          <div key={cfg.id} style={{ textAlign: 'center' }}>
                            <p style={{ color: C.dim, fontSize: '9px', letterSpacing: '0.1em', margin: '0 0 3px' }}>S{cfg.id}</p>
                            <p style={{ color: info.color, fontSize: '11px', margin: 0 }}>{info.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadCSV(`${u.user_name}_自己分析_${dateStr}.csv`, buildUserCSV(u.user_name, sd)); }}
                      style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: '4px', color: C.muted, fontSize: '11px', cursor: 'pointer', fontFamily: C.font, whiteSpace: 'nowrap' }}
                    >
                      CSV
                    </button>
                    <span style={{ color: C.dim, fontSize: '16px', lineHeight: 1 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* 展開：セッション詳細 */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 24px 24px' }}>
                    {SESSIONS.map((cfg) => {
                      const session = sd?.sessions?.[String(cfg.id)];
                      const sesKey = `${u.id}-${cfg.id}`;
                      const isSesExpanded = expandedSession === sesKey;
                      const totalQ = cfg.phases.reduce((a, p) => a + p.questions.length, 0);
                      const answeredQ = Object.keys(session?.answers ?? {}).length;
                      const info = statusLabel(session?.status ?? 'not_started');

                      return (
                        <div key={cfg.id} style={{ border: `1px solid ${C.border}`, borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
                          <div
                            onClick={() => setExpandedSession(isSesExpanded ? null : sesKey)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', background: isSesExpanded ? '#0f0f0f' : 'transparent', userSelect: 'none' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.15em' }}>SESSION {cfg.id}</span>
                              <div>
                                <p style={{ color: C.text, fontSize: '13px', margin: '0 0 2px' }}>{cfg.title}</p>
                                <p style={{ color: C.dim, fontSize: '11px', margin: 0 }}>{answeredQ}/{totalQ} 問回答済み</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ color: info.color, fontSize: '11px' }}>{info.text}</span>
                              {session?.completedAt && (
                                <span style={{ color: '#333', fontSize: '10px' }}>{new Date(session.completedAt).toLocaleDateString('ja-JP')}</span>
                              )}
                              <span style={{ color: C.dim, fontSize: '14px' }}>{isSesExpanded ? '▲' : '▼'}</span>
                            </div>
                          </div>

                          {isSesExpanded && (
                            <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${C.border}` }}>
                              {cfg.phases.map((phase, pi) => (
                                <div key={pi} style={{ marginTop: '20px' }}>
                                  <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.18em', marginBottom: '12px' }}>{phase.title}</p>
                                  {phase.questions.map((q, qi) => {
                                    const ans = session?.answers?.[`${pi}-${qi}`];
                                    return (
                                      <div key={qi} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #161616' }}>
                                        <p style={{ color: C.muted, fontSize: '12px', lineHeight: '1.7', marginBottom: '6px' }}>
                                          <span style={{ color: C.dim, fontSize: '10px', marginRight: '8px' }}>Q{pi + 1}-{qi + 1}</span>
                                          {q}
                                        </p>
                                        <p style={{ color: ans ? C.text : '#2a2a2a', fontSize: '13px', lineHeight: '1.8', margin: 0, whiteSpace: 'pre-wrap' }}>
                                          {ans || '（未回答）'}
                                        </p>
                                      </div>
                                    );
                                  })}
                                  {session?.summary && pi === cfg.phases.length - 1 && (
                                    <div style={{ marginTop: '16px', padding: '16px', background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: '6px' }}>
                                      <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.15em', marginBottom: '10px' }}>生成カード</p>
                                      <p style={{ color: '#bbb', fontSize: '12px', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0 }}>{session.summary}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {sd?.integratedDoc && (
                      <div style={{ border: `1px solid ${C.gold}33`, borderRadius: '6px', overflow: 'hidden', marginTop: '10px' }}>
                        <div
                          onClick={() => setExpandedSession(expandedSession === `${u.id}-final` ? null : `${u.id}-final`)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', background: 'transparent', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.15em' }}>FINAL</span>
                            <p style={{ color: C.text, fontSize: '13px', margin: 0 }}>分身ドキュメント</p>
                          </div>
                          <span style={{ color: C.dim, fontSize: '14px' }}>{expandedSession === `${u.id}-final` ? '▲' : '▼'}</span>
                        </div>
                        {expandedSession === `${u.id}-final` && (
                          <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
                            <p style={{ color: '#bbb', fontSize: '12px', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0 }}>{sd.integratedDoc}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
