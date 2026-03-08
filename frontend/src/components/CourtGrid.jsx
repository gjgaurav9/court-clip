// Badminton court zone grid
// Half-court layout (near player, net at top):
// Grid horizontally divided into: Tramline(30) | Inner(60) | Center(120) | Inner(60) | Tramline(30)
// Grid vertically divided into: Front(90) | Mid(150) | Back(120, with center cutout for zone 13)

const W = 300; // court width in SVG units
const HALF_H = 360; // half court height

// Near player half court zones (net at top, y=0)
const NEAR_ZONES = [
  // Left Tramline
  { zone: 10, x: 0, y: 0, w: 30, h: 90 },
  { zone: 11, x: 0, y: 90, w: 30, h: 150 },
  { zone: 12, x: 0, y: 240, w: 30, h: 120 },

  // Left Inner
  { zone: 2, x: 30, y: 0, w: 60, h: 90 },
  { zone: 6, x: 30, y: 90, w: 60, h: 150 },
  { zone: 4, x: 30, y: 240, w: 60, h: 120 },

  // Center Area (spans across the traditional center line)
  { zone: 7, x: 90, y: 0, w: 120, h: 90 },
  { zone: 8, x: 90, y: 90, w: 120, h: 150 },
  { zone: 9, x: 90, y: 240, w: 120, h: 75 },
  { zone: 13, x: 90, y: 315, w: 120, h: 45 },

  // Right Inner
  { zone: 1, x: 210, y: 0, w: 60, h: 90 },
  { zone: 5, x: 210, y: 90, w: 60, h: 150 },
  { zone: 3, x: 210, y: 240, w: 60, h: 120 },

  // Right Tramline
  { zone: 16, x: 270, y: 0, w: 30, h: 90 },
  { zone: 15, x: 270, y: 90, w: 30, h: 150 },
  { zone: 14, x: 270, y: 240, w: 30, h: 120 },
];

// Far player half court zones (mirrored 180 degrees, net at bottom, y=360)
const FAR_ZONES = [
  // Right Tramline visually (maps to Near Left Tramline 10,11,12)
  { zone: 12, x: 270, y: 0, w: 30, h: 120 },
  { zone: 11, x: 270, y: 120, w: 30, h: 150 },
  { zone: 10, x: 270, y: 270, w: 30, h: 90 },

  // Right Inner visually (maps to Near Left Inner 2,6,4)
  { zone: 4, x: 210, y: 0, w: 60, h: 120 },
  { zone: 6, x: 210, y: 120, w: 60, h: 150 },
  { zone: 2, x: 210, y: 270, w: 60, h: 90 },

  // Center visually (maps to Near Center 7,8,9,13)
  { zone: 13, x: 90, y: 0, w: 120, h: 45 },
  { zone: 9, x: 90, y: 45, w: 120, h: 75 },
  { zone: 8, x: 90, y: 120, w: 120, h: 150 },
  { zone: 7, x: 90, y: 270, w: 120, h: 90 },

  // Left Inner visually (maps to Near Right Inner 1,5,3)
  { zone: 3, x: 30, y: 0, w: 60, h: 120 },
  { zone: 5, x: 30, y: 120, w: 60, h: 150 },
  { zone: 1, x: 30, y: 270, w: 60, h: 90 },

  // Left Tramline visually (maps to Near Right Tramline 16,15,14)
  { zone: 14, x: 0, y: 0, w: 30, h: 120 },
  { zone: 15, x: 0, y: 120, w: 30, h: 150 },
  { zone: 16, x: 0, y: 270, w: 30, h: 90 },
];

function CourtLines({ yOff = 0, h = HALF_H, netAtTop = true }) {
  const netY = netAtTop ? yOff : yOff + h;
  const shortServiceY = netAtTop ? yOff + 90 : yOff + h - 90;
  const midCourtY = netAtTop ? yOff + 240 : yOff + h - 240;
  const longServiceY = netAtTop ? yOff + 315 : yOff + h - 315;

  return (
    <g>
      {/* Outer boundary */}
      <rect x="0" y={yOff} width={W} height={h} fill="none" stroke="#FFF" strokeWidth="1.5" />

      {/* Net line */}
      <line x1="0" y1={netY} x2={W} y2={netY} stroke="#EF4444" strokeWidth="2.5" />

      {/* Doubles sidelines (tramlines) */}
      <line x1="30" y1={yOff} x2="30" y2={yOff + h} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.6" />
      <line x1="270" y1={yOff} x2="270" y2={yOff + h} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* Inner strip lines (defines the center area width) */}
      <line x1="90" y1={yOff} x2="90" y2={yOff + h} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.65" />
      <line x1="210" y1={yOff} x2="210" y2={yOff + h} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.65" />

      {/* Short service line */}
      <line x1="0" y1={shortServiceY} x2={W} y2={shortServiceY} stroke="#FFF" strokeWidth="1.2" strokeOpacity="0.65" />

      {/* Mid court division */}
      <line x1="0" y1={midCourtY} x2={W} y2={midCourtY} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.65" />

      {/* Doubles long service line (drawn only in the center to bound zone 13) */}
      <line x1="90" y1={longServiceY} x2="210" y2={longServiceY} stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.45" />
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