import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { storage } from "../lib/storage";
import { clamp, defaultName } from "../lib/util";
import { speakDirect, refreshVoices, getChosenVoice, selectVoice, playBeep, getChineseVoices, getAllVoicesScored } from "../lib/tts";
import CategoryPicker from "./CategoryPicker";
import MyPacks from "./MyPacks";

const PASTEL_COLORS = [
  "bg-pink-200", "bg-yellow-200", "bg-green-200", "bg-blue-200",
  "bg-purple-200", "bg-orange-200", "bg-teal-200", "bg-rose-200",
  "bg-amber-200", "bg-lime-200",
];

export default function Setup({ categories, categoriesVersion = 0, onStart, onCategoriesChanged }) {
  const cachedPrefs = useMemo(() => storage.loadPrefs(), []);
  const cachedNames = useMemo(() => storage.loadNames(), []);

  const [players, setPlayers] = useState(() => storage.loadCount() || 3);
  const [questionCount, setQuestionCount] = useState(cachedPrefs.questionCount || 15);
  const [intervalSec, setIntervalSec] = useState(cachedPrefs.intervalSec || 2);
  const [answerSec, setAnswerSec] = useState(cachedPrefs.answerSec || 10);
  const [maxWrongs, setMaxWrongs] = useState(cachedPrefs.maxWrongs ?? 1);
  // 多分類混選：陣列存 category id；空陣列代表「全部」
  const [categoryIds, setCategoryIds] = useState(() => {
    if (Array.isArray(cachedPrefs.categoryIds)) return cachedPrefs.categoryIds;
    // 從舊版 cachedPrefs.category 字串遷移
    if (cachedPrefs.category && cachedPrefs.category !== "mixed") return [cachedPrefs.category];
    return categories.map(c => c.id); // 預設全選
  });
  const [useTTS, setUseTTS] = useState(cachedPrefs.useTTS ?? true);
  const [shuffleAnswer, setShuffleAnswer] = useState(cachedPrefs.shuffleAnswer ?? true);
  const [names, setNames] = useState(() => {
    const arr = [];
    for (let i = 0; i < 10; i++) arr.push(cachedNames[i] || "");
    return arr;
  });
  const [voiceList, setVoiceList] = useState([]); // 已排序：高分在前
  const [chosenVoiceName, setChosenVoiceName] = useState("");
  const [showAllLangs, setShowAllLangs] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 載入語音清單（依使用者選擇過濾語言）
  useEffect(() => {
    const update = () => {
      refreshVoices();
      const list = showAllLangs
        ? getAllVoicesScored()
        : getChineseVoices();
      setVoiceList(list);
      const chosen = getChosenVoice();
      setChosenVoiceName(chosen?.name || "");
    };
    update();
    const t1 = setTimeout(update, 400);
    const t2 = setTimeout(update, 1500);
    const t3 = setTimeout(update, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [showAllLangs]);

  // 即時存名字
  useEffect(() => {
    storage.saveNames(names.slice(0, players));
  }, [names, players]);

  const handleStart = () => {
    const finalNames = [];
    for (let i = 0; i < players; i++) {
      finalNames.push((names[i] || "").trim() || defaultName(i));
    }
    storage.saveCount(players);
    storage.savePrefs({ questionCount, intervalSec, answerSec, maxWrongs, categoryIds, useTTS, shuffleAnswer });
    onStart({
      players,
      playerNames: finalNames,
      questionCount: clamp(questionCount, 3, 50),
      intervalMs: clamp(intervalSec, 1, 10) * 1000,
      answerSec: clamp(answerSec, 3, 60),
      maxWrongs: clamp(maxWrongs, 0, 5),
      categoryIds,
      useTTS,
      shuffleAnswer,
    });
  };

  const testVoice = () => {
    refreshVoices();
    // 包含常見的冷僻字，可立即聽出語音引擎涵蓋率
    speakDirect("速畫紅龜粿、黑輪、貢丸、椪餅", "zh-TW");
  };

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-10"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <motion.h1
          className="inline-block text-5xl sm:text-7xl font-black text-deep relative"
          initial={{ scale: 0.8 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          速記速畫
          <span className="absolute -top-3 -right-6 text-3xl animate-wiggle inline-block">✨</span>
        </motion.h1>
        <p className="mt-3 text-deep/70 text-base sm:text-lg font-semibold">
          🎨 形狀很像但又不一樣 · 聽聲音速記 · 比誰最快
        </p>
      </div>

      {/* Player names */}
      <Section emoji="👥" title="參賽者">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="font-bold text-deep">人數</span>
          <div className="flex items-center gap-2">
            <RoundBtn onClick={() => setPlayers(p => Math.max(2, p - 1))}>−</RoundBtn>
            <span className="text-3xl font-black w-12 text-center">{players}</span>
            <RoundBtn onClick={() => setPlayers(p => Math.min(10, p + 1))}>+</RoundBtn>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: players }).map((_, i) => (
            <div key={i} className={`${PASTEL_COLORS[i % PASTEL_COLORS.length]} rounded-2xl p-2 border-2 border-deep/15 shadow-[3px_3px_0_rgba(45,27,78,0.15)]`}>
              <input
                type="text"
                value={names[i] || ""}
                placeholder={defaultName(i)}
                maxLength={12}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                className="w-full bg-transparent text-deep font-bold text-center text-base sm:text-lg outline-none placeholder:text-deep/40"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Category picker (multi-select) */}
      <Section emoji="🎯" title="題目類別">
        <CategoryPicker
          categories={categories}
          selected={categoryIds}
          onChange={setCategoryIds}
        />
      </Section>

      {/* My custom packs */}
      <Section emoji="📝" title="我的題庫（自製）">
        <MyPacks onChanged={onCategoriesChanged} externalVersion={categoriesVersion} />
      </Section>

      {/* Quick settings */}
      <Section emoji="⚙️" title="遊戲設定">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stepper label="題數" value={questionCount} onChange={setQuestionCount} min={3} max={50} unit="題" />
          <Stepper label="出題秒數" value={intervalSec} onChange={setIntervalSec} min={1} max={10} unit="秒" />
          <Stepper label="作答秒數" value={answerSec} onChange={setAnswerSec} min={3} max={60} unit="秒" />
          <Stepper label="可錯次數" value={maxWrongs} onChange={setMaxWrongs} min={0} max={5} unit="次" />
        </div>
      </Section>

      {/* Advanced */}
      <Section emoji="🔊" title="語音與其他">
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input type="checkbox" checked={useTTS} onChange={(e) => setUseTTS(e.target.checked)} className="w-5 h-5 accent-coral" />
          <span className="font-bold">啟用語音播報</span>
        </label>
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input type="checkbox" checked={shuffleAnswer} onChange={(e) => setShuffleAnswer(e.target.checked)} className="w-5 h-5 accent-coral" />
          <span className="font-bold">解答階段打亂順序</span>
        </label>
        <button
          onClick={() => setShowAdvanced(s => !s)}
          className="text-deep/60 text-sm underline mb-3"
        >
          {showAdvanced ? "收起進階設定" : "展開進階設定"}
        </button>
        {showAdvanced && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold">選擇語音（推薦 Google 國語）</label>
                <label className="text-xs text-deep/60 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAllLangs}
                    onChange={(e) => setShowAllLangs(e.target.checked)}
                    className="w-4 h-4 accent-coral"
                  />
                  顯示全部語音
                </label>
              </div>
              <select
                value={chosenVoiceName}
                onChange={(e) => {
                  const name = e.target.value;
                  const entry = voiceList.find(({ voice }) => voice.name === name);
                  if (entry) {
                    selectVoice(entry.voice);
                    setChosenVoiceName(name);
                  }
                }}
                className="w-full p-2 rounded-xl border-2 border-deep/15 bg-white"
              >
                {voiceList.length === 0 && (
                  <option value="">（語音清單載入中⋯）</option>
                )}
                {voiceList.map(({ voice, score }, i) => {
                  const isTop = i === 0 && score >= 700;
                  const recommended = score >= 700;
                  return (
                    <option key={voice.name + voice.lang} value={voice.name}>
                      {recommended ? "★ " : ""}
                      {isTop ? "(推薦) " : ""}
                      {voice.name} — {voice.lang}
                    </option>
                  );
                })}
              </select>
              {!showAllLangs && voiceList.length === 0 && (
                <p className="text-xs text-coral/80 mt-1 font-bold">
                  ⚠️ 偵測不到中文語音，請改用 Chrome / Edge，或勾「顯示全部語音」手動挑選
                </p>
              )}
              {!showAllLangs && voiceList.length > 0 && voiceList[0].score < 700 && (
                <p className="text-xs text-deep/60 mt-1">
                  💡 沒找到 Google / Microsoft 線上語音；建議用 Chrome 或 Edge 取得最佳發音
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={testVoice} className="btn-soft text-sm">🔊 測試中文難字</button>
              <button onClick={() => { refreshVoices(); speakDirect("Voice test, one two three", "en-US"); }} className="btn-soft text-sm">🔉 測試英文</button>
              <button onClick={() => playBeep()} className="btn-soft text-sm">🎵 測試 Beep</button>
            </div>
          </div>
        )}
      </Section>

      <div className="text-center mt-8">
        <motion.button
          whileHover={categoryIds.length > 0 ? { scale: 1.05 } : {}}
          whileTap={categoryIds.length > 0 ? { scale: 0.95 } : {}}
          onClick={handleStart}
          disabled={categoryIds.length === 0}
          className="btn-pop text-2xl px-12 py-5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          🎮 開始遊戲
        </motion.button>
      </div>
    </motion.div>
  );
}

function Section({ emoji, title, children }) {
  return (
    <div className="sticker p-4 sm:p-6 mb-5">
      <h2 className="text-xl sm:text-2xl font-black mb-3 flex items-center gap-2">
        <span className="text-2xl sm:text-3xl">{emoji}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function RoundBtn({ children, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className="w-10 h-10 rounded-full bg-deep text-white font-black text-xl shadow-[2px_2px_0_rgba(45,27,78,0.3)]"
    >
      {children}
    </motion.button>
  );
}

function Stepper({ label, value, onChange, min, max, unit }) {
  return (
    <div className="bg-cream rounded-2xl p-3 border-2 border-deep/10 text-center">
      <div className="text-xs font-bold text-deep/60 mb-1">{label}</div>
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-full bg-deep/10 hover:bg-deep/20 font-black">−</button>
        <span className="text-xl sm:text-2xl font-black w-10 text-center">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-7 h-7 rounded-full bg-deep/10 hover:bg-deep/20 font-black">+</button>
      </div>
      <div className="text-xs text-deep/50 mt-1">{unit}</div>
    </div>
  );
}
