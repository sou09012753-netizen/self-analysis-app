// 既存の回答に「質問文」をバックフィルする（STEP 1）。
//
//   node scripts/backfill-question-texts.mjs          … dry-run（何も書かない。対象件数だけ出す）
//   node scripts/backfill-question-texts.mjs --apply  … 書き込む
//
// session_data.sessions[sid].questionTexts[key] = { text: <現在の質問マスタ>, isBackfilled: true, savedAt: null }
//
// 守ること：
//   - answers / conversations / insights / summary には触らない。questionTexts を足すだけ
//   - 既に questionTexts があるキーは上書きしない（fillMissingQuestionTexts）
//   - 書き込み前に backup/ に行ごと保存する（.gitignore 済み）
//   - 本人アプリの自動保存と競合しないよう、updated_at が読んだ時と同じ行だけ更新する
//     （ずれていたらスキップして報告。再実行すれば拾える）
//   - 書き込み後に読み直し、回答件数が増減していないことを検証する
//
// ※ 必ず STEP 4（質問マスタ差し替え）より前に実行すること。後だと新しい文面が入ってしまう。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { SESSIONS } from '../lib/sessions.js';
import { fillMissingQuestionTexts } from '../lib/questionTexts.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  if (!(key in process.env)) process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
}

const apply = process.argv.includes('--apply');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const countAnswers = (sd) => Object.values(sd?.sessions || {})
  .reduce((n, s) => n + Object.values(s?.answers || {}).filter(a => String(a || '').trim()).length, 0);

const { data: rows, error } = await supabase
  .from('coaching_users')
  .select('id, user_name, updated_at, session_data');
if (error) throw error;

if (apply) {
  mkdirSync(join(root, 'backup'), { recursive: true });
  const file = join(root, 'backup', `session_data_before_backfill_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(rows, null, 2));
  console.log(`バックアップ: ${file}`);
}

let totalAnswers = 0, totalFilled = 0, updated = 0, skipped = 0;
for (const row of rows) {
  const sd = row.session_data;
  const before = countAnswers(sd);
  totalAnswers += before;
  if (!sd?.sessions) continue;

  let filledHere = 0;
  const sessions = Object.fromEntries(Object.entries(sd.sessions).map(([sid, s]) => {
    const cfg = SESSIONS.find(c => String(c.id) === String(sid));
    const { session, filled } = fillMissingQuestionTexts(cfg, s);
    filledHere += filled.length;
    return [sid, session];
  }));
  if (filledHere === 0) continue;
  totalFilled += filledHere;
  console.log(`${row.user_name.padEnd(14)} 回答${before}件 / 質問文を入れる ${filledHere}件`);
  if (!apply) continue;

  const next = { ...sd, sessions };
  if (countAnswers(next) !== before) throw new Error(`${row.user_name}: 回答件数が変わるため中止`);

  // updated_at は変えない（コーチ一覧の並び・「最終更新」を動かさないため）
  const { data: res, error: upErr } = await supabase
    .from('coaching_users')
    .update({ session_data: next })
    .eq('id', row.id)
    .eq('updated_at', row.updated_at)
    .select('session_data');
  if (upErr) throw upErr;
  if (!res?.length) { skipped++; console.log(`  → スキップ（読んだ後に本人が保存した）`); continue; }
  if (countAnswers(res[0].session_data) !== before) throw new Error(`${row.user_name}: 書き込み後の回答件数が一致しない`);
  updated++;
}

console.log(`\n回答 ${totalAnswers}件 / 質問文を入れる ${totalFilled}件`);
console.log(apply ? `更新 ${updated}行 / スキップ ${skipped}行` : 'dry-run（書き込みなし）。実行するときは --apply');
