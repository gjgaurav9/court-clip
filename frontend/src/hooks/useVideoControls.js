import { useState, useRef, useCallback, useEffect } from 'react';
import { saveVideo, getVideo } from '../lib/videoStore';

const DEFAULT_FPS = 30;

export default function useVideoControls(projectId) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [totalFrames, setTotalFrames] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFileName, setVideoFileName] = useState('');
  const [playbackSpeed, setPlaybackSpeedState] = useState(1);
  const [storedVideoName, setStoredVideoName] = useState(null);
  const seekingRef = useRef(false);
  const pendingSeekRef = useRef(null);
  const rvfcHandleRef = useRef(null);

  const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.5, 2];

  const setPlaybackSpeed = useCallback((speed) => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
    setPlaybackSpeedState(speed);
  }, []);

  const increaseSpeed = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
    if (idx < SPEED_OPTIONS.length - 1) {
      setPlaybackSpeed(SPEED_OPTIONS[idx + 1]);
    }
  }, [playbackSpeed, setPlaybackSpeed]);

  const decreaseSpeed = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
    if (idx > 0) {
      setPlaybackSpeed(SPEED_OPTIONS[idx - 1]);
    }
  }, [playbackSpeed, setPlaybackSpeed]);

  const doSeek = useCallback((frame) => {
    const video = videoRef.current;
    if (!video) return;
    const clampedFrame = Math.max(0, Math.min(frame, totalFrames - 1));
    seekingRef.current = true;
    video.currentTime = clampedFrame / fps;
    setCurrentFrame(clampedFrame);

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      seekingRef.current = false;
      // If a new seek was queued while we were seeking, execute it
      if (pendingSeekRef.current !== null) {
        const next = pendingSeekRef.current;
        pendingSeekRef.current = null;
        doSeek(next);
      }
    };
    video.addEventListener('seeked', onSeeked);
  }, [fps, totalFrames]);

  const seekToFrame = useCallback((frame) => {
    if (seekingRef.current) {
      // Queue the latest seek target — only keep the most recent
      pendingSeekRef.current = frame;
      return;
    }
    doSeek(frame);
  }, [doSeek]);

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
    setStoredVideoName(null);

    video.onloadedmetadata = () => {
      const dur = video.duration;
      setDuration(dur);
      const total = Math.round(dur * fps);
      setTotalFrames(total);
      setCurrentFrame(0);
      setVideoLoaded(true);
      // Persist to IndexedDB
      if (projectId) {
        saveVideo(projectId, file).catch(() => {});
      }
    };
  }, [fps, projectId]);

  // Check IndexedDB for a previously loaded video on mount
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    getVideo(projectId).then((record) => {
      if (cancelled || !record) return;
      if (!videoLoaded) {
        setStoredVideoName(record.name);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId, videoLoaded]);

  const reloadStoredVideo = useCallback(() => {
    if (!projectId) return;
    getVideo(projectId).then((record) => {
      if (record?.file) {
        loadVideo(record.file);
      }
    }).catch(() => {});
  }, [projectId, loadVideo]);

  // Update current frame during playback — use requestVideoFrameCallback if available
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const hasRVFC = typeof video.requestVideoFrameCallback === 'function';

    // requestVideoFrameCallback gives us precise per-frame updates
    if (hasRVFC) {
      const onFrame = (now, metadata) => {
        const frame = Math.round(metadata.mediaTime * fps);
        setCurrentFrame(frame);
        rvfcHandleRef.current = video.requestVideoFrameCallback(onFrame);
      };
      rvfcHandleRef.current = video.requestVideoFrameCallback(onFrame);
    }

    // Fallback: timeupdate for browsers without RVFC (also fires on seeked for paused state)
    const onTimeUpdate = () => {
      if (!hasRVFC) {
        const frame = Math.round(video.currentTime * fps);
        setCurrentFrame(frame);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      if (hasRVFC && rvfcHandleRef.current != null) {
        video.cancelVideoFrameCallback(rvfcHandleRef.current);
      }
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
    playbackSpeed,
    setPlaybackSpeed,
    increaseSpeed,
    decreaseSpeed,
    seekToFrame,
    togglePlay,
    play,
    pause,
    nextFrame,
    prevFrame,
    skipForward,
    skipBackward,
    loadVideo,
    reloadStoredVideo,
    storedVideoName,
    formatTime,
  };
}
