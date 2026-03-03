import { useRef, useState, useEffect, useCallback } from 'react';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.5, 2];

export default function MiniPlayer({ videoSrc, frameStart, frameEnd, fps, onClose }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [looping, setLooping] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(frameStart);

  const startTime = frameStart / fps;
  const endTime = frameEnd / fps;
  const totalSegmentFrames = frameEnd - frameStart;

  // Seek to start and play on mount
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.src = videoSrc;
    vid.currentTime = startTime;
    vid.playbackRate = speed;
    vid.play().catch(() => {});
  }, [videoSrc, startTime, speed]);

  // Loop logic via timeupdate
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onTimeUpdate = () => {
      const frame = Math.round(vid.currentTime * fps);
      setCurrentFrame(Math.max(frameStart, Math.min(frame, frameEnd)));
      if (vid.currentTime >= endTime) {
        if (looping) {
          vid.currentTime = startTime;
          vid.play().catch(() => {});
        } else {
          vid.pause();
          setPlaying(false);
        }
      }
    };

    vid.addEventListener('timeupdate', onTimeUpdate);
    return () => vid.removeEventListener('timeupdate', onTimeUpdate);
  }, [fps, frameStart, frameEnd, startTime, endTime, looping]);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      if (vid.currentTime >= endTime) vid.currentTime = startTime;
      vid.play().catch(() => {});
      setPlaying(true);
    } else {
      vid.pause();
      setPlaying(false);
    }
  }, [startTime, endTime]);

  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed);
    const vid = videoRef.current;
    if (vid) vid.playbackRate = newSpeed;
  }, []);

  const handleScrub = useCallback((e) => {
    const frame = parseInt(e.target.value);
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = frame / fps;
    setCurrentFrame(frame);
  }, [fps]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <span className="text-sm text-gray-300 font-medium">
            Clip Preview — Frames {frameStart}–{frameEnd}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none cursor-pointer px-1"
          >
            &times;
          </button>
        </div>

        {/* Video */}
        <div className="bg-black">
          <video
            ref={videoRef}
            className="w-full"
            playsInline
          />
        </div>

        {/* Controls */}
        <div className="px-4 py-3 flex flex-col gap-2">
          {/* Scrub slider */}
          <input
            type="range"
            min={frameStart}
            max={frameEnd}
            value={currentFrame}
            onChange={handleScrub}
            className="w-full h-1.5 accent-blue-500"
          />

          <div className="flex items-center justify-between text-xs text-gray-400">
            {/* Left: playback controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 text-sm cursor-pointer"
              >
                {playing ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={() => setLooping(!looping)}
                className={`cursor-pointer ${looping ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Loop {looping ? 'ON' : 'OFF'}
              </button>
              <select
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="bg-gray-700 rounded px-1.5 py-0.5 text-gray-300 border border-gray-600 focus:outline-none"
              >
                {SPEED_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
            </div>

            {/* Right: frame counter */}
            <span>
              Frame {currentFrame - frameStart} / {totalSegmentFrames}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
