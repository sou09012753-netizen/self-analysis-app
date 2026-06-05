import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

const STORAGE_KEY = 'self_analysis_v1';

const SESSIONS = [
  {
    id: 1,
    title: "自分の動機の根っこ",
    subtitle: "家庭・幼少期・学生時代",
    description: "行動パターンの根拠を掘り出す",
    phases: [
      {
        title: "家庭環境",
        questions: [
          "家族構成と、家の雰囲気を一言で教えてください。父、母、兄弟の構成は？",
          "父親はどんな人でしたか？子どもの頃、どう見ていましたか？",
          "母親はどんな人でしたか？あなたとの関係は？",
          "家の中で一番怖かった、嫌だった経験は何ですか？",
          "褒められた記憶はありますか？どんな時に、誰に褒められましたか？",
          "お金について、家庭の中でどんなメッセージを受け取りましたか？",
        ],
      },
      {
        title: "小学校〜中学校",
        questions: [
          "小学校時代、クラスの中でどんな存在でしたか？",
          "夢中になったこと、熱中したことは何ですか？",
          "初めて本気で悔しかった経験は何ですか？",
          "初めて本気で認められた、嬉しかった経験は？",
          "中学で大きな転機や挫折はありましたか？その時どうしましたか？",
        ],
      },
      {
        title: "高校〜20歳",
        questions: [
          "高校時代、自分をどう見ていましたか？周りにはどう見えていたと思いますか？",
          "人生で初めて「自分から動いた」瞬間はいつですか？",
          "周りにどう見られたかったですか？その裏にある本音は？",
          "自分を偽ったり、本音を隠した経験はありますか？正直に。",
          "人生で一番孤独だった時期はいつですか？その時、何をしていましたか？",
          "初めてお金を稼いだ経験は？その時、何を感じましたか？",
          "20歳の時点で、自分のどこに自信があり、どこに最も不安を感じていましたか？",
        ],
      },
    ],
  },
  {
    id: 2,
    title: "強み・弱み・失敗パターン",
    subtitle: "挫折・どん底・現在の仕事",
    description: "本当の強さと弱さの核心",
    phases: [
      {
        title: "最大の失敗・どん底",
        questions: [
          "人生で一番しんどかった時期はいつですか？具体的に何が起きていましたか？",
          "その時、誰かに話しましたか？それとも1人で抱えましたか？",
          "消えたい、死にたいという気持ちはありましたか？正直に。",
          "その時期を乗り越えられたのはなぜだと思いますか？",
          "今でも同じ失敗パターンを繰り返していると感じることはありますか？",
        ],
      },
      {
        title: "現在の仕事・強み・弱み",
        questions: [
          "今の仕事で一番得意なことは何ですか？",
          "今の仕事で一番苦手なことは？正直に。",
          "うまくいく時とうまくいかない時、何が違いますか？",
          "熱量が下がる時はどんな時ですか？その時、どうしますか？",
          "自分の一番の弱点を1つだけ言うとしたら何ですか？",
        ],
      },
      {
        title: "お金と行動パターン",
        questions: [
          "お金が入った時、正直に何を考え、どう行動しますか？",
          "お金に余裕が出た時、自分の中に何が起きますか？",
          "逃げ込む場所や習慣はありますか？正直に答えてください。",
          "「本物」を見た瞬間、あなたに何が起きますか？",
          "これまでの人生で最も輝いた瞬間を具体的に教えてください。",
          "最も恥ずかしかった、後悔している行動は何ですか？",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "本物の自分軸",
    subtitle: "人間関係・ゴール・ビジョン",
    description: "真の動機に基づいた自分軸の言語化",
    phases: [
      {
        title: "人間関係・孤独",
        questions: [
          "今、心から信頼できる人は何人いますか？その人のどこを信頼していますか？",
          "人間関係で繰り返す失敗パターンはありますか？",
          "孤独を感じた時、どうやって埋めますか？",
          "大切な人に本音を話せていますか？話せない理由は何ですか？",
          "あなたにとって「愛されている」とはどんな状態ですか？",
          "相手をコントロールしたくなる衝動はいつ湧きますか？",
        ],
      },
      {
        title: "ゴールとビジョン",
        questions: [
          "3年後、どんな状態でいたいですか？数字と状態で具体的に教えてください。",
          "そのゴールの本当の理由は何ですか？お金のため？認められたいため？誰かを守りたい？",
          "絶対に譲れないことは何ですか？",
          "絶対にやりたくないことは何ですか？",
          "死ぬ時に「やっておけばよかった」と思いたくないことは何ですか？",
        ],
      },
      {
        title: "自分軸の言語化",
        questions: [
          "あなたが行動する最大の燃料は何ですか？",
          "あなたが止まる時の一番の原因は何ですか？",
          "あなたにとって「成功」の定義を一言で言うと？",
          "あなたが他者に最も提供できる価値は何ですか？",
          "今の自分に一番必要なものは何だと思いますか？",
        ],
      },
    ],
  },
];

const defaultSession = () => ({ status: 'not_started', answers: {}, summary: '', completedAt: null });
const defaultData = (userName = '') => ({
  userName,
  sessions: { 1: defaultSession(), 2: defaultSession(), 3: defaultSession() },
  integratedDoc: '',
});

const getTotalQ = (sessionConfig) => sessionConfig.phases.reduce((a, p) => a + p.questions.length, 0);

const getNextQ = (session, sessionConfig) => {
  for (let pi = 0; pi < sessionConfig.phases.length; pi++) {
    const phase = sessionConfig.phases[pi];
    for (let qi = 0; qi < phase.questions.length; qi++) {
      if (!session.answers[`${pi}-${qi}`]) {
        return {
          phaseIdx: pi, qIdx: qi, phase,
          question: phase.questions[qi],
          qNum: qi + 1,
          phaseTotal: phase.questions.length,
          isLast: pi === sessionConfig.phases.length - 1 && qi === phase.questions.length - 1,
        };
      }
    }
  }
  return null;
};

const C = {
  bg: '#0a0a0a', gold: '#c9a84c', text: '#f5f0e8',
  muted: '#888', dim: '#555', surface: '#111',
  border: '#1e1e1e', border2: '#222',
  font: "'Noto Serif JP', Georgia, serif",
};

const btn = (active, extra = {}) => ({
  padding: '16px 24px', border: 'none', borderRadius: '4px', cursor: active ? 'pointer' : 'not-allowed',
  fontSize: '14px', letterSpacing: '0.12em', transition: 'all 0.3s', fontFamily: C.font,
  background: active ? C.gold : '#1a1a1a', color: active ? '#0a0a0a' : C.dim,
  opacity: active ? 1 : 0.6, ...extra,
});

const outlineBtn = (extra = {}) => ({
  padding: '13px 24px', background: 'transparent', border: `1px solid ${C.border2}`,
  borderRadius: '4px', color: C.dim, fontSize: '13px', letterSpacing: '0.1em',
  cursor: 'pointer', fontFamily: C.font, ...extra,
});

export default function SelfAnalysisApp() {
  const [view, setView] = useState('landing');
  const [data, setData] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [convHistory, setConvHistory] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [currentSummary, setCurrentSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
        if (parsed.userName) setView('session-select');
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (data) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    }
  }, [data]);

  const patchSession = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      sessions: { ...prev.sessions, [id]: { ...prev.sessions[id], ...updates } },
    }));
  }, []);

  const handleStart = () => {
    if (!nameInput.trim()) return;
    const d = defaultData(nameInput.trim());
    setData(d);
    setView('session-select');
  };

  const handleSelectSession = (id) => {
    const session = data.sessions[id];
    setActiveId(id);
    setTab(0);
    if (session.status === 'completed') {
      setCurrentSummary(session.summary);
      setView('session-summary');
      return;
    }
    setAnswer(''); setFollowUp(''); setConvHistory([]); setCurrentSummary('');
    if (session.status === 'not_started') patchSession(id, { status: 'in_progress' });
    setView('session-active');
  };

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
    setIsLoading(true);
    setAnswer('');

    let fu = '';
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'followup', question: current.question, answer: saved, conversationHistory: convHistory }),
      });
      const result = await res.json();
      fu = result.text || '';
      if (fu && fu !== '十分です') {
        setFollowUp(fu);
        setConvHistory(prev => [
          ...prev,
          { role: 'user', content: `質問：${current.question}\n回答：${saved}` },
          { role: 'assistant', content: fu },
        ]);
      }
    } catch (e) {}

    setIsLoading(false);

    if (isLast && (!fu || fu === '十分です')) {
      setFollowUp('');
      await completeSession(newAnswers);
    }
  };

  const handleNext = async () => {
    setFollowUp(''); setConvHistory([]); setAnswer('');
    const cfg = SESSIONS[activeId - 1];
    const answers = data.sessions[activeId].answers;
    if (Object.keys(answers).length >= getTotalQ(cfg)) {
      await completeSession(answers);
    }
  };

  const completeSession = async (answers) => {
    setIsSummarizing(true);
    setView('session-summary');

    const cfg = SESSIONS[activeId - 1];
    const allAnswers = cfg.phases.map((phase, pi) => ({
      phase: phase.title,
      qa: phase.questions.map((q, qi) => ({ question: q, answer: answers[`${pi}-${qi}`] || '未回答' })),
    }));

    const previousSummaries = [];
    for (let i = 1; i < activeId; i++) {
      if (data.sessions[i].summary) {
        previousSummaries.push({ sessionNumber: i, title: SESSIONS[i - 1].title, summary: data.sessions[i].summary });
      }
    }

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'summary', sessionNumber: activeId, sessionTitle: cfg.title, userName: data.userName, allAnswers, previousSummaries }),
      });
      const result = await res.json();
      const summary = result.text || '';
      setCurrentSummary(summary);
      setData(prev => ({
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeId]: { ...prev.sessions[activeId], status: 'completed', answers, summary, completedAt: new Date().toISOString() },
        },
      }));
    } catch (e) {
      setCurrentSummary('サマリーの生成に失敗しました。');
      patchSession(activeId, { status: 'completed', answers, completedAt: new Date().toISOString() });
    }

    setIsSummarizing(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setView('final-document');

    const allSessionData = SESSIONS.map((cfg, idx) => {
      const id = idx + 1;
      const s = data.sessions[id];
      return {
        sessionNumber: id, title: cfg.title, summary: s.summary,
        answers: cfg.phases.map((phase, pi) => ({
          phase: phase.title,
          qa: phase.questions.map((q, qi) => ({ question: q, answer: s.answers[`${pi}-${qi}`] || '未回答' })),
        })),
      };
    });

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'generate', userName: data.userName, allSessionData }),
      });
      const result = await res.json();
      setData(prev => ({ ...prev, integratedDoc: result.text || '' }));
    } catch (e) {
      setData(prev => ({ ...prev, integratedDoc: 'エラーが発生しました。' }));
    }

    setIsGenerating(false);
  };

  const allDone = data && [1, 2, 3].every(i => data.sessions[i].status === 'completed');

  // ── LANDING ──────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <>
        <Head><title>分身作成プログラム</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, padding: '20px' }}>
          <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '2px', background: C.gold, margin: '0 auto 40px' }} />
            <h1 style={{ color: C.text, fontSize: '26px', fontWeight: '300', letterSpacing: '0.08em', marginBottom: '12px', lineHeight: '1.5' }}>
              分身作成プログラム
            </h1>
            <p style={{ color: C.muted, fontSize: '13px', lineHeight: '1.9', marginBottom: '12px' }}>
              3回のセッションで、あなたの思考・判断・価値観を<br />
              AIに学習させるための深層ヒアリングです。
            </p>
            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginBottom: '40px' }}>
              {['SESSION 1\n動機の根っこ', 'SESSION 2\n強み・弱み', 'SESSION 3\n自分軸'].map((label, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', whiteSpace: 'pre', lineHeight: '1.8' }}>{label}</div>
                </div>
              ))}
            </div>
            <input
              type="text" placeholder="あなたの名前を入力" value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: `1px solid #333`, borderRadius: '4px', color: C.text, fontSize: '15px', textAlign: 'center', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', fontFamily: C.font }}
            />
            <button onClick={handleStart} style={btn(!!nameInput.trim(), { width: '100%', padding: '16px' })}>
              開始する
            </button>
            <p style={{ color: '#333', fontSize: '11px', marginTop: '20px', letterSpacing: '0.1em' }}>
              各セッション 約90分 / 全3回
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── SESSION SELECT ────────────────────────────────────────────────────
  if (view === 'session-select') {
    const statusLabel = (s) => {
      if (s.status === 'completed') return '完了';
      if (s.status === 'in_progress') return '途中';
      return '未開始';
    };
    const statusColor = (s) => {
      if (s.status === 'completed') return C.gold;
      if (s.status === 'in_progress') return '#6b9b6b';
      return C.dim;
    };

    return (
      <>
        <Head><title>セッション選択</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '48px 20px' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '1px', background: C.gold }} />
              <span style={{ color: C.gold, fontSize: '11px', letterSpacing: '0.2em' }}>SESSIONS</span>
            </div>
            <h2 style={{ color: C.text, fontSize: '22px', fontWeight: '300', marginBottom: '8px' }}>{data.userName}</h2>
            <p style={{ color: C.dim, fontSize: '12px', marginBottom: '48px' }}>セッションを選んでください</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {SESSIONS.map((cfg, idx) => {
                const id = idx + 1;
                const session = data.sessions[id];
                const prevDone = id === 1 || data.sessions[id - 1].status === 'completed';
                const locked = !prevDone;
                const totalQ = getTotalQ(cfg);
                const answeredQ = Object.keys(session.answers).length;

                return (
                  <div
                    key={id}
                    onClick={() => !locked && handleSelectSession(id)}
                    style={{
                      padding: '24px', border: `1px solid ${locked ? '#1a1a1a' : C.border}`,
                      borderRadius: '8px', cursor: locked ? 'not-allowed' : 'pointer',
                      background: session.status === 'completed' ? '#0f0f0f' : C.surface,
                      opacity: locked ? 0.4 : 1, transition: 'border-color 0.2s',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {session.status === 'completed' && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: C.gold }} />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.25em' }}>SESSION {id}</span>
                        <h3 style={{ color: C.text, fontSize: '17px', fontWeight: '300', margin: '6px 0 4px', letterSpacing: '0.03em' }}>{cfg.title}</h3>
                        <p style={{ color: C.muted, fontSize: '12px', margin: 0 }}>{cfg.subtitle}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: statusColor(session), fontSize: '11px', letterSpacing: '0.1em' }}>{statusLabel(session)}</span>
                        {session.status === 'in_progress' && (
                          <div style={{ color: C.dim, fontSize: '11px', marginTop: '4px' }}>{answeredQ}/{totalQ}問</div>
                        )}
                      </div>
                    </div>
                    {session.status === 'in_progress' && (
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ height: '1px', background: '#1a1a1a' }}>
                          <div style={{ height: '100%', width: `${Math.round(answeredQ / totalQ * 100)}%`, background: '#6b9b6b', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div style={{ marginTop: '40px', padding: '24px', border: `1px solid ${C.gold}`, borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: C.muted, fontSize: '13px', marginBottom: '16px' }}>全3回のセッションが完了しました</p>
                {data.integratedDoc ? (
                  <button onClick={() => setView('final-document')} style={btn(true, { width: '100%' })}>
                    分身ドキュメントを見る
                  </button>
                ) : (
                  <button onClick={handleGenerate} style={btn(true, { width: '100%' })}>
                    統合ドキュメントを生成する
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => { localStorage.removeItem(STORAGE_KEY); setData(null); setView('landing'); }}
              style={{ ...outlineBtn({ marginTop: '32px', fontSize: '11px', padding: '10px 16px', color: '#333', borderColor: '#1a1a1a' }) }}
            >
              リセット
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── SESSION ACTIVE ────────────────────────────────────────────────────
  if (view === 'session-active') {
    const cfg = SESSIONS[activeId - 1];
    const session = data.sessions[activeId];
    const current = getNextQ(session, cfg);
    const totalQ = getTotalQ(cfg);
    const answeredQ = Object.keys(session.answers).length;
    const progress = Math.round((answeredQ / totalQ) * 100);

    if (!current) return null;

    return (
      <>
        <Head><title>Session {activeId} — {cfg.title}</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '32px 20px 60px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.25em' }}>SESSION {activeId} / 3</span>
              <span style={{ color: C.dim, fontSize: '11px' }}>{progress}%</span>
            </div>
            <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '40px' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: C.gold, transition: 'width 0.5s' }} />
            </div>

            {/* Phase */}
            <div style={{ marginBottom: '36px' }}>
              <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '8px' }}>{current.phase.title}</p>
              <h2 style={{ color: C.text, fontSize: '22px', fontWeight: '300', letterSpacing: '0.04em' }}>{cfg.title}</h2>
            </div>

            {/* Question */}
            <div style={{ paddingLeft: '18px', borderLeft: `2px solid ${C.gold}`, marginBottom: '32px' }}>
              <p style={{ color: C.muted, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '12px' }}>
                Q{current.qNum} / {current.phaseTotal}
              </p>
              <p style={{ color: C.text, fontSize: '17px', lineHeight: '1.75', fontWeight: '300' }}>
                {current.question}
              </p>
            </div>

            {/* Follow-up */}
            {followUp && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '20px', marginBottom: '28px' }}>
                <p style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>深掘り</p>
                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7' }}>{followUp}</p>
              </div>
            )}

            {/* Input */}
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={followUp ? '続けて答えてください...' : '正直に、思ったままを書いてください...'}
              rows={followUp ? 4 : 6}
              style={{ width: '100%', padding: '18px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '15px', lineHeight: '1.8', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: C.font, marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || isLoading}
                style={btn(!!answer.trim() && !isLoading, { flex: 1 })}
              >
                {isLoading ? '分析中...' : '回答する'}
              </button>
              {followUp && (
                <button onClick={handleNext} style={outlineBtn({ padding: '16px 20px' })}>
                  次へ進む
                </button>
              )}
            </div>

            {!followUp && answeredQ > 0 && (
              <button onClick={() => { setView('session-select'); }} style={outlineBtn({ width: '100%', marginTop: '12px', fontSize: '11px' })}>
                ← セッション選択に戻る（進捗は保存済み）
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── SESSION SUMMARY ───────────────────────────────────────────────────
  if (view === 'session-summary') {
    const cfg = SESSIONS[activeId - 1];
    const completedSessions = [1, 2, 3].filter(i => data.sessions[i].status === 'completed' && i !== activeId);

    const renderMarkdown = (text) =>
      text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} style={{ color: C.gold, fontSize: '13px', letterSpacing: '0.15em', margin: '24px 0 10px', fontWeight: '400' }}>{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} style={{ color: C.text, fontSize: '18px', fontWeight: '300', margin: '0 0 20px' }}>{line.slice(2)}</h2>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ color: C.text, fontSize: '14px', fontWeight: '500', margin: '8px 0 4px' }}>{line.slice(2, -2)}</p>;
        if (line.match(/^\*\*(.+?):\*\*/)) {
          const [, label, ...rest] = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
          return <p key={i} style={{ color: '#ccc', fontSize: '14px', margin: '6px 0', lineHeight: '1.7' }}><span style={{ color: C.text, fontWeight: '500' }}>{label}：</span>{rest.join(' ')}</p>;
        }
        if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) return <p key={i} style={{ color: '#ccc', fontSize: '14px', margin: '6px 0', lineHeight: '1.7', paddingLeft: '8px' }}>{line}</p>;
        if (line === '---') return <div key={i} style={{ height: '1px', background: '#1a1a1a', margin: '20px 0' }} />;
        if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
        return <p key={i} style={{ color: '#ccc', fontSize: '14px', margin: '4px 0', lineHeight: '1.8' }}>{line}</p>;
      });

    const tabs = [
      { label: `SESSION ${activeId} — 今日の発見`, content: currentSummary },
      ...completedSessions.map(i => ({ label: `SESSION ${i} — ${SESSIONS[i - 1].title}`, content: data.sessions[i].summary })),
    ];

    return (
      <>
        <Head><title>Session {activeId} 完了</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '40px 20px 60px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ width: '32px', height: '1px', background: C.gold }} />
              <span style={{ color: C.gold, fontSize: '11px', letterSpacing: '0.2em' }}>
                {isSummarizing ? 'GENERATING...' : `SESSION ${activeId} COMPLETE`}
              </span>
            </div>

            <h2 style={{ color: C.text, fontSize: '22px', fontWeight: '300', marginBottom: '32px', letterSpacing: '0.04em' }}>
              {cfg.title}
            </h2>

            {/* Tabs */}
            {tabs.length > 1 && (
              <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: `1px solid ${C.border}` }}>
                {tabs.map((t, i) => (
                  <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.font, fontSize: '11px', letterSpacing: '0.1em', color: tab === i ? C.gold : C.dim, borderBottom: tab === i ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: '-1px' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Summary content */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '32px', minHeight: '200px' }}>
              {isSummarizing && tab === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: C.dim }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.gold, animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '13px' }}>サマリーを生成しています...</span>
                </div>
              ) : (
                renderMarkdown(tabs[tab]?.content || '')
              )}
            </div>

            {!isSummarizing && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                <button onClick={() => setView('session-select')} style={btn(true)}>
                  セッション選択へ
                </button>
                {allDone && (
                  <button onClick={handleGenerate} style={btn(true, { background: C.text, color: '#0a0a0a' })}>
                    統合ドキュメントを生成する
                  </button>
                )}
                <button onClick={() => navigator.clipboard?.writeText(tabs[tab]?.content || '')} style={outlineBtn()}>
                  コピー
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── FINAL DOCUMENT ────────────────────────────────────────────────────
  if (view === 'final-document') {
    const doc = data?.integratedDoc || '';

    const renderDoc = (text) =>
      text.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} style={{ color: C.text, fontSize: '22px', fontWeight: '300', margin: '0 0 28px', letterSpacing: '0.04em' }}>{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} style={{ color: C.gold, fontSize: '13px', letterSpacing: '0.2em', margin: '28px 0 12px', fontWeight: '400' }}>{line.slice(3)}</h2>;
        if (line.match(/^\*\*(.+?):\*\*\s*(.*)/)) {
          const [, label, rest] = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
          return <p key={i} style={{ color: '#ccc', fontSize: '14px', margin: '6px 0', lineHeight: '1.8' }}><span style={{ color: C.text }}>{label}：</span>{rest}</p>;
        }
        if (line.startsWith('- ')) return <p key={i} style={{ color: '#bbb', fontSize: '14px', margin: '5px 0', lineHeight: '1.8', paddingLeft: '12px' }}>·  {line.slice(2)}</p>;
        if (line === '---') return <div key={i} style={{ height: '1px', background: '#1a1a1a', margin: '24px 0' }} />;
        if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
        return <p key={i} style={{ color: '#ccc', fontSize: '14px', margin: '4px 0', lineHeight: '1.8' }}>{line}</p>;
      });

    return (
      <>
        <Head><title>分身ドキュメント — {data.userName}</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '48px 20px 80px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
              <div style={{ width: '40px', height: '1px', background: C.gold }} />
              <span style={{ color: C.gold, fontSize: '11px', letterSpacing: '0.2em' }}>
                {isGenerating ? 'GENERATING...' : 'COMPLETE'}
              </span>
            </div>

            {isGenerating ? (
              <div style={{ color: C.dim, fontSize: '14px' }}>
                <p style={{ marginBottom: '8px' }}>3回のセッションを統合しています...</p>
                <p style={{ fontSize: '12px', color: '#333' }}>約30秒かかります</p>
              </div>
            ) : (
              <>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '40px' }}>
                  {renderDoc(doc)}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigator.clipboard?.writeText(doc)} style={btn(true)}>
                    コピーする
                  </button>
                  <button onClick={() => setView('session-select')} style={outlineBtn()}>
                    ← セッション選択へ
                  </button>
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
