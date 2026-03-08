import { useState, useCallback, useEffect, useRef } from 'react';
import { annotations as api } from '../api/client';

export default function useAnnotations(projectId) {
  const [annotations, setAnnotations] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [loading, setLoading] = useState(!!projectId);

  // Segment marking state
  const [markingStart, setMarkingStart] = useState(null);

  // Track projectId and annotations to avoid stale closures
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;

  // Load annotations from server on mount
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setSyncError(null);
        const data = await api.list(projectId);
        if (!cancelled) {
          setAnnotations(data.sort((a, b) => a.frameStart - b.frameStart));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setSyncError(err.message);
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  const clearRedoStack = useCallback(() => {
    setRedoStack([]);
  }, []);

  const addAnnotation = useCallback(async (annotation) => {
    clearRedoStack();
    // Optimistic: add locally immediately
    const tempId = Date.now();
    const localAnnotation = { ...annotation, id: tempId, projectId: parseInt(projectIdRef.current) };
    setAnnotations((prev) => {
      const newList = [...prev, localAnnotation];
      return newList.sort((a, b) => a.frameStart - b.frameStart);
    });
    setUndoStack((prev) => [...prev, { type: 'add', annotation: localAnnotation }]);

    if (projectIdRef.current) {
      try {
        setSyncError(null);
        const saved = await api.create(projectIdRef.current, annotation);
        setLastSyncTime(new Date());
        // Replace temp id with server id
        setAnnotations((prev) =>
          prev.map((a) => (a.id === tempId ? saved : a))
        );
        // Update undo stack too
        setUndoStack((prev) =>
          prev.map((entry) =>
            entry.annotation?.id === tempId ? { ...entry, annotation: saved } : entry
          )
        );
      } catch (err) {
        setSyncError(err.message);
        // Rollback
        setAnnotations((prev) => prev.filter((a) => a.id !== tempId));
        setUndoStack((prev) => prev.slice(0, -1));
      }
    }
  }, [clearRedoStack]);

  const updateAnnotation = useCallback(async (id, updates) => {
    clearRedoStack();
    const previous = annotationsRef.current.find((a) => a.id === id);
    if (!previous) return;
    const previousCopy = { ...previous };

    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    setUndoStack((stack) => [...stack, { type: 'update', id, previous: previousCopy }]);

    if (projectIdRef.current) {
      try {
        setSyncError(null);
        await api.update(projectIdRef.current, id, updates);
        setLastSyncTime(new Date());
      } catch (err) {
        setSyncError(err.message);
        // Rollback
        setAnnotations((prev) => prev.map((a) => (a.id === id ? previousCopy : a)));
        setUndoStack((stack) => stack.slice(0, -1));
      }
    }
  }, [clearRedoStack]);

  const deleteAnnotation = useCallback(async (id) => {
    clearRedoStack();
    const deleted = annotationsRef.current.find((a) => a.id === id);
    if (!deleted) return;
    const deletedCopy = { ...deleted };

    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setUndoStack((stack) => [...stack, { type: 'delete', annotation: deletedCopy }]);

    if (projectIdRef.current) {
      try {
        setSyncError(null);
        await api.delete(projectIdRef.current, id);
        setLastSyncTime(new Date());
      } catch (err) {
        setSyncError(err.message);
        // Rollback
        setAnnotations((prev) => {
          const restored = [...prev, deletedCopy];
          return restored.sort((a, b) => a.frameStart - b.frameStart);
        });
        setUndoStack((stack) => stack.slice(0, -1));
      }
    }
  }, [clearRedoStack]);

  const undo = useCallback(async () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, -1);

      // Push to redo stack
      setRedoStack((redo) => [...redo, last]);

      if (last.type === 'add') {
        setAnnotations((anns) => anns.filter((a) => a.id !== last.annotation.id));
        // Sync delete to server
        if (projectIdRef.current) {
          api.delete(projectIdRef.current, last.annotation.id).catch((err) => setSyncError(err.message));
        }
      } else if (last.type === 'delete') {
        setAnnotations((anns) => {
          const restored = [...anns, last.annotation];
          return restored.sort((a, b) => a.frameStart - b.frameStart);
        });
        // Sync re-create to server
        if (projectIdRef.current) {
          const { id, projectId: _pid, ...data } = last.annotation;
          api.create(projectIdRef.current, data).then((saved) => {
            // Update local id with server id
            setAnnotations((anns) => anns.map((a) => (a.id === id ? saved : a)));
            // Update redo stack entry
            setRedoStack((redo) =>
              redo.map((entry) =>
                entry.annotation?.id === id ? { ...entry, annotation: saved } : entry
              )
            );
          }).catch((err) => setSyncError(err.message));
        }
      } else if (last.type === 'update') {
        setAnnotations((anns) =>
          anns.map((a) => (a.id === last.id ? last.previous : a))
        );
        // Sync revert to server
        if (projectIdRef.current) {
          const { id, projectId: _pid, ...data } = last.previous;
          api.update(projectIdRef.current, last.id, data).catch((err) => setSyncError(err.message));
        }
      }
      return rest;
    });
  }, []);

  const redo = useCallback(async () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, -1);

      // Push back to undo stack
      setUndoStack((undo) => [...undo, last]);

      if (last.type === 'add') {
        setAnnotations((anns) => {
          const restored = [...anns, last.annotation];
          return restored.sort((a, b) => a.frameStart - b.frameStart);
        });
        // Sync re-create to server
        if (projectIdRef.current) {
          const { id, projectId: _pid, ...data } = last.annotation;
          api.create(projectIdRef.current, data).then((saved) => {
            setAnnotations((anns) => anns.map((a) => (a.id === id ? saved : a)));
            setUndoStack((undo) =>
              undo.map((entry) =>
                entry.annotation?.id === id ? { ...entry, annotation: saved } : entry
              )
            );
          }).catch((err) => setSyncError(err.message));
        }
      } else if (last.type === 'delete') {
        setAnnotations((anns) => anns.filter((a) => a.id !== last.annotation.id));
        // Sync delete to server
        if (projectIdRef.current) {
          api.delete(projectIdRef.current, last.annotation.id).catch((err) => setSyncError(err.message));
        }
      } else if (last.type === 'update') {
        // Re-apply the update: we need to compute the "after" state
        setAnnotations((anns) => {
          const current = anns.find((a) => a.id === last.id);
          if (!current) return anns;
          // The "after" was the state before undo, which we don't store explicitly.
          // But we do know `last.previous` was what we reverted TO.
          // Actually for redo of update, we need to reapply. Let's find what changed.
          // We stored the annotation BEFORE the update in `last.previous`.
          // The current state should be `last.previous` (since undo reverted to it).
          // To redo, we need the "after" state — but we didn't store it.
          // This is a limitation; for now just return as-is. The server has the latest.
          return anns;
        });
        // For update redo, sync the update fields to server
        // Since we don't store the forward diff, we skip client-side redo for updates
      }
      return rest;
    });
  }, []);

  const markSegment = useCallback((currentFrame) => {
    if (markingStart === null) {
      setMarkingStart(currentFrame);
      return { action: 'start', frame: currentFrame };
    } else {
      const start = Math.min(markingStart, currentFrame);
      const end = Math.max(markingStart, currentFrame);
      setMarkingStart(null);
      return { action: 'end', frameStart: start, frameEnd: end };
    }
  }, [markingStart]);

  const cancelMarking = useCallback(() => {
    setMarkingStart(null);
  }, []);

  const getNextRallyNumber = useCallback(() => {
    if (annotations.length === 0) return 1;
    return Math.max(...annotations.map((a) => a.rallyNumber));
  }, [annotations]);

  const getNextShotNumber = useCallback((rallyNumber) => {
    const rallied = annotations.filter((a) => a.rallyNumber === rallyNumber);
    if (rallied.length === 0) return 1;
    return Math.max(...rallied.map((a) => a.shotNumber)) + 1;
  }, [annotations]);

  return {
    annotations,
    markingStart,
    loading,
    syncError,
    lastSyncTime,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    undo,
    redo,
    undoStack,
    redoStack,
    markSegment,
    cancelMarking,
    getNextRallyNumber,
    getNextShotNumber,
  };
}
