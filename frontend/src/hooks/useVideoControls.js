import { useState, useRef, useCallback, useEffect } from 'react';

const DEFAULT_FPS = 30;

export default function useVideoControls() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [totalFrames, setTotalFrames] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFileName, setVideoFileName] = useState('');

  const seekToFrame = useCallback((frame) => {
    const video = videoRef.current;
    if (!video) return;
    const clampedFrame = Math.max(0, Math.min(frame, totalFrames - 1));
    video.currentTime = clampedFrame / fps;
    setCurrentFrame(clampedFrame);
  }, [fps, totalFrames]);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const nextFrame = useCallback(() => {
    pause();
    seekToFrame(currentFrame + 1);
  }, [currentFrame, seekToFrame, pause]);

  const prevFrame = useCallback(() => {
    pause();
    seekToFrame(currentFrame - 1);
  }, [currentFrame, seekToFrame, pause]);

  const skipForward = useCallback((frames = 10) => {
    pause();
    seekToFrame(currentFrame + frames);
  }, [currentFrame, seekToFrame, pause]);

  const skipBackward = useCallback((frames = 10) => {
    pause();
    seekToFrame(currentFrame - frames);
  }, [currentFrame, seekToFrame, pause]);

  const loadVideo = useCallback((file) => {
    const video = videoRef.current;
    if (!video) return;

    const url = URL.createObjectURL(file);
    video.src = url;
    setVideoFileName(file.name);

    video.onloadedmetadata = () => {
      const dur = video.duration;
      setDuration(dur);
      const total = Math.round(dur * fps);
      setTotalFrames(total);
      setCurrentFrame(0);
      setVideoLoaded(true);
    };
  }, [fps]);

  // Update current frame during playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const frame = Math.round(video.currentTime * fps);
      setCurrentFrame(frame);
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, [fps]);

  const formatTime = useCallback((frame) => {
    const totalSeconds = frame / fps;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
  }, [fps]);

  return {
    videoRef,
    isPlaying,
    currentFrame,
    fps,
    setFps,
    totalFrames,
    duration,
    videoLoaded,
    videoFileName,
    seekToFrame,
    togglePlay,
    play,
    pause,
    nextFrame,
    prevFrame,
    skipForward,
    skipBackward,
    loadVideo,
    formatTime,
  };
}
