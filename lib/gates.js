// coach_gates 列の読み書きヘルパ。ここが解放ゲートの単一の真実。
// クライアント・コーチ・サーバーが同じ意味で解釈するために全員ここを通す。
//
// 形: { "1": {sessionOpen, cardReleased}, "2": {...}, "3": {...} }

// コーチが本人に許可できるゲート。set-gate.js のホワイトリストにも使う。
export const GATE_FIELDS = ['sessionOpen', 'cardReleased'];

// そのセッションを本人が開いて回答できるか。
// セッション1は常に開く（新規クライアントがすぐ着手できるように）。
export const isSessionOpen = (gates, sessionId) => {
  if (Number(sessionId) === 1) return true;
  return !!gates?.[String(sessionId)]?.sessionOpen;
};

// 自己分析シート（カード）を本人画面に出してよいか。コーチが表示許可するまで false。
export const isCardReleased = (gates, sessionId) =>
  !!gates?.[String(sessionId)]?.cardReleased;

// 1セッション分のゲートを安全に取り出す（未設定なら全部 false の形で返す）。
export const gateFor = (gates, sessionId) => ({
  sessionOpen: isSessionOpen(gates, sessionId),
  cardReleased: isCardReleased(gates, sessionId),
});
