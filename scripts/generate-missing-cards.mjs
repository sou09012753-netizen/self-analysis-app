// 全問回答済みなのに自己分析シート（カード）が無いセッションのシートを作る。
// コーチ画面の「カードを生成して表示」と同じ処理をコマンドから行う。
//
//   node scripts/generate-missing-cards.mjs                       … 対象を出すだけ（生成しない）
//   node scripts/generate-missing-cards.mjs --apply --only=<id> --session=<1|2|3>
//
// 本番の API を叩く（ローカルに ANTHROPIC_API_KEY を置かないため）：
//   POST /api/claude        type=summary  … シート本文と五角形スコアを作る
//   POST /api/admin/save-card             … session_data にシートを保存し、表示ゲートを開ける
//
// コーチのパスコードは coaches テーブルから読む（画面と同じ認証。表示はしない）。
//
// 注意：生成した瞬間に本人がアプリを開いたままだと、本人の blob 上書きでシートが消えることがある
//       （既知の競合）。実行後にDBを読んで残っているか必ず確かめること。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { SESSIONS } from '../lib/sessions.js';
import { visibleQuestions, countActiveQuestions } from '../lib/retiredQuestions.js';
import { answerWithFollowups } from '../lib/followups.js';
import { questionForAI } from '../lib/questionTexts.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  if (!(key in process.env)) process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
}

const BASE = process.env.APP_URL || 'https://self-analysis-app-delta.vercel.app';
const arg = (n) => process.argv.find(a => a.startsWith(`--${n}=`))?.split('=')[1];
const apply = process.argv.includes('--apply');
const only = arg('only');
const onlySession = arg('session');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data: rows, error } = await supabase
  .from('coaching_users')
  .select('id, user_name, coach_id, archived_at, session_data')
  .is('archived_at', null);
if (error) throw error;

// 全問回答済み（出題中の質問だけで数える）なのにシートが無いセッション
const targets = [];
for (const row of rows) {
  for (const cfg of SESSIONS) {
    const s = row.session_data?.sessions?.[String(cfg.id)];
    if (!s) continue;
    const answered = Object.entries(s.answers || {}).filter(([k, a]) => String(a || '').trim() && !(cfg.id === 1 && k === '1-0')).length;
    if (answered < countActiveQuestions(cfg.id, cfg.phases)) continue;
    if (s.status === 'completed' && s.summary) continue;
    targets.push({ row, cfg, session: s });
  }
}

const list = targets.filter(t => (!only || t.row.id === only) && (!onlySession || String(t.cfg.id) === onlySession));
console.log(`対象 ${targets.length}件` + (only || onlySession ? ` / 今回 ${list.length}件` : ''));
for (const t of list) console.log(`  ${t.row.user_name}  SESSION ${t.cfg.id}  ${t.row.id}`);
if (!apply) { console.log('\n生成しない（--apply --only=<id> --session=<n> で実行）'); process.exit(0); }
if (list.length !== 1) { console.error('\n✗ --only と --session で1件に絞ってください'); process.exit(1); }

const [{ row, cfg, session }] = list;

const { data: coach } = await supabase.from('coaches').select('passcode').eq('id', row.coach_id).single();
if (!coach?.passcode) { console.error('✗ コーチのパスコードが取れません'); process.exit(1); }
const headers = { 'Content-Type': 'application/json', 'x-coach-passcode': coach.passcode };

// コーチ画面と同じ組み立て。回答済みの問いは保存時の質問文で渡す。
const allAnswers = cfg.phases.map((phase, pi) => ({
  phase: phase.title,
  qa: visibleQuestions(cfg.id, pi, phase, session.answers).map(({ q, key }) => ({
    question: questionForAI(session, key, q),
    answer: answerWithFollowups(session, key),
  })),
}));
const previousSummaries = [];
for (let i = 1; i < cfg.id; i++) {
  const prev = row.session_data.sessions?.[String(i)];
  if (prev?.summary) previousSummaries.push({ sessionNumber: i, title: SESSIONS[i - 1].title, summary: prev.summary });
}

console.log(`\n${row.user_name} SESSION ${cfg.id} のシートを生成します（前セッションのシート ${previousSummaries.length}件を参照）...`);
const r = await fetch(`${BASE}/api/claude`, {
  method: 'POST', headers,
  body: JSON.stringify({ type: 'summary', sessionNumber: cfg.id, userName: row.user_name, allAnswers, previousSummaries }),
});
const json = await r.json();
if (!r.ok || !json.text) { console.error('✗ 生成に失敗:', json.error || r.status); process.exit(1); }
console.log(`  本文 ${json.text.length}字 / スコア ${json.scores ? 'あり' : 'なし'}`);

const save = await fetch(`${BASE}/api/admin/save-card`, {
  method: 'POST', headers,
  body: JSON.stringify({ userId: row.id, sessionId: cfg.id, summary: json.text, scores: json.scores || null }),
});
const saveJson = await save.json().catch(() => ({}));
if (!save.ok) { console.error('✗ 保存に失敗:', saveJson.error || save.status); process.exit(1); }
console.log('  保存しました（状態=完了、シートの表示ゲートを開けました）');
