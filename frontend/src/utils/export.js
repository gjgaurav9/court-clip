export function exportCSV(annotations, videoFileName) {
  const headers = [
    'video_name', 'rally_number', 'shot_number', 'player_id',
    'shot_type', 'backhand', 'around_head', 'hit_area',
    'frame_start', 'frame_end', 'duration_sec',
  ];

  const rows = annotations.map((a) => [
    videoFileName,
    a.rallyNumber,
    a.shotNumber,
    a.playerId,
    a.shotType,
    a.backhand ? 1 : 0,
    a.aroundHead ? 1 : 0,
    a.hitArea ?? '',
    a.frameStart,
    a.frameEnd,
    a.durationSec,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  download(csv, `${stripExt(videoFileName)}_annotations.csv`, 'text/csv');
}

export function exportJSON(annotations, videoFileName) {
  const data = annotations.map((a) => ({
    video_name: videoFileName,
    rally_number: a.rallyNumber,
    shot_number: a.shotNumber,
    player_id: a.playerId,
    shot_type: a.shotType,
    backhand: a.backhand,
    around_head: a.aroundHead,
    hit_area: a.hitArea,
    frame_start: a.frameStart,
    frame_end: a.frameEnd,
    duration_sec: a.durationSec,
  }));

  const json = JSON.stringify(data, null, 2);
  download(json, `${stripExt(videoFileName)}_annotations.json`, 'application/json');
}

function stripExt(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

function download(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
