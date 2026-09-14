// 回答保存時点の質問文。回答と問いの対応の唯一の真実。
//
//   session.questionTexts[key] = { text, isBackfilled, savedAt }
//
//   isBackfilled = false … 本人がそのとき画面で見た質問文をそのまま保存したもの
//   isBackfilled = true  … 2026-09 のバックフィルで「その時点の質問マスタ」を後から入れたもの。
//                          7/25 の質問変更をまたいだ回答もあるため、当時の文面とは限らない。
//
// 質問マスタ（lib/sessions.js）は「これから出題する文面」でしかない。
// 回答済みの問いの表示・AI渡しは必ずここを通す。マスタを書き換えても既存回答の問いが変わらないように。
//
// ※ session_data の blob 丸ごと上書きで消えないよう、/api/db/save は既存の questionTexts を
//   サーバー側で必ず残す（mergeQuestionTexts）。

export const BACKFILL_NOTE = '（この回答は当時の質問文が不明です）';

// 画面表示用。保存済みの質問文があればそれ、無ければマスタの文面。
export const questionTextFor = (session, key, fallback = '') =>
  session?.questionTexts?.[key]?.text || fallback;

export const isBackfilledQuestion = (session, key) =>
  !!session?.questionTexts?.[key]?.isBackfilled;

// AI渡し用。バックフィル分には注記を添える。
export const questionForAI = (session, key, fallback = '') => {
  const text = questionTextFor(session, key, fallback);
  return isBackfilledQuestion(session, key) ? `${text}${BACKFILL_NOTE}` : text;
};

export const newQuestionText = (text) => ({ text, isBackfilled: false, savedAt: new Date().toISOString() });

// 保存時のマージ。既にDBにある質問文は絶対に上書き・削除しない（incoming は追加だけできる）。
export const mergeQuestionTexts = (existing = {}, incoming = {}) => ({ ...(incoming || {}), ...(existing || {}) });

// 回答があるのに質問文が無いキーに、マスタの文面を isBackfilled=true で入れる。
// 既存の質問文には触らない。バックフィルスクリプトと /api/db/save（古い画面から保存された回答の救済）が使う。
// 戻り値: { session, filled }（filled = 新しく入れたキーの配列）
export const fillMissingQuestionTexts = (cfg, session) => {
  if (!cfg || !session?.answers) return { session, filled: [] };
  const qt = { ...(session.questionTexts || {}) };
  const filled = [];
  for (const [key, ans] of Object.entries(session.answers)) {
    if (!String(ans || '').trim() || qt[key]?.text) continue;
    const [pi, qi] = key.split('-').map(Number);
    const text = cfg.phases[pi]?.questions[qi];
    if (!text) continue;
    qt[key] = { text, isBackfilled: true, savedAt: null };
    filled.push(key);
  }
  return filled.length ? { session: { ...session, questionTexts: qt }, filled } : { session, filled };
};
