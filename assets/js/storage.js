const STORAGE_KEY = 'greenhouse-monitor-v1';
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const saved = JSON.parse(raw), fresh = seed();
    return { ...fresh, ...saved, zones: (saved.zones || fresh.zones).map((zone, index) => ({ ...fresh.zones[index % fresh.zones.length], ...zone })), settings: { ...fresh.settings, ...saved.settings }, actuators: { ...fresh.actuators, ...saved.actuators }, history: (saved.history || fresh.history).map((item, index) => ({ ...fresh.history[index % fresh.history.length], ...item, water: item.water ?? saved.water ?? fresh.water })) };
  } catch { return seed(); }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

