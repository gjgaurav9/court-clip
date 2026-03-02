// Badminton half-court zone layout (near player perspective, net at top)
// Row 0 (front/net):  13, 9, 8, 7, 9, 13
// Row 1 (mid court):   3, 5, 1, 2, 6, 4
// Row 2 (back court): 14,15,16,10,11, 12

const ZONES = [
  // row, col, zone, x, y, w, h  (in SVG units, court area is 300w x 360h)
  // --- Front row (net side) ---
  // Tramlines are narrower (30 units), inner cols are 60 units
  { zone: 13, x: 0,   y: 0,   w: 30,  h: 90, label: '13' },
  { zone: 9,  x: 30,  y: 0,   w: 60,  h: 90, label: '9' },
  { zone: 8,  x: 90,  y: 0,   w: 60,  h: 90, label: '8' },
  { zone: 7,  x: 150, y: 0,   w: 60,  h: 90, label: '7' },
  { zone: 9,  x: 210, y: 0,   w: 60,  h: 90, label: '9', mirror: true },
  { zone: 13, x: 270, y: 0,   w: 30,  h: 90, label: '13', mirror: true },

  // --- Mid row (service court) ---
  { zone: 3,  x: 0,   y: 90,  w: 30,  h: 150, label: '3' },
  { zone: 5,  x: 30,  y: 90,  w: 60,  h: 150, label: '5' },
  { zone: 1,  x: 90,  y: 90,  w: 60,  h: 150, label: '1' },
  { zone: 2,  x: 150, y: 90,  w: 60,  h: 150, label: '2' },
  { zone: 6,  x: 210, y: 90,  w: 60,  h: 150, label: '6' },
  { zone: 4,  x: 270, y: 90,  w: 30,  h: 150, label: '4' },

  // --- Back row (baseline) ---
  { zone: 14, x: 0,   y: 240, w: 30,  h: 120, label: '14' },
  { zone: 15, x: 30,  y: 240, w: 60,  h: 120, label: '15' },
  { zone: 16, x: 90,  y: 240, w: 60,  h: 120, label: '16' },
  { zone: 10, x: 150, y: 240, w: 60,  h: 120, label: '10' },
  { zone: 11, x: 210, y: 240, w: 60,  h: 120, label: '11' },
  { zone: 12, x: 270, y: 240, w: 30,  h: 120, label: '12' },
];

export default function CourtGrid({ value, onChange, compact = false }) {
  const svgW = 300;
  const svgH = 360;
  const pad = 0;

  return (
    <div className="flex flex-col gap-1">
      {!compact && <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider">Net</div>}
      <svg
        viewBox={`${-pad} ${-pad} ${svgW + pad * 2} ${svgH + pad * 2}`}
        className={compact ? 'w-full max-w-[140px] mx-auto' : 'w-full max-w-[200px] mx-auto'}
      >
        {/* Court surface */}
        <rect x="0" y="0" width={svgW} height={svgH} fill="#1A5C2A" rx="2" />

        {/* Clickable zones */}
        {ZONES.map((z, i) => {
          const isSelected = value === z.zone;
          return (
            <g key={i} onClick={() => onChange(z.zone)} className="cursor-pointer">
              {/* Selection fill */}
              <rect
                x={z.x} y={z.y} width={z.w} height={z.h}
                fill={isSelected ? '#3B82F6' : 'transparent'}
                fillOpacity={isSelected ? 0.55 : 0}
                stroke={isSelected ? '#60A5FA' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
              />
              {/* Hover area */}
              <rect
                x={z.x} y={z.y} width={z.w} height={z.h}
                fill="transparent"
                className="hover:fill-blue-400/20"
              />
              {/* Zone number */}
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2 + 4}
                textAnchor="middle"
                fontSize={compact ? 10 : 13}
                fill={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.55)'}
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {z.label}
              </text>
            </g>
          );
        })}

        {/* Court lines */}
        {/* Outer boundary */}
        <rect x="0" y="0" width={svgW} height={svgH} fill="none" stroke="#FFF" strokeWidth="2" rx="2" />

        {/* Net line (top) */}
        <line x1="0" y1="2" x2={svgW} y2="2" stroke="#EF4444" strokeWidth="3" />

        {/* Doubles sidelines (tramlines) */}
        <line x1="30" y1="0" x2="30" y2={svgH} stroke="#FFF" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="270" y1="0" x2="270" y2={svgH} stroke="#FFF" strokeWidth="1" strokeOpacity="0.6" />

        {/* Center line (from short service line to back) */}
        <line x1="150" y1="90" x2="150" y2={svgH} stroke="#FFF" strokeWidth="1" strokeOpacity="0.7" />

        {/* Short service line */}
        <line x1="0" y1="90" x2={svgW} y2="90" stroke="#FFF" strokeWidth="1.5" strokeOpacity="0.7" />

        {/* Long service line (doubles) */}
        <line x1="0" y1="240" x2={svgW} y2="240" stroke="#FFF" strokeWidth="1" strokeOpacity="0.5" />
      </svg>
      {!compact && <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider">Baseline</div>}
    </div>
  );
}
