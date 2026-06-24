import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

const DRAFT_KEY = 'coaching_sen_draft';
const SESSION_KEY = 'coaching_sen_token';

const parseJwt = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};

const getValidSession = () => {
  try {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return null;
    const payload = parseJwt(token);
    if (!payload) return null;
    if (Date.now() / 1000 >= payload.exp - 60) return null;
    return { token, userId: payload.sub };
  } catch { return null; }
};

export const SESSIONS = [
  {
    id: 1,
    title: '今の自分を解剖する',
    subtitle: '現在地を正直に見る',
    cardName: 'あなたの「動き出す理由」カード',
    goal: '自分が何を大切にしているか、何に引っかかりを感じているかを言語化します。正解はありません。思ったままを書いてください。',
    phases: [
      {
        title: 'モヤモヤの輪郭を取る',
        questions: [
          '今、頭の中にあるモヤモヤや引っかかりを、言葉にならなくていいので思いつくまま全部書いてください。正解はありません。',
          'そのモヤモヤは、「自分自身への疑い」から来ていますか。それとも「周りや環境への不満・比較」から来ていますか。どちらが強いか、直感で答えてください。',
          'そのモヤモヤが完全に消えたとして、あなたは「何ができるようになる」と思いますか。それとも「何者かになれる」と思いますか。',
          'Q1で出てきたモヤモヤの中で、一番「考えたくない」「直視したくない」と感じるものはどれですか。それはなぜだと思いますか。',
        ],
      },
      {
        title: '過去から現在を読む',
        questions: [
          '親に「ありがとう」と直接言ったことはありますか。言えたか、言えなかったか。言えなかったとしたら、なぜですか。',
          '子どもの頃、「本気でやめたいのに続けたこと」はありますか。その時、自分を動かしていたのは何でしたか。例）習い事、部活、家族の期待など',
          'これまでの人生で「続けられると思っていたのにやめたこと」は何ですか。やめた瞬間、自分に何と言い訳しましたか。正直に。',
        ],
      },
      {
        title: '承認と動機の核心',
        questions: [
          '誰かに褒められた時と、自分で「できた」と感じた時、どちらの満足感が長く続きますか。どちらが強いか正直に。',
          '一生誰にも見せられない、評価されない条件でも、今やっていることを続けますか。続けないとしたら、それは何を意味すると思いますか。',
        ],
      },
    ],
  },
  {
    id: 2,
    title: '止まっている理由を特定する',
    subtitle: '動けない本当の理由を見つける',
    cardName: 'あなたの「動き方のクセ」カード',
    goal: '同じパターンを繰り返してしまう理由を掘り下げます。なぜ動けないのか、本音で向き合ってください。',
    phases: [
      {
        title: '本音の孤立',
        questions: [
          '今、自分が本当にやろうとしていることを、全部正直に話せる人間が何人いますか。具体的な人数で答えてください。',
          'その人たちにも話せていないことがあるとしたら、なぜですか。「否定されるから」以外の理由で考えてみてください。',
        ],
      },
      {
        title: '回避パターン',
        questions: [
          '何かから逃げた後、必ずやることがあります。それは何ですか。例）走る、寝る、スマホを見る、食べる、掃除する',
          'その行動をしている時、何を感じていますか。逃げた罪悪感ですか、一時的な安堵ですか、それとも別の何かですか。',
          '今、一番先送りにしていることは何ですか。なぜ今日やらないのか、本当の理由を正直に書いてください。',
        ],
      },
      {
        title: '矛盾を直視する',
        questions: [
          '「〇〇したい」と思っているのに、実際の行動が伴っていないことはありますか。その矛盾に気づいていますか。何が邪魔していると思いますか。',
          'これまでの人生で、今も「逃げた」と後悔している選択が一つあるとしたら、それは何ですか。',
        ],
      },
    ],
  },
  {
    id: 3,
    title: '次の一手を決める',
    subtitle: 'ビジョンではなく、今週の行動まで落とす',
    cardName: 'あなたの「自分軸」カード',
    goal: '3回のセッションで見えてきたことを使って、本物の自分軸を言語化します。ビジョンではなく、今週動ける一手まで落としてください。',
    phases: [
      {
        title: '死ぬ前の後悔',
        questions: [
          '80歳で死ぬ直前、「あの時こうしておけばよかった」と後悔するとしたら、それは何ですか。お金・地位以外で答えてください。',
        ],
      },
      {
        title: '本物の動機',
        questions: [
          '今一番熱量がある「やりたいこと」の、本当の理由は何ですか。誰かに認められたいのか、自分が満たされたいのか、誰かを守りたいのか。正直に。',
          'もしその「やりたいこと」が永遠に誰にも評価されないとわかっていても、やり続けますか。やめるとしたら、それはなぜですか。',
        ],
      },
      {
        title: '軸を言語化する',
        questions: [
          'SESSION 1から今日まで、一番「そうだった」と腑に落ちた瞬間はいつですか。その時何に気づきましたか。',
          'あなたが死ぬ時に、自分の人生を一文で表すとしたら、何と書きますか。',
          '今週、必ずやると決めることを一つだけ書いてください。いつやるか、やらなかった時の言い訳も一緒に書いてください。',
        ],
      },
    ],
  },
];

const NEXT_PREVIEW = {
  2: {
    title: '次回 SESSION 2「止まっている理由を特定する」',
    body: '今日見えてきた「動き出す理由」をベースに、なぜ同じパターンを繰り返してしまうのかを掘り下げます。本音の孤立・回避パターン・矛盾を直視して、「動き方のクセカード」を完成させます。',
  },
  3: {
    title: '次回 SESSION 3「次の一手を決める」',
    body: '今日特定した「動き方のクセ」を踏まえて、本物の自分軸を言語化します。ビジョンを描くだけじゃなく、今週の行動まで落とします。「自分軸カード」と「分身ドキュメント」が完成します。',
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

const defaultSession = () => ({ status: 'not_started', answers: {}, insights: {}, summary: '', completedAt: null, workSubmitted: false });
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
  const [isLoading, setIsLoading]     = useState(false);
  const [isSummarizing, setIsSummarizing]   = useState(false);
  const [summaryText, setSummaryText]       = useState('');
  const [summaryError, setSummaryError]     = useState('');
  const [summaryTab, setSummaryTab]         = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus]     = useState('');
  const [insight, setInsight]           = useState('');
  const [followupDepth, setFollowupDepth] = useState(0);
  const [isFollowingUp, setIsFollowingUp] = useState(false);
  const [reflectText, setReflectText]   = useState('');
  const [onelineText, setOnelineText]   = useState('');
  const [resumeToast, setResumeToast]   = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [workContent, setWorkContent]   = useState(null);
  const [workAnswer, setWorkAnswer]     = useState('');
  const [isGeneratingWork, setIsGeneratingWork] = useState(false);
  const [isSavingWork, setIsSavingWork] = useState(false);
  const [workFeedback, setWorkFeedback] = useState(null);
  const [workFeedbackAnswer, setWorkFeedbackAnswer] = useState('');
  const [workFeedbackLoading, setWorkFeedbackLoading] = useState(false);
  const saveTimer = useRef(null);
  const dbSaveTimer = useRef(null);
  const userIdRef = useRef(null);
  const tokenRef = useRef(null);
  const coachIdRef = useRef(null);
  const followupKeyRef = useRef(null);
  const followupQuestionRef = useRef('');
  const followupIsLastRef = useRef(false);
  const conversationHistoryRef = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const coachParam = params.get('coach');
    if (coachParam) coachIdRef.current = coachParam;

    const session = getValidSession();
    if (!session) { window.location.href = '/login'; return; }
    userIdRef.current = session.userId;
    tokenRef.current = session.token;

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

    fetch('/api/db/load', { headers: { 'Authorization': `Bearer ${session.token}` } })
      .then(r => r.json())
      .then(({ sessionData }) => { if (sessionData) applyData(sessionData); })
      .catch(() => {})
      .finally(() => { setAuthChecking(false); });
  }, []);

  useEffect(() => {
    if (!data || !tokenRef.current) return;
    if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current);
    dbSaveTimer.current = setTimeout(() => {
      fetch('/api/db/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ userName: data.userName, sessionData: data, coachId: coachIdRef.current || null }),
      }).catch(() => {});
    }, 1000);
    return () => { if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current); };
  }, [data]);

  useEffect(() => {
    if (view !== 'session-active' || !activeId || !answer) { setSaveStatus(''); return; }
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

  useEffect(() => {
    if (view !== 'session-active' || !activeId) return;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft?.sessionId === activeId && draft.text) setAnswer(draft.text);
    } catch {}
  }, [view, activeId]);

  const saveData = (updater) => setData(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
  const patchSession = (id, updates) => saveData(prev => ({ ...prev, sessions: { ...prev.sessions, [id]: { ...prev.sessions[id], ...updates } } }));

  const goToSessionSelect = () => {
    saveData(prev => ({ ...prev, activeSessionId: null }));
    conversationHistoryRef.current = [];
    setFollowUp(''); setAnswer(''); setSaveStatus(''); setInsight(''); setFollowupDepth(0); setIsFollowingUp(false); setReflectText(''); setOnelineText('');
    setWorkContent(null); setWorkAnswer('');
    setWorkFeedback(null); setWorkFeedbackAnswer('');
    setView('session-select');
  };

  const handleSignOut = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    window.location.href = '/login';
  };

  const handleReset = async () => {
    if (!window.confirm('データをリセットしますか？全セッションの回答が削除されます。')) return;
    if (tokenRef.current) {
      await fetch('/api/db/delete', { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenRef.current}` } }).catch(() => {});
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setData(null);
    setView('landing');
  };

  const handleStart = () => {
    if (!nameInput.trim()) return;
    setData(defaultData(nameInput.trim()));
    setView('session-select');
  };

  const handleSelectSession = async (id) => {
    setActiveId(id);
    setSummaryTab(0);
    const session = data.sessions[id];
    if (session.status === 'completed') {
      setSummaryText(session.summary);
      setSummaryError('');
      setView('session-summary');
      return;
    }
    conversationHistoryRef.current = [];
    setAnswer(''); setFollowUp(''); setSummaryText(''); setSummaryError(''); setSaveStatus(''); setInsight(''); setFollowupDepth(0); setIsFollowingUp(false); setReflectText(''); setOnelineText('');
    setWorkFeedback(null); setWorkFeedbackAnswer('');
    if (session.status === 'not_started') patchSession(id, { status: 'in_progress' });
    saveData(prev => ({ ...prev, activeSessionId: id }));

    if ((id === 2 || id === 3) && session.status === 'not_started') {
      try {
        const r = await fetch(`/api/db/work?session_no=${id - 1}`, {
          headers: { 'Authorization': `Bearer ${tokenRef.current}` },
        });
        const json = await r.json();
        if (json.work?.work_text) {
          const workSummary = json.work.work_text.split('\n')[0];
          setWorkFeedback({
            workText: json.work.work_text,
            question: `前回「${workSummary}」に取り組まれたんですね。やってみてどうでしたか？`,
            workId: json.work.id,
          });
        }
      } catch {}
    }

    setView('session-active');
  };

  const showReflect = async (savedAnswer) => {
    try {
      const result = await callAPI({ type: 'reflect', answer: savedAnswer });
      if (result && result.trim()) {
        setReflectText(result.trim());
        await new Promise(r => setTimeout(r, 3000));
        setReflectText('');
      }
    } catch {}
  };

  // 困惑ワード検出
  const isConfused = (text) => {
    const t = text.trim();
    return /^(難しい|わからない|わかりません|どう答えれば|どう答えたら|どう書けば|どう書いたら|思いつかない|特にない|ない|なし|わからん|むずかしい|意味がわからない|何を書けば)/.test(t) || t.length < 20 && /難し|わからな|思いつかな|特にな/.test(t);
  };

  const handleSubmit = async () => {
    if (answer.trim().length < 10 || isLoading || isFollowingUp) return;
    const cfg = SESSIONS[activeId - 1];
    const session = data.sessions[activeId];
    const saved = answer;
    setIsLoading(true);
    setIsFollowingUp(true);
    setAnswer('');

    if (followUp) {
      const key = followupKeyRef.current;
      const question = followupQuestionRef.current;
      const newAnswers = { ...session.answers, [key]: saved };
      patchSession(activeId, { answers: newAnswers });

      try {
        const previousContext = activeId > 1
          ? [1, 2].slice(0, activeId - 1).map(i => data.sessions[i]?.summary ? `【SESSION ${i} サマリー】\n${data.sessions[i].summary}` : null).filter(Boolean).join('\n\n')
          : '';
        const fu = await callAPI({
          type: 'followup',
          question,
          answer: saved,
          conversationHistory: conversationHistoryRef.current,
          depth: followupDepth,
          previousContext,
        });
        if (fu && fu !== '十分です') {
          conversationHistoryRef.current = [
            ...conversationHistoryRef.current,
            { role: 'user', content: saved },
            { role: 'assistant', content: fu },
          ];
          setFollowUp(fu);
          setFollowupDepth(prev => prev + 1);
        } else {
          conversationHistoryRef.current = [];
          setFollowUp('');
          setFollowupDepth(0);
          if (fu === '十分です') await showReflect(saved);
          if (followupIsLastRef.current) await runCompleteSession(activeId, newAnswers, data);
        }
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 2500);
        setFollowUp('');
        setFollowupDepth(0);
      }
      setIsFollowingUp(false);
      setIsLoading(false);
    } else {
      const current = getNextQ(session, cfg);
      if (!current) { setIsFollowingUp(false); setIsLoading(false); return; }
      const key = `${current.phaseIdx}-${current.qIdx}`;
      const newAnswers = { ...session.answers, [key]: saved };
      const isLast = Object.keys(newAnswers).length >= getTotalQ(cfg);
      const newInsights = { ...(session.insights || {}), [key]: insight.trim() };
      patchSession(activeId, { answers: newAnswers, insights: newInsights });
      setInsight('');
      followupKeyRef.current = key;
      followupQuestionRef.current = current.question;
      followupIsLastRef.current = isLast;
      conversationHistoryRef.current = [];
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);

      try {
        const confused = isConfused(saved);
        const previousContext = activeId > 1
          ? [1, 2].slice(0, activeId - 1).map(i => data.sessions[i]?.summary ? `【SESSION ${i} サマリー】\n${data.sessions[i].summary}` : null).filter(Boolean).join('\n\n')
          : '';
        const fu = await callAPI(
          confused
            ? { type: 'reframe', question: current.question, answer: saved }
            : {
                type: 'followup',
                question: current.question,
                answer: saved,
                conversationHistory: [],
                depth: 0,
                previousContext,
              }
        );
        if (fu && fu !== '十分です') {
          conversationHistoryRef.current = confused
            ? [{ role: 'user', content: `質問：${current.question}\n${saved}` }, { role: 'assistant', content: fu }]
            : [{ role: 'user', content: `質問：${current.question}\n${saved}` }, { role: 'assistant', content: fu }];
          setFollowUp(fu);
          setFollowupDepth(1);
        } else {
          setFollowUp('');
          setFollowupDepth(0);
          if (fu === '十分です') await showReflect(saved);
          if (isLast) await runCompleteSession(activeId, newAnswers, data);
        }
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 2500);
      }
      setIsFollowingUp(false);
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    setFollowupDepth(0);
    const cfg = SESSIONS[activeId - 1];
    const answers = data.sessions[activeId].answers;
    if (Object.keys(answers).length >= getTotalQ(cfg)) await runCompleteSession(activeId, answers, data);
  };

  const runCompleteSession = async (sessionId, answers, currentData) => {
    saveData(prev => ({ ...prev, activeSessionId: null }));
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setSummaryText(''); setSummaryError(''); setOnelineText(''); setIsSummarizing(true); setView('session-summary');
    try {
      const cfg = SESSIONS[sessionId - 1];
      const allAnswers = cfg.phases.map((phase, pi) => ({
        phase: phase.title,
        qa: phase.questions.map((q, qi) => ({ question: q, answer: answers[`${pi}-${qi}`] || '未回答' })),
      }));
      const previousSummaries = [];
      for (let i = 1; i < sessionId; i++) {
        if (currentData.sessions[i]?.summary) previousSummaries.push({ sessionNumber: i, title: SESSIONS[i - 1].title, summary: currentData.sessions[i].summary });
      }
      callAPI({ type: 'onelineinsight', allAnswers }).then(text => { if (text) setOnelineText(text); }).catch(() => {});
      const summary = await callAPI({ type: 'summary', sessionNumber: sessionId, userName: currentData.userName, allAnswers, previousSummaries });
      setSummaryText(summary);
      saveData(prev => ({
        ...prev,
        activeSessionId: null,
        sessions: {
          ...prev.sessions,
          [sessionId]: { ...prev.sessions[sessionId], status: 'completed', answers, summary, completedAt: new Date().toISOString() }
        }
      }));
    } catch (err) {
      setSummaryError(err.message || 'エラーが発生しました');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setView('final-document');
    try {
      const allSessionData = SESSIONS.map((cfg, idx) => {
        const id = idx + 1;
        const s = data.sessions[id];
        return { sessionNumber: id, title: cfg.title, cardName: cfg.cardName, summary: s.summary, answers: cfg.phases.map((phase, pi) => ({ phase: phase.title, qa: phase.questions.map((q, qi) => ({ question: q, answer: s.answers[`${pi}-${qi}`] || '未回答' })) })) };
      });
      const doc = await callAPI({ type: 'generate', userName: data.userName, allSessionData });
      saveData(prev => ({ ...prev, integratedDoc: doc }));
    } catch (err) {
      saveData(prev => ({ ...prev, integratedDoc: `エラー: ${err.message}` }));
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadText = (filename, content) => {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildSessionText = (sid) => {
    const cfg = SESSIONS[sid - 1];
    const session = data.sessions[sid];
    const date = session.completedAt ? new Date(session.completedAt).toLocaleDateString('ja-JP') : new Date().toLocaleDateString('ja-JP');
    const bar = '━'.repeat(48);
    let t = `${bar}\nコーチングSEN 自己分析プログラム\nSESSION ${sid}「${cfg.title}」\n${data.userName}  /  ${date}\n${bar}\n\n■ 回答データ\n\n`;
    cfg.phases.forEach((phase, pi) => { t += `▶ ${phase.title}\n\n`; phase.questions.forEach((q, qi) => { const k = `${pi}-${qi}`; t += `Q: ${q}\nA: ${session.answers[k] || '（未回答）'}\n`; if (session.insights?.[k]) t += `気づき: ${session.insights[k]}\n`; t += '\n'; }); });
    t += `\n${bar}\n■ ${cfg.cardName}\n${bar}\n\n`;
    t += (session.summary || '').replace(/^#{1,4} /gm, '■ ').replace(/^- /gm, '・');
    return t;
  };

  const buildFinalText = () => {
    const bar = '━'.repeat(48);
    let t = `${bar}\nコーチングSEN\n${data.userName} 分身ドキュメント  /  ${new Date().toLocaleDateString('ja-JP')}\n${bar}\n\n`;
    t += (data.integratedDoc || '').replace(/^#{1,4} /gm, '■ ').replace(/^- /gm, '・');
    t += `\n\n\n${bar}\n■ 全セッション回答データ\n${bar}\n\n`;
    SESSIONS.forEach((cfg, idx) => {
      const id = idx + 1; const session = data.sessions[id];
      t += `■ SESSION ${id}「${cfg.title}」\n\n`;
      cfg.phases.forEach((phase, pi) => { t += `▶ ${phase.title}\n\n`; phase.questions.forEach((q, qi) => { const k = `${pi}-${qi}`; t += `Q: ${q}\nA: ${session.answers[k] || '（未回答）'}\n`; if (session.insights?.[k]) t += `気づき: ${session.insights[k]}\n`; t += '\n'; }); });
      t += '\n';
    });
    return t;
  };

  const exportFilename = (sid) => `${data.userName}_SESSION${sid}_${(data.sessions[sid]?.completedAt ? new Date(data.sessions[sid].completedAt) : new Date()).toISOString().slice(0,10).replace(/-/g,'')}.txt`;

  const handleGoToWork = async (sessionId) => {
    setWorkContent(null); setWorkAnswer(''); setIsGeneratingWork(true);
    setView('session-work');
    try {
      const summary = data.sessions[sessionId].summary;
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'work', sessionNumber: sessionId, summary }),
      });
      const json = await res.json();
      setWorkContent(json.work || null);
    } catch {}
    setIsGeneratingWork(false);
  };

  const handleSaveWork = async (sessionId) => {
    if (!workContent || isSavingWork) return;
    setIsSavingWork(true);
    const workText = [workContent.work, workContent.reason, workContent.timing, workContent.record].filter(Boolean).join('\n');
    try {
      await fetch('/api/db/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ session_no: sessionId, work_text: workText, response_text: workAnswer.trim() || null }),
      });
      patchSession(sessionId, { workSubmitted: true });
      setWorkContent(null); setWorkAnswer('');
      setView('session-select');
    } catch {}
    setIsSavingWork(false);
  };

  const allDone = data && [1,2,3].every(i => data.sessions[i].status === 'completed');

  if (authChecking) return null;

  if (view === 'landing') return (
    <>
      <Head><title>コーチングSEN 自己分析プログラム</title></Head>
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, padding: '24px' }}>
        <div style={{ maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '2px', background: C.gold, margin: '0 auto 36px' }} />
          <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.4em', marginBottom: '14px' }}>COACHING SEN</p>
          <h1 style={{ color: C.text, fontSize: '19px', fontWeight: '300', letterSpacing: '0.04em', marginBottom: '16px', lineHeight: '1.4' }}>コーチングSEN 自己分析プログラム</h1>
          <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.9', marginBottom: '40px' }}>3回のセッションで、自分が動く理由・止まる理由・<br />これからの軸を、自分の言葉で手に入れる。</p>
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
          <input type="text" placeholder="あなたの名前を入力してください" value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStart()} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: `1px solid #333`, borderRadius: '4px', color: C.text, fontSize: '15px', textAlign: 'center', outline: 'none', marginBottom: '14px', boxSizing: 'border-box', fontFamily: C.font }} />
          <button onClick={handleStart} style={goldBtn(!!nameInput.trim(), { width: '100%', padding: '16px', fontSize: '14px' })}>開始する</button>
          <p style={{ color: '#2a2a2a', fontSize: '11px', marginTop: '20px' }}>各セッション 約45〜60分 · 全3回</p>
        </div>
      </div>
    </>
  );

  if (view === 'session-select') {
    const statusInfo = (s) => {
      if (s.status === 'completed') return { label: '完了', color: C.gold };
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
              <button onClick={handleSignOut} style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: '4px', color: C.dim, fontSize: '11px', cursor: 'pointer', fontFamily: C.font }}>ログアウト</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {SESSIONS.map(cfg => {
                const id = cfg.id;
                const session = data.sessions[id];
                const prevSession = data.sessions[id - 1];
                const locked = id !== 1 && !(prevSession.status === 'completed' && prevSession.workSubmitted);
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
                  : <button onClick={handleGenerate} style={goldBtn(true, { width: '100%', padding: '15px' })}>統合ドキュメントを生成する</button>}
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

  if (view === 'session-active') {
    const cfg = SESSIONS[activeId - 1];
    const session = data.sessions[activeId];
    const current = getNextQ(session, cfg);
    const totalQ = getTotalQ(cfg);
    const answeredQ = Object.keys(session.answers).length;
    const progress = Math.round(answeredQ / totalQ * 100);
    return (
      <>
        <Head>
          <title>SESSION {activeId} — {cfg.title}</title>
          <style>{`@keyframes reflectIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </Head>
        {resumeToast && <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 200, background: '#0f1f0f', border: `1px solid ${C.green}`, borderRadius: '6px', padding: '10px 18px', color: C.green, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>●</span> 前回の続きから再開しました</div>}
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '32px 20px 80px' }}>
          <div style={{ maxWidth: '580px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.2em' }}>SESSION {activeId} · {cfg.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {saveStatus === 'saving' && <span style={{ color: '#444', fontSize: '10px' }}>保存中...</span>}
                  {saveStatus === 'saved' && <span style={{ color: C.green, fontSize: '10px' }}>✓ 保存済み</span>}
                  {saveStatus === 'error' && <span style={{ color: '#e05555', fontSize: '10px' }}>通信エラー</span>}
                  <span style={{ color: C.dim, fontSize: '11px' }}>{progress}%</span>
                </div>
              </div>
              <div style={{ height: '1px', background: '#1a1a1a' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: C.gold, transition: 'width 0.5s' }} />
              </div>
            </div>
            {workFeedback && answeredQ === 0 ? (
              <div>
                <div style={{ background: '#0d1a0d', border: `1px solid ${C.green}33`, borderRadius: '8px', padding: '18px 22px', marginBottom: '28px' }}>
                  <p style={{ color: C.green, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>前回のワーク確認</p>
                  <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>{workFeedback.workText}</p>
                </div>
                <div style={{ paddingLeft: '16px', borderLeft: `2px solid ${C.green}`, marginBottom: '28px' }}>
                  <p style={{ color: C.text, fontSize: '17px', lineHeight: '1.8', fontWeight: '300' }}>{workFeedback.question}</p>
                </div>
                <textarea
                  value={workFeedbackAnswer}
                  onChange={e => setWorkFeedbackAnswer(e.target.value)}
                  placeholder="正直に書いてください..."
                  rows={4}
                  style={{ width: '100%', padding: '18px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '15px', lineHeight: '1.8', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: C.font, marginBottom: '12px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={async () => {
                      setWorkFeedbackLoading(true);
                      try {
                        await fetch('/api/db/work', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRef.current}` },
                          body: JSON.stringify({ session_no: activeId - 1, work_text: workFeedback.workText, response_text: workFeedbackAnswer.trim() || null }),
                        });
                      } catch {}
                      setWorkFeedback(null); setWorkFeedbackAnswer('');
                      setWorkFeedbackLoading(false);
                    }}
                    disabled={workFeedbackLoading || workFeedbackAnswer.trim().length < 5}
                    style={goldBtn(!workFeedbackLoading && workFeedbackAnswer.trim().length >= 5, { flex: 1 })}
                  >{workFeedbackLoading ? '保存中...' : '答えて次へ進む'}</button>
                  <button
                    onClick={() => { setWorkFeedback(null); setWorkFeedbackAnswer(''); }}
                    style={ghostBtn()}
                  >スキップ</button>
                </div>
              </div>
            ) : current ? (
              <>
                {reflectText ? (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <p style={{ color: C.gold, fontSize: '20px', fontWeight: '300', lineHeight: '1.9', letterSpacing: '0.02em', animation: 'reflectIn 0.7s ease forwards' }}>
                      {reflectText}
                    </p>
                  </div>
                ) : (
                  <>
                    {!followUp && !isFollowingUp && (
                      <>
                        <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.25em', marginBottom: '32px' }}>{current.phase.title}</p>
                        {answeredQ === 0 && cfg.goal && (
                          <div style={{ background: '#0d0d0d', border: `1px solid ${C.border2}`, borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' }}>
                            <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>このセッションについて</p>
                            <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.8', margin: 0 }}>{cfg.goal}</p>
                          </div>
                        )}
                        <div style={{ paddingLeft: '16px', borderLeft: `2px solid ${C.gold}`, marginBottom: '28px' }}>
                          <p style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '10px' }}>Q{current.qNum} / {current.phaseTotal}</p>
                          <p style={{ color: C.text, fontSize: '18px', lineHeight: '1.8', fontWeight: '300' }}>{current.question}</p>
                        </div>
                      </>
                    )}
                    {isFollowingUp && !followUp && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim, padding: '12px 0 28px' }}>
                        <span style={{ color: C.gold }}>·</span>
                        <span style={{ fontSize: '13px' }}>読んでいます...</span>
                      </div>
                    )}
                    {followUp && (
                      <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '18px 20px', marginBottom: '24px' }}>
                        <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '4px' }}>もう少しだけ</p>
                        <p style={{ color: C.muted, fontSize: '11px', lineHeight: '1.6', marginBottom: '12px' }}>その言葉の奥にあるものを知りたいので、もう少し聞かせてください。</p>
                        <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.75' }}>{followUp}</p>
                      </div>
                    )}
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder={followUp ? '続けて書いてください...' : '正直に、思ったままを書いてください...'} rows={followUp ? 4 : 6} style={{ width: '100%', padding: '18px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '15px', lineHeight: '1.8', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: C.font, marginBottom: '8px' }} />
                    {!followUp && !isFollowingUp && (
                      <div style={{ marginBottom: '14px' }}>
                        <p style={{ color: C.dim, fontSize: '11px', letterSpacing: '0.08em', margin: '0 0 6px' }}>この質問で気づいたことを一文で（任意）</p>
                        <input type="text" value={insight} onChange={e => setInsight(e.target.value)} placeholder="気づいた一文を..." style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.muted, fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: C.font }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={handleSubmit} disabled={answer.trim().length < 10 || isLoading} style={goldBtn(answer.trim().length >= 10 && !isLoading, { flex: 1 })}>{isLoading ? '読んでいます...' : '回答する'}</button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ padding: '40px 0' }}>
                {isSummarizing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim }}><span style={{ color: C.gold }}>·</span><span style={{ fontSize: '13px' }}>カードを作っています...</span></div>
                  : <button onClick={handleNext} style={goldBtn(true)}>カードを生成する</button>}
              </div>
            )}
            {!reflectText && (
              <button
                onClick={goToSessionSelect}
                disabled={isLoading || isFollowingUp}
                style={ghostBtn({ width: '100%', marginTop: '16px', fontSize: '11px', ...(isLoading || isFollowingUp ? { opacity: 0.3, cursor: 'not-allowed' } : {}) })}
              >← セッション選択に戻る（進捗は保存済み）</button>
            )}
          </div>
        </div>
      </>
    );
  }

  if (view === 'session-summary') {
    const cfg = SESSIONS[activeId - 1];
    const nextPreview = NEXT_PREVIEW[activeId + 1];
    const completedPrev = [1,2,3].filter(i => i < activeId && data.sessions[i].status === 'completed');
    const cardContent = summaryText || data.sessions[activeId]?.summary || '';
    const tabs = [{ label: `今日の発見 — ${cfg.cardName}`, content: cardContent, sessionId: activeId }, ...completedPrev.map(i => ({ label: `SESSION ${i} — ${SESSIONS[i-1].cardName}`, content: data.sessions[i].summary, sessionId: i }))];
    return (
      <>
        <Head><title>SESSION {activeId} 完了 — コーチングSEN</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '44px 20px 80px' }}>
          <div style={{ maxWidth: '660px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
              <div style={{ width: '32px', height: '1px', background: C.gold }} />
              <span style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.25em' }}>{isSummarizing ? 'GENERATING...' : `SESSION ${activeId} COMPLETE`}</span>
            </div>
            <h2 style={{ color: C.text, fontSize: '21px', fontWeight: '300', marginBottom: '6px' }}>{cfg.title}</h2>
            <p style={{ color: C.dim, fontSize: '12px', marginBottom: '32px' }}>{cfg.cardName}</p>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '32px 36px', minHeight: '240px', marginBottom: '24px' }}>
              {isSummarizing
                ? (onelineText
                    ? <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p style={{ color: C.gold, fontSize: '24px', fontWeight: '300', lineHeight: '1.9', margin: '0 0 24px', letterSpacing: '0.01em' }}>{onelineText}</p>
                        <p style={{ color: C.dim, fontSize: '11px', letterSpacing: '0.15em' }}>カードを作っています...</p>
                      </div>
                    : <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim, padding: '20px 0' }}><span style={{ color: C.gold }}>·</span><span style={{ fontSize: '13px' }}>カードを作っています... しばらくお待ちください</span></div>)
                : summaryError
                  ? <div style={{ padding: '20px 0' }}>
                      <p style={{ color: '#e05555', fontSize: '13px', marginBottom: '8px' }}>生成に失敗しました</p>
                      <p style={{ color: C.dim, fontSize: '12px', marginBottom: '16px' }}>{summaryError}</p>
                      <button onClick={() => runCompleteSession(activeId, data.sessions[activeId].answers, data)} style={goldBtn(true)}>もう一度試す</button>
                    </div>
                  : <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ width: '32px', height: '1px', background: C.gold, margin: '0 auto 24px' }} />
                      <p style={{ color: C.text, fontSize: '17px', fontWeight: '300', lineHeight: '1.8', marginBottom: '10px' }}>コーチに送りました。</p>
                      <p style={{ color: C.muted, fontSize: '13px' }}>セッションをお待ちください。</p>
                    </div>}
            </div>
            {!isSummarizing && !summaryError && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {activeId < 3 && !data.sessions[activeId]?.workSubmitted
                  ? <button onClick={() => handleGoToWork(activeId)} style={goldBtn(true)}>次回までのワークを確認する →</button>
                  : <button onClick={goToSessionSelect} style={goldBtn(true)}>セッション選択へ</button>}
                {activeId === 3 && (
                  <button onClick={goToSessionSelect} style={goldBtn(true)}>セッション選択へ</button>
                )}
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

  if (view === 'session-work') {
    return (
      <>
        <Head><title>次回までのワーク — SESSION {activeId}</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '48px 20px 80px' }}>
          <div style={{ maxWidth: '580px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
              <div style={{ width: '32px', height: '1px', background: C.gold }} />
              <span style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.25em' }}>NEXT SESSION WORK</span>
            </div>
            <h2 style={{ color: C.text, fontSize: '20px', fontWeight: '300', marginBottom: '8px' }}>次回までのワーク</h2>
            <p style={{ color: C.dim, fontSize: '12px', marginBottom: '32px' }}>SESSION {activeId}の気づきをもとに、次のセッションまで取り組むことです。</p>
            {isGeneratingWork ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim, padding: '40px 0' }}>
                <span style={{ color: C.gold }}>·</span>
                <span style={{ fontSize: '13px' }}>ワークを設計しています...</span>
              </div>
            ) : workContent ? (
              <>
                <div style={{ background: C.surface, border: `1px solid ${C.gold}33`, borderRadius: '8px', padding: '28px 32px', marginBottom: '28px' }}>
                  <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '16px' }}>取り組むこと</p>
                  <p style={{ color: C.text, fontSize: '17px', lineHeight: '1.8', fontWeight: '300', marginBottom: '20px' }}>{workContent.work}</p>
                  {workContent.reason && (
                    <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.7', marginBottom: '10px' }}>
                      <span style={{ color: C.dim, fontSize: '11px' }}>なぜこれか　</span>{workContent.reason}
                    </p>
                  )}
                  {workContent.timing && (
                    <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.7', marginBottom: '10px' }}>
                      <span style={{ color: C.dim, fontSize: '11px' }}>いつやるか　</span>{workContent.timing}
                    </p>
                  )}
                  {workContent.record && (
                    <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.7' }}>
                      <span style={{ color: C.dim, fontSize: '11px' }}>記録方法　　</span>{workContent.record}
                    </p>
                  )}
                </div>
                <p style={{ color: C.dim, fontSize: '12px', marginBottom: '10px' }}>取り組みに対して一言（任意）</p>
                <textarea
                  value={workAnswer}
                  onChange={e => setWorkAnswer(e.target.value)}
                  placeholder="やります / 正直きつい / でもやってみます... など"
                  rows={3}
                  style={{ width: '100%', padding: '16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '14px', lineHeight: '1.8', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: C.font, marginBottom: '20px' }}
                />
                <button
                  onClick={() => handleSaveWork(activeId)}
                  disabled={isSavingWork}
                  style={goldBtn(!isSavingWork, { width: '100%', padding: '16px', fontSize: '14px' })}
                >{isSavingWork ? '保存中...' : 'コミットして次のセッションへ進む'}</button>
              </>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <p style={{ color: '#e05555', fontSize: '13px', marginBottom: '16px' }}>生成に失敗しました</p>
                <button onClick={() => handleGoToWork(activeId)} style={goldBtn(true)}>もう一度試す</button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  if (view === 'final-document') {
    const doc = data?.integratedDoc || '';
    return (
      <>
        <Head><title>分身ドキュメント — {data?.userName}</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '48px 20px 80px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
              <div style={{ width: '40px', height: '1px', background: C.gold }} />
              <span style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.25em' }}>{isGenerating ? 'GENERATING...' : 'DOCUMENT COMPLETE'}</span>
            </div>
            {isGenerating ? (
              <div style={{ padding: '40px 0' }}>
                <p style={{ color: C.muted, fontSize: '14px', marginBottom: '8px' }}>3回のセッションをまとめています...</p>
                <p style={{ color: '#333', fontSize: '12px' }}>約30秒かかります</p>
              </div>
            ) : (
              <>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '40px 44px', marginBottom: '24px' }}>
                  {renderMd(doc)}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigator.clipboard?.writeText(doc)} style={goldBtn(true)}>コピーする</button>
                  <button onClick={() => downloadText(`${data.userName}_分身ドキュメント_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.txt`, buildFinalText())} style={ghostBtn()}>ダウンロード</button>
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
