-- コーチが握る「解放ゲート」。クライアントには一切書かせない。
--
-- 形: { "1": {"sessionOpen": true, "cardReleased": true},
--       "2": {"sessionOpen": false, "cardReleased": false}, ... }
--
--   sessionOpen  = そのセッションを本人が開いて回答できるか（コーチが開く）
--                  ※ セッション1は常に開く（lib/gates.js 側で id===1 を true 固定）
--   cardReleased = 自己分析シート（カード）を本人画面に出してよいか（コーチが表示許可）
--
-- ※ session_data(JSON) の中に持たせない理由：
--    /api/db/save.js はクライアントが持つ session_data を丸ごと upsert する。
--    コーチがゲートを開けた直後、本人がアプリを開いたまま自動保存すると、
--    ゲートを知らない古い blob に上書きされて消える（radar_scores・answers が
--    消えたのと同じ経路）。本人が絶対に書かない別列に隔離することで、
--    ライブセッション中にコーチが開けても消えない。

alter table public.coaching_users
  add column if not exists coach_gates jsonb not null default '{}'::jsonb;
