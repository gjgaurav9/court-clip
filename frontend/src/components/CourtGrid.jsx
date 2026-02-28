const ROWS = 4;
const COLS = 4;
const ROW_LABELS = ['Front court', 'Mid front', 'Mid back', 'Back court'];

export default function CourtGrid({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-400 text-center">Net Side</div>
      <svg viewBox="0 0 200 260" className="w-full max-w-[180px] mx-auto">
        {/* Court outline */}
        <rect x="10" y="10" width="180" height="240" fill="none" stroke="#4B5563" strokeWidth="2" rx="2" />

        {/* Net line */}
        <line x1="10" y1="12" x2="190" y2="12" stroke="#EF4444" strokeWidth="2" strokeDasharray="4" />

        {/* Center line */}
        <line x1="100" y1="10" x2="100" y2="250" stroke="#374151" strokeWidth="1" />

        {/* Horizontal lines */}
        {[1, 2, 3].map((i) => (
          <line key={i} x1="10" y1={10 + i * 60} x2="190" y2={10 + i * 60} stroke="#374151" strokeWidth="1" />
        ))}

        {/* Clickable zones */}
        {Array.from({ length: ROWS * COLS }, (_, idx) => {
          const row = Math.floor(idx / COLS);
          const col = idx % COLS;
          const zone = idx + 1;
          const x = 10 + col * 45;
          const y = 10 + row * 60;
          const isSelected = value === zone;

          return (
            <g key={zone} onClick={() => onChange(zone)} className="cursor-pointer">
              <rect
                x={x}
                y={y}
                width={45}
                height={60}
                fill={isSelected ? '#3B82F6' : 'transparent'}
                fillOpacity={isSelected ? 0.5 : 0}
                stroke="none"
              />
              <rect
                x={x}
                y={y}
                width={45}
                height={60}
                fill="transparent"
                className="hover:fill-blue-500/20"
              />
              <text
                x={x + 22.5}
                y={y + 34}
                textAnchor="middle"
                fontSize="14"
                fill={isSelected ? '#FFFFFF' : '#9CA3AF'}
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {zone}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-xs text-gray-400 text-center">Baseline</div>
    </div>
  );
}
