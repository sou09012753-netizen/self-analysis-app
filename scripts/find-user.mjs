// なぜ特定メールのクライアントがコーチ一覧に出ないのかを切り分ける読み取り専用の診断。
// 何も変更しない（select と auth.admin.listUsers のみ）。
//
//   node scripts/find-user.mjs <email>
//
// SUPABASE_URL / SUPABASE_SERVICE_KEY は .env.local から読む（無ければ process.env）。
//
// コーチ一覧は /api/admin/coach-data(action='clients') が
//   .eq('coach_id', coach.id).is('archived_at', null)
// で引くので、次のどれかに当たると「出てこない」：
//   - Auth にそのメールが無い            → 認証に無い
//   - Auth はあるが coaching_users 行なし → 孤児
//   - 行はあるが archived_at が入っている  → アーカイブ
//   - 行はあるが別のコーチに紐づく         → 別コーチ
//   - 行はあるが coach_id が null/壊れている → 孤児（coach未割当）

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local を最小パースして process.env に載せる（Next と同じファイルを見る）
const loadEnvLocal = () => {
  const path = join(__dirname, '..', '.env.local');
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return; // 無ければ process.env をそのまま使う
  }
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
};

const die = (msg) => { console.error(`\n✗ ${msg}\n`); process.exit(1); };

const main = async () => {
  loadEnvLocal();

  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) die('メールアドレスを渡してください: node scripts/find-user.mjs <email>');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    die('SUPABASE_URL / SUPABASE_SERVICE_KEY が見つかりません（.env.local か環境変数に設定してください）');
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log(`\n── 診断: ${email} ──\n`);

  // 1) Auth にそのメールがいるか（listUsers をページングして探す）
  let authUser = null;
  for (let page = 1; page <= 50 && !authUser; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) die(`auth.admin.listUsers 失敗: ${error.message}`);
    const users = data?.users || [];
    authUser = users.find(u => (u.email || '').toLowerCase() === email) || null;
    if (users.length < 1000) break; // 最終ページ
  }

  if (!authUser) {
    console.log('Auth(users)      : 見つからない');
    console.log('\n【判定】認証に無い');
    console.log('  → このメールで Supabase Auth のユーザーが存在しない。');
    console.log('     招待/作成が完了していないか、別メールで登録されている可能性。\n');
    return;
  }

  console.log(`Auth(users)      : あり  id=${authUser.id}`);
  console.log(`                   created_at=${authUser.created_at || '?'}`);
  console.log(`                   confirmed=${authUser.email_confirmed_at ? 'yes' : 'no'}`);

  // 2) coaching_users にその id の行があるか（アプリは user.id をそのまま行の id にする）
  const { data: row, error: rowErr } = await supabase
    .from('coaching_users')
    .select('id, user_name, coach_id, archived_at, updated_at')
    .eq('id', authUser.id)
    .maybeSingle();
  if (rowErr) die(`coaching_users 参照失敗: ${rowErr.message}`);

  if (!row) {
    console.log('coaching_users   : 行なし');
    console.log('\n【判定】孤児');
    console.log('  → Auth ユーザーはあるが coaching_users に行が無い。');
    console.log('     一度もアプリでデータ保存(初回save)が走っていない可能性。\n');
    return;
  }

  console.log(`coaching_users   : あり  user_name=${row.user_name ?? '(空)'}`);
  console.log(`                   coach_id=${row.coach_id ?? 'null'}`);
  console.log(`                   archived_at=${row.archived_at ?? 'null'}`);

  // 3) アーカイブされているか
  if (row.archived_at) {
    console.log('\n【判定】アーカイブ');
    console.log(`  → archived_at=${row.archived_at} が入っているため一覧から除外されている。`);
    console.log('     コーチ画面「アーカイブ済み」から復元すれば戻る。\n');
    return;
  }

  // 4) coach_id の状態
  if (!row.coach_id) {
    console.log('\n【判定】孤児（coach未割当）');
    console.log('  → coach_id が null。どのコーチの一覧にも出ない。\n');
    return;
  }

  const { data: coach, error: coachErr } = await supabase
    .from('coaches')
    .select('id, name')
    .eq('id', row.coach_id)
    .maybeSingle();
  if (coachErr) die(`coaches 参照失敗: ${coachErr.message}`);

  if (!coach) {
    console.log(`coaches          : coach_id=${row.coach_id} に該当なし`);
    console.log('\n【判定】孤児（coach_idが壊れている）');
    console.log('  → coach_id が存在しないコーチを指している。どの一覧にも出ない。\n');
    return;
  }

  console.log(`coaches          : coach_id=${coach.id}  name=${coach.name}`);
  console.log('\n【判定】別コーチ');
  console.log(`  → このクライアントはコーチ「${coach.name}」(id=${coach.id}) に紐づいている。`);
  console.log('     このコーチのパスコードで入った一覧にだけ表示される。');
  console.log('     別のコーチを探しているなら、それが「出てこない」理由。\n');
};

main().catch(e => die(e?.message || String(e)));
