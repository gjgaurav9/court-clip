import { useState } from 'react';

export default function AnnotationTable({ annotations, onSeek, onEdit, onDelete }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  if (annotations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        No annotations yet. Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> to mark segment boundaries.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs text-gray-400 uppercase border-b border-gray-700">
            <th className="py-2 px-3">#</th>
            <th className="py-2 px-3">Rally</th>
            <th className="py-2 px-3">Shot</th>
            <th className="py-2 px-3">Player</th>
            <th className="py-2 px-3">Type</th>
            <th className="py-2 px-3">BH</th>
            <th className="py-2 px-3">AH</th>
            <th className="py-2 px-3">Area</th>
            <th className="py-2 px-3">Frames</th>
            <th className="py-2 px-3">Dur(s)</th>
            <th className="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {annotations.map((ann, idx) => (
            <tr
              key={ann.id}
              className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
              onClick={() => onSeek(ann.frameStart)}
            >
              <td className="py-2 px-3 text-gray-400">{idx + 1}</td>
              <td className="py-2 px-3">{ann.rallyNumber}</td>
              <td className="py-2 px-3">{ann.shotNumber}</td>
              <td className="py-2 px-3">{ann.playerId}</td>
              <td className="py-2 px-3">{ann.shotType}</td>
              <td className="py-2 px-3">{ann.backhand ? 'Y' : ''}</td>
              <td className="py-2 px-3">{ann.aroundHead ? 'Y' : ''}</td>
              <td className="py-2 px-3">{ann.hitArea ?? '-'}</td>
              <td className="py-2 px-3 font-mono text-xs">{ann.frameStart}-{ann.frameEnd}</td>
              <td className="py-2 px-3 font-mono text-xs">{ann.durationSec}</td>
              <td className="py-2 px-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEdit(ann)}
                  className="text-blue-400 hover:text-blue-300 text-xs cursor-pointer"
                >
                  Edit
                </button>
                {deleteConfirm === ann.id ? (
                  <span className="flex gap-1">
                    <button
                      onClick={() => { onDelete(ann.id); setDeleteConfirm(null); }}
                      className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-gray-400 text-xs cursor-pointer"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(ann.id)}
                    className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                  >
                    Del
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
