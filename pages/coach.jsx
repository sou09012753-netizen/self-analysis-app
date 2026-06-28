import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { getSupabaseClient } from '../lib/supabaseClient';

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

const inlineBold = (text) => {
  if (!text || !text.includes('**')) return text;
  return text.split(/\*\*(.+?)\*\*/g).map((p, i) =>
    i % 2 === 1 ? <strong key={i} style={{ color: C.text, fontWeight: '600' }}>{p}</strong> : p
  );
};

const renderMd = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# '))   return <h2 key={i} style={{ color: C.text, fontSize: '17px', fontWeight: '300', margin: '0 0 24px', letterSpacing: '0.05em' }}>{inlineBold(line.slice(2))}</h2>;
    if (line.startsWith('## '))  return <h3 key={i} style={{ color: C.text, fontSize: '13px', fontWeight: '600', margin: '36px 0 16px', borderBottom: `1px solid ${C.border2}`, paddingBottom: '8px', letterSpacing: '0.05em' }}>{inlineBold(line.slice(3))}</h3>;
    if (line.startsWith('### ')) return <h4 key={i} style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', margin: '24px 0 10px', fontWeight: '500', textTransform: 'uppercase' }}>{inlineBold(line.slice(4))}</h4>;
    if (line.match(/^\d+\.\s/))  return <p key={i} style={{ color: '#ccc', fontSize: '13px', margin: '10px 0', lineHeight: '2.0' }}>{inlineBold(line)}</p>;
    if (line.startsWith('- '))   return <p key={i} style={{ color: '#bbb', fontSize: '13px', margin: '8px 0', lineHeight: '2.0', display: 'flex', gap: '10px' }}><span style={{ color: C.gold, flexShrink: 0, marginTop: '1px' }}>·</span><span>{inlineBold(line.slice(2))}</span></p>;
    if (line.match(/^\*\*(.+?)：\*\*\s*(.*)/)) {
      const [, label, rest] = line.match(/^\*\*(.+?)：\*\*\s*(.*)/);
      return (
        <div key={i} style={{ margin: '20px 0 6px' }}>
          <p style={{ color: C.text, fontSize: '13px', fontWeight: '600', margin: '0 0 6px', lineHeight: '1.6' }}>{label}：</p>
          {rest && <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '2.0', margin: '0', paddingLeft: '14px' }}>{inlineBold(rest)}</p>}
        </div>
      );
    }
    if (line.match(/^\*\*(.+?):\*\*\s*(.*)/)) {
      const [, label, rest] = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
      return (
        <div key={i} style={{ margin: '20px 0 6px' }}>
          <p style={{ color: C.text, fontSize: '13px', fontWeight: '600', margin: '0 0 6px', lineHeight: '1.6' }}>{label}：</p>
          {rest && <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '2.0', margin: '0', paddingLeft: '14px' }}>{inlineBold(rest)}</p>}
        </div>
      );
    }
    if (line === '---') return <div key={i} style={{ height: '1px', background: C.border2, margin: '24px 0' }} />;
    if (!line.trim())  return <div key={i} style={{ height: '12px' }} />;
    return <p key={i} style={{ color: '#ccc', fontSize: '13px', margin: '8px 0', lineHeight: '2.0' }}>{inlineBold(line)}</p>;
  });
};

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
  const [clientWorkResponses, setClientWorkResponses] = useState([]);

  // クライアント追加
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [createClientError, setCreateClientError] = useState('');
  const [createClientSuccess, setCreateClientSuccess] = useState('');

  // Report states
  const [reportText, setReportText] = useState(null);
  const [reportOpen, setReportOpen] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportUpdatedAt, setReportUpdatedAt] = useState(null);

  // Session questions states
  const [sessionQuestions, setSessionQuestions] = useState(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(true);
  const [questionsUpdatedAt, setQuestionsUpdatedAt] = useState(null);

  // Session unlock states
  const [unlockingSession, setUnlockingSession] = useState(null);
  const [generatingCard, setGeneratingCard] = useState(null);

  const passcodeRef = useRef('');
  const channelRef = useRef(null);
  const selectedClientRef = useRef(null);

  const loadClients = async (pc) => {
    const r = await fetch('/api/admin/coach-data?action=clients', { headers: { 'x-coach-passcode': pc } });
    if (!r.ok) throw new Error('Invalid');
    const json = await r.json();
    setClients(json.clients || []);
  };

  const setupRealtime = async () => {
    const supabase = await getSupabaseClient();
    const channel = supabase
      .channel('coaching_users_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coaching_users' }, (payload) => {
        if (passcodeRef.current) loadClients(passcodeRef.current).catch(() => {});
        const sc = selectedClientRef.current;
        if (sc && payload.new?.id === sc.id) pollClient(sc.id);
      })
      .subscribe();
    channelRef.current = channel;
  };

  const handlePasscode = async () => {
    if (passcode.length !== 4) return;
    try {
      await loadClients(passcode);
      passcodeRef.current = passcode;
      setPasscodeError('');
      setPhase('clients');
      setupRealtime();
    } catch {
      setPasscodeError('パスコードが違います');
    }
  };

  const pollClient = async (clientId) => {
    try {
      const r = await fetch(`/api/admin/coach-data?action=answers&userId=${clientId}`, { headers: { 'x-coach-passcode': passcodeRef.current } });
      const json = await r.json();
      if (!json.client) return;
      setClientData(json.client.session_data);
      setClientWorkResponses(json.client.work_responses || []);
    } catch {}
  };

  const loadOrGenerateQuestions = async (clientId, userName, sessionData) => {
    const hasCompleted = Object.values(sessionData?.sessions || {}).some(s => s.status === 'completed');
    if (!hasCompleted) return;

    try {
      const r = await fetch(`/api/admin/session-questions?userId=${clientId}`, {
        headers: { 'x-coach-passcode': passcodeRef.current },
      });
      const json = await r.json();
      if (json.questions) {
        setSessionQuestions(json.questions.questions_text);
        setQuestionsUpdatedAt(json.questions.updated_at);
        return;
      }
    } catch {}

    setIsGeneratingQuestions(true);
    try {
      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sessionquestions', userName, sessionData }),
      });
      const json = await r.json();
      const text = json.text || '';
      if (selectedClientRef.current?.id === clientId) {
        setSessionQuestions(text);
        setQuestionsUpdatedAt(new Date().toISOString());
      }
      fetch('/api/admin/session-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-coach-passcode': passcodeRef.current },
        body: JSON.stringify({ userId: clientId, questionsText: text }),
      }).catch(() => {});
    } catch {
      if (selectedClientRef.current?.id === clientId) setSessionQuestions('');
    }
    if (selectedClientRef.current?.id === clientId) setIsGeneratingQuestions(false);
  };

  const saveReport = async (clientId, text) => {
    try {
      await fetch('/api/admin/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-coach-passcode': passcodeRef.current },
        body: JSON.stringify({ userId: clientId, reportText: text }),
      });
      setReportUpdatedAt(new Date().toISOString());
    } catch {}
  };

  const doGenerateReport = async (clientId, userName, sessionData, workResponses) => {
    setIsGeneratingReport(true);
    try {
      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'report', userName, sessionData, workResponses }),
      });
      const json = await r.json();
      const text = json.text || '';
      if (selectedClientRef.current?.id === clientId) setReportText(text);
      if (text) await saveReport(clientId, text);
    } catch {
      if (selectedClientRef.current?.id === clientId) setReportText('');
    }
    if (selectedClientRef.current?.id === clientId) setIsGeneratingReport(false);
  };

  const loadOrGenerateReport = async (clientId, userName, sessionData, workResponses) => {
    try {
      const r = await fetch(`/api/admin/report?userId=${clientId}`, {
        headers: { 'x-coach-passcode': passcodeRef.current },
      });
      const json = await r.json();
      if (json.report) {
        setReportText(json.report.report_text);
        setReportUpdatedAt(json.report.updated_at);
        return;
      }
      await doGenerateReport(clientId, userName, sessionData, workResponses);
    } catch {
      setReportText('');
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    selectedClientRef.current = client;
    setClientData(null);
    setClientWorkResponses([]);
    setReportText(null);
    setReportUpdatedAt(null);
    setSessionQuestions(null);
    setQuestionsUpdatedAt(null);
    setPhase('session');

    (async () => {
      try {
        const r = await fetch(`/api/admin/coach-data?action=answers&userId=${client.id}`, {
          headers: { 'x-coach-passcode': passcodeRef.current },
        });
        const json = await r.json();
        if (!json.client) return;
        const sessionData = json.client.session_data;
        const workResponses = json.client.work_responses || [];
        setClientData(sessionData);
        setClientWorkResponses(workResponses);
        await Promise.all([
          loadOrGenerateReport(client.id, client.user_name, sessionData, workResponses),
          loadOrGenerateQuestions(client.id, client.user_name, sessionData),
        ]);
      } catch {}
    })();
  };

  const handleBack = () => {
    selectedClientRef.current = null;
    setSelectedClient(null); setClientData(null);
    setReportText(null); setReportUpdatedAt(null); setClientWorkResponses([]);
    setSessionQuestions(null); setQuestionsUpdatedAt(null);
    setUnlockingSession(null);
    setGeneratingCard(null);
    setPhase('clients');
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim() || !newClientPassword || isCreatingClient) return;
    setIsCreatingClient(true);
    setCreateClientError('');
    setCreateClientSuccess('');
    try {
      const r = await fetch('/api/coach/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-coach-passcode': passcodeRef.current },
        body: JSON.stringify({ userName: newClientName.trim(), email: newClientEmail.trim(), userPassword: newClientPassword }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'クライアント作成に失敗しました');
      setCreateClientSuccess(`${newClientName.trim()} を追加しました`);
      setNewClientName(''); setNewClientEmail(''); setNewClientPassword('');
      setShowCreateClient(false);
      loadClients(passcodeRef.current);
    } catch (err) {
      setCreateClientError(err.message);
    }
    setIsCreatingClient(false);
  };

  const handleGenerateCard = async (sessionId) => {
    if (!selectedClient || !clientData) return;
    setGeneratingCard(sessionId);
    try {
      const cfg = SESSIONS_MAP[sessionId];
      if (!cfg) return;
      const sess = clientData.sessions?.[sessionId] || {};
      const answers = sess.answers || {};

      const allAnswers = cfg.phases.map((phase, pi) => ({
        phase: phase.title,
        qa: phase.questions.map((q, qi) => ({ question: q, answer: answers[`${pi}-${qi}`] || '未回答' })),
      }));

      const previousSummaries = [];
      for (let i = 1; i < sessionId; i++) {
        const prev = clientData.sessions?.[i];
        if (prev?.summary) previousSummaries.push({ sessionNumber: i, title: SESSIONS_MAP[i]?.title || '', summary: prev.summary });
      }

      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'summary', sessionNumber: sessionId, userName: selectedClient.user_name, allAnswers, previousSummaries }),
      });
      const json = await r.json();
      const summary = json.text || '';
      if (!summary) return;

      await fetch('/api/admin/save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-coach-passcode': passcodeRef.current },
        body: JSON.stringify({ userId: selectedClient.id, sessionId, summary }),
      });

      setClientData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sessions: {
            ...prev.sessions,
            [sessionId]: {
              ...(prev.sessions?.[sessionId] || {}),
              status: 'completed',
              summary,
              completedAt: new Date().toISOString(),
              unlocked: true,
            },
          },
        };
      });
    } catch {}
    setGeneratingCard(null);
  };

  const handleUnlockSession = async (sessionId) => {
    if (!selectedClient) return;
    setUnlockingSession(sessionId);
    try {
      const r = await fetch('/api/admin/unlock-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-coach-passcode': passcodeRef.current },
        body: JSON.stringify({ userId: selectedClient.id, sessionId }),
      });
      if (r.ok) {
        setClientData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            sessions: {
              ...prev.sessions,
              [sessionId]: { ...(prev.sessions?.[sessionId] || {}), unlocked: true },
            },
          };
        });
      }
    } catch {}
    setUnlockingSession(null);
  };

  const handleDownloadPDF = () => {
    if (!clientData || !selectedClient) return;
    const completedSessions = Object.entries(clientData.sessions || {})
      .filter(([, s]) => s.status === 'completed' && s.summary)
      .sort(([a], [b]) => Number(a) - Number(b));
    if (completedSessions.length === 0) return;

    const summaryToHtml = (text) => {
      if (!text) return '';
      return text.split('\n').map(line => {
        if (line.startsWith('# '))   return `<h2 style="font-size:18px;font-weight:300;margin:0 0 16px;border-bottom:1px solid #ddd;padding-bottom:6px;">${line.slice(2)}</h2>`;
        if (line.startsWith('## '))  return `<h3 style="font-size:14px;font-weight:500;margin:22px 0 10px;color:#111;">${line.slice(3)}</h3>`;
        if (line.startsWith('### ')) return `<h4 style="font-size:11px;color:#888;letter-spacing:0.12em;margin:14px 0 6px;font-weight:400;">${line.slice(4)}</h4>`;
        if (line.startsWith('- '))   return `<p style="font-size:13px;line-height:1.9;margin:3px 0;color:#333;">· ${line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`;
        if (line.match(/^\d+\.\s/))  return `<p style="font-size:13px;line-height:1.9;margin:3px 0;color:#333;">${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`;
        if (line === '---') return '<hr style="border:none;border-top:1px solid #eee;margin:18px 0;">';
        if (!line.trim()) return '<div style="height:5px;"></div>';
        return `<p style="font-size:13px;line-height:1.9;margin:3px 0;color:#333;">${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`;
      }).join('');
    };

    const sessionSectionTitle = { 1: '今の自分を解剖する', 2: '止まっている理由を特定する', 3: '次の一手を決める' };

    const body = completedSessions.map(([sid, sess]) => {
      const date = sess.completedAt ? new Date(sess.completedAt).toLocaleDateString('ja-JP') : '';
      return `
        <div style="margin-bottom:40px;">
          <p style="font-size:11px;color:#999;letter-spacing:0.15em;margin:0 0 4px;">SESSION ${sid} · ${sessionSectionTitle[sid] || ''} · ${date}</p>
          <hr style="border:none;border-top:2px solid #c9a84c;margin:0 0 20px;width:40px;">
          ${summaryToHtml(sess.summary)}
        </div>`;
    }).join('<hr style="border:none;border-top:1px solid #ddd;margin:32px 0;">');

    const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<title>${selectedClient.user_name} 分身シート</title>
<style>
  body { font-family: 'Hiragino Serif', 'Yu Mincho', 'Noto Serif JP', Georgia, serif; margin: 48px; color: #1a1a1a; }
  @media print { body { margin: 24px; } }
</style>
</head><body>
<h1 style="font-size:22px;font-weight:300;margin:0 0 4px;">${selectedClient.user_name}</h1>
<p style="font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 36px;">分身シート</p>
${body}
</body></html>`;

    const pw = window.open('', '_blank', 'width=900,height=700');
    pw.document.write(html);
    pw.document.close();
    pw.focus();
    setTimeout(() => { pw.print(); }, 600);
  };

  useEffect(() => () => {
    if (channelRef.current) channelRef.current.unsubscribe();
  }, []);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', margin: 0 }}>COACH MODE — クライアント選択</p>
            <button
              onClick={() => { setShowCreateClient(true); setCreateClientError(''); setCreateClientSuccess(''); }}
              style={{ padding: '8px 16px', border: `1px solid ${C.gold}66`, borderRadius: '4px', background: 'transparent', color: C.gold, fontSize: '11px', cursor: 'pointer', fontFamily: C.font }}
            >
              ＋ クライアントを追加
            </button>
          </div>

          {/* クライアント追加フォーム */}
          {showCreateClient && (
            <div style={{ padding: '20px', border: `1px solid ${C.gold}33`, borderRadius: '8px', background: '#0c0c0c', marginBottom: '20px' }}>
              <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '14px' }}>新規クライアント</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="text" placeholder="クライアント名"
                  value={newClientName} onChange={e => setNewClientName(e.target.value)}
                  style={{ padding: '12px 14px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '14px', outline: 'none', fontFamily: C.font }}
                />
                <input
                  type="email" placeholder="メールアドレス"
                  value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)}
                  style={{ padding: '12px 14px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '14px', outline: 'none', fontFamily: C.font }}
                />
                <input
                  type="password" placeholder="初期パスワード（8文字以上）"
                  value={newClientPassword} onChange={e => setNewClientPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateClient()}
                  style={{ padding: '12px 14px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: C.text, fontSize: '14px', outline: 'none', fontFamily: C.font }}
                />
              </div>
              {createClientError && <p style={{ color: C.red, fontSize: '12px', marginBottom: '10px' }}>{createClientError}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCreateClient}
                  disabled={!newClientName.trim() || !newClientEmail.trim() || !newClientPassword || isCreatingClient}
                  style={btn(newClientName.trim() && newClientEmail.trim() && newClientPassword && !isCreatingClient)}
                >
                  {isCreatingClient ? '作成中...' : '追加'}
                </button>
                <button
                  onClick={() => { setShowCreateClient(false); setCreateClientError(''); }}
                  style={ghost()}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
          {createClientSuccess && <p style={{ color: C.green, fontSize: '12px', marginBottom: '16px' }}>{createClientSuccess}</p>}

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
    const hasCompletedSession = clientData && Object.values(clientData.sessions || {}).some(s => s.status === 'completed');

    return (
      <>
        <Head><title>{selectedClient?.user_name} — コーチ画面</title></Head>
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '32px 24px 80px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>

            {/* ヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '4px' }}>COACH VIEW</p>
                <h2 style={{ color: C.text, fontSize: '20px', fontWeight: '300', margin: 0 }}>{selectedClient?.user_name}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
                <span style={{ color: C.dim, fontSize: '11px' }}>接続中</span>
                {hasCompletedSession && (
                  <button onClick={handleDownloadPDF} style={ghost({ fontSize: '10px', padding: '7px 14px', color: C.gold, borderColor: '#2a2200' })}>
                    分身シートをダウンロード
                  </button>
                )}
                <button onClick={handleBack} style={ghost()}>← 戻る</button>
              </div>
            </div>

            {/* セッション解放管理 */}
            {clientData && (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
                <div style={{ background: C.surface, padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.3em', margin: 0 }}>セッション解放管理</p>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', gap: '12px' }}>
                  {[1, 2, 3].map(id => {
                    const sess = clientData.sessions?.[id] || {};
                    const cfg = SESSIONS_MAP[id];
                    let totalQ = 0;
                    if (cfg) cfg.phases.forEach(p => totalQ += p.questions.length);
                    const answeredQ = Object.keys(sess.answers || {}).length;
                    const allAnswered = totalQ > 0 && answeredQ >= totalQ;
                    const unlocked = sess.unlocked || false;
                    const completed = sess.status === 'completed';
                    const isUnlocking = unlockingSession === id;
                    return (
                      <div key={id} style={{ flex: 1, padding: '14px', background: '#0a0a0a', borderRadius: '6px', border: `1px solid ${(unlocked || completed) ? C.gold + '44' : C.border}` }}>
                        <p style={{ color: (unlocked || completed) ? C.gold : C.dim, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>SESSION {id}</p>
                        <p style={{ color: C.dim, fontSize: '11px', marginBottom: '12px' }}>
                          {completed ? '完了' : allAnswered ? '全問記入済み' : answeredQ > 0 ? `${answeredQ}/${totalQ}問` : '未開始'}
                        </p>
                        {completed ? (
                          <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.08em' }}>完了</p>
                        ) : allAnswered ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              onClick={() => generatingCard === null && handleGenerateCard(id)}
                              style={{
                                padding: '7px 0', border: 'none', borderRadius: '4px',
                                cursor: generatingCard !== null ? 'not-allowed' : 'pointer',
                                fontSize: '11px', fontFamily: C.font, width: '100%',
                                background: generatingCard === id ? '#1a1a1a' : C.gold,
                                color: generatingCard === id ? C.dim : '#0a0a0a',
                                opacity: generatingCard !== null && generatingCard !== id ? 0.4 : 1,
                              }}
                            >{generatingCard === id ? '生成中...' : 'カードを生成する'}</button>
                            {!unlocked && (
                              <button
                                onClick={() => !isUnlocking && handleUnlockSession(id)}
                                style={{
                                  padding: '5px 0', border: `1px solid ${C.border2}`, borderRadius: '4px',
                                  cursor: isUnlocking ? 'not-allowed' : 'pointer',
                                  fontSize: '10px', fontFamily: C.font, width: '100%',
                                  background: 'transparent', color: C.dim,
                                }}
                              >{isUnlocking ? '...' : '解放のみ'}</button>
                            )}
                            {unlocked && <p style={{ color: C.dim, fontSize: '10px', textAlign: 'center' }}>解放済み</p>}
                          </div>
                        ) : (
                          <p style={{ color: '#2a2a2a', fontSize: '10px' }}>記入待ち</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 診断レポート */}
            <div style={{ border: `1px solid #2a2200`, borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{ background: '#0e0b00', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ color: C.gold, fontSize: '10px', letterSpacing: '0.3em', margin: 0 }}>診断レポート</p>
                  {reportUpdatedAt && (
                    <span style={{ color: C.dim, fontSize: '10px' }}>{new Date(reportUpdatedAt).toLocaleDateString('ja-JP')} 生成</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {reportText && !isGeneratingReport && (
                    <button
                      onClick={() => doGenerateReport(selectedClient.id, selectedClient.user_name, clientData, clientWorkResponses)}
                      style={ghost({ fontSize: '10px', padding: '6px 12px', color: C.gold, borderColor: '#2a2200' })}
                    >再生成</button>
                  )}
                  <button onClick={() => setReportOpen(o => !o)} style={ghost({ fontSize: '10px', padding: '6px 12px' })}>
                    {reportOpen ? '折りたたむ' : '開く'}
                  </button>
                </div>
              </div>
              {reportOpen && (
                <div style={{ padding: '24px 28px', background: '#080600' }}>
                  {reportText === null && !isGeneratingReport && <p style={{ color: C.dim, fontSize: '13px' }}>読み込み中...</p>}
                  {isGeneratingReport && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim }}>
                      <span style={{ color: C.gold }}>·</span>
                      <span style={{ fontSize: '13px' }}>レポートを生成しています（30〜60秒かかります）...</span>
                    </div>
                  )}
                  {!isGeneratingReport && reportText === '' && <p style={{ color: C.dim, fontSize: '13px' }}>レポートを生成できませんでした。再生成を試してください。</p>}
                  {!isGeneratingReport && reportText && <div>{renderMd(reportText)}</div>}
                </div>
              )}
            </div>

            {/* セッションで使える問い 3つ */}
            {hasCompletedSession && (
              <div style={{ border: `1px solid #1a2a1a`, borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
                <div style={{ background: '#0a100a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <p style={{ color: C.green, fontSize: '10px', letterSpacing: '0.3em', margin: 0 }}>セッションで使える問い 5つ</p>
                    {questionsUpdatedAt && (
                      <span style={{ color: C.dim, fontSize: '10px' }}>{new Date(questionsUpdatedAt).toLocaleDateString('ja-JP')} 生成</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {sessionQuestions && !isGeneratingQuestions && (
                      <button
                        onClick={async () => {
                          setSessionQuestions(null);
                          setQuestionsUpdatedAt(null);
                          setIsGeneratingQuestions(true);
                          try {
                            const r = await fetch('/api/claude', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ type: 'sessionquestions', userName: selectedClient.user_name, sessionData: clientData }),
                            });
                            const json = await r.json();
                            const text = json.text || '';
                            setSessionQuestions(text);
                            setQuestionsUpdatedAt(new Date().toISOString());
                            fetch('/api/admin/session-questions', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'x-coach-passcode': passcodeRef.current },
                              body: JSON.stringify({ userId: selectedClient.id, questionsText: text }),
                            }).catch(() => {});
                          } catch { setSessionQuestions(''); }
                          setIsGeneratingQuestions(false);
                        }}
                        style={ghost({ fontSize: '10px', padding: '6px 12px', color: C.green, borderColor: '#1a2a1a' })}
                      >再生成</button>
                    )}
                    <button onClick={() => setQuestionsOpen(o => !o)} style={ghost({ fontSize: '10px', padding: '6px 12px' })}>
                      {questionsOpen ? '折りたたむ' : '開く'}
                    </button>
                  </div>
                </div>
                {questionsOpen && (
                  <div style={{ padding: '24px 28px', background: '#060a06' }}>
                    {(sessionQuestions === null || isGeneratingQuestions) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.dim }}>
                        <span style={{ color: C.green }}>·</span>
                        <span style={{ fontSize: '13px' }}>問いを生成しています...</span>
                      </div>
                    )}
                    {!isGeneratingQuestions && sessionQuestions === '' && (
                      <p style={{ color: C.dim, fontSize: '13px' }}>生成できませんでした。再生成を試してください。</p>
                    )}
                    {!isGeneratingQuestions && sessionQuestions && <div>{renderMd(sessionQuestions)}</div>}
                  </div>
                )}
              </div>
            )}

            {/* リアルタイム最新回答 */}
            <p style={{ color: C.dim, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '14px' }}>リアルタイム最新回答</p>
            {latest ? (
              <div style={{ background: '#0a0f0a', border: `1px solid ${C.green}22`, borderRadius: '6px', padding: '16px 20px' }}>
                <p style={{ color: C.green, fontSize: '10px', letterSpacing: '0.2em', marginBottom: '6px' }}>SESSION {latest.sessionId}</p>
                <p style={{ color: C.dim, fontSize: '11px', marginBottom: '8px' }}>{latest.question}</p>
                <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.7' }}>{latest.answer}</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.dim }}>
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
