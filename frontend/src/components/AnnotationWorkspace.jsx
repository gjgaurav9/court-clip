import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import LabelForm from './LabelForm';
import AnnotationTable from './AnnotationTable';
import Sidebar from './Sidebar';
import FilterBar from './FilterBar';
import ShortcutHelp from './ShortcutHelp';
import useVideoControls from '../hooks/useVideoControls';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import useAnnotations from '../hooks/useAnnotations';
import { annotations as annotationsApi, projects as projectsApi, health } from '../api/client';

export default function AnnotationWorkspace() {
  const { id: projectId } = useParams();
  const video = useVideoControls(projectId);
  const ann = useAnnotations(projectId);

  const [showLabelForm, setShowLabelForm] = useState(false);
  const [pendingSegment, setPendingSegment] = useState(null);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [editableFrames, setEditableFrames] = useState(false);
  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [filters, setFilters] = useState({ rally: '', player: '', shotType: '' });
  const [dbDegraded, setDbDegraded] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Check database health on mount
  useEffect(() => {
    health().then((res) => {
      if (res.status === 'degraded') setDbDegraded(true);
    }).catch(() => setDbDegraded(true));
  }, []);

  // Load project info
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const p = await projectsApi.get(projectId);
        if (!cancelled) setProject(p);
      } catch {
        // handled by error states elsewhere
      } finally {
        if (!cancelled) setProjectLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  // Sync video metadata to server when video loads
  useEffect(() => {
    if (!video.videoLoaded || !projectId) return;
    const data = {
      videoFilename: video.videoFileName,
      videoFps: video.fps,
      totalFrames: video.totalFrames,
    };
    // Save full file path in Electron for auto-reload
    if (video.videoFilePath) {
      data.videoFilepath = video.videoFilePath;
    }
    projectsApi.update(projectId, data).catch(() => {});
  }, [video.videoLoaded, video.videoFileName, video.fps, video.totalFrames, video.videoFilePath, projectId]);

  // Auto-load video from saved filepath (Electron only)
  useEffect(() => {
    if (video.videoLoaded || !project?.videoFilepath || !window.electronAPI?.fileExists) return;
    try {
      if (window.electronAPI.fileExists(project.videoFilepath)) {
        const fileUrl = window.electronAPI.getFileUrl(project.videoFilepath);
        const videoEl = video.videoRef.current;
        if (videoEl) {
          videoEl.src = fileUrl;
          videoEl.onloadedmetadata = () => {
            video.setFps(project.videoFps || 30);
          };
        }
      }
    } catch {
      // File no longer exists or not in Electron
    }
  }, [project, video.videoLoaded]);

  // Filtered annotations
  const filteredAnnotations = useMemo(() => {
    return ann.annotations.filter((a) => {
      if (filters.rally && a.rallyNumber !== filters.rally) return false;
      if (filters.player && a.playerId !== filters.player) return false;
      if (filters.shotType && a.shotType !== filters.shotType) return false;
      return true;
    });
  }, [ann.annotations, filters]);

  const handleMarkSegment = useCallback(() => {
    if (!video.videoLoaded) return;
    video.pause();
    const result = ann.markSegment(video.currentFrame);
    if (result.action === 'end') {
      const segLen = result.frameEnd - result.frameStart;
      if (segLen < 5) {
        if (!window.confirm(`Only ${segLen} frame${segLen !== 1 ? 's' : ''} — continue?`)) {
          ann.cancelMarking();
          return;
        }
      } else if (segLen > 300) {
        if (!window.confirm(`${segLen} frames is very long — continue?`)) {
          ann.cancelMarking();
          return;
        }
      }
      setPendingSegment({ frameStart: result.frameStart, frameEnd: result.frameEnd });
    }
  }, [video, ann]);

  const handleOpenLabel = useCallback(() => {
    if (showLabelForm) return;
    video.pause();
    // If there's a freshly marked segment, open a blank form for it
    if (pendingSegment) {
      setEditingAnnotation(null);
      setEditableFrames(false);
      setShowLabelForm(true);
      return;
    }
    // Otherwise, fall back to editing the last annotation
    if (ann.annotations.length > 0) {
      const last = ann.annotations[ann.annotations.length - 1];
      setEditingAnnotation(last);
      setEditableFrames(false);
      setShowLabelForm(true);
    }
  }, [ann.annotations, showLabelForm, video, pendingSegment]);

  const handleAddShot = useCallback(() => {
    if (!video.videoLoaded) return;
    video.pause();
    setPendingSegment({ frameStart: video.currentFrame, frameEnd: video.currentFrame });
    setEditableFrames(true);
    setEditingAnnotation(null);
    setShowLabelForm(true);
  }, [video]);

  const handleSaveLabel = useCallback((data) => {
    if (editingAnnotation) {
      ann.updateAnnotation(editingAnnotation.id, data);
    } else {
      ann.addAnnotation(data);
    }
    setShowLabelForm(false);
    setPendingSegment(null);
    setEditingAnnotation(null);
    setEditableFrames(false);
  }, [editingAnnotation, ann]);

  const handleCancelLabel = useCallback(() => {
    setShowLabelForm(false);
    // Keep pendingSegment so Shift+Enter can re-open a blank form for it
    setEditingAnnotation(null);
    setEditableFrames(false);
    ann.cancelMarking();
  }, [ann]);

  const handleEdit = useCallback((annotation) => {
    video.pause();
    setEditingAnnotation(annotation);
    setEditableFrames(false);
    setShowLabelForm(true);
  }, [video]);

  const handleExport = useCallback((format) => {
    window.open(annotationsApi.exportUrl(projectId, format), '_blank');
  }, [projectId]);

  const shortcutHandlers = useMemo(() => ({
    onTogglePlay: video.togglePlay,
    onNextFrame: video.nextFrame,
    onPrevFrame: video.prevFrame,
    onSkipForward: () => video.skipForward(30),
    onSkipBackward: () => video.skipBackward(30),
    onMarkSegment: handleMarkSegment,
    onOpenLabel: handleOpenLabel,
    onUndo: ann.undo,
    onRedo: ann.redo,
    onIncreaseSpeed: video.increaseSpeed,
    onDecreaseSpeed: video.decreaseSpeed,
    onShowHelp: () => setShowShortcutHelp(true),
  }), [video, handleMarkSegment, handleOpenLabel, ann]);

  useKeyboardShortcuts(shortcutHandlers, !showLabelForm);

  // Coverage calculation
  const coverage = useMemo(() => {
    if (!video.videoLoaded || video.totalFrames === 0 || ann.annotations.length === 0) return 0;
    const covered = new Set();
    for (const a of ann.annotations) {
      for (let f = a.frameStart; f <= a.frameEnd; f++) covered.add(f);
    }
    return (covered.size / video.totalFrames) * 100;
  }, [ann.annotations, video.videoLoaded, video.totalFrames]);

  const defaultRally = ann.getNextRallyNumber();
  const defaultShot = ann.getNextShotNumber(defaultRally);

  if (projectLoading) {
    return <div className="text-gray-400 text-center py-20">Loading workspace...</div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-blue-400 hover:text-blue-300">Projects</Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-300">{project?.name || `Project ${projectId}`}</span>
      </div>

      {/* DB degraded banner */}
      {dbDegraded && (
        <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-300 px-4 py-2 rounded-lg text-sm">
          Database connection failed. Annotations may not save. Check your .env file.
        </div>
      )}

      {/* Sync error banner */}
      {ann.syncError && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded-lg text-sm">
          Sync error: {ann.syncError}
        </div>
      )}

      {/* Main layout: video + sidebar */}
      <div className="flex gap-4">
        {/* Left: Video + Timeline */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <VideoPlayer
            videoRef={video.videoRef}
            isPlaying={video.isPlaying}
            currentFrame={video.currentFrame}
            fps={video.fps}
            totalFrames={video.totalFrames}
            videoLoaded={video.videoLoaded}
            videoFileName={video.videoFileName}
            formatTime={video.formatTime}
            onLoadVideo={video.loadVideo}
            markingStart={ann.markingStart}
            playbackSpeed={video.playbackSpeed}
            onSpeedChange={video.setPlaybackSpeed}
            storedVideoName={video.storedVideoName}
            onReloadStored={video.reloadStoredVideo}
          />

          {/* Timeline */}
          {video.videoLoaded && (
            <Timeline
              annotations={ann.annotations}
              filteredAnnotations={filteredAnnotations}
              totalFrames={video.totalFrames}
              currentFrame={video.currentFrame}
              onSeek={video.seekToFrame}
              fps={video.fps}
            />
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-80 shrink-0">
          {showLabelForm ? (
            <LabelForm
              segment={pendingSegment}
              fps={video.fps}
              defaultRallyNumber={editingAnnotation ? editingAnnotation.rallyNumber : defaultRally}
              defaultShotNumber={editingAnnotation ? editingAnnotation.shotNumber : defaultShot}
              onSave={handleSaveLabel}
              onCancel={handleCancelLabel}
              editingAnnotation={editingAnnotation}
              editableFrames={editableFrames}
            />
          ) : (
            <Sidebar
              projectId={projectId}
              annotations={ann.annotations}
              filteredAnnotations={filteredAnnotations}
              videoRef={video.videoRef}
              fps={video.fps}
              onSeek={video.seekToFrame}
              onEdit={handleEdit}
              onDelete={ann.deleteAnnotation}
              onExport={handleExport}
              onAddShot={handleAddShot}
              videoFilePath={video.videoFilePath}
            />
          )}
        </div>
      </div>

      {/* Coverage progress bar */}
      {video.videoLoaded && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-gray-400 shrink-0">Coverage</span>
          <div className="flex-1 bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(coverage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-12 text-right">{coverage.toFixed(1)}%</span>
        </div>
      )}

      {/* Filter bar + Annotation table */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Annotations</h2>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
        <AnnotationTable
          annotations={filteredAnnotations}
          onSeek={video.seekToFrame}
          onEdit={handleEdit}
          onDelete={ann.deleteAnnotation}
        />
      </div>

      {/* Keyboard shortcuts bar */}
      <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 px-2 items-center">
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Space</kbd> Play/Pause</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">&larr;&rarr;</kbd> Frame step</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Shift+&larr;&rarr;</kbd> Skip 30</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Enter</kbd> Mark segment</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Shift+Enter</kbd> Edit label</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">[ ]</kbd> Speed -/+</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Ctrl+Z</kbd> Undo</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Ctrl+Shift+Z</kbd> Redo</span>
        <button
          onClick={() => setShowShortcutHelp(true)}
          className="px-1.5 py-0.5 bg-gray-800 rounded hover:bg-gray-700 transition-colors cursor-pointer"
          title="Keyboard shortcuts (?)"
        >?</button>
        {ann.lastSyncTime && (
          <span className="ml-auto text-gray-600">
            Last saved: {ann.lastSyncTime.toLocaleTimeString()}
          </span>
        )}
      </div>

      {showShortcutHelp && <ShortcutHelp onClose={() => setShowShortcutHelp(false)} />}
    </div>
  );
}
