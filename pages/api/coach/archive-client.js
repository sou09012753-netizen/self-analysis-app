import { getSupabase } from '../../../lib/supabase';
import { validateCoachPasscode } from '../../../lib/coachAuth';
import { MAX_CLIENTS_PER_COACH } from '../../../lib/limits';

// クライアントの論理削除（アーカイブ）。物理削除はしない。
// restore: true で復元（コーチ画面の「アーカイブ済み」セクションから呼ぶ）
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const passcode = req.headers['x-coach-passcode'];
  const coach = await validateCoachPasscode(passcode);
  if (!coach) return res.status(401).json({ error: 'パスコードが違います' });

  const { userId, restore } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId は必須です' });

  const supabase = getSupabase();

  // 復元は枠を1つ消費する。create-client と同じ上限で弾く（無制限なら素通り）。
  if (restore && MAX_CLIENTS_PER_COACH != null) {
    const { count, error: countError } = await supabase
      .from('coaching_users')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', coach.id)
      .is('archived_at', null);
    if (countError) return res.status(500).json({ error: countError.message });
    if (count >= MAX_CLIENTS_PER_COACH) {
      return res.status(409).json({
        error: `クライアント登録は${MAX_CLIENTS_PER_COACH}人までです。他のクライアントをアーカイブしてから戻してください。`,
      });
    }
  }

  // 所有者検証は update の where に入れる。
  // 事前 select → update だと間に coach_id が変わりうるため、条件を書き込み文に持たせる。
  const { data, error } = await supabase
    .from('coaching_users')
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq('id', userId)
    .eq('coach_id', coach.id)
    .select('id');

  if (error) return res.status(500).json({ error: error.message });

  // 他コーチのクライアントを指定した場合もここに落ちる。
  // 「存在しない」と「担当ではない」を区別せず、行の存在を漏らさない。
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'クライアントが見つかりません' });
  }

  return res.json({ ok: true });
}
