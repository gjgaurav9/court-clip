import { useState, useCallback } from 'react';

export default function useAnnotations() {
  const [annotations, setAnnotations] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  // Segment marking state
  const [markingStart, setMarkingStart] = useState(null);

  const addAnnotation = useCallback((annotation) => {
    setAnnotations((prev) => {
      const newList = [...prev, { ...annotation, id: Date.now() }];
      return newList.sort((a, b) => a.frameStart - b.frameStart);
    });
    setUndoStack((prev) => [...prev, { type: 'add', annotation }]);
  }, []);

  const updateAnnotation = useCallback((id, updates) => {
    setAnnotations((prev) => {
      const old = prev.find((a) => a.id === id);
      if (!old) return prev;
      setUndoStack((stack) => [...stack, { type: 'update', id, previous: { ...old } }]);
      return prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
    });
  }, []);

  const deleteAnnotation = useCallback((id) => {
    setAnnotations((prev) => {
      const old = prev.find((a) => a.id === id);
      if (!old) return prev;
      setUndoStack((stack) => [...stack, { type: 'delete', annotation: { ...old } }]);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, -1);

      if (last.type === 'add') {
        setAnnotations((anns) => anns.filter((a) => a.id !== last.annotation.id));
      } else if (last.type === 'delete') {
        setAnnotations((anns) => {
          const restored = [...anns, last.annotation];
          return restored.sort((a, b) => a.frameStart - b.frameStart);
        });
      } else if (last.type === 'update') {
        setAnnotations((anns) =>
          anns.map((a) => (a.id === last.id ? last.previous : a))
        );
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
    return Math.max(...annotations.map((a) => a.rallyNumber)) ;
  }, [annotations]);

  const getNextShotNumber = useCallback((rallyNumber) => {
    const rallied = annotations.filter((a) => a.rallyNumber === rallyNumber);
    if (rallied.length === 0) return 1;
    return Math.max(...rallied.map((a) => a.shotNumber)) + 1;
  }, [annotations]);

  return {
    annotations,
    markingStart,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    undo,
    undoStack,
    markSegment,
    cancelMarking,
    getNextRallyNumber,
    getNextShotNumber,
  };
}
