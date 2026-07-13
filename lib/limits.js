// コーチ1人あたりのクライアント登録上限（アーカイブ済みは数に含めない）
//
// 将来コーチ単位で可変にする場合は coaches テーブルに max_clients 列を足し、
// この定数はフォールバック値として使う。
export const MAX_CLIENTS_PER_COACH = 10;
