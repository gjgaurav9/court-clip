import { useEffect } from 'react';

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause' },
  { key: '\u2190 \u2192', action: 'Frame step (1 frame)' },
  { key: 'Shift + \u2190 \u2192', action: 'Skip 30 frames' },
  { key: '[ ]', action: 'Decrease / Increase speed' },
  { key: 'Enter', action: 'Mark segment start/end' },
  { key: 'Shift + Enter', action: 'Edit last label' },
  { key: 'Ctrl + Z', action: 'Undo' },
  { key: 'Ctrl + Shift + Z', action: 'Redo' },
  { key: '?', action: 'Show this help' },
];

export default function ShortcutHelp({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Keyboard Shortcuts</h2>
        <table className="w-full text-sm">
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.key} className="border-b border-gray-700/50 last:border-0">
                <td className="py-2 pr-4">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-200 font-mono">
                    {s.key}
                  </kbd>
                </td>
                <td className="py-2 text-gray-300">{s.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
