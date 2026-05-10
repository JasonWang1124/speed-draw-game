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

// 比對使用者答案是否符合題目（含別名）
// q 可以是字串或題目物件 { name, aliases? }
export function matchAnswer(input, q) {
  const target = normalize(input);
  if (!target) return false;
  if (typeof q === "string") return normalize(q) === target;
  if (normalize(q.name) === target) return true;
  if (Array.isArray(q.aliases)) {
    for (const alias of q.aliases) {
      if (normalize(alias) === target) return true;
    }
  }
  return false;
}

export const defaultName = (i) => `選手 ${String.fromCharCode(65 + i)}`;
