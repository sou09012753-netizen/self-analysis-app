import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { getSupabaseClient } from '../lib/supabaseClient';

const DRAFT_KEY = 'coaching_sen_draft';

const SESSIONS = [
  {
    id: 1,
    title: '自分の根っこを知る',
    subtitle: '幼少期〜20歳の棚卸し',
    cardName: 'あなたの動機の核心カード',
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
    subtitle: '成功と失敗の繰り返しパターンを特定',
    cardName: 'あなたの成功条件・失敗条件カード',
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
    subtitle: 'ゴール・価値観・譲れないものを言語化',
    cardName: 'あなたの自分軸カード',
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

const NEXT_PREVIEW = {
  2: {
    title: '次回 SESSION 2「自分のパターンを知る」',
    body: '今日明らかになった「動機の核心」が、あなたの成功と失敗にどう繋がっているかを探ります。繰り返すパターンを特定し、「成功条件・失敗条件カード」を完成させます。',
  },
  3: {
    title: '次回 SESSION 3「自分の軸を手に入れる」',
    body: '今日特定した成功・失敗パターンを踏まえて、本物の自分軸を言語化します。ゴール・価値観・譲れないものを明確にし、「自分軸カード」と統合「分身ドキュメント」が完成します。',
  },
};

const getTotalQ = (cfg) => cfg.phases.reduce((a, p) => a + p.questions.length, 0);

const getNextQ = (session, cfg) => {
  for (let pi = 0; pi < cfg.phases.length; pi++) {
    for (let qi = 0; qi < cfg.phases[pi].questions.length; qi++) {
      if (!session.answers[`${pi}-${qi}`]) {
        return {
          phaseIdx: pi, qIdx: qi,
          phase: cfg.phases[pi],
          question: cfg.phases[pi].questions[qi],
          qNum: qi + 1,
          phaseTotal: cfg.phases[pi].questions.length,
          isLast: pi === cfg.phases.length - 1 && qi === cfg.phases[pi].questions.length - 1,
        };
      }
    }
  }
  return null;
};

const defaultSession = () => ({ status: 'not_started', answers: {}, summary: '', completedAt: null });
const defaultData = (name) => ({
  userName: name,
  activeSessionId: null,
  sessions: { 1: defaultSession(), 2: defaultSession(), 3: defaultSession() },
  integratedDoc: '',
});

const C = {
  bg: '#0a0a0a', gold: '#c9a84c', text: '#f5f0e8',
  muted: '#888', dim: '#555', surface: '#111',
  border: '#1e1e1e', border2: '#2a2a2a', green: '#6b9b6b',
  font: "'Noto Serif JP', Georgia, serif",
};

const goldBtn = (active, extra = {}) => ({
  padding: '15px 28px', border: 'none', borderRadius: '4px',
  cursor: active ? 'pointer' : 'not-allowed', fontSize: '13px',
  letterSpacing: '0.12em', fontFamily: C.font,
  background: active ? C.gold : '#1a1a1a', color: active ? '#0a0a0a' : C.dim,
  opacity: active ? 1 : 0.5, ...extra,
});

const ghostBtn = (extra = {}) => ({
  padding: '13px 20px', background: 'transparent',
  border: `1px solid ${C.border2}`, borderRadius: '4px',
  color: C.dim, fontSize: '12px', letterSpacing: '0.1em',
  cursor: 'pointer', fontFamily: C.font, ...extra,
});

const renderMd = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# '))   return <h2 key={i} style={{ color: C.text, fontSize: '20px', fontWeight: '300', margin: '0 0 24px' }}>{line.slice(2)}</h2>;
    if (line.startsWith('## '))  return <h3 key={i} style={{ color: C.text, fontSize: '16px', fontWeight: '400', margin: '28px 0 14px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>{line.slice(3)}</h3>;
    if (line.startsWith('### ')) return <h4 key={i} style={{ color: C.gold, fontSize: '11px', letterSpacing: '0.2em', margin: '20px 0 10px', fontWeight: '400' }}>{line.slice(4)}</h4>;
    if (line.match(/^\d+\.\s/))  return <p key={i} style={{ color: '#ccc', fontSize: '14px', margin: '6px 0', lineHeight: '1.8' }}>{line}</p>;
    if (line.startsWith('- '))   return <p key={i} style={{ color: '#bbb', fontSize: '14px', margin: '5px 0', lineHeight: '1.8', display: 'flex', gap: '8px' }}><span style={{ color: C.gold, flexShrink: 0 }}>·</span>{line.slice(2)}</p>;
    if (line.match(/^\*\*(.+?):\*\*\s*(.*)/)) {
      const [, label, rest] = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
      return <p key={i} style={{ color: '#ccc', fontSize: '14px', margin: '7px 0', lineHeight: '1.8' }}><span style={{ color: C.text, fontWeight: '500' }}>{label}：</span>{rest}</p>;
    }
    if (line === '---') return <div key={i} style={{ height: '1px', background: C.border, margin: '24px 0' }} />;
    if (!line.trim())  return <div key={i} style={{ height: '6px' }} />;
    return <p key={i} style={{ color: '#ccc', fontSize: '14px', margin: '4px 0', lineHeight: '1.8' }}>{line}</p>;
  });
};

const callAPI = async (body) => {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.text || '';
};

export default function SelfAnalysisApp() {
  const [view, setView]           = useState('landing');
  const [data, setData]           = useState(null);
  const [activeId, setActiveId]   = useState(null);
  const [nameInput, setNameInput] = useState('');

  const [answer, setAnswer]           = useState('');
  const [followUp, setFollowUp]       = useState('');
  const [convHistory, setConvHistory] = useState([]);
  const [isLoading, setIsLoading]     = useState(false);

  const [isSummarizing, setIsSummarizing]   = useState(false);
  const [summaryText, setSummaryText]       = useState('');
  const [summaryError, setSummaryError]     = useState('');
  const [summaryTab, setSummaryTab]         = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus]     = useState('');
  const [resumeToast, setResumeToast]   = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const saveTimer = useRef(null);
  const dbSaveTimer = useRef(null);
  const userIdRef = useRef(null);
  const tokenRef = useRef(null);

  // 認証チェック → DBロード
  useEffect(() => {
    const subRef = { current: null };

    const applyData = (parsed) => {
      setData(parsed);
      const rid = parsed.activeSessionId;
      if (rid && parsed.sessions[rid]?.status === 'in_progress') {
        setActiveId(rid);
        setView('session-active');
        setResumeToast(true);
        setTimeout(() => setResumeToast(false), 3500);
      } else {
        setView('session-select');
      }
    };

    (async () => {
      try {
        const supabase = await getSupabaseClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { window.location.href = '/login'; return; }

        userIdRef.current = session.user.id;
        tokenRef.current = session.access_token;
        setAuthChecking(false);

        try {
          const res = await fetch('/api/db/load', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          const { sessionData } = await res.json();
          if (sessionData) applyData(sessionData);
        } catch {}

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT') { window.location.href = '/login'; }
          if (session?.access_token) tokenRef.current = session.access_token;
        });
        subRef.current = data.subscription;
      } catch (err) {
        console.error('Auth error:', err);
        setAuthChecking(false);
      }
    })();

    return () => { subRef.current?.unsubscribe(); };
  }, []);

  // DB 書き込み（デバウンス1秒）
  useEffect(() => {
    if (!data || !tokenRef.current) return;
    if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current);
    dbSaveTimer.current = setTimeout(() => {
      fetch('/api/db/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({ userName: data.userName, sessionData: data }),
      }).catch(() => {});
    }, 1000);
    return () => { if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current); };
  }, [data]);

  // 下書き自動保存
  useEffect(() => {
    if (view !== 'session-active' || !activeId || !answer) {
      setSaveStatus('');
      return;
    }
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ sessionId: activeId, text: answer }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2500);
      } catch {}
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [answer, view, activeId]);

  // 下書き復元
  useEffect(() => {
    if (view !== 'session-active' || !activeId) return;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft?.sessionId === activeId && draft.text) setAnswer(draft.text);
    } catch {}
  }, [view, activeId]);

  const saveData = (updater) => setData(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });

  const patchSession = (id, updates) => {
    saveData(prev => ({
      ...prev,
      sessions: { ...prev.sessions, [id]: { ...prev.sessions[id], ...updates } },
    }));
  };

  const goToSessionSelect = () => {
    saveData(prev => ({ ...prev, activeSessionId: null }));
    setFollowUp(''); setConvHistory([]); setAnswer(''); setSaveStatus('');
    setView('session-select');
  };

  const handleSignOut = async () => {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleReset = async () => {
    if (!window.confirm('データをリセットしますか？全セッションの回答が削除されます。')) return;
    if (tokenRef.current) {
      await fetch('/api/db/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokenRef.current}` },
      }).catch(() => {});
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setData(null);
    setView('landing');
  };

  // ── ランディング ──────────────────────────────────────────────────────
  const handleStart = () => {
    if (!nameInput.trim()) return;
    const d = defaultData(nameInput.trim());
    setData(d);
    setView('session-select');
  };

  // ── セッション選択 ────────────────────────────────────────────────────
  const handleSelectSession = (id) => {
    setActiveId(id);
    setSummaryTab(0);
    const session = data.sessions[id];
    if (session.status === 'completed') {
      setSummaryText(session.summary);
      setSummaryError('');
      setView('session-summary');
      return;
    }
    setAnswer(''); setFollowUp(''); setConvHistory([]); setSummaryText(''); setSummaryError(''); setSaveStatus('');
    if (session.status === 'not_started') patchSession(id, { status: 'in_progress' });
    saveData(prev => ({ ...prev, activeSessionId: id }));
    setView('session-active');
  };

  // ── 回答送信 ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!answer.trim() || isLoading) return;
    const cfg = SESSIONS[activeId - 1];
    const session = data.sessions[activeId];
    const current = getNextQ(session, cfg);
    if (!current) return;

    const key = `${current.phaseIdx}-${current.qIdx}`;
    const saved = answer;
    const newAnswers = { ...session.answers, [key]: saved };
    const isLast = Object.keys(newAnswers).length >= getTotalQ(cfg);

    patchSession(activeId, { answers: newAnswers });
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
    setIsLoading(true);
    setAnswer('');

    let fu = '';
    try {
      fu = await callAPI({
        type: 'followup',
        question: current.question,
        answer: saved,
        conversationHistory: convHistory,
      });
      if (fu && fu !== '十分です') {
        setFollowUp(fu);
        setConvHistory(prev => [
          ...prev,
          { role: 'user', content: `質問：${current.question}\n回答：${saved}` },
          { role: 'assistant', content: fu },
        ]);
      }
    } catch {}

    setIsLoading(false);

    if (isLast) {
      setFollowUp('');
      await runCompleteSession(activeId, newAnswers, data);
    }
  };

  // ── 次の質問へ ────────────────────────────────────────────────────────
  const handleNext = async () => {
    setFollowUp(''); setConvHistory([]); setAnswer(''); setSaveStatus('');
    const cfg = SESSIONS[activeId - 1];
    const answers = data.sessions[activeId].answers;
    if (Object.keys(answers).length >= getTotalQ(cfg)) {
      await runCompleteSession(activeId, answers, data);
    }
  };

  // ── セッション完了・カード生成 ────────────────────────────────────────
  const runCompleteSession = async (sessionId, answers, currentData) => {
    saveData(prev => ({ ...prev, activeSessionId: null }));
    try { localStorage.removeItem(DRAFT_KEY); } catch {}

    setSummaryText('');
    setSummaryError('');
    setIsSummarizing(true);
    setView('session-summary');

    try {
      const cfg = SESSIONS[sessionId - 1];

      const allAnswers = cfg.phases.map((phase, pi) => ({
        phase: phase.title,
        qa: phase.questions.map((q, qi) => ({
          question: q,
          answer: answers[`${pi}-${qi}`] || '未回答',
        })),
      }));

      const previousSummaries = [];
      for (let i = 1; i < sessionId; i++) {
        if (currentData.sessions[i]?.summary) {
          previousSummaries.push({
            sessionNumber: i,
            title: SESSIONS[i - 1].title,
            summary: currentData.sessions[i].summary,
          });
        }
      }

      const summary = await callAPI({
        type: 'summary',
        sessionNumber: sessionId,
        userName: currentData.userName,
        allAnswers,
        previousSummaries,
      });

      setSummaryText(summary);
      saveData(prev => ({
        ...prev,
        activeSessionId: null,
        sessions: {
          ...prev.sessions,
          [sessionId]: {
            ...prev.sessions[sessionId],
            status: 'completed',
            answers,
            summary,
            completedAt: new Date().toISOString(),
          },
        },
      }));
    } catch (err) {
      setSummaryError(err.message || 'エラーが発生しました');
    } finally {
      setIsSummarizing(false);
    }
  };

  // ── 統合ドキュメント生成 ──────────────────────────────────────────────
  const handleGenerate = async () => {
    setIsGenerating(true);
    setView('final-document');
    try {
      const allSessionData = SESSIONS.map((cfg, idx) => {
        const id = idx + 1;
        const s = data.sessions[id];
        return {
          sessionNumber: id,
          title: cfg.title,
          cardName: cfg.cardName,
          summary: s.summary,
          answers: cfg.phases.map((phase, pi) => ({
            phase: phase.title,
            qa: phase.questions.map((q, qi) => ({ question: q, answer: s.answers[`${pi}-${qi}`] || '未回答' })),
          })),
        };
      });
      const doc = await callAPI({ type: 'generate', userName: data.userName, allSessionData });
      saveData(prev => ({ ...prev, integratedDoc: doc }));
    } catch (err) {
      saveData(prev => ({ ...prev, integratedDoc: `エラー: ${err.message}` }));
    } finally {
      setIsGenerating(false);
    }
  };

  // ── エクスポート ──────────────────────────────────────────────────────
  const downloadText = (filename, content) => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })),
      download: filename,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const buildSessionText = (sid) => {
    const cfg = SESSIONS[sid - 1];
    const session = data.sessions[sid];
    const date = session.completedAt ? new Date(session.completedAt).toLocaleDateString('ja-JP') : new Date().toLocaleDateString('ja-JP');
    const bar = '━'.repeat(48);
    let t = `${bar}\nコーチングSEN 自己分析プログラム\nSESSION ${sid}「${cfg.title}」\n${data.userName}  /  ${date}\n${bar}\n\n■ 回答データ\n\n`;
    cfg.phases.forEach((phase, pi) => {
      t += `▶ ${phase.title}\n\n`;
      phase.questions.forEach((q, qi) => {
        t += `Q: ${q}\nA: ${session.answers[`${pi}-${qi}`] || '（未回答）'}\n\n`;
      });
    });
    t += `\n${bar}\n■ ${cfg.cardName}\n${bar}\n\n`;
    t += (session.summary || '').replace(/^#{1,4} /gm, '■ ').replace(/^- /gm, '・');
    return t;
  };

  const buildFinalText = () => {
    const bar = '━'.repeat(48);
    const date = new Date().toLocaleDateString('ja-JP');
    let t = `${bar}\nコーチングSEN 自己分析プログラム\n${data.userName} 分身ドキュメント  /  ${date}\n${bar}\n\n`;
    t += (data.integratedDoc || '').replace(/^#{1,4} /gm, '■ ').replace(/^- /gm, '・');
    t += `\n\n\n${bar}\n■ 全セッション回答データ\n${bar}\n\n`;
    SESSIONS.forEach((cfg, idx) => {
      const id = idx + 1;
      const session = data.sessions[id];
      t += `■ SESSION ${id}「${cfg.title}」\n\n`;
      cfg.phases.forEach((phase, pi) => {
        t += `▶ ${phase.title}\n\n`;
        phase.questions.forEach((q, qi) => {
          t += `Q: ${q}\nA: ${session.answers[`${pi}-${qi}`] || '（未回答）'}\n\n`;
        });
      });
      t += '\n';
    });
    return t;
  };

  const exportFilename = (sid) => {
    const date = (data.sessions[sid]?.completedAt ? new Date(data.sessions[sid].completedAt) : new Date())
      .toISOString().slice(0, 10).replace(/-/g, '');
    return `${data.userName}_SESSION${sid}_${date}.txt`;
  };

  const allDone = data && [1, 2, 3].every(i => data.sessions[i].status === 'completed');

  if (authChecking) return null;

  // ────────────────────────────────────────────────────────────────────
  // LANDING
  // ────────────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <>
        <Head><title>コーチングSEN 自己分析プログラム</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, padding: '24px' }}>
          <div style={{ maxWidth: '460px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '2px', background: C.gold, margin: '0 auto 36px' }} />
            <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.4em', marginBottom: '14px' }}>COACHING SEN</p>
            <h1 style={{ color: C.text, fontSize: '19px', fontWeight: '300', letterSpacing: '0.04em', marginBottom: '16px', lineHeight: '1.4', whiteSpace: 'nowrap' }}>
              コーチングSEN 自己分析プログラム
            </h1>
            <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.9', marginBottom: '40px' }}>
              セッションで、あなたの思考、判断、価値観などを<br />
              深層まで深掘り、言語化するためのプログラム
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px', textAlign: 'left' }}>
              {SESSIONS.map(s => (
                <div key={s.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '14px 18px', background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: '6px' }}>
                  <span style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.15em', whiteSpace: 'nowrap', paddingTop: '2px' }}>SESSION {s.id}</span>
                  <div>
                    <p style={{ color: C.text, fontSize: '13px', margin: '0 0 2px' }}>{s.title}</p>
                    <p style={{ color: C.dim, fontSize: '11px', margin: 0 }}>{s.cardName}</p>
                  </div>
                </div>
              ))}
            </div>
            <input
              type="text" placeholder="あなたの名前を入力してください"
              value={nameInput} onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: `1px solid #333`, borderRadius: '4px', color: C.text, fontSize: '15px', textAlign: 'center', outline: 'none', marginBottom: '14px', boxSizing: 'border-box', fontFamily: C.font }}
            />
            <button onClick={handleStart} style={goldBtn(!!nameInput.trim(), { width: '100%', padding: '16px', fontSize: '14px' })}>
              開始する
            </button>
            <p style={{ color: '#2a2a2a', fontSize: '11px', marginTop: '20px' }}>各セッション 約90分 · 全3回</p>
          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // SESSION SELECT
  // ────────────────────────────────────────────────────────────────────
  if (view === 'session-select') {
    const statusInfo = (s) => {
      if (s.status === 'completed')   return { label: '完了',   color: C.gold };
      if (s.status === 'in_progress') return { label: '進行中', color: C.green };
      return { label: '未開始', color: C.dim };
    };
    return (
      <>
        <Head><title>セッション選択 — コーチングSEN</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '48px 20px' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '6px' }}>COACHING SEN</p>
                <h2 style={{ color: C.text, fontSize: '20px', fontWeight: '300', marginBottom: '4px' }}>{data.userName}</h2>
                <p style={{ color: C.dim, fontSize: '12px', marginBottom: '40px' }}>セッションを選択してください</p>
              </div>
              <button onClick={handleSignOut} style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: '4px', color: C.dim, fontSize: '11px', cursor: 'pointer', fontFamily: C.font, marginTop: '2px' }}>
                ログアウト
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {SESSIONS.map(cfg => {
                const id = cfg.id;
                const session = data.sessions[id];
                const locked = id !== 1 && data.sessions[id - 1].status !== 'completed';
                const info = statusInfo(session);
                const totalQ = getTotalQ(cfg);
                const answeredQ = Object.keys(session.answers).length;
                const progress = Math.round(answeredQ / totalQ * 100);
                return (
                  <div key={id} onClick={() => !locked && handleSelectSession(id)} style={{ padding: '22px 24px', border: `1px solid ${session.status === 'completed' ? '#2a2a2a' : C.border}`, borderRadius: '8px', cursor: locked ? 'not-allowed' : 'pointer', background: session.status === 'completed' ? '#0c0c0c' : C.surface, opacity: locked ? 0.35 : 1, position: 'relative', overflow: 'hidden' }}>
                    {session.status === 'completed' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: session.status === 'in_progress' ? '14px' : 0 }}>
                      <div>
                        <span style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.2em' }}>SESSION {id}</span>
                        <h3 style={{ color: C.text, fontSize: '16px', fontWeight: '300', margin: '5px 0 3px' }}>{cfg.title}</h3>
                        <p style={{ color: C.muted, fontSize: '11px', margin: 0 }}>{cfg.cardName}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '12px' }}>
                        <span style={{ color: info.color, fontSize: '11px' }}>{info.label}</span>
                        {session.status === 'in_progress' && <p style={{ color: C.dim, fontSize: '11px', margin: '3px 0 0' }}>{answeredQ}/{totalQ}問</p>}
                      </div>
                    </div>
                    {session.status === 'in_progress' && (
                      <div style={{ height: '1px', background: '#1a1a1a' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: C.green, transition: 'width 0.4s' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {allDone && (
              <div style={{ marginTop: '32px', padding: '24px', border: `1px solid ${C.gold}33`, borderRadius: '8px', background: '#0c0c0c', textAlign: 'center' }}>
                <p style={{ color: C.muted, fontSize: '12px', marginBottom: '16px', lineHeight: '1.8' }}>全3回のセッションが完了しました。<br />3枚のカードを統合した「分身ドキュメント」を生成します。</p>
                {data.integratedDoc
                  ? <button onClick={() => setView('final-document')} style={goldBtn(true, { width: '100%', padding: '15px' })}>分身ドキュメントを見る</button>
                  : <button onClick={handleGenerate} style={goldBtn(true, { width: '100%', padding: '15px' })}>統合ドキュメントを生成する</button>
                }
              </div>
            )}
            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleReset} style={ghostBtn({ fontSize: '11px', color: '#333', borderColor: '#1a1a1a', padding: '8px 14px' })}>リセット</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // SESSION ACTIVE
  // ────────────────────────────────────────────────────────────────────
  if (view === 'session-active') {
    const cfg = SESSIONS[activeId - 1];
    const session = data.sessions[activeId];
    const current = getNextQ(session, cfg);
    const totalQ = getTotalQ(cfg);
    const answeredQ = Object.keys(session.answers).length;
    const progress = Math.round(answeredQ / totalQ * 100);

    return (
      <>
        <Head><title>SESSION {activeId} — {cfg.title}</title></Head>
        {resumeToast && (
          <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 200, background: '#0f1f0f', border: `1px solid ${C.green}`, borderRadius: '6px', padding: '10px 18px', color: C.green, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>●</span> 前回の続きから再開しました
          </div>
        )}
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '32px 20px 80px' }}>
          <div style={{ maxWidth: '580px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.2em' }}>SESSION {activeId} · {cfg.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {saveStatus === 'saving' && <span style={{ color: '#444', fontSize: '10px' }}>保存中...</span>}
                  {saveStatus === 'saved'  && <span style={{ color: C.green, fontSize: '10px' }}>✓ 保存済み</span>}
                  <span style={{ color: C.dim, fontSize: '11px' }}>{progress}%</span>
                </div>
              </div>
              <div style={{ height: '1px', background: '#1a1a1a' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: C.gold, transition: 'width 0.5s' }} />
              </div>
            </div>

            {current ? (
              <>
                <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.25em', marginBottom: '32px' }}>{current.phase.title}</p>
                <div style={{ paddingLeft: '16px', borderLeft: `2px solid ${C.gold}`, marginBottom: '28px' }}>
                  <p style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '10px' }}>Q{current.qNum} / {current.phaseTotal}</p>
                  <p style={{ color: C.text, fontSize: '18px', lineHeight: '1.8', fontWeight: '300' }}>{current.question}</p>
                </div>
                {followUp && (
                  <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '18px 20px', marginBottom: '24px' }}>
                    <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>深掘り</p>
                    <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.75' }}>{followUp}</p>
                  </div>
                )}
                <textarea
                  value={answer} onChange={e => setAnswer(e.target.value)}
                  placeholder={followUp ? '続けて答えてください...' : '正直に、思ったままを書いてください...'}
                  rows={followUp ? 4 : 6}
                  style={{ width: '100%', padding: '18px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '15px', lineHeight: '1.8', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: C.font, marginBottom: '14px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleSubmit} disabled={!answer.trim() || isLoading} style={goldBtn(!!answer.trim() && !isLoading, { flex: 1 })}>
                    {isLoading ? '分析中...' : '回答する'}
                  </button>
                  {followUp && <button onClick={handleNext} style={ghostBtn({ padding: '15px 20px' })}>次へ</button>}
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 0' }}>
                {isSummarizing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim }}>
                    <span style={{ color: C.gold }}>·</span>
                    <span style={{ fontSize: '13px' }}>カードを生成しています...</span>
                  </div>
                ) : (
                  <button onClick={handleNext} style={goldBtn(true)}>カードを生成する</button>
                )}
              </div>
            )}

            <button onClick={goToSessionSelect} style={ghostBtn({ width: '100%', marginTop: '16px', fontSize: '11px' })}>
              ← セッション選択に戻る（進捗は保存済み）
            </button>
          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // SESSION SUMMARY
  // ────────────────────────────────────────────────────────────────────
  if (view === 'session-summary') {
    const cfg = SESSIONS[activeId - 1];
    const nextPreview = NEXT_PREVIEW[activeId + 1];
    const completedPrev = [1, 2, 3].filter(i => i < activeId && data.sessions[i].status === 'completed');
    const cardContent = summaryText || data.sessions[activeId]?.summary || '';
    const tabs = [
      { label: `今日の発見 — ${cfg.cardName}`, content: cardContent, sessionId: activeId },
      ...completedPrev.map(i => ({ label: `SESSION ${i} — ${SESSIONS[i - 1].cardName}`, content: data.sessions[i].summary, sessionId: i })),
    ];

    return (
      <>
        <Head><title>SESSION {activeId} 完了 — コーチングSEN</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '44px 20px 80px' }}>
          <div style={{ maxWidth: '660px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
              <div style={{ width: '32px', height: '1px', background: C.gold }} />
              <span style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.25em' }}>
                {isSummarizing ? 'GENERATING CARD...' : `SESSION ${activeId} COMPLETE`}
              </span>
            </div>
            <h2 style={{ color: C.text, fontSize: '21px', fontWeight: '300', marginBottom: '6px' }}>{cfg.title}</h2>
            <p style={{ color: C.dim, fontSize: '12px', marginBottom: '32px' }}>{cfg.cardName}</p>

            {tabs.length > 1 && !isSummarizing && (
              <div style={{ display: 'flex', marginBottom: '20px', borderBottom: `1px solid ${C.border}` }}>
                {tabs.map((t, i) => (
                  <button key={i} onClick={() => setSummaryTab(i)} style={{ padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.font, fontSize: '10px', letterSpacing: '0.1em', color: summaryTab === i ? C.gold : C.dim, borderBottom: summaryTab === i ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '32px 36px', minHeight: '240px', marginBottom: '24px' }}>
              {isSummarizing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim, padding: '20px 0' }}>
                  <span style={{ color: C.gold }}>·</span>
                  <span style={{ fontSize: '13px' }}>カードを生成しています... しばらくお待ちください</span>
                </div>
              ) : summaryError ? (
                <div style={{ padding: '20px 0' }}>
                  <p style={{ color: '#e05555', fontSize: '13px', marginBottom: '8px' }}>生成に失敗しました</p>
                  <p style={{ color: C.dim, fontSize: '12px', marginBottom: '16px' }}>{summaryError}</p>
                  <button onClick={() => runCompleteSession(activeId, data.sessions[activeId].answers, data)} style={goldBtn(true)}>再試行する</button>
                </div>
              ) : (
                renderMd(tabs[summaryTab]?.content || '')
              )}
            </div>

            {!isSummarizing && !summaryError && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <button onClick={goToSessionSelect} style={goldBtn(true)}>セッション選択へ</button>
                {allDone && !data.integratedDoc && <button onClick={handleGenerate} style={goldBtn(true, { background: C.text, color: '#0a0a0a' })}>統合ドキュメントを生成する</button>}
                {allDone && data.integratedDoc  && <button onClick={() => setView('final-document')} style={goldBtn(true, { background: C.text, color: '#0a0a0a' })}>分身ドキュメントを見る</button>}
                <button onClick={() => navigator.clipboard?.writeText(tabs[summaryTab]?.content || '')} style={ghostBtn()}>コピー</button>
                <button onClick={() => { const sid = tabs[summaryTab]?.sessionId; if (sid) downloadText(exportFilename(sid), buildSessionText(sid)); }} style={ghostBtn()}>ダウンロード</button>
              </div>
            )}

            {!isSummarizing && !summaryError && nextPreview && (
              <div style={{ padding: '24px', border: `1px solid ${C.border2}`, borderRadius: '8px', background: '#0c0c0c' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '20px', height: '1px', background: C.gold }} />
                  <span style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em' }}>NEXT SESSION</span>
                </div>
                <h4 style={{ color: C.text, fontSize: '15px', fontWeight: '300', margin: '0 0 10px' }}>{nextPreview.title}</h4>
                <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.8', margin: 0 }}>{nextPreview.body}</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // FINAL DOCUMENT
  // ────────────────────────────────────────────────────────────────────
  if (view === 'final-document') {
    const doc = data?.integratedDoc || '';
    return (
      <>
        <Head><title>分身ドキュメント — {data?.userName}</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '48px 20px 80px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
              <div style={{ width: '40px', height: '1px', background: C.gold }} />
              <span style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.25em' }}>
                {isGenerating ? 'GENERATING...' : 'DOCUMENT COMPLETE'}
              </span>
            </div>
            {isGenerating ? (
              <div style={{ padding: '40px 0' }}>
                <p style={{ color: C.muted, fontSize: '14px', marginBottom: '8px' }}>3回のセッションを統合しています...</p>
                <p style={{ color: '#333', fontSize: '12px' }}>約30秒かかります</p>
              </div>
            ) : (
              <>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '40px 44px', marginBottom: '24px' }}>
                  {renderMd(doc)}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigator.clipboard?.writeText(doc)} style={goldBtn(true)}>コピーする</button>
                  <button onClick={() => downloadText(`${data.userName}_分身ドキュメント_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.txt`, buildFinalText())} style={ghostBtn()}>ダウンロード</button>
                  <button onClick={goToSessionSelect} style={ghostBtn()}>← セッション選択へ</button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return null;
}
