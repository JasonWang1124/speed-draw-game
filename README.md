<div align="center">

# 🎴 速畫祭典

**聽聲速記．揮毫搶答**

*聽聲音搶答的速畫派對遊戲 — 一人聽題畫圖、其他人猜畫的就是什麼*

[![Live Demo](https://img.shields.io/badge/Live-speed--draw--game.pages.dev-D4391C?style=flat-square)](https://speed-draw-game.pages.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-1A3A5C?style=flat-square)](LICENSE)

—— 壹　·　聽聲速記．揮毫搶答　·　終 ——

</div>

---

## 🤔 為什麼做這個

派對畫畫遊戲的老問題：抽到的題目太雜、玩家畫得太認真、看的人猜不出來。

**速畫祭典的核心 twist** — 每個分類都有一個「強行套用」的視覺主題：

| 分類 | 怎麼畫 | 範例 |
|---|---|---|
| 圓形類 | 全部畫成一個圓 | 月亮、肉丸、月餅、紅龜粿 |
| 長條類 | 全部畫成一根棒子 | 羽毛、釣竿、注射器、薩克斯風 |
| 傘狀類 | 全部上寬下窄 | 羊角麵包、噴泉、101 大樓 |
| 動物剪影類 | 用最少線條畫出辨識特徵 | 犀牛、長頸鹿、孔雀、刺蝟 |

幽默點在於：把不同東西強行套成同一形狀，一群人會邊畫邊笑邊吵「你那個明明是 X 不是 Y！」

---

## ✨ 特色

- 🎴 **10 個視覺主題分類，各 50 題，共 500 題**
- 🔊 **Web Speech API 語音念題**，台灣口音 zh-TW，畫面只顯示鈴鐺不顯示題目文字
- 🎨 **浮世繪祭典視覺**：和紙、朱印、Yuji Syuku 漢字、燈籠、聲波同心圓
- 👥 **2–10 人對戰**，內建計分、輪流出題、最終排名揚塵
- 📝 **自製題庫** — 在 UI 上手動建立、編輯、匯入 JSON/CSV、匯出全部
- 🔗 **URL hash 題庫分享** — 把自製題庫壓縮成 token 塞 URL，朋友打開連結就能匯入
- 👁 **視覺輔助模式** — 冷僻字念不出來時，答題者可看題目文字（其他玩家還是只能靠聲音）
- 🎯 **可錯次數設定** — 0–5 次容錯，超過才算錯
- 🔁 **重播語音按鈕** — 沒聽清楚可重播

---

## 🎮 怎麼玩

1. **設定** — 填玩家姓名（2–10 人）、設題數 / 出題秒數 / 作答秒數 / 可錯次數、勾選類別
2. **聽題** — 點「開 席」，依設定秒數依序播報 N 題。畫面**只顯示聽聲鈴鐺與聲波**，刻意不顯示文字逼大家用耳朵聽
3. **作答** — 每位玩家被隨機分配到的題目，回想剛剛聽到的是什麼，**畫出來給其他人猜**
4. **計分** — 結算每位玩家的答對 / 答錯，最後排名揚塵

---

## 🛠 技術棧

| 類別 | 工具 |
|---|---|
| 框架 | React 19 + Vite 8 |
| 樣式 | Tailwind CSS 4 |
| 動畫 | framer-motion 12 |
| 語音 | Web Speech API（瀏覽器原生 TTS） |
| 動態效果 | canvas-confetti |
| 儲存 | localStorage（題庫、設定、玩家名單） |
| 部署 | Cloudflare Pages |
| 字型 | Yuji Syuku（印章字）· Klee One（標題）· Noto Sans TC（內文） |

---

## 🔧 本機開發

```bash
git clone https://github.com/JasonWang1124/speed-draw-game.git
cd speed-draw-game/react-app
npm install
npm run dev
```

預設跑在 `http://localhost:5173/`。

打 production build：

```bash
npm run build      # 產出到 dist/
npm run preview    # 本機預覽 dist
```

---

## 🚀 部署

已部署到 **Cloudflare Pages**。每次 `git push origin main` 自動觸發 build。

設定值：

| 欄位 | 值 |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `react-app` |
| Production branch | `main` |

---

## 📚 題庫結構

題庫由 10 個分類組成（每類 50 題，共 500 題）：

| ID | 名稱 | 視覺主題 |
|---|---|---|
| `round` | 圓形類 | 全部畫成一個圓 |
| `long` | 長條類 | 全部畫成一根棒子 |
| `umbrella` | 傘狀類 | 全部上寬下窄 |
| `bottle` | 瓶罐類 | 全部畫成瓶身 |
| `flat` | 扁平類 | 全部畫成一片扁 |
| `cube` | 方塊類 | 全部畫成方塊 |
| `ring` | 環形類 | 全部畫成一個圈（中間有洞） |
| `heart` | 心形 / 弧形類 | 全部畫成弧線 |
| `star` | 星形 / 放射類 | 全部放射狀 |
| `animal` | 動物剪影類 | 全部畫成動物剪影 |

<details>
<summary>📦 自製題庫 JSON 格式</summary>

```json
{
  "label": "我的題庫",
  "emoji": "📦",
  "desc": "簡介，10–30 字",
  "items": [
    { "name": "題目", "aliases": ["別名 1", "別名 2"], "hint": "畫畫提示" },
    { "name": "簡單題", "hint": "短描述" }
  ]
}
```

- `aliases` 可省略，給判定答題用
- `hint` 可省略，hint 在「視覺輔助模式」會顯示給答題者

</details>

---

## 🎵 TTS 細節

Chrome 上的 Web Speech API 有幾個常見坑，這專案的 [`react-app/src/lib/tts.js`](react-app/src/lib/tts.js) 處理了：

| 坑 | 解法 |
|---|---|
| 首句被靜默吞掉 | `speakNow` idle path 改成**同步**呼叫 `synth.speak()`，保留 user gesture activation |
| Chrome cancel→speak race | cancel 後延遲 120ms 再 speak，給內部狀態時間清乾淨 |
| 長句 > 15 秒自動暫停 | watchdog 偵測 utterance 超過 12 秒才介入 `pause()` → `resume()`，短句不被切音 |
| 冷僻字念不出來 | voice 自動升級：Google zh-TW > Microsoft 線上 > macOS Premium > 系統內建 |
| voice 清單延遲載入 | 監聽 `voiceschanged` + 300ms/1s/3s 多次 retry |

到「設定 → 進階」可以手動換 voice、測試難字（紅龜粿、椪餅、黑輪）、測試英文。

---

## 📁 專案結構

```
speed-draw-game/
├── react-app/                  # Vite + React 主程式
│   ├── src/
│   │   ├── components/         # Setup / QuestionPhase / AnswerPhase / Final ...
│   │   ├── lib/                # tts.js / questionBank.js / packIO.js / util.js
│   │   ├── questions.json      # 內建題庫（500 題）
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
├── README.md
└── LICENSE
```

---

## 📝 License

MIT © 2026 [Jason Wang](https://github.com/JasonWang1124)

詳見 [LICENSE](LICENSE)。

---

<div align="center">

**作　·　JASON　WANG　·　製**

二　〇　二　六

</div>
