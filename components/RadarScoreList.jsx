import { RADAR_AXES, SCORE_MAX } from '../lib/radar';

// ★コーチ画面専用。SelfAnalysisApp からは絶対に import しない。
//   本人には数値・点数・目盛りを見せない（見えた瞬間に採点表になる）。
//   数値描画をこのファイルに隔離することで、RadarPentagon 側は
//   「数値を描くコードが存在しない」状態を保つ。
//
// 数値の意味は本人向けと同じ「その領域で本人がどれだけ言葉を出せたか（自己開示の深さ）」。
// 能力・性格の評価ではない。1 = 未踏。

export default function RadarScoreList({ scores, title }) {
  if (!scores) return null;

  return (
    <div style={{ minWidth: '180px' }}>
      {title && (
        <p style={{ color: '#444', fontSize: '10px', letterSpacing: '0.2em', margin: '0 0 10px' }}>{title}</p>
      )}
      {RADAR_AXES.map(axis => (
        <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
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
      ))}
      <p style={{ color: '#444', fontSize: '10px', lineHeight: '1.7', margin: '10px 0 0' }}>
        自己開示の深さ（1＝未踏）。能力・性格の評価ではない。
      </p>
    </div>
  );
}
