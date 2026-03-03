import { useRef } from 'react';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.5, 2];

export default function VideoPlayer({
  videoRef,
  isPlaying,
  currentFrame,
  fps,
  totalFrames,
  videoLoaded,
  videoFileName,
  formatTime,
  onLoadVideo,
  markingStart,
  playbackSpeed,
  onSpeedChange,
  storedVideoName,
  onReloadStored,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onLoadVideo(file);
  };

  const progress = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Video element */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
        />
        {!videoLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {storedVideoName ? (
              <>
                <p className="text-gray-400 text-sm">
                  Previously loaded: <span className="text-white font-medium">{storedVideoName}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onReloadStored}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Reload
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Change video
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-lg">Load a video to start annotating</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Open Video File
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Marking indicator */}
        {markingStart !== null && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            Marking start: Frame {markingStart}
          </div>
        )}
      </div>

      {/* Controls info bar */}
      {videoLoaded && (
        <div className="flex items-center justify-between text-sm text-gray-300 bg-gray-800 rounded-lg px-4 py-2">
          <div className="flex gap-6">
            <span>
              Frame: <span className="text-white font-mono font-medium">{currentFrame}</span>
              <span className="text-gray-500"> / {totalFrames}</span>
            </span>
            <span>
              Time: <span className="text-white font-mono font-medium">{formatTime(currentFrame)}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>FPS: <span className="text-white font-mono">{fps}</span></span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-xs">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="bg-gray-700 text-white text-xs rounded px-1.5 py-0.5 border border-gray-600 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {SPEED_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
            </div>
            <span className={`font-medium ${isPlaying ? 'text-green-400' : 'text-yellow-400'}`}>
              {isPlaying ? 'Playing' : 'Paused'}
            </span>
          </div>
        </div>
      )}

      {/* Scrub bar */}
      {videoLoaded && (
        <div className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const frame = Math.round(pct * totalFrames);
            videoRef.current.currentTime = frame / fps;
          }}
        >
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* File info */}
      {videoLoaded && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="truncate max-w-md">{videoFileName}</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            Change video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
