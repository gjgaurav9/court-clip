export default function Timeline({ annotations, totalFrames, currentFrame, onSeek, fps }) {
  if (totalFrames === 0) return null;

  const progress = (currentFrame / totalFrames) * 100;

  return (
    <div className="relative h-10 bg-gray-800 rounded-lg overflow-hidden">
      {/* Segment blocks */}
      {annotations.map((ann) => {
        const left = (ann.frameStart / totalFrames) * 100;
        const width = ((ann.frameEnd - ann.frameStart) / totalFrames) * 100;
        return (
          <div
            key={ann.id}
            className="absolute top-0 h-full bg-blue-500/60 hover:bg-blue-400/80 cursor-pointer border-r border-l border-blue-300/30 transition-colors"
            style={{ left: `${left}%`, width: `${Math.max(width, 0.3)}%` }}
            title={`Rally ${ann.rallyNumber} Shot ${ann.shotNumber} (${ann.frameStart}-${ann.frameEnd})`}
            onClick={() => onSeek(ann.frameStart)}
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
  );
}
