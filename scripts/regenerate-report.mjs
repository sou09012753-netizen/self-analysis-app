// 診断レポートを今の回答から作り直す（コーチ画面の「再生成」と同じ処理）。
//
//   node scripts/regenerate-report.mjs --only=<user_id>           … 今の状態を出すだけ
//   node scripts/regenerate-report.mjs --only=<user_id> --apply   … 作り直して上書きする
//
// 削除はしない。上書き前の本文は backup/ に保存する。
// 回答が1件も無いクライアントは作り直さない（AIが「回答データが添付されていない」と返すため）。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

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
const only = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];
const apply = process.argv.includes('--apply');
if (!only) { console.error('✗ --only=<user_id> を渡してください'); process.exit(1); }

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data: row, error } = await supabase
  .from('coaching_users')
  .select('id, user_name, coach_id, session_data')
  .eq('id', only)
  .single();
if (error) throw error;

const answerCount = Object.values(row.session_data?.sessions || {})
  .reduce((n, s) => n + Object.values(s?.answers || {}).filter(a => String(a || '').trim()).length, 0);

const { data: current } = await supabase
  .from('coach_reports').select('report_text, updated_at').eq('user_id', row.id).maybeSingle();

console.log(`${row.user_name}  回答 ${answerCount}件`);
console.log(`  今のレポート: ${current ? `${current.report_text.length}字 / ${current.updated_at?.slice(0, 10)}` : 'なし'}`);
if (current) console.log(`  冒頭: ${current.report_text.slice(0, 60).replace(/\n/g, ' ')}`);
if (!apply) { console.log('\n作り直さない（--apply で実行）'); process.exit(0); }
if (answerCount === 0) { console.error('\n✗ 回答が1件もないので作り直さない'); process.exit(1); }

const { data: coach } = await supabase.from('coaches').select('passcode').eq('id', row.coach_id).single();
if (!coach?.passcode) { console.error('✗ コーチのパスコードが取れません'); process.exit(1); }
const headers = { 'Content-Type': 'application/json', 'x-coach-passcode': coach.passcode };

if (current) {
  mkdirSync(join(root, 'backup'), { recursive: true });
  const file = join(root, 'backup', `coach_report_${row.id}_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
  writeFileSync(file, current.report_text);
  console.log(`  上書き前の本文を保存: ${file}`);
}

const { data: works } = await supabase
  .from('work_responses').select('session_no, work_text, response_text').eq('user_id', row.id).order('session_no');

console.log('\n作り直しています（30〜60秒）...');
const r = await fetch(`${BASE}/api/claude`, {
  method: 'POST', headers,
  body: JSON.stringify({ type: 'report', userName: row.user_name, sessionData: row.session_data, workResponses: works || [] }),
});
const json = await r.json();
if (!r.ok || !json.text) { console.error('✗ 生成に失敗:', json.error || r.status); process.exit(1); }

const save = await fetch(`${BASE}/api/admin/report`, {
  method: 'POST', headers,
  body: JSON.stringify({ userId: row.id, reportText: json.text }),
});
if (!save.ok) { console.error('✗ 保存に失敗:', (await save.json().catch(() => ({}))).error || save.status); process.exit(1); }
console.log(`  保存しました（${json.text.length}字）`);
console.log(`  冒頭: ${json.text.slice(0, 80).replace(/\n/g, ' ')}`);
