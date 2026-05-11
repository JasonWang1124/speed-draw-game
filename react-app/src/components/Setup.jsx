import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { storage } from "../lib/storage";
import { clamp, defaultName } from "../lib/util";
import { speakDirect, refreshVoices, getChosenVoice, selectVoice, playBeep, getChineseVoices, getAllVoicesScored, unlockTTS } from "../lib/tts";
import CategoryPicker from "./CategoryPicker";
import MyPacks from "./MyPacks";
import VoiceStatusCard from "./VoiceStatusCard";
import heroLanterns from "../assets/hero-lanterns.png";

// 章節編號（壹貳參肆伍） — 取代 emoji
const SECTION_NUMERALS = ["壹", "貳", "參", "肆", "伍"];

export default function Setup({ categories, categoriesVersion = 0, onStart, onCategoriesChanged }) {
  const cachedPrefs = useMemo(() => storage.loadPrefs(), []);
  const cachedNames = useMemo(() => storage.loadNames(), []);

  const [players, setPlayers] = useState(() => storage.loadCount() || 3);
  const [questionCount, setQuestionCount] = useState(cachedPrefs.questionCount || 15);
  const [intervalSec, setIntervalSec] = useState(cachedPrefs.intervalSec || 2);
  const [answerSec, setAnswerSec] = useState(cachedPrefs.answerSec || 10);
  const [maxWrongs, setMaxWrongs] = useState(cachedPrefs.maxWrongs ?? 1);
  const [categoryIds, setCategoryIds] = useState(() => {
    if (Array.isArray(cachedPrefs.categoryIds)) return cachedPrefs.categoryIds;
    if (cachedPrefs.category && cachedPrefs.category !== "mixed") return [cachedPrefs.category];
    return categories.map(c => c.id);
  });
  const [useTTS, setUseTTS] = useState(cachedPrefs.useTTS ?? true);
  const [shuffleAnswer, setShuffleAnswer] = useState(cachedPrefs.shuffleAnswer ?? true);
  const [showAnswerText, setShowAnswerText] = useState(cachedPrefs.showAnswerText ?? false);
  const [names, setNames] = useState(() => {
    const arr = [];
    for (let i = 0; i < 10; i++) arr.push(cachedNames[i] || "");
    return arr;
  });
  const [voiceList, setVoiceList] = useState([]);
  const [chosenVoiceName, setChosenVoiceName] = useState("");
  const [showAllLangs, setShowAllLangs] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const update = () => {
      refreshVoices();
      const list = showAllLangs ? getAllVoicesScored() : getChineseVoices();
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

  useEffect(() => {
    storage.saveNames(names.slice(0, players));
  }, [names, players]);

  const handleStart = () => {
    const finalNames = [];
    for (let i = 0; i < players; i++) {
      finalNames.push((names[i] || "").trim() || defaultName(i));
    }
    storage.saveCount(players);
    storage.savePrefs({ questionCount, intervalSec, answerSec, maxWrongs, categoryIds, useTTS, shuffleAnswer, showAnswerText });
    if (useTTS) unlockTTS();
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
      showAnswerText,
    });
  };

  const testVoice = () => {
    refreshVoices();
    speakDirect("速畫紅龜粿、黑輪、貢丸、椪餅", "zh-TW");
  };

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ─── Hero ─── */}
      <div className="relative mb-10 sm:mb-14">
        {/* 主視覺：燈籠插畫 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-2"
        >
          <img
            src={heroLanterns}
            alt=""
            className="w-48 sm:w-60 animate-hero-float"
            style={{ filter: "drop-shadow(0 8px 16px rgba(26, 58, 92, 0.25))" }}
          />
        </motion.div>

        {/* 主標題：直書「速畫祭典」 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-center"
        >
          <h1 className="font-display text-5xl sm:text-7xl font-semibold text-[var(--color-ink)] tracking-[0.15em] inline-flex items-baseline gap-1">
            <span>速</span>
            <span>畫</span>
            <span className="text-[var(--color-vermillion)]">祭</span>
            <span>典</span>
          </h1>
          <div className="mt-4 flex items-center justify-center gap-3 text-sm sm:text-base text-[var(--color-ink-soft)]">
            <span className="font-stamp text-[var(--color-vermillion)] text-xl">壹</span>
            <span className="tracking-[0.3em] font-display">聽聲速記．揮毫搶答</span>
            <span className="font-stamp text-[var(--color-vermillion)] text-xl">終</span>
          </div>
        </motion.div>
      </div>

      {/* ─── 參賽者 ─── */}
      <SectionScroll index={0} title="參賽者" subtitle="Hosts" delay={0.1}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <span className="font-display text-base text-[var(--color-ink-soft)] tracking-widest">人　數</span>
          <div className="flex items-center gap-3">
            <CircleBtn onClick={() => setPlayers(p => Math.max(2, p - 1))} aria-label="減少人數">−</CircleBtn>
            <span className="font-stamp text-4xl text-[var(--color-vermillion)] w-12 text-center leading-none">{players}</span>
            <CircleBtn onClick={() => setPlayers(p => Math.min(10, p + 1))} aria-label="增加人數">+</CircleBtn>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {Array.from({ length: players }).map((_, i) => (
            <PlayerSlot
              key={i}
              index={i}
              value={names[i] || ""}
              placeholder={defaultName(i)}
              onChange={(v) => {
                const next = [...names];
                next[i] = v;
                setNames(next);
              }}
            />
          ))}
        </div>
      </SectionScroll>

      {/* ─── 題目類別 ─── */}
      <SectionScroll index={1} title="題目類別" subtitle="Categories" delay={0.2}>
        <CategoryPicker
          categories={categories}
          selected={categoryIds}
          onChange={setCategoryIds}
        />
      </SectionScroll>

      {/* ─── 自製題庫 ─── */}
      <SectionScroll index={2} title="我的題庫" subtitle="My Decks" delay={0.3}>
        <MyPacks onChanged={onCategoriesChanged} externalVersion={categoriesVersion} />
      </SectionScroll>

      {/* ─── 遊戲設定 ─── */}
      <SectionScroll index={3} title="場次設定" subtitle="Rounds" delay={0.4}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stepper label="題數" value={questionCount} onChange={setQuestionCount} min={3} max={50} unit="題" />
          <Stepper label="出題秒數" value={intervalSec} onChange={setIntervalSec} min={1} max={10} unit="秒" />
          <Stepper label="作答秒數" value={answerSec} onChange={setAnswerSec} min={3} max={60} unit="秒" />
          <Stepper label="可錯次數" value={maxWrongs} onChange={setMaxWrongs} min={0} max={5} unit="次" />
        </div>
      </SectionScroll>

      {/* ─── 語音與其他 ─── */}
      <SectionScroll index={4} title="語音與其他" subtitle="Voice" delay={0.5}>
        {useTTS && (
          <div className="mb-4">
            <VoiceStatusCard refreshKey={chosenVoiceName + showAllLangs} />
          </div>
        )}

        <Toggle
          checked={useTTS}
          onChange={setUseTTS}
          label="啟用語音播報"
        />
        <Toggle
          checked={showAnswerText}
          onChange={setShowAnswerText}
          label="答題者可看到題目文字"
          hint="冷僻字念不出來時的視覺 fallback；其他玩家還是只能靠聲音"
        />
        <Toggle
          checked={shuffleAnswer}
          onChange={setShuffleAnswer}
          label="解答階段打亂順序"
        />

        <button
          onClick={() => setShowAdvanced(s => !s)}
          className="font-display text-sm text-[var(--color-indigo)] underline underline-offset-4 decoration-2 decoration-[var(--color-vermillion)]/40 hover:decoration-[var(--color-vermillion)] tracking-widest mt-2"
        >
          {showAdvanced ? "—　收起進階　—" : "—　展開進階　—"}
        </button>

        {showAdvanced && (
          <div className="space-y-4 mt-4 pt-4 border-t border-dashed border-[var(--color-ink)]/15">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-display text-sm tracking-wider">選擇語音</label>
                <label className="text-xs text-[var(--color-ink-soft)] flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAllLangs}
                    onChange={(e) => setShowAllLangs(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[var(--color-vermillion)]"
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
                className="w-full p-2.5 border-2 border-[var(--color-ink)]/20 bg-[var(--color-washi-bright)] font-sans text-sm focus:outline-none focus:border-[var(--color-vermillion)]"
              >
                {voiceList.length === 0 && <option value="">（語音清單載入中⋯）</option>}
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
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={testVoice} className="btn-paper text-xs">🔊 測試難字</button>
              <button onClick={() => { refreshVoices(); speakDirect("Voice test, one two three", "en-US"); }} className="btn-paper text-xs">🔉 測試英文</button>
              <button onClick={() => playBeep()} className="btn-paper text-xs">🎵 測試 Beep</button>
            </div>
          </div>
        )}
      </SectionScroll>

      {/* ─── CTA ─── */}
      <div className="text-center mt-10">
        <motion.button
          whileHover={categoryIds.length > 0 ? { scale: 1.02 } : {}}
          whileTap={categoryIds.length > 0 ? { scale: 0.97 } : {}}
          onClick={handleStart}
          disabled={categoryIds.length === 0}
          className="btn-seal text-lg sm:text-xl px-14 sm:px-20 py-5"
        >
          開　席
        </motion.button>
        <div className="mt-5 font-display text-xs text-[var(--color-ink-soft)] tracking-[0.4em]">
          ／ 即 將 揭 幕 ／
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
 * Sub-components
 * ───────────────────────────────────────────── */

// 區段：和紙卷軸 + 章節編號
function SectionScroll({ index, title, subtitle, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="washi-card rounded-sm p-5 sm:p-7 mb-5"
    >
      <header className="flex items-baseline gap-3 mb-5">
        <span className="font-stamp text-2xl sm:text-3xl text-[var(--color-vermillion)] leading-none">
          {SECTION_NUMERALS[index]}
        </span>
        <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-[0.15em] text-[var(--color-ink)]">
          {title}
        </h2>
        <span className="text-xs tracking-[0.3em] text-[var(--color-ink-soft)]/60 uppercase ml-1">
          {subtitle}
        </span>
        <span className="flex-1 h-px bg-gradient-to-r from-[var(--color-ink)]/30 to-transparent ml-2"></span>
      </header>
      {children}
    </motion.section>
  );
}

function CircleBtn({ children, onClick, ...rest }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      {...rest}
      className="w-10 h-10 rounded-full bg-[var(--color-ink)] text-[var(--color-washi-bright)] font-display text-xl leading-none flex items-center justify-center shadow-[2px_2px_0_var(--color-vermillion)] hover:shadow-[3px_3px_0_var(--color-vermillion)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition"
    >
      {children}
    </motion.button>
  );
}

// 玩家輸入：和紙卡 + 索引印章
function PlayerSlot({ index, value, placeholder, onChange }) {
  return (
    <div className="relative bg-[var(--color-washi-warm)] border-2 border-[var(--color-ink)] p-3 pl-10 transition hover:shadow-[3px_3px_0_var(--color-vermillion)]">
      {/* 索引印章 */}
      <span className="absolute left-2 top-1/2 -translate-y-1/2 stamp-round" style={{ width: 28, height: 28, fontSize: 13 }}>
        {index + 1}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={12}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-display font-semibold text-[var(--color-ink)] text-base sm:text-lg outline-none placeholder:text-[var(--color-ink)]/30 tracking-wider"
      />
    </div>
  );
}

// 數字計步器：和紙卡 + Yuji Syuku 大字
function Stepper({ label, value, onChange, min, max, unit }) {
  return (
    <div className="bg-[var(--color-washi-warm)] border-2 border-[var(--color-ink)]/80 p-3 text-center">
      <div className="font-display text-xs text-[var(--color-ink-soft)] tracking-[0.3em] mb-1.5">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 flex items-center justify-center bg-[var(--color-washi-bright)] border border-[var(--color-ink)]/40 hover:bg-[var(--color-ink)] hover:text-[var(--color-washi-bright)] font-display text-base leading-none transition"
        >
          −
        </button>
        <span className="font-stamp text-3xl sm:text-4xl text-[var(--color-vermillion)] w-10 text-center leading-none">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 flex items-center justify-center bg-[var(--color-washi-bright)] border border-[var(--color-ink)]/40 hover:bg-[var(--color-ink)] hover:text-[var(--color-washi-bright)] font-display text-base leading-none transition"
        >
          +
        </button>
      </div>
      <div className="font-display text-xs text-[var(--color-ink-soft)]/70 tracking-widest mt-1">{unit}</div>
    </div>
  );
}

// Toggle：朱色印章勾選
function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start gap-3 mb-3 cursor-pointer group">
      <span className="relative flex items-center justify-center w-6 h-6 mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <span
          className={`absolute inset-0 border-2 transition-all ${
            checked
              ? "bg-[var(--color-vermillion)] border-[var(--color-vermillion-dark)]"
              : "bg-[var(--color-washi-bright)] border-[var(--color-ink)]/40 group-hover:border-[var(--color-ink)]"
          }`}
        ></span>
        {checked && (
          <svg className="relative z-10 w-4 h-4 text-[var(--color-washi-bright)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="flex-1">
        <span className="font-display font-semibold text-[var(--color-ink)] tracking-wider">{label}</span>
        {hint && (
          <span className="block text-xs text-[var(--color-ink-soft)]/70 mt-0.5 leading-relaxed">{hint}</span>
        )}
      </span>
    </label>
  );
}
