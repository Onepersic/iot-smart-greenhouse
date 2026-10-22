const STORAGE_KEY = 'greenhouse-monitor-v1';
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const saved = JSON.parse(raw), fresh = seed();
    return { ...fresh, ...saved, settings: { ...fresh.settings, ...saved.settings }, actuators: { ...fresh.actuators, ...saved.actuators } };
  } catch { return seed(); }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
