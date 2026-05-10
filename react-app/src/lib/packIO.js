// 自製題庫匯入匯出工具
// 支援格式：JSON（與 questions.json 同 schema）/ CSV（單分類，欄位：name, aliases, hint）

// ─── 觸發瀏覽器下載 ────────────────────────────
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延遲釋放避免 Safari 中斷下載
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── JSON ─────────────────────────────────────
// categories: [{ label, emoji, desc, items }]
export function exportJSON(categories, filename = "speed-draw-pack.json") {
  const payload = {
    schema: "speed-draw-pack/1",
    exportedAt: new Date().toISOString(),
    categories: categories.map(c => ({
      label: c.label,
      emoji: c.emoji,
      desc: c.desc,
      items: c.items,
    })),
  };
  download(filename, JSON.stringify(payload, null, 2), "application/json");
}

// 解析 JSON 字串 → 回傳 categories 陣列
// 容忍兩種輸入格式：
//   { categories: [...] }   ← 標準（含 schema）
//   [...]                    ← 直接是分類陣列
export function parseJSON(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSON 格式錯誤，無法解析");
  }
  let cats;
  if (Array.isArray(data)) cats = data;
  else if (data && Array.isArray(data.categories)) cats = data.categories;
  else throw new Error("檔案中找不到 categories 陣列");
  if (cats.length === 0) throw new Error("檔案內沒有任何分類");
  return cats;
}

// ─── CSV ─────────────────────────────────────
// 單分類專用：第一行為 header（name, aliases, hint）
// 別名以 | 分隔（避免和 CSV 的 , 衝突）
export function exportCSV(category, filename) {
  const rows = [["name", "aliases", "hint"]];
  for (const it of category.items) {
    rows.push([
      it.name || "",
      Array.isArray(it.aliases) ? it.aliases.join("|") : "",
      it.hint || "",
    ]);
  }
  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");
  // BOM 讓 Excel 正確識別 UTF-8
  download(filename || `${category.label || "pack"}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// 簡易 CSV 解析（支援雙引號 escape 與多行）
function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // 移除 BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++;
      } else {
        field += ch; i++;
      }
    } else {
      if (ch === '"') { inQuotes = true; i++; }
      else if (ch === ",") { row.push(field); field = ""; i++; }
      else if (ch === "\n" || ch === "\r") {
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
        // 吃掉 \r\n
        if (ch === "\r" && text[i + 1] === "\n") i += 2; else i++;
      } else { field += ch; i++; }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// 解析 CSV → 回傳單一分類
// label / emoji / desc 由呼叫方提供（由匯入對話框輸入）
export function parseCSV(text, { label = "匯入分類", emoji = "📦", desc = "" } = {}) {
  const rows = parseCSVRows(text);
  if (rows.length < 2) throw new Error("CSV 至少要有 header 列 + 一筆題目");
  const header = rows[0].map(s => s.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  if (nameIdx === -1) throw new Error("CSV header 必須包含 name 欄位");
  const aliasesIdx = header.indexOf("aliases");
  const hintIdx = header.indexOf("hint");

  const items = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const name = (cells[nameIdx] || "").trim();
    if (!name) continue;
    const item = { name };
    if (hintIdx !== -1 && cells[hintIdx]) item.hint = cells[hintIdx].trim();
    if (aliasesIdx !== -1 && cells[aliasesIdx]) {
      const aliases = cells[aliasesIdx]
        .split(/[|、，,;；]/)
        .map(a => a.trim())
        .filter(Boolean);
      if (aliases.length > 0) item.aliases = aliases;
    }
    items.push(item);
  }
  if (items.length === 0) throw new Error("CSV 中沒有有效的題目（name 欄位皆空）");
  return { label, emoji, desc, items };
}

// ─── URL hash 分享 ────────────────────────────
// 設計：把單一分類序列化 → 壓縮（簡單 deflate via CompressionStream） → base64url
// 接收端 reverse 即可。沒有 CompressionStream（舊瀏覽器）時 fallback 到原始 base64

function toBase64Url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deflate(text) {
  if (typeof CompressionStream === "undefined") {
    return new TextEncoder().encode(text);
  }
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

async function inflate(bytes) {
  if (typeof DecompressionStream === "undefined") {
    return new TextDecoder().decode(bytes);
  }
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const buf = await new Response(stream).arrayBuffer();
    return new TextDecoder().decode(buf);
  } catch {
    // bytes 可能是純文字（無壓縮 fallback）
    return new TextDecoder().decode(bytes);
  }
}

// 編碼單一分類為 share token
export async function encodeShare(category) {
  const payload = {
    label: category.label,
    emoji: category.emoji,
    desc: category.desc,
    items: category.items,
  };
  const json = JSON.stringify(payload);
  const compressed = await deflate(json);
  return toBase64Url(compressed);
}

// 從 token 解碼回分類
export async function decodeShare(token) {
  if (!token) throw new Error("分享連結為空");
  const bytes = fromBase64Url(token);
  const text = await inflate(bytes);
  const data = JSON.parse(text);
  if (!data || !data.label || !Array.isArray(data.items)) {
    throw new Error("分享資料格式錯誤");
  }
  return data;
}

// 產生完整可分享的 URL
export async function buildShareURL(category) {
  const token = await encodeShare(category);
  const base = window.location.origin + window.location.pathname;
  return `${base}#/import?p=${token}`;
}

// 從 location.hash 讀取 share token；沒有就回 null
export function readShareTokenFromHash() {
  const hash = window.location.hash || "";
  const m = hash.match(/import\?p=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

// 清掉 hash 中的 share token（不留在網址列）
export function clearShareHash() {
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

// ─── 從檔案讀取（File 物件）─────────────────────
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("檔案讀取失敗"));
    reader.readAsText(file, "UTF-8");
  });
}
