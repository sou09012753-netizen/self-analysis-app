import { useState, useEffect } from 'react';
import Head from 'next/head';

const SESSIONS = [
  {
    id: 1,
    title: '自分の根っこを知る',
    phases: [
      {
        title: '家庭環境',
        questions: [
          '家族構成と、家の雰囲気を一言で教えてください。父、母、兄弟の構成は？',
          '父親はどんな人でしたか？子どもの頃、どう見ていましたか？',
          '母親はどんな人でしたか？あなたとの関係は？',
          '家の中で一番怖かった、嫌だった経験は何ですか？',
          '褒められた記憶はありますか？どんな時に、誰に褒められましたか？',
          'お金について、家庭の中でどんなメッセージを受け取りましたか？',
        ],
      },
      {
        title: '小学校〜中学校',
        questions: [
          '小学校時代、クラスの中でどんな存在でしたか？',
          '夢中になったこと、熱中したことは何ですか？',
          '初めて本気で悔しかった経験は何ですか？',
          '初めて本気で認められた、嬉しかった経験は？',
          '中学で大きな転機や挫折はありましたか？その時どうしましたか？',
        ],
      },
      {
        title: '高校〜20歳',
        questions: [
          '高校時代、自分をどう見ていましたか？周りにはどう見えていたと思いますか？',
          '人生で初めて「自分から動いた」瞬間はいつですか？',
          '周りにどう見られたかったですか？その裏にある本音は？',
          '自分を偽ったり、本音を隠した経験はありますか？正直に。',
          '人生で一番孤独だった時期はいつですか？その時何をしていましたか？',
          '初めてお金を稼いだ経験は？その時、何を感じましたか？',
        ],
      },
    ],
  },
  {
    id: 2,
    title: '自分のパターンを知る',
    phases: [
      {
        title: '失敗・どん底パターン',
        questions: [
          '人生で一番しんどかった時期はいつですか？具体的に何が起きていましたか？',
          'その時、誰かに話しましたか？それとも1人で抱えましたか？',
          '消えたい、死にたいという気持ちはありましたか？正直に。',
          'その時期を乗り越えられたのはなぜだと思いますか？',
          '今でも同じ失敗パターンを繰り返していると感じることはありますか？それはどんなパターンですか？',
        ],
      },
      {
        title: '成功・強みパターン',
        questions: [
          '今の仕事で一番得意なことは何ですか？',
          '今の仕事で一番苦手なことは？正直に。',
          'うまくいく時とうまくいかない時、何が違いますか？',
          '熱量が上がる瞬間はどんな時ですか？',
          '熱量が下がる時はどんな時ですか？その時どうしますか？',
          '自分の最大の弱点を1つだけ正直に言うとしたら？',
        ],
      },
      {
        title: 'お金・行動パターン',
        questions: [
          'お金が入った時、正直に何を考え、どう行動しますか？',
          'お金に余裕が出た時、自分の中に何が起きますか？',
          '逃げ込む場所・習慣はありますか？正直に答えてください。',
          '「本物」を見た瞬間、あなたに何が起きますか？',
          'これまでの人生で最も輝いた瞬間を具体的に教えてください。',
        ],
      },
    ],
  },
  {
    id: 3,
    title: '自分の軸を手に入れる',
    phases: [
      {
        title: '人間関係のパターン',
        questions: [
          '今、心から信頼できる人は何人いますか？その人のどこを信頼していますか？',
          '人間関係で繰り返す失敗パターンはありますか？',
          '孤独を感じた時、どうやって埋めますか？',
          '大切な人に本音を話せていますか？話せない理由は何ですか？',
          'あなたにとって「愛されている」とはどんな状態ですか？',
        ],
      },
      {
        title: 'ゴールとビジョン',
        questions: [
          '3年後、どんな状態でいたいですか？数字と状態で具体的に教えてください。',
          'そのゴールの本当の理由は何ですか？お金のため？認められたいため？誰かを守りたい？',
          '絶対に譲れないことは何ですか？',
          '絶対にやりたくないことは何ですか？',
          '死ぬ時に「やっておけばよかった」と思いたくないことは何ですか？',
        ],
      },
      {
        title: '自分軸の言語化',
        questions: [
          'あなたが行動する最大の燃料は何ですか？',
          'あなたが止まる時の一番の原因は何ですか？',
          'あなたにとって「成功」の定義を一言で言うと？',
          'あなたが他者に最も提供できる価値は何ですか？',
          '今の自分に一番必要なものは何だと思いますか？',
        ],
      },
    ],
  },
];

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

  const [newEmail, setNewEmail]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating]   = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('admin_authed');
    const savedPw = sessionStorage.getItem('admin_pw');
    if (saved === '1' && savedPw) {
      setPw(savedPw);
      setAuthed(true);
      fetchUsers(savedPw);
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
  };

  const handleCreateUser = async () => {
    if (!newEmail.trim() || !newPassword || isCreating) return;
    setIsCreating(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: pw, email: newEmail.trim(), userPassword: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'ユーザー作成に失敗しました');
      setCreateSuccess(`${newEmail.trim()} を作成しました`);
      setNewEmail('');
      setNewPassword('');
      setShowCreateForm(false);
      fetchUsers(pw);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // ── ログイン画面 ──────────────────────────────────────────────────────
  if (!authed) {
    return (
      <>
        <Head><title>管理画面 — コーチングSEN</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, padding: '24px' }}>
          <div style={{ maxWidth: '360px', width: '100%' }}>
            <div style={{ width: '32px', height: '2px', background: C.gold, marginBottom: '32px' }} />
            <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.4em', marginBottom: '8px' }}>COACHING SEN</p>
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
      <Head><title>管理画面 — コーチングSEN</title></Head>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '6px' }}>COACHING SEN — ADMIN</p>
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
                onClick={() => fetchUsers(pw)}
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

          {/* クライアント追加フォーム */}
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
                    type="email" placeholder="メールアドレス"
                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    style={{ padding: '12px 14px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '14px', outline: 'none', fontFamily: C.font }}
                  />
                  <input
                    type="password" placeholder="初期パスワード（8文字以上）"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateUser()}
                    style={{ padding: '12px 14px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '14px', outline: 'none', fontFamily: C.font }}
                  />
                </div>
                {createError && <p style={{ color: C.red, fontSize: '12px', marginBottom: '10px' }}>{createError}</p>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCreateUser}
                    disabled={!newEmail.trim() || !newPassword || isCreating}
                    style={{ padding: '11px 22px', border: 'none', borderRadius: '4px', background: (newEmail.trim() && newPassword) ? C.gold : '#1a1a1a', color: (newEmail.trim() && newPassword) ? '#0a0a0a' : C.dim, cursor: (newEmail.trim() && newPassword) ? 'pointer' : 'not-allowed', fontSize: '12px', fontFamily: C.font }}
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
