// Badminton court zone grid
// Half-court layout (near player, net at top):
//   Front/net row:  13 | 9 | 8 | 7 | 7 | 9 | 13   (7 cells, zone 7 straddles center)
//   Mid row:         3 | 5 | 1 | 2 | 6 | 4         (6 cells)
//   Back row:       14 |15 |16 |10 |11 | 12         (6 cells)
//
// Full court shows far player half (mirrored) on top, net, then near player half below.

const W = 300; // court width in SVG units
const HALF_H = 360; // half court height

// Column edges: tramline(30) | inner(60) | center-left(60) | center-right(60) | inner(60) | tramline(30)
const COL = [0, 30, 90, 150, 210, 270, 300];

// Row edges for a half court (net at y=0):
// Front: 0-90, Mid: 90-240, Back: 240-360
const ROW = [0, 90, 240, 360];

// Near player half court zones (net at top)
const NEAR_ZONES = [
  // Front row (net) — zone 7 split into two 30-wide cells
  { zone: 13, x: COL[0], y: ROW[0], w: 30,  h: 90 },
  { zone: 9,  x: COL[1], y: ROW[0], w: 60,  h: 90 },
  { zone: 8,  x: COL[2], y: ROW[0], w: 60,  h: 90 },
  { zone: 7,  x: 150,    y: ROW[0], w: 30,  h: 90 },  // left half of 7
  { zone: 7,  x: 180,    y: ROW[0], w: 30,  h: 90 },  // right half of 7
  { zone: 9,  x: COL[4], y: ROW[0], w: 60,  h: 90 },
  { zone: 13, x: COL[5], y: ROW[0], w: 30,  h: 90 },

  // Mid row
  { zone: 3,  x: COL[0], y: ROW[1], w: 30,  h: 150 },
  { zone: 5,  x: COL[1], y: ROW[1], w: 60,  h: 150 },
  { zone: 1,  x: COL[2], y: ROW[1], w: 60,  h: 150 },
  { zone: 2,  x: COL[3], y: ROW[1], w: 60,  h: 150 },
  { zone: 6,  x: COL[4], y: ROW[1], w: 60,  h: 150 },
  { zone: 4,  x: COL[5], y: ROW[1], w: 30,  h: 150 },

  // Back row
  { zone: 14, x: COL[0], y: ROW[2], w: 30,  h: 120 },
  { zone: 15, x: COL[1], y: ROW[2], w: 60,  h: 120 },
  { zone: 16, x: COL[2], y: ROW[2], w: 60,  h: 120 },
  { zone: 10, x: COL[3], y: ROW[2], w: 60,  h: 120 },
  { zone: 11, x: COL[4], y: ROW[2], w: 60,  h: 120 },
  { zone: 12, x: COL[5], y: ROW[2], w: 30,  h: 120 },
];

// Far player half court zones (mirrored horizontally, rows flipped vertically)
// Back row at top: 12,11,10,16,15,14
// Mid row: 4,6,2,1,5,3
// Front row at bottom (touching net): 13,9,8,7,7,9,13
const FAR_ZONES = [
  // Back row (top of far half)
  { zone: 12, x: COL[0], y: 0,   w: 30,  h: 120 },
  { zone: 11, x: COL[1], y: 0,   w: 60,  h: 120 },
  { zone: 10, x: COL[2], y: 0,   w: 60,  h: 120 },
  { zone: 16, x: COL[3], y: 0,   w: 60,  h: 120 },
  { zone: 15, x: COL[4], y: 0,   w: 60,  h: 120 },
  { zone: 14, x: COL[5], y: 0,   w: 30,  h: 120 },

  // Mid row
  { zone: 4,  x: COL[0], y: 120, w: 30,  h: 150 },
  { zone: 6,  x: COL[1], y: 120, w: 60,  h: 150 },
  { zone: 2,  x: COL[2], y: 120, w: 60,  h: 150 },
  { zone: 1,  x: COL[3], y: 120, w: 60,  h: 150 },
  { zone: 5,  x: COL[4], y: 120, w: 60,  h: 150 },
  { zone: 3,  x: COL[5], y: 120, w: 30,  h: 150 },

  // Front row (net side, bottom of far half)
  { zone: 13, x: COL[0], y: 270, w: 30,  h: 90 },
  { zone: 9,  x: COL[1], y: 270, w: 60,  h: 90 },
  { zone: 8,  x: COL[2], y: 270, w: 60,  h: 90 },
  { zone: 7,  x: 150,    y: 270, w: 30,  h: 90 },
  { zone: 7,  x: 180,    y: 270, w: 30,  h: 90 },
  { zone: 9,  x: COL[4], y: 270, w: 60,  h: 90 },
  { zone: 13, x: COL[5], y: 270, w: 30,  h: 90 },
];

function CourtLines({ yOff = 0, h = HALF_H, netAtTop = true }) {
  const netY = netAtTop ? yOff : yOff + h;
  const shortServiceY = netAtTop ? yOff + 90 : yOff + h - 90;
  const longServiceY = netAtTop ? yOff + 240 : yOff + h - 240;

  return (
    <g>
      {/* Outer boundary */}
      <rect x="0" y={yOff} width={W} height={h} fill="none" stroke="#FFF" strokeWidth="1.5" />

      {/* Net line */}
      <line x1="0" y1={netY} x2={W} y2={netY} stroke="#EF4444" strokeWidth="2.5" />

      {/* Doubles sidelines (tramlines) */}
      <line x1="30" y1={yOff} x2="30" y2={yOff + h} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.6" />
      <line x1="270" y1={yOff} x2="270" y2={yOff + h} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* Center line (from short service line to back boundary) */}
      {netAtTop ? (
        <line x1="150" y1={shortServiceY} x2="150" y2={yOff + h} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.65" />
      ) : (
        <line x1="150" y1={yOff} x2="150" y2={shortServiceY} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.65" />
      )}

      {/* Short service line */}
      <line x1="0" y1={shortServiceY} x2={W} y2={shortServiceY} stroke="#FFF" strokeWidth="1.2" strokeOpacity="0.65" />

      {/* Long service line (doubles) */}
      <line x1="0" y1={longServiceY} x2={W} y2={longServiceY} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.45" />
    </g>
  );
}

function ZoneCell({ z, yOff = 0, isSelected, onClick, compact }) {
  const cx = z.x + z.w / 2;
  const cy = yOff + z.y + z.h / 2;
  const fontSize = compact ? 9 : 12;

  return (
    <g onClick={() => onClick(z.zone)} className="cursor-pointer">
      <rect
        x={z.x} y={yOff + z.y} width={z.w} height={z.h}
        fill={isSelected ? '#3B82F6' : 'transparent'}
        fillOpacity={isSelected ? 0.5 : 0}
        stroke={isSelected ? '#60A5FA' : 'none'}
        strokeWidth={isSelected ? 1.5 : 0}
      />
      <rect
        x={z.x} y={yOff + z.y} width={z.w} height={z.h}
        fill="transparent"
        className="hover:fill-blue-400/20"
      />
      <text
        x={cx} y={cy + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fill={isSelected ? '#FFF' : 'rgba(255,255,255,0.5)'}
        fontWeight={isSelected ? 'bold' : 'normal'}
        style={{ userSelect: 'none' }}
      >
        {z.zone}
      </text>
    </g>
  );
}

export default function CourtGrid({ value, onChange, compact = false, mode = 'half' }) {
  if (mode === 'full') {
    // Full court: far half (top) + net gap + near half (bottom)
    const gap = 16; // net gap
    const totalH = HALF_H * 2 + gap;

    return (
      <div className="flex flex-col gap-1">
        {!compact && <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider">Far Player</div>}
        <svg
          viewBox={`0 0 ${W} ${totalH}`}
          className={compact ? 'w-full max-w-[140px] mx-auto' : 'w-full max-w-[220px] mx-auto'}
        >
          {/* Far half background */}
          <rect x="0" y="0" width={W} height={HALF_H} fill="#1A5C2A" />
          {/* Net gap */}
          <rect x="0" y={HALF_H} width={W} height={gap} fill="#374151" />
          <text x={W / 2} y={HALF_H + gap / 2 + 3} textAnchor="middle" fontSize="8" fill="#9CA3AF">NET</text>
          {/* Near half background */}
          <rect x="0" y={HALF_H + gap} width={W} height={HALF_H} fill="#1A5C2A" />

          {/* Far half zones */}
          {FAR_ZONES.map((z, i) => (
            <ZoneCell key={`f${i}`} z={z} yOff={0} isSelected={value === z.zone} onClick={onChange} compact={compact} />
          ))}
          <CourtLines yOff={0} h={HALF_H} netAtTop={false} />

          {/* Near half zones */}
          {NEAR_ZONES.map((z, i) => (
            <ZoneCell key={`n${i}`} z={z} yOff={HALF_H + gap} isSelected={value === z.zone} onClick={onChange} compact={compact} />
          ))}
          <CourtLines yOff={HALF_H + gap} h={HALF_H} netAtTop={true} />
        </svg>
        {!compact && <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider">Near Player</div>}
      </div>
    );
  }

  // Half court mode (default)
  return (
    <div className="flex flex-col gap-1">
      {!compact && <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider">Net</div>}
      <svg
        viewBox={`0 0 ${W} ${HALF_H}`}
        className={compact ? 'w-full max-w-[140px] mx-auto' : 'w-full max-w-[200px] mx-auto'}
      >
        <rect x="0" y="0" width={W} height={HALF_H} fill="#1A5C2A" rx="2" />

        {NEAR_ZONES.map((z, i) => (
          <ZoneCell key={i} z={z} yOff={0} isSelected={value === z.zone} onClick={onChange} compact={compact} />
        ))}

        <CourtLines yOff={0} h={HALF_H} netAtTop={true} />
      </svg>
      {!compact && <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider">Baseline</div>}
    </div>
  );
}
