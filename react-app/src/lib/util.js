export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function normalize(s) {
  return (s || "")
    .replace(/\s+/g, "")
    .replace(/[，。！？、,.!?]/g, "")
    .toLowerCase();
}

export const defaultName = (i) => `選手 ${String.fromCharCode(65 + i)}`;
