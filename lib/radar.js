// 五角形レーダーの軸。ここが単一の真実。
//
// 「仕事」は置かない。SENは意図的に仕事の話を排除する設計で（SESSION 3 で
// 「お金・地位以外で」と明示）、22問中0問。測る手段のない軸を置くと全員の
// 同じ角が凹み、「余白」ではなく「設計の穴」に見える。
// 代わりに「承認と動機」を置く（S1 2-0/2-1・S3 1-0/1-1 の4問が該当）。
export const RADAR_AXES = ['生き方', '環境', '承認と動機', '行動', '自己コントロール'];

// スコアは「その領域で本人がどれだけ自分の言葉を出せたか（自己開示の深さ）」。
// 能力・性格・優劣の点数ではない。
// 1 = 未踏（まだ言葉が出ていない）。欠如ではない。0は使わない。
export const SCORE_MIN = 1;
export const SCORE_MAX = 5;

// 保存形式は2種類を受け付ける（後方互換）：
//   旧: { "生き方": 4, ... }
//   新: { "生き方": { score: 4, reason: "..." }, ... }   ← reason はコーチにだけ見せる
const rawScore = (v) => (v && typeof v === 'object' ? v.score : v);

// AIが 0 や範囲外を返しても、0 はここから先に到達しない。
// 1軸でも欠けたら null を返す（歪んだ五角形やゼロ角を描かせないため）。
export const normalizeScores = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const axis of RADAR_AXES) {
    const v = Math.round(Number(rawScore(raw[axis])));
    if (!Number.isFinite(v)) return null;
    out[axis] = Math.min(SCORE_MAX, Math.max(SCORE_MIN, v));
  }
  return out;
};

// 各軸の根拠。★コーチ画面にだけ出す。本人には見せない。
export const extractReasons = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  let found = false;
  for (const axis of RADAR_AXES) {
    const v = raw[axis];
    const reason = v && typeof v === 'object' && typeof v.reason === 'string' ? v.reason.trim() : '';
    if (reason) found = true;
    out[axis] = reason;
  }
  return found ? out : null;
};

// へこんだ軸 = これから掘れる余白。
// 「弱い」「低い」「不足」「苦手」とは呼ばない。
export const getUnexplored = (scores) =>
  scores ? RADAR_AXES.filter(a => scores[a] <= 2) : [];

// 本人向けの説明。数値・点数・スコアには一切触れない。
export const RADAR_CAPTION_CLIENT = [
  'これは、今日出てきた言葉の形です。',
  '点数でも評価でもありません。',
  'へこみは「足りない」ではなく、「まだ言葉になっていない」というだけです。',
];

// コーチ向けの注記。数値を出す画面にだけ添える。
export const RADAR_CAPTION_COACH =
  'AIが回答群から「自己開示の深さ」を1〜5で採点したもの。能力・性格の評価ではない。AIの自己申告であり、コーチの観察が優先する。';
