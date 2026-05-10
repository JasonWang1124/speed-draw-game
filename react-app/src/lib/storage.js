const KEYS = {
  names: "speedDraw.playerNames",
  count: "speedDraw.playerCount",
  prefs: "speedDraw.prefs",
};

const safeJSON = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

export const storage = {
  loadNames: () => safeJSON.get(KEYS.names, []),
  saveNames: (names) => safeJSON.set(KEYS.names, names),
  loadCount: () => {
    const n = parseInt(localStorage.getItem(KEYS.count));
    return isNaN(n) ? null : n;
  },
  saveCount: (n) => localStorage.setItem(KEYS.count, String(n)),
  loadPrefs: () => safeJSON.get(KEYS.prefs, {}),
  savePrefs: (p) => safeJSON.set(KEYS.prefs, p),
};
