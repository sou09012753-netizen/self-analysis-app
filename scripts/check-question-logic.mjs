// 質問リニューアル（2026-09）の仕様が壊れていないかを確かめる。DBにも本番にも触らない。
//
//   node scripts/check-question-logic.mjs
//
// 深掘りの上限・SESSION 1 の禁止ルール・質問文の取り回し・SESSION 3 の過去回答表示を検査する。

import { followupMaxDepth, SHORT_ANSWER_CHARS, getPendingFollowup, answerWithFollowups } from '../lib/followups.js';
import { questionTextFor, questionForAI, newQuestionText, mergeQuestionTexts } from '../lib/questionTexts.js';
import { SESSIONS } from '../lib/sessions.js';
import { visibleQuestions } from '../lib/retiredQuestions.js';
import { readFileSync } from 'node:fs';
let ng = 0;
const ok = (label, cond, extra='') => { console.log(`${cond ? '✓' : '✗'} ${label}${extra?'  '+extra:''}`); if(!cond) ng++; };

// STEP2: 深掘り上限
const short = 'まだよく分からないです', long = 'あ'.repeat(40);
ok('S1 短い回答(13字) → 上限2回', followupMaxDepth(1, short) === 2);
ok('S1 40字ちょうど → 上限1回', followupMaxDepth(1, long) === 1);
ok('S1 39字 → 上限2回', followupMaxDepth(1, 'あ'.repeat(39)) === 2);
ok('S2 は常に3回', followupMaxDepth(2, short) === 3 && followupMaxDepth(2, long) === 3);
ok('S3 は常に3回', followupMaxDepth(3, short) === 3);
ok('しきい値は40字', SHORT_ANSWER_CHARS === 40);

// サーバー側の打ち切り（claude.js の実装を読む）
const api = readFileSync(new URL('../pages/api/claude.js', import.meta.url),'utf8');
ok('depth >= maxDepth で「十分です」を返す', /if \(depth >= maxDepth\) return res\.json\(\{ text: '十分です' \}\)/.test(api));
ok('S1 のときだけ追加ルールを足す', /Number\(sessionNumber\) === 1 \? SESSION1_FOLLOWUP_RULES : ''/.test(api));
// STEP3: 禁止文言がルールに含まれるか
for (const w of ['つまり〜ですね','〜に近くないですか','解釈・仮説・言い換えを提示しない','矛盾・言い訳・回避を指摘しない'])
  ok(`S1ルールに「${w}」`, api.includes(w));

// STEP1: 質問文の取り回し
const master = SESSIONS[0].phases[0].questions[1];
const answered = { answers: { '0-1': 'x' } };
ok('バックフィル前の回答は旧文面', questionTextFor(answered, '0-1', master).startsWith('そのモヤモヤは、'));
ok('AI渡しに注記が付く', questionForAI(answered, '0-1', master).includes('当時の質問文が不明'));
const saved = { answers: { '0-1': 'x' }, questionTexts: { '0-1': newQuestionText('SAVED') } };
ok('保存済みは保存文面・注記なし', questionForAI(saved, '0-1', master) === 'SAVED');
ok('未回答は新しい文面', questionTextFor({ answers: {} }, '0-1', master) === master);
ok('保存時マージで既存が勝つ', mergeQuestionTexts({a:{text:'DB'}}, {a:{text:'新'},b:{text:'追加'}}).a.text === 'DB');

// STEP4: 差し替え結果
ok('S1 は8問出題（停止1問を除く）', visibleQuestions(1,1,SESSIONS[0].phases[1],{}).length === 2);
ok('S3#4 は過去回答を参照する問い', SESSIONS[2].phases[2].questions[0].startsWith('SESSION 1・2で答えた中で'));
const app = readFileSync(new URL('../components/SelfAnalysisApp.jsx', import.meta.url),'utf8');
ok('S3#4（キー 2-0）で過去回答を表示', /PAST_ANSWERS_AT = \{ sessionId: 3, key: '2-0' \}/.test(app));
ok('深掘り中も表示が続く', /followUp \? followupKeyRef\.current :/.test(app));

// 深掘りスレッドの整形
const sess = { answers:{'0-0':'本文'}, conversations:{'0-0':[{role:'user',content:'質問：Q\n本文'},{role:'assistant',content:'深掘り1'},{role:'user',content:'追加'}]} };
ok('往復の復元', getPendingFollowup(sess, SESSIONS[0]) === null);
ok('本文＋深掘りの連結', answerWithFollowups(sess,'0-0').includes('【深掘り】深掘り1'));

console.log(ng ? `\n✗ ${ng}件 失敗` : '\n全て期待どおり');
process.exit(ng ? 1 : 0);
