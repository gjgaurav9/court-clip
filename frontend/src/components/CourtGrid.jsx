const ROWS = 4;
const COLS = 2;
const ROW_LABELS = ['Front court', 'Mid front', 'Mid back', 'Back court'];

export default function CourtGrid({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-400 text-center">Net Side</div>
      <svg viewBox="0 0 200 300" className="w-full max-w-[180px] mx-auto">
        {/* Court surface */}
        <rect x="10" y="10" width="180" height="280" fill="#1A5C2A" rx="2" />

        {/* Court outline */}
        <rect x="10" y="10" width="180" height="280" fill="none" stroke="#FFFFFF" strokeWidth="2" rx="2" />

        {/* Net line */}
        <line x1="10" y1="14" x2="190" y2="14" stroke="#EF4444" strokeWidth="3" />

        {/* Doubles sideline (tramlines) */}
        <line x1="25" y1="10" x2="25" y2="290" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="175" y1="10" x2="175" y2="290" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.5" />

        {/* Center line (only in service area) */}
        <line x1="100" y1="10" x2="100" y2="220" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.7" />

        {/* Short service line */}
        <line x1="10" y1="80" x2="190" y2="80" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.7" />

        {/* Long service line (doubles) */}
        <line x1="10" y1="220" x2="190" y2="220" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.5" />

        {/* Mid-court division for 4 rows */}
        <line x1="10" y1="150" x2="190" y2="150" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4" />

        {/* Clickable zones — 4 rows x 2 cols = 8 zones, but we do 4x4 = 16 for finer granularity */}
        {Array.from({ length: ROWS * 4 }, (_, idx) => {
          const row = Math.floor(idx / 4);
          const col = idx % 4;
          const zone = idx + 1;
          const x = 10 + col * 45;
          const y = 10 + row * 70;
          const isSelected = value === zone;

          return (
            <g key={zone} onClick={() => onChange(zone)} className="cursor-pointer">
              {/* Selection highlight */}
              <rect
                x={x}
                y={y}
                width={45}
                height={70}
                fill={isSelected ? '#3B82F6' : 'transparent'}
                fillOpacity={isSelected ? 0.5 : 0}
                stroke={isSelected ? '#60A5FA' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
              />
              {/* Hover area */}
              <rect
                x={x}
                y={y}
                width={45}
                height={70}
                fill="transparent"
                className="hover:fill-blue-400/20"
              />
              {/* Zone number */}
              <text
                x={x + 22.5}
                y={y + 40}
                textAnchor="middle"
                fontSize="13"
                fill={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {zone}
              </text>
            </g>
          );
        })}

        {/* Row labels on the right */}
        {ROW_LABELS.map((label, i) => (
          <text
            key={label}
            x="197"
            y={10 + i * 70 + 40}
            textAnchor="start"
            fontSize="7"
            fill="rgba(255,255,255,0.35)"
            transform={`rotate(90, 197, ${10 + i * 70 + 40})`}
          >
            {label}
          </text>
        ))}
      </svg>
      <div className="text-xs text-gray-400 text-center">Baseline</div>
    </div>
  );
}
