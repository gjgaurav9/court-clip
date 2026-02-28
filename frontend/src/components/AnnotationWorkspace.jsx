import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import LabelForm from './LabelForm';
import AnnotationTable from './AnnotationTable';
import useVideoControls from '../hooks/useVideoControls';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import useAnnotations from '../hooks/useAnnotations';
import { annotations as annotationsApi, projects as projectsApi } from '../api/client';

export default function AnnotationWorkspace() {
  const { id: projectId } = useParams();
  const video = useVideoControls();
  const ann = useAnnotations(projectId);

  const [showLabelForm, setShowLabelForm] = useState(false);
  const [pendingSegment, setPendingSegment] = useState(null);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);

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
    projectsApi.update(projectId, {
      videoFilename: video.videoFileName,
      videoFps: video.fps,
      totalFrames: video.totalFrames,
    }).catch(() => {});
  }, [video.videoLoaded, video.videoFileName, video.fps, video.totalFrames, projectId]);

  const handleMarkSegment = useCallback(() => {
    if (!video.videoLoaded) return;
    const result = ann.markSegment(video.currentFrame);
    if (result.action === 'end') {
      setPendingSegment({ frameStart: result.frameStart, frameEnd: result.frameEnd });
      setShowLabelForm(true);
    }
  }, [video.videoLoaded, video.currentFrame, ann]);

  const handleOpenLabel = useCallback(() => {
    if (ann.annotations.length > 0 && !showLabelForm) {
      const last = ann.annotations[ann.annotations.length - 1];
      setEditingAnnotation(last);
      setShowLabelForm(true);
    }
  }, [ann.annotations, showLabelForm]);

  const handleSaveLabel = useCallback((data) => {
    if (editingAnnotation) {
      ann.updateAnnotation(editingAnnotation.id, data);
    } else {
      ann.addAnnotation(data);
    }
    setShowLabelForm(false);
    setPendingSegment(null);
    setEditingAnnotation(null);
  }, [editingAnnotation, ann]);

  const handleCancelLabel = useCallback(() => {
    setShowLabelForm(false);
    setPendingSegment(null);
    setEditingAnnotation(null);
    ann.cancelMarking();
  }, [ann]);

  const handleEdit = useCallback((annotation) => {
    setEditingAnnotation(annotation);
    setShowLabelForm(true);
  }, []);

  const handleExport = useCallback((format) => {
    window.open(annotationsApi.exportUrl(projectId, format), '_blank');
  }, [projectId]);

  const shortcutHandlers = useMemo(() => ({
    onTogglePlay: video.togglePlay,
    onNextFrame: video.nextFrame,
    onPrevFrame: video.prevFrame,
    onSkipForward: () => video.skipForward(10),
    onSkipBackward: () => video.skipBackward(10),
    onMarkSegment: handleMarkSegment,
    onOpenLabel: handleOpenLabel,
    onUndo: ann.undo,
    onRedo: ann.redo,
  }), [video, handleMarkSegment, handleOpenLabel, ann]);

  useKeyboardShortcuts(shortcutHandlers, !showLabelForm);

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
          />

          {/* Timeline */}
          {video.videoLoaded && (
            <Timeline
              annotations={ann.annotations}
              totalFrames={video.totalFrames}
              currentFrame={video.currentFrame}
              onSeek={video.seekToFrame}
              fps={video.fps}
            />
          )}
        </div>

        {/* Right sidebar: Label form */}
        <div className="w-72 shrink-0">
          {showLabelForm ? (
            <LabelForm
              segment={pendingSegment}
              fps={video.fps}
              defaultRallyNumber={editingAnnotation ? editingAnnotation.rallyNumber : defaultRally}
              defaultShotNumber={editingAnnotation ? editingAnnotation.shotNumber : defaultShot}
              onSave={handleSaveLabel}
              onCancel={handleCancelLabel}
              editingAnnotation={editingAnnotation}
            />
          ) : (
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400 flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Labeling</h3>
              {ann.markingStart !== null ? (
                <p className="text-yellow-400">
                  Start marked at frame {ann.markingStart}. Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> to set end.
                </p>
              ) : (
                <p>
                  Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> to mark segment start.
                </p>
              )}

              {/* Export buttons */}
              {ann.annotations.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer"
                  >
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Annotation table */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Annotations</h2>
        <AnnotationTable
          annotations={ann.annotations}
          onSeek={video.seekToFrame}
          onEdit={handleEdit}
          onDelete={ann.deleteAnnotation}
        />
      </div>

      {/* Keyboard shortcuts bar */}
      <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 px-2">
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Space</kbd> Play/Pause</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">&larr;&rarr;</kbd> Frame step</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Shift+&larr;&rarr;</kbd> Skip 10</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Enter</kbd> Mark segment</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Shift+Enter</kbd> Edit label</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Ctrl+Z</kbd> Undo</span>
        <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Ctrl+Shift+Z</kbd> Redo</span>
      </div>
    </div>
  );
}
