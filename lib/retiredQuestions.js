// 出題を停止した質問。
//
// 2026-09: SESSION 1 フェーズ1（過去から現在を読む）の
//          「親に『ありがとう』と直接言ったことはありますか。」を停止。
//
// 回答・深掘り・気づきメモはすべて `${phaseIdx}-${qIdx}` をキーに保存されている。
// questions 配列から要素を消すと後続の質問のキーがずれ、既に回答済みの
// クライアント18人分の回答が別の質問に紐づいてしまう。
// そのため配列からは消さず、「出題対象からのみ除外する」形で停止する。
//
// 停止済みの質問は、既に回答があるクライアントにだけ表示する（過去データの保全）。
// 新規クライアントには出題されず、表示にも出ない。

const RETIRED = new Set([
  '1:1-0', // 親に「ありがとう」と直接言ったことはありますか。
]);

export const isRetired = (sessionId, pi, qi) => RETIRED.has(`${sessionId}:${pi}-${qi}`);

// そのセッションで実際に出題される質問数（進捗表示・完了判定用）
export const countActiveQuestions = (sessionId, phases) =>
  phases.reduce(
    (n, phase, pi) => n + phase.questions.filter((_, qi) => !isRetired(sessionId, pi, qi)).length,
    0,
  );

// 表示・AI渡し用の質問リスト。停止済みは回答がある場合だけ残す。
export const visibleQuestions = (sessionId, pi, phase, answers = {}) =>
  phase.questions
    .map((q, qi) => ({ q, qi, key: `${pi}-${qi}` }))
    .filter(({ qi, key }) => !isRetired(sessionId, pi, qi) || !!answers[key]);
