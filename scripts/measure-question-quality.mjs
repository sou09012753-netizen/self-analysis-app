// 質問リニューアル（2026-09）の効果測定。読み取り専用（select のみ）。
//
//   node scripts/measure-question-quality.mjs --since=2026-09-20
//
//   --since   差し替えを本番に出した日（この日以降に保存された回答だけを数える）。必須
//   --csv     質問ごとの表を CSV でも出す
//
// 集計対象：questionTexts[key].isBackfilled === false かつ savedAt >= --since
//           かつ 保存された質問文が現行マスタと一致するもの（差し替え前に開いていた画面からの回答を除く）
//
// 指標（監査と同じ定義）：
//   初回回答 … answers[key]（深掘り前の本文）
//   浅い回答 … 初回回答が SHORT_ANSWER_CHARS 字未満、または「わからない・特にない」を含む
//   深掘り往復 … conversations[key] のうち、深掘りの問いに本人が答えた回数

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { SESSIONS } from '../lib/sessions.js';
import { isRetired } from '../lib/retiredQuestions.js';
import { SHORT_ANSWER_CHARS } from '../lib/followups.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  if (!(key in process.env)) process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
}

const arg = (name) => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1];
const since = arg('since');
if (!since || Number.isNaN(Date.parse(since))) {
  console.error('\n✗ --since=YYYY-MM-DD（差し替えを本番に出した日）を渡してください\n');
  process.exit(1);
}
const sinceMs = Date.parse(since);

// 監査（2026-09）の実測値
const BASELINE = {
  1: { shallow: 62.9, chars: 37 },
  2: { shallow: 74.7, chars: 28 },
  3: { shallow: 73.3, chars: 35 },
  all: { shallow: 69.8, chars: 33 },
};
const TARGET = { shallow: 48, chars: 50 };

const DONT_KNOW = /わからない|分からない|わかりません|分かりません|わからん|特にない|特に無い|特になし|とくにない/;
const len = (s) => [...String(s || '').trim()].length;
const isShallow = (s) => len(s) < SHORT_ANSWER_CHARS || DONT_KNOW.test(String(s || ''));
const followupRounds = (thread) => Array.isArray(thread) ? thread.slice(1).filter(m => m.role === 'user').length : 0;
const median = (xs) => {
  if (!xs.length) return null;
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const mean = (xs) => xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : null;
const fmt = (x, d = 1) => x == null ? '-' : Number(x.toFixed(d));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { data: rows, error } = await supabase.from('coaching_users').select('id, user_name, session_data');
if (error) throw error;

// 質問ごとのバケツ（出題中の質問だけ。番号は本人画面と同じ通し番号）
const buckets = [];
for (const cfg of SESSIONS) {
  let n = 0;
  cfg.phases.forEach((phase, pi) => phase.questions.forEach((q, qi) => {
    if (isRetired(cfg.id, pi, qi)) return;
    n++;
    buckets.push({ sid: cfg.id, key: `${pi}-${qi}`, label: `S${cfg.id}#${n}`, question: q, lens: [], shallow: 0, rounds: [], users: new Set() });
  }));
}
const bucketOf = (sid, key) => buckets.find(b => b.sid === Number(sid) && b.key === key);

let excludedBackfilled = 0, excludedBefore = 0, excludedOldText = 0;
for (const row of rows) {
  for (const [sid, s] of Object.entries(row.session_data?.sessions || {})) {
    for (const [key, ans] of Object.entries(s?.answers || {})) {
      if (!String(ans || '').trim()) continue;
      const qt = s.questionTexts?.[key];
      const b = bucketOf(sid, key);
      if (!qt || qt.isBackfilled) { excludedBackfilled++; continue; }
      if (!qt.savedAt || Date.parse(qt.savedAt) < sinceMs) { excludedBefore++; continue; }
      if (!b || qt.text !== b.question) { excludedOldText++; continue; }
      b.lens.push(len(ans));
      if (isShallow(ans)) b.shallow++;
      b.rounds.push(followupRounds(s.conversations?.[key]));
      b.users.add(row.id);
    }
  }
}

const summarize = (bs) => {
  const lens = bs.flatMap(b => b.lens);
  const shallow = bs.reduce((n, b) => n + b.shallow, 0);
  return {
    回答数: lens.length,
    人数: new Set(bs.flatMap(b => [...b.users])).size,
    '初回文字数 中央値': fmt(median(lens)),
    '初回文字数 平均': fmt(mean(lens)),
    '浅い割合%': lens.length ? fmt(shallow / lens.length * 100) : '-',
    '深掘り往復 平均': fmt(mean(bs.flatMap(b => b.rounds)), 2),
  };
};

console.log(`\n集計対象：${since} 以降に保存された、質問文つきの回答（isBackfilled=false）`);
console.log(`除外：バックフィル・質問文なし ${excludedBackfilled}件 / ${since} より前 ${excludedBefore}件 / 旧文面で回答 ${excludedOldText}件\n`);

console.log('■ 質問ごと');
console.table(buckets.map(b => ({ 質問: b.label, ...summarize([b]), 文面: b.question.slice(0, 24) + '…' })));

console.log('■ セッションごと（ベースライン＝監査実測値、文字数は平均で比較）');
const sessionRows = [1, 2, 3].map(sid => {
  const r = summarize(buckets.filter(b => b.sid === sid));
  return { セッション: `SESSION ${sid}`, ...r, 'ベースライン 浅い%': BASELINE[sid].shallow, 'ベースライン 文字数': BASELINE[sid].chars };
});
const all = summarize(buckets);
sessionRows.push({ セッション: '全体', ...all, 'ベースライン 浅い%': BASELINE.all.shallow, 'ベースライン 文字数': BASELINE.all.chars });
console.table(sessionRows);

console.log(`■ 目標：全体の浅い割合 ${TARGET.shallow}% 以下 / 初回文字数 ${TARGET.chars}字 以上`);
const s1Users = summarize(buckets.filter(b => b.sid === 1)).人数;
if (all.回答数) {
  const okShallow = all['浅い割合%'] <= TARGET.shallow;
  const okChars = all['初回文字数 平均'] >= TARGET.chars;
  console.log(`  浅い割合 ${all['浅い割合%']}% → ${okShallow ? '達成' : '未達'}　/　文字数 平均${all['初回文字数 平均']}字・中央値${all['初回文字数 中央値']}字 → ${okChars ? '達成' : '未達'}`);
}
console.log(`  判定の目安：新規受講生 6〜8人が SESSION 1 を終えた時点（現在 SESSION 1 に回答した人：${s1Users}人）\n`);

if (process.argv.includes('--csv')) {
  const head = ['質問', '回答数', '人数', '初回文字数_中央値', '初回文字数_平均', '浅い割合%', '深掘り往復_平均', '文面'];
  const csv = [head, ...buckets.map(b => { const r = summarize([b]); return [b.label, r.回答数, r.人数, r['初回文字数 中央値'], r['初回文字数 平均'], r['浅い割合%'], r['深掘り往復 平均'], b.question]; })]
    .map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(',')).join('\n');
  console.log(csv);
}
