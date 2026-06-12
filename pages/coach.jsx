import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

const C = {
  bg: '#050505', text: '#f0ebe0', muted: '#888', dim: '#444',
  gold: '#c9a84c', green: '#5a9b5a', red: '#c04040',
  surface: '#0c0c0c', border: '#1a1a1a', border2: '#252525',
  font: "'Noto Serif JP', Georgia, serif",
};

const btn = (active, extra = {}) => ({
  padding: '12px 22px', border: 'none', borderRadius: '4px',
  cursor: active ? 'pointer' : 'not-allowed', fontSize: '12px',
  letterSpacing: '0.1em', fontFamily: C.font,
  background: active ? C.gold : '#1a1a1a', color: active ? '#0a0a0a' : C.dim,
  opacity: active ? 1 : 0.5, ...extra,
});

const ghost = (extra = {}) => ({
  padding: '10px 18px', background: 'transparent',
  border: `1px solid ${C.border2}`, borderRadius: '4px',
  color: C.dim, fontSize: '11px', cursor: 'pointer', fontFamily: C.font, ...extra,
});

const SESSIONS_MAP = {
  1: { title: '今の自分を解剖する', phases: [
    { title: 'モヤモヤの輪郭を取る', questions: ['今、頭の中にあるモヤモヤや引っかかりを、言葉にならなくていいので思いつくまま全部書いてください。','そのモヤモヤは、「自分自身への疑い」から来ていますか。それとも「周りや環境への不満・比較」から来ていますか。','そのモヤモヤが完全に消えたとして、あなたは「何ができるようになる」と思いますか。','Q1で出てきたモヤモヤの中で、一番「考えたくない」「直視したくない」と感じるものはどれですか。'] },
    { title: '過去から現在を読む', questions: ['親に「ありがとう」と直接言ったことはありますか。','子どもの頃、「本気でやめたいのに続けたこと」はありますか。','これまでの人生で「続けられると思っていたのにやめたこと」は何ですか。'] },
    { title: '承認と動機の核心', questions: ['誰かに褒められた時と、自分で「できた」と感じた時、どちらの満足感が長く続きますか。','一生誰にも見せられない、評価されない条件でも、今やっていることを続けますか。'] },
  ]},
  2: { title: '止まっている理由を特定する', phases: [
    { title: '本音の孤立', questions: ['今、自分が本当にやろうとしていることを、全部正直に話せる人間が何人いますか。','その人たちにも話せていないことがあるとしたら、なぜですか。'] },
    { title: '回避パターン', questions: ['何かから逃げた後、必ずやることがあります。それは何ですか。','その行動をしている時、何を感じていますか。','今、一番先送りにしていることは何ですか。'] },
    { title: '矛盾を直視する', questions: ['「〇〇したい」と思っているのに、実際の行動が伴っていないことはありますか。','これまでの人生で、今も「逃げた」と後悔している選択が一つあるとしたら、それは何ですか。'] },
  ]},
  3: { title: '次の一手を決める', phases: [
    { title: '死ぬ前の後悔', questions: ['80歳で死ぬ直前、「あの時こうしておけばよかった」と後悔するとしたら、それは何ですか。'] },
    { title: '本物の動機', questions: ['今一番熱量がある「やりたいこと」の、本当の理由は何ですか。','もしその「やりたいこと」が永遠に誰にも評価されないとわかっていても、やり続けますか。'] },
    { title: '軸を言語化する', questions: ['SESSION 1から今日まで、一番「そうだった」と腑に落ちた瞬間はいつですか。','あなたが死ぬ時に、自分の人生を一文で表すとしたら、何と書きますか。','今週、必ずやると決めることを一つだけ書いてください。'] },
  ]},
};

const getLatestAnswerEntry = (sessionData) => {
  if (!sessionData?.sessions) return null;
  let latest = null;
  for (const [sid, sess] of Object.entries(sessionData.sessions)) {
    if (!sess.answers) continue;
    const sessionCfg = SESSIONS_MAP[Number(sid)];
    if (!sessionCfg) continue;
    for (const [key, ans] of Object.entries(sess.answers)) {
      if (!ans) continue;
      const [pi, qi] = key.split('-').map(Number);
      const question = sessionCfg.phases[pi]?.questions[qi] || '';
      if (!latest || key > latest.key) {
        latest = { sessionId: Number(sid), key, question, answer: ans };
      }
    }
  }
  return latest;
};

export default function CoachPage() {
  const [phase, setPhase] = useState('passcode');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [scriptHistory, setScriptHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const passcodeRef = useRef('');
  const lastAnswerKeyRef = useRef(null);
  const pollTimerRef = useRef(null);

  const apiHeaders = { 'x-coach-passcode': passcodeRef.current };

  const loadClients = async (pc) => {
    const r = await fetch('/api/admin/coach-data?action=clients', { headers: { 'x-coach-passcode': pc } });
    if (!r.ok) throw new Error('Invalid');
    const json = await r.json();
    setClients(json.clients || []);
  };

  const handlePasscode = async () => {
    if (passcode.length !== 4) return;
    try {
      await loadClients(passcode);
      passcodeRef.current = passcode;
      setPasscodeError('');
      setPhase('clients');
    } catch {
      setPasscodeError('パスコードが違います');
    }
  };

  const generateScript = async (entry, userName) => {
    if (!entry || isGenerating) return;
    setIsGenerating(true);
    try {
      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'coachscript', question: entry.question, answer: entry.answer, userName }),
      });
      const json = await r.json();
      const s = json.script;
      setScriptHistory(prev => [{ ...s, question: entry.question, answer: entry.answer, at: new Date().toLocaleTimeString('ja-JP') }, ...prev].slice(0, 20));
    } catch {}
    setIsGenerating(false);
  };

  const pollClient = async (clientId, userName) => {
    try {
      const r = await fetch(`/api/admin/coach-data?action=answers&userId=${clientId}`, { headers: { 'x-coach-passcode': passcodeRef.current } });
      const json = await r.json();
      if (!json.client) return;
      setClientData(json.client.session_data);
      const entry = getLatestAnswerEntry(json.client.session_data);
      const entryKey = entry ? `${entry.sessionId}-${entry.key}` : null;
      if (entry && entryKey !== lastAnswerKeyRef.current) {
        lastAnswerKeyRef.current = entryKey;
        generateScript(entry, userName);
      }
    } catch {}
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setScriptHistory([]);
    setClientData(null);
    lastAnswerKeyRef.current = null;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollClient(client.id, client.user_name);
    pollTimerRef.current = setInterval(() => pollClient(client.id, client.user_name), 5000);
    setPhase('session');
  };

  const handleBack = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setSelectedClient(null); setClientData(null); setScriptHistory([]);
    lastAnswerKeyRef.current = null;
    setPhase('clients');
  };

  useEffect(() => () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); }, []);

  if (phase === 'passcode') return (
    <>
      <Head><title>コーチ台本 — SEN</title></Head>
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font }}>
        <div style={{ maxWidth: '320px', width: '100%', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.4em', marginBottom: '28px' }}>COACH MODE</p>
          <input
            type="password"
            maxLength={4}
            placeholder="4桁パスコード"
            value={passcode}
            onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handlePasscode()}
            style={{ width: '100%', padding: '14px', background: 'transparent', border: `1px solid #333`, borderRadius: '4px', color: C.text, fontSize: '20px', textAlign: 'center', outline: 'none', letterSpacing: '0.5em', marginBottom: '14px', boxSizing: 'border-box', fontFamily: C.font }}
          />
          {passcodeError && <p style={{ color: C.red, fontSize: '12px', marginBottom: '10px' }}>{passcodeError}</p>}
          <button onClick={handlePasscode} style={btn(passcode.length === 4, { width: '100%' })}>入室する</button>
        </div>
      </div>
    </>
  );

  if (phase === 'clients') return (
    <>
      <Head><title>クライアント選択 — コーチ台本</title></Head>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '48px 24px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '28px' }}>COACH MODE — クライアント選択</p>
          {clients.length === 0 ? (
            <p style={{ color: C.dim, fontSize: '13px' }}>クライアントが見つかりません</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {clients.map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '18px 22px', border: `1px solid ${C.border}`, borderRadius: '6px', cursor: 'pointer', background: C.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: C.text, fontSize: '15px' }}>{c.user_name}</span>
                  <span style={{ color: C.dim, fontSize: '11px' }}>{c.updated_at ? new Date(c.updated_at).toLocaleDateString('ja-JP') : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (phase === 'session') {
    const latest = clientData ? getLatestAnswerEntry(clientData) : null;
    const current = scriptHistory[0];
    return (
      <>
        <Head><title>{selectedClient?.user_name} — コーチ台本</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '32px 24px 80px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '4px' }}>LIVE SESSION</p>
                <h2 style={{ color: C.text, fontSize: '20px', fontWeight: '300', margin: 0 }}>{selectedClient?.user_name}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
                <span style={{ color: C.dim, fontSize: '11px' }}>5秒ごとに更新</span>
                <button onClick={handleBack} style={ghost()}>← 戻る</button>
              </div>
            </div>

            {latest && (
              <div style={{ background: '#0a0f0a', border: `1px solid ${C.green}22`, borderRadius: '6px', padding: '16px 20px', marginBottom: '24px' }}>
                <p style={{ color: C.green, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '6px' }}>最新回答</p>
                <p style={{ color: C.dim, fontSize: '11px', marginBottom: '6px' }}>SESSION {latest.sessionId} · {latest.question}</p>
                <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.7' }}>{latest.answer}</p>
              </div>
            )}

            {isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim, padding: '16px 0 20px' }}>
                <span style={{ color: C.gold }}>·</span>
                <span style={{ fontSize: '13px' }}>台本を生成しています...</span>
              </div>
            )}

            {current && (
              <div style={{ background: '#0f0c00', border: `2px solid ${C.gold}44`, borderRadius: '8px', padding: '24px 28px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em' }}>今言うべき一言</p>
                  <span style={{ color: C.dim, fontSize: '10px' }}>{current.at}</span>
                </div>
                {current.summary && (
                  <p style={{ color: C.muted, fontSize: '12px', marginBottom: '12px', lineHeight: '1.6' }}>
                    <span style={{ color: C.dim }}>要点　</span>{current.summary}
                  </p>
                )}
                <p style={{ color: C.text, fontSize: '18px', lineHeight: '1.9', fontWeight: '300', marginBottom: '16px' }}>{current.script}</p>
                {current.caution && (
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
                    <p style={{ color: C.red, fontSize: '12px', lineHeight: '1.6' }}>
                      <span style={{ fontSize: '10px', letterSpacing: '0.15em' }}>注意 　</span>{current.caution}
                    </p>
                  </div>
                )}
              </div>
            )}

            {scriptHistory.length > 1 && (
              <>
                <p style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '14px' }}>履歴</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scriptHistory.slice(1).map((s, i) => (
                    <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '16px 20px', opacity: 0.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <p style={{ color: C.dim, fontSize: '11px' }}>{s.question?.slice(0, 40)}...</p>
                        <span style={{ color: C.dim, fontSize: '10px' }}>{s.at}</span>
                      </div>
                      {s.summary && <p style={{ color: C.muted, fontSize: '12px', marginBottom: '6px' }}>{s.summary}</p>}
                      <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.7' }}>{s.script}</p>
                      {s.caution && <p style={{ color: C.red, fontSize: '11px', marginTop: '8px' }}>注意: {s.caution}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!latest && !isGenerating && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.dim }}>
                <p style={{ fontSize: '13px' }}>クライアントの回答を待機中...</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return null;
}
