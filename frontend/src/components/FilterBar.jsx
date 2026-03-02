const SHOT_TYPES = [
  'Short Serve', 'Long Serve', 'Toss', 'Lift', 'Dribble',
  'Smash', 'Jump Smash', 'Tab', 'Block', 'Drive',
  'Low Drop', 'High Drop', 'Netkill',
];

export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const hasFilters = filters.rally || filters.player || filters.shotType;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Filter:</span>

      <input
        type="number"
        min={1}
        placeholder="Rally #"
        value={filters.rally || ''}
        onChange={(e) => update('rally', e.target.value ? parseInt(e.target.value) : '')}
        className="bg-gray-700 rounded px-2 py-1 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none w-20"
      />

      <select
        value={filters.player || ''}
        onChange={(e) => update('player', e.target.value)}
        className="bg-gray-700 rounded px-2 py-1 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        <option value="">All Players</option>
        <option>Player 1</option>
        <option>Player 2</option>
      </select>

      <select
        value={filters.shotType || ''}
        onChange={(e) => update('shotType', e.target.value)}
        className="bg-gray-700 rounded px-2 py-1 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        <option value="">All Shot Types</option>
        {SHOT_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>

      {hasFilters && (
        <button
          onClick={() => onChange({ rally: '', player: '', shotType: '' })}
          className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  );
}
