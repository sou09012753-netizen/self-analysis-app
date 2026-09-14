// 回答保存時点の質問文。回答と問いの対応の唯一の真実。
//
//   session.questionTexts[key] = { text, isBackfilled, savedAt }
//
//   isBackfilled = false … 本人がそのとき画面で見た質問文をそのまま保存したもの
//   isBackfilled = true  … 2026-09 のバックフィルで「リニューアル前の質問文」を後から入れたもの。
//                          7/25 の質問変更をまたいだ回答もあるため、当時の文面とは限らない。
//
// 質問マスタ（lib/sessions.js）は「これから出題する文面」でしかない。
// 回答済みの問いの表示・AI渡しは必ずここを通す。マスタを書き換えても既存回答の問いが変わらないように。
//
// ※ session_data の blob 丸ごと上書きで消えないよう、/api/db/save は既存の questionTexts を
//   サーバー側で必ず残す（mergeQuestionTexts）。

import { LEGACY_QUESTIONS } from './legacyQuestions.js';
import { SESSIONS } from './sessions.js';

export const BACKFILL_NOTE = '（この回答は当時の質問文が不明です）';

// 現行マスタの文面 → 同じ位置のリニューアル前の文面
const LEGACY_BY_MASTER = new Map(SESSIONS.flatMap(cfg => cfg.phases.flatMap((phase, pi) =>
  phase.questions.map((q, qi) => [q, LEGACY_QUESTIONS[cfg.id]?.[pi]?.[qi]]))).filter(([, t]) => t));

// 回答済みなのに質問文がまだ保存されていない（バックフィル前の）回答。新しい文面を出さず、リニューアル前の文面を使う。
const unsavedAnswered = (session, key) =>
  !session?.questionTexts?.[key]?.text && !!String(session?.answers?.[key] || '').trim();

// 画面表示用。保存済みの質問文 → （バックフィル前の回答なら）リニューアル前の文面 → 渡された文面。
export const questionTextFor = (session, key, fallback = '') =>
  session?.questionTexts?.[key]?.text
  || (unsavedAnswered(session, key) && LEGACY_BY_MASTER.get(fallback))
  || fallback;

// 保存済みの質問文が無い回答も「当時の質問文は不明」扱い
export const isBackfilledQuestion = (session, key) =>
  session?.questionTexts?.[key] ? !!session.questionTexts[key].isBackfilled : unsavedAnswered(session, key);

// AI渡し用。バックフィル分には注記を添える。
export const questionForAI = (session, key, fallback = '') => {
  const text = questionTextFor(session, key, fallback);
  return isBackfilledQuestion(session, key) ? `${text}${BACKFILL_NOTE}` : text;
};

export const newQuestionText = (text) => ({ text, isBackfilled: false, savedAt: new Date().toISOString() });

// 保存時のマージ。既にDBにある質問文は絶対に上書き・削除しない（incoming は追加だけできる）。
export const mergeQuestionTexts = (existing = {}, incoming = {}) => ({ ...(incoming || {}), ...(existing || {}) });

// 回答があるのに質問文が無いキーに、リニューアル前の文面（lib/legacyQuestions.js）を isBackfilled=true で入れる。
// 現行マスタは使わない（マスタ差し替え後に呼ばれても、新しい文面が古い回答に付かないように）。
// 既存の質問文には触らない。バックフィルスクリプトと /api/db/save（古い画面から保存された回答の救済）が使う。
// 戻り値: { session, filled }（filled = 新しく入れたキーの配列）
export const fillMissingQuestionTexts = (sessionId, session) => {
  const legacy = LEGACY_QUESTIONS[Number(sessionId)];
  if (!legacy || !session?.answers) return { session, filled: [] };
  const qt = { ...(session.questionTexts || {}) };
  const filled = [];
  for (const [key, ans] of Object.entries(session.answers)) {
    if (!String(ans || '').trim() || qt[key]?.text) continue;
    const [pi, qi] = key.split('-').map(Number);
    const text = legacy[pi]?.[qi];
    if (!text) continue;
    qt[key] = { text, isBackfilled: true, savedAt: null };
    filled.push(key);
  }
  return filled.length ? { session: { ...session, questionTexts: qt }, filled } : { session, filled };
};
