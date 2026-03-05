import { useState, useEffect } from 'react';
import CourtGrid from './CourtGrid';

const DEFAULT_SHOT_TYPES = [
  'Short Serve', 'Long Serve', 'Toss', 'Lift', 'Dribble',
  'Smash', 'Jump Smash', 'Tab', 'Block', 'Drive',
  'Low Drop', 'High Drop', 'Netkill',
];

const STORAGE_KEY = 'courtclip-custom-shot-types';

function loadShotTypes() {
  try {
    const custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return [...DEFAULT_SHOT_TYPES, ...custom];
  } catch {
    return [...DEFAULT_SHOT_TYPES];
  }
}

export default function LabelForm({
  segment,
  fps,
  defaultRallyNumber,
  defaultShotNumber,
  onSave,
  onCancel,
  editingAnnotation,
  editableFrames = false,
}) {
  const [shotTypes, setShotTypes] = useState(loadShotTypes);
  const [rallyNumber, setRallyNumber] = useState(defaultRallyNumber);
  const [shotNumber, setShotNumber] = useState(defaultShotNumber);
  const [playerId, setPlayerId] = useState('Player 1');
  const [shotType, setShotType] = useState('Short Serve');
  const [backhand, setBackhand] = useState(false);
  const [aroundHead, setAroundHead] = useState(false);
  const [hitArea, setHitArea] = useState(null);
  const [playerArea, setPlayerArea] = useState(null);
  const [opponentArea, setOpponentArea] = useState(null);
  const [frameStartInput, setFrameStartInput] = useState(0);
  const [frameEndInput, setFrameEndInput] = useState(0);

  const handleAddShotType = () => {
    const name = window.prompt('Enter new shot type name:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (shotTypes.includes(trimmed)) return;
    const newTypes = [...shotTypes, trimmed];
    setShotTypes(newTypes);
    setShotType(trimmed);
    // Persist only custom types
    const custom = newTypes.filter((t) => !DEFAULT_SHOT_TYPES.includes(t));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  };

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
      setPlayerArea(editingAnnotation.playerArea ?? null);
      setOpponentArea(editingAnnotation.opponentArea ?? null);
      setFrameStartInput(editingAnnotation.frameStart);
      setFrameEndInput(editingAnnotation.frameEnd);
    } else if (segment) {
      setFrameStartInput(segment.frameStart);
      setFrameEndInput(segment.frameEnd);
    }
  }, [editingAnnotation, segment]);

  const frameStart = editableFrames ? frameStartInput : (segment?.frameStart ?? editingAnnotation?.frameStart ?? 0);
  const frameEnd = editableFrames ? frameEndInput : (segment?.frameEnd ?? editingAnnotation?.frameEnd ?? 0);
  const durationSec = fps > 0 ? ((frameEnd - frameStart) / fps).toFixed(3) : '0.000';

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
      playerArea,
      opponentArea,
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
        {editableFrames ? (
          <div className="grid grid-cols-2 gap-2 w-full">
            <label className="flex flex-col gap-1">
              <span>Frame Start</span>
              <input type="number" min={0} value={frameStartInput}
                onChange={(e) => setFrameStartInput(parseInt(e.target.value) || 0)}
                className="bg-gray-700 rounded px-2 py-1 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none" />
            </label>
            <label className="flex flex-col gap-1">
              <span>Frame End</span>
              <input type="number" min={0} value={frameEndInput}
                onChange={(e) => setFrameEndInput(parseInt(e.target.value) || 0)}
                className="bg-gray-700 rounded px-2 py-1 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none" />
            </label>
          </div>
        ) : (
          <>
            <span>Frames: {frameStart} - {frameEnd}</span>
            <span>Duration: {durationSec}s</span>
          </>
        )}
      </div>

      {/* Rally & Shot Number */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Rally #</span>
          <input
            type="number" min={1} value={rallyNumber}
            onChange={(e) => setRallyNumber(parseInt(e.target.value) || 1)}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Shot #</span>
          <input
            type="number" min={1} value={shotNumber}
            onChange={(e) => setShotNumber(parseInt(e.target.value) || 1)}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>

      {/* Player */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">Player</span>
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}
          className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none">
          <option>Player 1</option>
          <option>Player 2</option>
        </select>
      </label>

      {/* Shot Type */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">Shot Type</span>
        <div className="flex gap-1">
          <select value={shotType} onChange={(e) => setShotType(e.target.value)}
            className="flex-1 bg-gray-700 rounded px-2 py-1.5 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none">
            {shotTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button type="button" onClick={handleAddShotType}
            className="bg-gray-600 hover:bg-gray-500 text-white px-2.5 rounded text-sm font-bold transition-colors cursor-pointer"
            title="Add custom shot type">+</button>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={backhand} onChange={(e) => setBackhand(e.target.checked)} className="w-4 h-4 accent-blue-500" />
          <span className="text-sm text-gray-300">Backhand</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={aroundHead} onChange={(e) => setAroundHead(e.target.checked)} className="w-4 h-4 accent-blue-500" />
          <span className="text-sm text-gray-300">Around Head</span>
        </label>
      </div>

      {/*Reference Image Section*/}
      <div className="flex flex-col gap-1 mt-2">
        <span className="text-xs text-gray-400 text-center uppercase tracking-wider">Court Reference Map</span>
        <img
          src="https://lh3.googleusercontent.com/d/13YS9WdemRagEqrRFLVDrF3x7hah31DM0"
          alt="Badminton court zones reference"
          className="w-full h-auto rounded border border-gray-600 object-contain"
        />
      </div>

      {/* Court Grids — 3 side by side */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className="text-xs text-gray-400 block text-center mb-1">Hit Area</span>
          <CourtGrid value={hitArea} onChange={setHitArea} compact />
        </div>
        <div>
          <span className="text-xs text-gray-400 block text-center mb-1">Player Area</span>
          <CourtGrid value={playerArea} onChange={setPlayerArea} compact />
        </div>
        <div>
          <span className="text-xs text-gray-400 block text-center mb-1">Opponent Area</span>
          <CourtGrid value={opponentArea} onChange={setOpponentArea} compact />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer">
          {editingAnnotation ? 'Update' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}
