// conversations[key] が深掘りスレッドの唯一の真実。
//
//   thread[0] = { role: 'user',      content: `質問：<元の質問>\n<元の回答>` }
//   以降       = assistant（深掘り質問）と user（深掘り回答）が交互
//
//   末尾が assistant → 深掘り進行中（回答待ち）
//   末尾が user      → 深掘り完了
//   thread が無い    → 深掘りなし
//
// answers[key] には元の回答だけを入れる。深掘り回答で上書きしない。

// 元の回答に深掘りのやりとりを連結する（カード・レポート・統合doc・エクスポート用）
export const answerWithFollowups = (session, key, fallback = '未回答') => {
  const base = session?.answers?.[key] || fallback;
  const thread = session?.conversations?.[key];
  if (!Array.isArray(thread) || thread.length < 2) return base;
  const turns = thread.slice(1).map(m =>
    m.role === 'assistant' ? `\n\n【深掘り】${m.content}` : `\n【回答】${m.content}`
  ).join('');
  return base + turns;
};

// 回答待ちの深掘りを conversations から導出する（リロード時の復元用）
export const getPendingFollowup = (session, cfg) => {
  const conv = session?.conversations || {};
  for (const [key, thread] of Object.entries(conv)) {
    if (!Array.isArray(thread) || thread.length === 0) continue;
    const last = thread[thread.length - 1];
    if (last.role !== 'assistant') continue;
    const [pi, qi] = key.split('-').map(Number);
    return {
      key,
      question: cfg.phases[pi]?.questions[qi] || '',
      followUp: last.content,
      depth: thread.filter(m => m.role === 'assistant').length,
      history: thread,
    };
  }
  return null;
};

// 1問あたりの深掘りの上限回数。
//
//   SESSION 1    … 初回回答（深掘り前）が SHORT_ANSWER_CHARS 字未満なら 2回、それ以上なら 1回
//   SESSION 2・3 … 3回
//
// 監査で「浅い回答」を 40字未満としたのに合わせている（scripts/measure-question-quality.mjs と同じ基準）。
export const SHORT_ANSWER_CHARS = 40;

export const followupMaxDepth = (sessionId, firstAnswer = '') => {
  if (Number(sessionId) !== 1) return 3;
  return String(firstAnswer).trim().length < SHORT_ANSWER_CHARS ? 2 : 1;
};
