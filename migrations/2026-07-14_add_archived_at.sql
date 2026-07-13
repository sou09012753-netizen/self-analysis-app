-- クライアントの論理削除（アーカイブ）
--
-- NULL         = アクティブ
-- タイムスタンプ = アーカイブ済み（一覧・登録上限カウントから除外）
--
-- 物理削除はしない。回答データは残す。復元は archived_at を NULL に戻すだけ。
--
-- ※ session_data(JSON) の中にフラグを持たせない理由：
--    /api/db/save.js はクライアントが持つ session_data を丸ごと upsert するため、
--    アーカイブ後にそのクライアントがアプリを開くとフラグが上書きで消える。
--    列として独立させる必要がある。

alter table public.coaching_users
  add column if not exists archived_at timestamptz default null;

-- コーチごとのアクティブなクライアント一覧・件数カウント用の部分索引
create index if not exists coaching_users_coach_active_idx
  on public.coaching_users (coach_id)
  where archived_at is null;
