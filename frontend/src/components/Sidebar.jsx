import { useState, useEffect, useCallback } from 'react';
import { rallies as ralliesApi } from '../api/client';

const TABS = ['Segments', 'Stats', 'Rallies'];

export default function Sidebar({
  projectId,
  annotations,
  filteredAnnotations,
  videoRef,
  fps,
  onSeek,
  onEdit,
  onDelete,
  onExport,
  onAddShot,
  currentRallyNumber,
}) {
  const [activeTab, setActiveTab] = useState('Segments');
  const [rallies, setRallies] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load rallies
  useEffect(() => {
    if (!projectId) return;
    ralliesApi.list(projectId).then(setRallies).catch(() => {});
  }, [projectId]);

  const handleRallySave = useCallback(async (rallyNumber, field, value) => {
    const existing = rallies.find((r) => r.rallyNumber === rallyNumber);
    const data = {
      rallyNumber,
      winnerPlayerId: existing?.winnerPlayerId || null,
      player1Score: existing?.player1Score || null,
      player2Score: existing?.player2Score || null,
      [field]: value,
    };
    try {
      const saved = await ralliesApi.createOrUpdate(projectId, data);
      setRallies((prev) => {
        const idx = prev.findIndex((r) => r.rallyNumber === rallyNumber);
        if (idx >= 0) return prev.map((r) => r.rallyNumber === rallyNumber ? saved : r);
        return [...prev, saved].sort((a, b) => a.rallyNumber - b.rallyNumber);
      });
    } catch {}
  }, [projectId, rallies]);

  const handlePreview = useCallback((ann) => {
    if (!videoRef?.current || !fps) return;
    const vid = videoRef.current;
    vid.currentTime = ann.frameStart / fps;
    vid.play();
    const checkEnd = () => {
      if (vid.currentTime >= ann.frameEnd / fps) {
        vid.pause();
        vid.removeEventListener('timeupdate', checkEnd);
      }
    };
    vid.addEventListener('timeupdate', checkEnd);
  }, [videoRef, fps]);

  // Group annotations by rally
  const rallyGroups = {};
  (filteredAnnotations || annotations).forEach((ann) => {
    if (!rallyGroups[ann.rallyNumber]) rallyGroups[ann.rallyNumber] = [];
    rallyGroups[ann.rallyNumber].push(ann);
  });

  const rallyNumbers = [...new Set(annotations.map((a) => a.rallyNumber))].sort((a, b) => a - b);

  // Stats
  const shotTypes = {};
  const playerShots = {};
  annotations.forEach((a) => {
    shotTypes[a.shotType] = (shotTypes[a.shotType] || 0) + 1;
    playerShots[a.playerId] = (playerShots[a.playerId] || 0) + 1;
  });
  const avgRallyLen = rallyNumbers.length > 0
    ? (annotations.length / rallyNumbers.length).toFixed(1)
    : '0';
  const topShot = Object.entries(shotTypes).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs py-2 font-medium transition-colors cursor-pointer ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 340px)' }}>
        {activeTab === 'Segments' && (
          <div className="flex flex-col gap-2">
            {/* Add Shot button */}
            <button
              onClick={onAddShot}
              className="w-full bg-blue-600/80 hover:bg-blue-600 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer"
            >
              + Add Shot at Current Frame
            </button>

            {Object.keys(rallyGroups).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No segments yet.</p>
            ) : (
              Object.entries(rallyGroups)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([rally, shots]) => (
                  <div key={rally}>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Rally {rally}: {shots.length} shot{shots.length !== 1 ? 's' : ''}
                    </div>
                    {shots.map((ann) => (
                      <div key={ann.id} className="bg-gray-700/50 rounded px-3 py-2 mb-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200 font-medium">
                            R{ann.rallyNumber} S{ann.shotNumber} — {ann.shotType}
                          </span>
                        </div>
                        <div className="text-gray-400 mt-0.5">
                          {ann.playerId} | {ann.frameStart}→{ann.frameEnd}
                          {ann.backhand ? ' | BH' : ''}
                          {ann.aroundHead ? ' | AH' : ''}
                        </div>
                        <div className="flex gap-2 mt-1.5">
                          <button onClick={() => handlePreview(ann)}
                            className="text-green-400 hover:text-green-300 cursor-pointer">Preview</button>
                          <button onClick={() => onSeek(ann.frameStart)}
                            className="text-blue-400 hover:text-blue-300 cursor-pointer">Jump</button>
                          <button onClick={() => onEdit(ann)}
                            className="text-yellow-400 hover:text-yellow-300 cursor-pointer">Edit</button>
                          {deleteConfirm === ann.id ? (
                            <span className="flex gap-1">
                              <button onClick={() => { onDelete(ann.id); setDeleteConfirm(null); }}
                                className="text-red-400 cursor-pointer">Yes</button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="text-gray-400 cursor-pointer">No</button>
                            </span>
                          ) : (
                            <button onClick={() => setDeleteConfirm(ann.id)}
                              className="text-red-400 hover:text-red-300 cursor-pointer">Del</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-700/40 rounded p-3 text-center">
                <div className="text-2xl font-bold text-white">{rallyNumbers.length}</div>
                <div className="text-xs text-gray-400">Rallies</div>
              </div>
              <div className="bg-gray-700/40 rounded p-3 text-center">
                <div className="text-2xl font-bold text-white">{annotations.length}</div>
                <div className="text-xs text-gray-400">Shots</div>
              </div>
              <div className="bg-gray-700/40 rounded p-3 text-center">
                <div className="text-lg font-bold text-white">{avgRallyLen}</div>
                <div className="text-xs text-gray-400">Avg Rally Len</div>
              </div>
              <div className="bg-gray-700/40 rounded p-3 text-center">
                <div className="text-lg font-bold text-white">{topShot ? topShot[0] : '-'}</div>
                <div className="text-xs text-gray-400">Top Shot Type</div>
              </div>
            </div>

            {/* Shots per player */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Shots per Player</div>
              {Object.entries(playerShots).map(([player, count]) => (
                <div key={player} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-300 w-16">{player}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(count / annotations.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>

            {/* Shot type distribution */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Shot Types</div>
              {Object.entries(shotTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-300 w-20 truncate">{type}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(count / annotations.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Rallies' && (
          <div className="flex flex-col gap-2">
            {rallyNumbers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No rallies yet.</p>
            ) : (
              rallyNumbers.map((rn) => {
                const shots = annotations.filter((a) => a.rallyNumber === rn);
                const rallyMeta = rallies.find((r) => r.rallyNumber === rn);
                return (
                  <div key={rn} className="bg-gray-700/50 rounded px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-200">
                        Rally {rn} <span className="text-gray-400 text-xs">({shots.length} shots)</span>
                      </span>
                      <button onClick={() => onSeek(shots[0]?.frameStart)}
                        className="text-blue-400 hover:text-blue-300 text-xs cursor-pointer">Jump</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <select
                        value={rallyMeta?.winnerPlayerId || ''}
                        onChange={(e) => handleRallySave(rn, 'winnerPlayerId', e.target.value || null)}
                        className="bg-gray-700 rounded px-1.5 py-1 text-gray-300 border border-gray-600 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Winner</option>
                        <option>Player 1</option>
                        <option>Player 2</option>
                      </select>
                      <input
                        type="number" min={0}
                        placeholder="P1"
                        value={rallyMeta?.player1Score ?? ''}
                        onChange={(e) => handleRallySave(rn, 'player1Score', e.target.value ? parseInt(e.target.value) : null)}
                        className="bg-gray-700 rounded px-1.5 py-1 text-gray-300 border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                      />
                      <input
                        type="number" min={0}
                        placeholder="P2"
                        value={rallyMeta?.player2Score ?? ''}
                        onChange={(e) => handleRallySave(rn, 'player2Score', e.target.value ? parseInt(e.target.value) : null)}
                        className="bg-gray-700 rounded px-1.5 py-1 text-gray-300 border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Export buttons — always visible */}
      {annotations.length > 0 && (
        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-700">
          <button onClick={() => onExport('csv')}
            className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer">
            Export CSV
          </button>
          <button onClick={() => onExport('json')}
            className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded text-sm font-medium transition-colors cursor-pointer">
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}
