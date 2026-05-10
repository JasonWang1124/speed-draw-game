// 題庫資料層
// 來源：內建 questions.json（不可修改） + 使用者自製分類（localStorage）
//
// Category schema:
//   { id, label, emoji?, desc?, items: [...], custom?: true }
// Item schema:
//   { name, aliases?: string[], hint?: string }

import builtin from "../questions.json";

const STORAGE_KEY = "speedDraw.customCategories";
const CUSTOM_PREFIX = "custom:"; // 自製分類 id 前綴，避免和內建 id 衝突

// ─── localStorage I/O ─────────────────────────
function readCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 防呆：過濾掉沒 id / items 的項目
    return parsed.filter(
      c => c && typeof c.id === "string" && Array.isArray(c.items)
    );
  } catch {
    return [];
  }
}

function writeCustom(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

// ─── 公開 API ─────────────────────────────────
// 取得所有分類（內建在前、自製在後）
export function getAllCategories() {
  const custom = readCustom().map(c => ({ ...c, custom: true }));
  return [...builtin.categories, ...custom];
}

export function getBuiltinCategories() {
  return builtin.categories;
}

export function getCustomCategories() {
  return readCustom();
}

// 由 id 找分類
export function findCategory(id) {
  return getAllCategories().find(c => c.id === id) || null;
}

// 產生新自製分類 id（custom:base-N，N 為流水號）
export function generateCustomId(base = "pack") {
  const existing = new Set(readCustom().map(c => c.id));
  let n = 1;
  while (existing.has(`${CUSTOM_PREFIX}${base}-${n}`)) n++;
  return `${CUSTOM_PREFIX}${base}-${n}`;
}

// 新增自製分類
export function addCustomCategory({ label, emoji = "📦", desc = "", items = [] }) {
  if (!label || !label.trim()) throw new Error("label 不可為空");
  const list = readCustom();
  const cat = {
    id: generateCustomId(),
    label: label.trim(),
    emoji,
    desc,
    items: items.map(normalizeItem).filter(Boolean),
  };
  list.push(cat);
  writeCustom(list);
  return cat;
}

// 更新自製分類（merge，不允許改 id）
export function updateCustomCategory(id, patch) {
  if (!id.startsWith(CUSTOM_PREFIX)) throw new Error("僅自製分類可編輯");
  const list = readCustom();
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) throw new Error("找不到分類");
  const next = { ...list[idx], ...patch, id }; // 強制保留 id
  if (Array.isArray(patch.items)) {
    next.items = patch.items.map(normalizeItem).filter(Boolean);
  }
  list[idx] = next;
  writeCustom(list);
  return next;
}

// 刪除自製分類
export function deleteCustomCategory(id) {
  if (!id.startsWith(CUSTOM_PREFIX)) throw new Error("僅自製分類可刪除");
  const list = readCustom().filter(c => c.id !== id);
  writeCustom(list);
}

// 完整覆寫所有自製分類（用於匯入）
export function replaceAllCustom(list) {
  if (!Array.isArray(list)) throw new Error("資料必須是陣列");
  const cleaned = list
    .map(c => normalizeCategory(c))
    .filter(Boolean);
  writeCustom(cleaned);
  return cleaned;
}

// 合併匯入（新增/更新）
export function mergeImportCustom(list) {
  if (!Array.isArray(list)) throw new Error("資料必須是陣列");
  const current = readCustom();
  const byLabel = new Map(current.map(c => [c.label, c]));
  for (const raw of list) {
    const norm = normalizeCategory(raw);
    if (!norm) continue;
    if (byLabel.has(norm.label)) {
      // 同名 → 合併 items（去重）
      const existing = byLabel.get(norm.label);
      const seen = new Set(existing.items.map(it => it.name));
      for (const it of norm.items) {
        if (!seen.has(it.name)) {
          existing.items.push(it);
          seen.add(it.name);
        }
      }
    } else {
      // 新分類 → 重新分配 id 避免撞號
      norm.id = generateCustomId();
      current.push(norm);
      byLabel.set(norm.label, norm);
    }
  }
  writeCustom(current);
  return current;
}

// ─── 正規化 ─────────────────────────────────────
function normalizeItem(it) {
  if (!it) return null;
  const name = String(it.name || "").trim();
  if (!name) return null;
  const out = { name };
  if (it.hint) out.hint = String(it.hint).trim();
  if (Array.isArray(it.aliases)) {
    const aliases = it.aliases
      .map(a => String(a || "").trim())
      .filter(Boolean);
    if (aliases.length > 0) out.aliases = aliases;
  }
  return out;
}

function normalizeCategory(c) {
  if (!c) return null;
  const label = String(c.label || "").trim();
  if (!label) return null;
  const items = Array.isArray(c.items)
    ? c.items.map(normalizeItem).filter(Boolean)
    : [];
  return {
    id: typeof c.id === "string" && c.id.startsWith(CUSTOM_PREFIX)
      ? c.id
      : generateCustomId(),
    label,
    emoji: c.emoji ? String(c.emoji).slice(0, 4) : "📦",
    desc: c.desc ? String(c.desc).trim() : "",
    items,
  };
}

// ─── 判斷工具 ───────────────────────────────────
export function isCustomCategory(idOrCat) {
  const id = typeof idOrCat === "string" ? idOrCat : idOrCat?.id;
  return typeof id === "string" && id.startsWith(CUSTOM_PREFIX);
}
