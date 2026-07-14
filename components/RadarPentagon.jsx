import { RADAR_AXES, SCORE_MAX, normalizeScores, getUnexplored, RADAR_CAPTION_CLIENT } from '../lib/radar';

// 五角形レーダー。本人画面・コーチ画面の両方がこれを使う。
//
// ★このコンポーネントは数値を描画しない。<text> は軸ラベル（生き方 等）にのみ使う。
//   目盛りの数字・スコア値・凡例の数値を描くコードは、フラグの裏にも置かない。
//   数値と根拠が必要なコーチ画面は、隣に RadarScoreList を並べる（coach.jsx 専用）。
//
// ★説明文はこのコンポーネントに埋め込む。外から渡す形にすると、
//   渡し忘れで「説明のない五角形」が出てしまう（＝点数表に見える）。
//
// layers: [{ label, scores, color }] — 1枚ならセッション単体、3枚なら統合（重ね描き）
//   scores は旧形式（数値）でも新形式（{score, reason}）でもよい。ここで正規化する。

const pointAt = (axisIdx, ratio, cx, cy, r) => {
  const angle = (Math.PI * 2 * axisIdx) / RADAR_AXES.length - Math.PI / 2;
  return [cx + Math.cos(angle) * r * ratio, cy + Math.sin(angle) * r * ratio];
};

const polygonFor = (ratios, cx, cy, r) =>
  RADAR_AXES.map((_, i) => pointAt(i, ratios[i], cx, cy, r).join(',')).join(' ');

export default function RadarPentagon({ layers = [], size = 300, caption = true }) {
  const drawable = layers
    .map(l => (l ? { ...l, scores: normalizeScores(l.scores) } : null))
    .filter(l => l && l.scores);
  if (drawable.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = size * 0.33;

  const rings = [0.25, 0.5, 0.75, 1].map(f =>
    polygonFor(RADAR_AXES.map(() => f), cx, cy, r)
  );

  // 全レイヤーで未踏の軸だけを「余白」として挙げる
  const unexplored = RADAR_AXES.filter(axis =>
    drawable.every(l => getUnexplored(l.scores).includes(axis))
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
        {rings.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#2a2a2a" strokeWidth="1" />
        ))}
        {RADAR_AXES.map((_, i) => {
          const [x, y] = pointAt(i, 1, cx, cy, r);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#2a2a2a" strokeWidth="1" />;
        })}

        {drawable.map((layer, li) => (
          <polygon
            key={li}
            points={polygonFor(RADAR_AXES.map(a => layer.scores[a] / SCORE_MAX), cx, cy, r)}
            fill={layer.color}
            fillOpacity={drawable.length > 1 ? 0.14 : 0.22}
            stroke={layer.color}
            strokeWidth="1.5"
          />
        ))}

        {/* <text> は軸ラベルのみ。数値は一切描かない */}
        {RADAR_AXES.map((axis, i) => {
          const [x, y] = pointAt(i, 1.28, cx, cy, r);
          return (
            <text
              key={axis}
              x={x} y={y}
              textAnchor="middle" dominantBaseline="middle"
              fill="#888" fontSize="11"
              style={{ fontFamily: "'Noto Serif JP', Georgia, serif" }}
            >
              {axis}
            </text>
          );
        })}
      </svg>

      {drawable.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', marginTop: '10px' }}>
          {drawable.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '2px', background: l.color, display: 'inline-block' }} />
              <span style={{ color: '#888', fontSize: '10px', letterSpacing: '0.08em' }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* 説明文はチャートと不可分。単体で描画させない */}
      {caption && (
        <div style={{ marginTop: '16px', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
          {RADAR_CAPTION_CLIENT.map((line, i) => (
            <p
              key={i}
              style={{
                color: i === 0 ? '#888' : '#555',
                fontSize: '12px',
                lineHeight: '1.9',
                margin: 0,
              }}
            >
              {line}
            </p>
          ))}
          {unexplored.length > 0 && (
            <p style={{ color: '#c9a84c', fontSize: '12px', lineHeight: '1.9', margin: '10px 0 0' }}>
              これから掘れる余白：{unexplored.join('・')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
