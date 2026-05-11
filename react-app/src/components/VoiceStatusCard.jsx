import { useEffect, useMemo, useState } from "react";
import {
  getVoiceDebugInfo,
  refreshVoices,
  resetVoiceChoice,
  speakDirect,
} from "../lib/tts";

// 簡易瀏覽器判斷（用 userAgent，足夠給使用者建議用）
function detectBrowser() {
  if (typeof navigator === "undefined") return { name: "unknown" };
  const ua = navigator.userAgent || "";
  // 注意順序：Edge / Brave 也含 "Chrome" 字眼，要先排除
  if (/Edg\//.test(ua)) return { name: "Edge" };
  if (/Firefox\//.test(ua)) return { name: "Firefox" };
  if (/Brave/.test(ua)) return { name: "Brave" };
  if (/CriOS/.test(ua)) return { name: "Chrome iOS" };
  if (/Chrome\//.test(ua) && /Safari\//.test(ua)) return { name: "Chrome" };
  if (/Safari\//.test(ua)) return { name: "Safari" };
  return { name: "unknown" };
}

// 目前語音狀態指示卡：讓使用者一眼看到實際在用哪個 voice、品質如何
// props:
//   refreshKey: any   父層任何狀態變動觸發重抓資訊
export default function VoiceStatusCard({ refreshKey }) {
  const [info, setInfo] = useState(() => getVoiceDebugInfo());
  const browser = useMemo(detectBrowser, []);

  useEffect(() => {
    const update = () => {
      refreshVoices();
      setInfo(getVoiceDebugInfo());
    };
    update();
    // 多次 retry 涵蓋語音清單異步載入
    const timers = [
      setTimeout(update, 300),
      setTimeout(update, 1200),
      setTimeout(update, 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [refreshKey]);

  if (!info.hasVoice) {
    return (
      <div className="rounded-2xl p-3 border-2 border-deep/15 bg-deep/5 text-sm text-deep/60">
        {info.summary}
      </div>
    );
  }

  const tone =
    info.tier === "great"
      ? "bg-mint/20 border-mint"
      : info.tier === "good"
        ? "bg-buttercup/20 border-buttercup"
        : info.tier === "ok"
          ? "bg-orange-100 border-orange-300"
          : "bg-coral/15 border-coral";

  const handleReset = () => {
    resetVoiceChoice();
    setInfo(getVoiceDebugInfo());
  };

  const handleTest = () => {
    refreshVoices();
    // 含冷僻字測試句
    speakDirect("速畫紅龜粿、黑輪、貢丸、椪餅", "zh-TW");
  };

  return (
    <div className={`rounded-2xl p-3 border-2 ${tone}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">{info.label.split(" ")[0]}</span>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm text-deep break-words">
            {info.name}
            <span className="ml-2 text-xs font-mono text-deep/60">{info.lang}</span>
          </div>
          <div className="text-xs text-deep/70 mt-0.5">
            {info.label.split(" ").slice(1).join(" ")}
            {info.isManual && <span className="ml-1 text-deep/50">（你選的）</span>}
            <span className="ml-2 text-deep/50">
              · 系統共 {info.chineseCount} 個中文／{info.totalCount} 個總計
            </span>
          </div>
        </div>
      </div>

      {info.advice && (
        <div className="text-xs text-deep/70 leading-relaxed mb-2">
          💡 {info.advice}
        </div>
      )}

      {!info.hasGoogle && !info.hasMS && (
        <div className="text-xs text-coral/90 leading-relaxed mb-2">
          <div className="font-bold mb-1">
            ⚠️ 沒偵測到 Google / Microsoft 線上中文語音（冷僻字念不出來的最常見原因）
          </div>
          {browser.name === "Chrome" && (
            <ul className="list-disc list-inside space-y-0.5 text-deep/75">
              <li>你在用 Chrome 但仍未抓到 Google 語音，試試：</li>
              <li className="ml-3">確認電腦有網路（Google 線上 TTS 是雲端服務）</li>
              <li className="ml-3">等 10-30 秒後 <strong>重整頁面</strong>（首次載入較慢）</li>
              <li className="ml-3">關閉廣告攔截 / 隱私擴充功能（如 uBlock、Privacy Badger）</li>
              <li className="ml-3">更新 Chrome 到最新版本</li>
            </ul>
          )}
          {browser.name === "Edge" && (
            <ul className="list-disc list-inside space-y-0.5 text-deep/75">
              <li>你在用 Edge 但沒抓到 Microsoft 線上語音 — 確認電腦有網路後重整頁面</li>
            </ul>
          )}
          {browser.name === "Safari" && (
            <ul className="list-disc list-inside space-y-0.5 text-deep/75">
              <li>Safari 不支援 Google / Microsoft 雲端 TTS</li>
              <li>請改用 <strong>桌面版 Chrome 或 Edge</strong>（最佳體驗）</li>
            </ul>
          )}
          {browser.name === "Brave" && (
            <ul className="list-disc list-inside space-y-0.5 text-deep/75">
              <li>Brave 的隱私防護預設會擋住 Google TTS</li>
              <li>在 Brave 設定中關閉 Shields，或改用 Chrome / Edge</li>
            </ul>
          )}
          {browser.name === "Firefox" && (
            <ul className="list-disc list-inside space-y-0.5 text-deep/75">
              <li>Firefox 對 Web Speech API 支援較有限</li>
              <li>請改用桌面版 <strong>Chrome 或 Edge</strong></li>
            </ul>
          )}
          {browser.name === "Chrome iOS" && (
            <ul className="list-disc list-inside space-y-0.5 text-deep/75">
              <li>iOS 上的 Chrome 共用 Safari 引擎，沒有 Google 雲端 TTS</li>
              <li>桌面 / Android 版 Chrome 才能用 Google 線上語音</li>
            </ul>
          )}
          {browser.name === "unknown" && (
            <div className="text-deep/75">建議改用桌面版 Chrome 或 Edge 取得最佳冷僻字涵蓋率</div>
          )}
        </div>
      )}
      {info.hasGoogle && info.tier !== "great" && (
        <div className="text-xs text-deep/70 mb-2">
          系統有 Google 中文語音但目前未啟用 — 可能是你之前手動選了其他語音。
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={handleTest} className="btn-soft text-xs">
          🔊 聽看看
        </button>
        {info.isManual && (
          <button onClick={handleReset} className="btn-soft text-xs">
            🔄 改回自動選最佳
          </button>
        )}
      </div>
    </div>
  );
}
