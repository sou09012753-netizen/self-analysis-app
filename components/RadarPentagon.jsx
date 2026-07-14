import { RADAR_AXES, SCORE_MAX, getUnexplored, RADAR_CAPTION } from '../lib/radar';

// 五角形レーダー。本人画面・コーチ画面の両方がこれを使う。
//
// ★このコンポーネントは数値を描画しない。<text> は軸ラベル（生き方 等）にのみ使う。
//   目盛りの数字・スコア値・凡例の数値を描くコードは、フラグの裏にも置かない。
//   数値が必要なコーチ画面は、隣に RadarScoreList を並べる（coach.jsx 専用）。
//
// layers: [{ label, scores, color }] — 1枚ならセッション単体、3枚なら統合（重ね描き）

const pointAt = (axisIdx, ratio, cx, cy, r) => {
  // 頂点を真上から時計回りに配置
  const angle = (Math.PI * 2 * axisIdx) / RADAR_AXES.length - Math.PI / 2;
  return [cx + Math.cos(angle) * r * ratio, cy + Math.sin(angle) * r * ratio];
};

const polygonFor = (ratios, cx, cy, r) =>
  RADAR_AXES.map((_, i) => pointAt(i, ratios[i], cx, cy, r).join(',')).join(' ');

export default function RadarPentagon({ layers = [], size = 300, caption = true }) {
  const drawable = layers.filter(l => l && l.scores);
  if (drawable.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = size * 0.33;

  // グリッド（同心の五角形）。目盛りラベルは描かない。
  const rings = [0.25, 0.5, 0.75, 1].map(f =>
    polygonFor(RADAR_AXES.map(() => f), cx, cy, r)
  );

  // 統合表示では、全レイヤーで未踏の軸だけを「余白」として挙げる
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

      {/* キャプションはチャートと不可分。単体で描画させない */}
      {caption && (
        <div style={{ marginTop: '14px' }}>
          <p style={{ color: '#555', fontSize: '11px', lineHeight: '1.8', margin: 0 }}>{RADAR_CAPTION}</p>
          {unexplored.length > 0 && (
            <p style={{ color: '#c9a84c', fontSize: '11px', lineHeight: '1.8', margin: '6px 0 0' }}>
              これから掘れる余白：{unexplored.join('・')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
