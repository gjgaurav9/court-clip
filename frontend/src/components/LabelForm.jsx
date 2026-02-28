import { useState, useEffect } from 'react';
import CourtGrid from './CourtGrid';

const SHOT_TYPES = [
  'Short Serve', 'Long Serve', 'Toss', 'Lift', 'Dribble',
  'Smash', 'Jump Smash', 'Tab', 'Block', 'Drive',
  'Low Drop', 'High Drop', 'Netkill',
];

export default function LabelForm({
  segment,
  fps,
  defaultRallyNumber,
  defaultShotNumber,
  onSave,
  onCancel,
  editingAnnotation,
}) {
  const [rallyNumber, setRallyNumber] = useState(defaultRallyNumber);
  const [shotNumber, setShotNumber] = useState(defaultShotNumber);
  const [playerId, setPlayerId] = useState('Player 1');
  const [shotType, setShotType] = useState('Short Serve');
  const [backhand, setBackhand] = useState(false);
  const [aroundHead, setAroundHead] = useState(false);
  const [hitArea, setHitArea] = useState(null);

  // Pre-fill when editing
  useEffect(() => {
    if (editingAnnotation) {
      setRallyNumber(editingAnnotation.rallyNumber);
      setShotNumber(editingAnnotation.shotNumber);
      setPlayerId(editingAnnotation.playerId);
      setShotType(editingAnnotation.shotType);
      setBackhand(editingAnnotation.backhand);
      setAroundHead(editingAnnotation.aroundHead);
      setHitArea(editingAnnotation.hitArea);
    }
  }, [editingAnnotation]);

  const frameStart = segment?.frameStart ?? editingAnnotation?.frameStart ?? 0;
  const frameEnd = segment?.frameEnd ?? editingAnnotation?.frameEnd ?? 0;
  const durationSec = ((frameEnd - frameStart) / fps).toFixed(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      rallyNumber,
      shotNumber,
      playerId,
      shotType,
      backhand,
      aroundHead,
      hitArea,
      frameStart,
      frameEnd,
      durationSec: parseFloat(durationSec),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
        {editingAnnotation ? 'Edit Label' : 'Label Segment'}
      </h3>

      {/* Frame info */}
      <div className="text-xs text-gray-400 flex gap-4">
        <span>Frames: {frameStart} - {frameEnd}</span>
        <span>Duration: {durationSec}s</span>
      </div>

      {/* Rally & Shot Number */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Rally #</span>
          <input
            type="number"
            min={1}
            value={rallyNumber}
            onChange={(e) => setRallyNumber(parseInt(e.target.value) || 1)}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Shot #</span>
          <input
            type="number"
            min={1}
            value={shotNumber}
            onChange={(e) => setShotNumber(parseInt(e.target.value) || 1)}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>

      {/* Player */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">Player</span>
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option>Player 1</option>
          <option>Player 2</option>
        </select>
      </label>

      {/* Shot Type */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">Shot Type</span>
        <select
          value={shotType}
          onChange={(e) => setShotType(e.target.value)}
          className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          {SHOT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={backhand}
            onChange={(e) => setBackhand(e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
          <span className="text-sm text-gray-300">Backhand</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={aroundHead}
            onChange={(e) => setAroundHead(e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
          <span className="text-sm text-gray-300">Around Head</span>
        </label>
      </div>

      {/* Court Grid */}
      <div>
        <span className="text-xs text-gray-400">Hit Area</span>
        <CourtGrid value={hitArea} onChange={setHitArea} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer"
        >
          {editingAnnotation ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
