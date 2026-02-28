import { useEffect } from 'react';

export default function useKeyboardShortcuts(handlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      // Don't capture shortcuts when typing in input fields
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = e.key;
      const shift = e.shiftKey;
      const ctrl = e.ctrlKey || e.metaKey;

      if (key === ' ') {
        e.preventDefault();
        handlers.onTogglePlay?.();
      } else if (key === 'ArrowRight' && shift) {
        e.preventDefault();
        handlers.onSkipForward?.();
      } else if (key === 'ArrowLeft' && shift) {
        e.preventDefault();
        handlers.onSkipBackward?.();
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        handlers.onNextFrame?.();
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        handlers.onPrevFrame?.();
      } else if (key === 'Enter' && shift) {
        e.preventDefault();
        handlers.onOpenLabel?.();
      } else if (key === 'Enter') {
        e.preventDefault();
        handlers.onMarkSegment?.();
      } else if (key === 'z' && ctrl && shift) {
        e.preventDefault();
        handlers.onRedo?.();
      } else if (key === 'y' && ctrl) {
        e.preventDefault();
        handlers.onRedo?.();
      } else if (key === 'z' && ctrl) {
        e.preventDefault();
        handlers.onUndo?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers, enabled]);
}
