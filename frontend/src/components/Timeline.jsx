import { useState, useMemo } from 'react';

// Generate distinct colors for rally numbers
const RALLY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#A855F7',
  '#84CC16', '#E11D48', '#0EA5E9', '#D97706', '#7C3AED',
];

function getRallyColor(rallyNumber) {
  return RALLY_COLORS[(rallyNumber - 1) % RALLY_COLORS.length];
}

export default function Timeline({ annotations, totalFrames, currentFrame, onSeek, fps }) {
  const [hoveredAnn, setHoveredAnn] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  if (totalFrames === 0) return null;

  const progress = (currentFrame / totalFrames) * 100;
  const totalSeconds = totalFrames / fps;

  // Time markers every 30 seconds
  const timeMarkers = useMemo(() => {
    const markers = [];
    for (let sec = 30; sec < totalSeconds; sec += 30) {
      const pct = (sec / totalSeconds) * 100;
      const min = Math.floor(sec / 60);
      const s = sec % 60;
      markers.push({ pct, label: `${min}:${String(s).padStart(2, '0')}` });
    }
    return markers;
  }, [totalSeconds]);

  const formatFrame = (frame) => {
    const sec = frame / fps;
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${m}:${s.padStart(4, '0')}`;
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Time markers row */}
      <div className="relative h-4 text-[10px] text-gray-500">
        {timeMarkers.map((m) => (
          <span
            key={m.pct}
            className="absolute -translate-x-1/2"
            style={{ left: `${m.pct}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Main timeline bar */}
      <div className="relative h-10 bg-gray-800 rounded-lg overflow-hidden">
        {/* Time marker ticks */}
        {timeMarkers.map((m) => (
          <div
            key={m.pct}
            className="absolute top-0 h-full w-px bg-gray-700/60 pointer-events-none"
            style={{ left: `${m.pct}%` }}
          />
        ))}

        {/* Segment blocks */}
        {annotations.map((ann) => {
          const left = (ann.frameStart / totalFrames) * 100;
          const width = ((ann.frameEnd - ann.frameStart) / totalFrames) * 100;
          const color = getRallyColor(ann.rallyNumber);
          return (
            <div
              key={ann.id}
              className="absolute top-0 h-full cursor-pointer border-r border-l transition-opacity"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.3)}%`,
                backgroundColor: `${color}99`,
                borderColor: `${color}44`,
              }}
              onMouseEnter={(e) => {
                setHoveredAnn(ann);
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoveredAnn(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(ann.frameStart);
              }}
            />
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500 z-10 pointer-events-none"
          style={{ left: `${progress}%` }}
        />

        {/* Click to seek */}
        <div
          className="absolute inset-0 z-5 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            onSeek(Math.round(pct * totalFrames));
          }}
        />
      </div>

      {/* Tooltip */}
      {hoveredAnn && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 pointer-events-none shadow-lg"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 60,
          }}
        >
          <div className="font-medium">Rally {hoveredAnn.rallyNumber} &middot; Shot {hoveredAnn.shotNumber}</div>
          <div className="text-gray-400 mt-0.5">
            {hoveredAnn.shotType} {hoveredAnn.backhand ? '(BH)' : ''} {hoveredAnn.aroundHead ? '(AH)' : ''}
          </div>
          <div className="text-gray-500 mt-0.5">
            {formatFrame(hoveredAnn.frameStart)} &ndash; {formatFrame(hoveredAnn.frameEnd)} ({hoveredAnn.frameStart}-{hoveredAnn.frameEnd})
          </div>
        </div>
      )}

      {/* Rally color legend */}
      {annotations.length > 0 && (
        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mt-1">
          {[...new Set(annotations.map((a) => a.rallyNumber))].sort((a, b) => a - b).map((r) => (
            <span key={r} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: getRallyColor(r) }}
              />
              R{r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
