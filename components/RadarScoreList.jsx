import { RADAR_AXES, SCORE_MAX, normalizeScores, extractReasons, RADAR_CAPTION_COACH } from '../lib/radar';

// ★コーチ画面専用。SelfAnalysisApp からは絶対に import しない。
//   本人には数値・スコア・根拠を見せない（見えた瞬間に採点表・診断書になる）。
//   数値と根拠の描画をこのファイルに隔離することで、RadarPentagon 側は
//   「数値を描くコードが存在しない」状態を保つ。
//
// 数値の意味は「その領域で本人がどれだけ言葉を出せたか（自己開示の深さ）」。
// 能力・性格の評価ではない。1 = 未踏。

export default function RadarScoreList({ scores: raw, title }) {
  const scores = normalizeScores(raw);
  if (!scores) return null;
  const reasons = extractReasons(raw);

  return (
    <div style={{ minWidth: '260px', maxWidth: '360px' }}>
      {title && (
        <p style={{ color: '#444', fontSize: '10px', letterSpacing: '0.2em', margin: '0 0 12px' }}>{title}</p>
      )}

      {RADAR_AXES.map(axis => (
        <div key={axis} style={{ marginBottom: reasons ? '12px' : '7px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#888', fontSize: '11px', flex: 1 }}>{axis}</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {Array.from({ length: SCORE_MAX }, (_, i) => (
                <span
                  key={i}
                  style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: i < scores[axis] ? '#c9a84c' : '#252525',
                  }}
                />
              ))}
            </div>
            <span style={{ color: '#c9a84c', fontSize: '11px', width: '14px', textAlign: 'right' }}>
              {scores[axis]}
            </span>
          </div>

          {/* 根拠（観察）。コーチにだけ見せる */}
          {reasons?.[axis] && (
            <p style={{ color: '#666', fontSize: '11px', lineHeight: '1.7', margin: '4px 0 0', paddingLeft: '2px' }}>
              {reasons[axis]}
            </p>
          )}
        </div>
      ))}

      <p style={{ color: '#444', fontSize: '10px', lineHeight: '1.7', margin: '12px 0 0', paddingTop: '10px', borderTop: '1px solid #1a1a1a' }}>
        {RADAR_CAPTION_COACH}
      </p>
    </div>
  );
}
