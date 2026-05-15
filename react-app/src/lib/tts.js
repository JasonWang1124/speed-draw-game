// Web Speech API 語音引擎
// 設計目標：
// 1. 強制優先選擇 Google 中文語音（中文涵蓋率最完整）
// 2. 不使用 read 欄位人工修正，依賴語音引擎本身解析
// 3. 連續播報用 Promise 鏈接，避免 cancel() 互相吃掉
// 4. localStorage 記憶上次選的 voice
// 5. Chrome 防 idle 暫停 watchdog

const STORAGE_KEY = "speedDraw.voiceName"

let voicesCache = []
let chosenVoice = null
let userSelectedManually = false  // 使用者是否在 UI 上手動選過
let speakChain = Promise.resolve()
let watchdogTimer = null
let currentSpeechStartedAt = 0  // 目前 utterance 開始時刻；watchdog 用來判斷是否進入 Chrome 15s 暫停風險區

// ─── voice 選取分數 ────────────────────────────
// 分數越高越優先；目的：Google 國語（臺灣）一定排第一
function scoreVoice(v) {
  const name = (v.name || "").toLowerCase()
  const lang = (v.lang || "").toLowerCase()
  let s = 0

  // 第一級：Google 系列（雲端 TTS，中文涵蓋最完整）
  if (name.includes("google")) {
    if (lang === "zh-tw") s += 1000
    else if (lang.startsWith("zh-hk")) s += 900
    else if (lang.startsWith("zh-cn")) s += 800
    else if (lang.startsWith("zh")) s += 700
  }

  // 第二級：Microsoft 線上中文（Edge 上有 HsiaoChen / Yating / HanHan）
  if (name.includes("microsoft") || name.match(/hsiaochen|yating|hanhan|zhiwei|xiaoxiao/)) {
    if (lang === "zh-tw") s += 600
    else if (lang.startsWith("zh-hk")) s += 550
    else if (lang.startsWith("zh-cn")) s += 500
    else if (lang.startsWith("zh")) s += 450
  }

  // 第三級：macOS Premium / Enhanced 中文
  if (name.match(/premium|enhanced/i) && lang.startsWith("zh")) s += 400

  // 第四級：macOS 標準中文（Mei-Jia / Sin-ji / Ting-Ting / Meijia）
  if (name.match(/mei-?jia|sin-?ji|ting-?ting|meijia|sinji/i)) {
    if (lang === "zh-tw") s += 300
    else if (lang.startsWith("zh-hk")) s += 280
    else if (lang.startsWith("zh")) s += 250
  }

  // 第五級：純粹依語言代碼（沒中華語名稱辨識）
  if (s === 0) {
    if (lang === "zh-tw") s += 100
    else if (lang.startsWith("zh-hk")) s += 80
    else if (lang.startsWith("zh-cn")) s += 60
    else if (lang.startsWith("zh")) s += 40
  }

  // 加分：localService=false（雲端 voice 通常品質較好）
  if (s > 0 && v.localService === false) s += 20

  return s
}

// ─── voice 取得與排序 ───────────────────────────
export function getVoices() {
  return voicesCache
}

export function getChosenVoice() {
  return chosenVoice
}

export function getChineseVoices() {
  return voicesCache
    .filter(v => /^zh/i.test(v.lang))
    .map(v => ({ voice: v, score: scoreVoice(v) }))
    .sort((a, b) => b.score - a.score)
}

export function getAllVoicesScored() {
  return voicesCache
    .map(v => ({ voice: v, score: scoreVoice(v) }))
    .sort((a, b) => b.score - a.score)
}

// 從 localStorage 還原使用者上次選的 voice
function restoreSavedVoice() {
  try {
    const savedName = localStorage.getItem(STORAGE_KEY)
    if (!savedName) return null
    return voicesCache.find(v => v.name === savedName) || null
  } catch {
    return null
  }
}

export function refreshVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  const nextList = window.speechSynthesis.getVoices()
  if (nextList.length === 0) return
  voicesCache = nextList

  // 1. 使用者手動選過（含 localStorage 的記憶）→ 一律尊重，不自動升級
  if (userSelectedManually) {
    if (!chosenVoice || !voicesCache.includes(chosenVoice)) {
      // 已選的 voice 消失（例如系統移除），才 fallback
      chosenVoice = getChineseVoices()[0]?.voice || voicesCache[0] || null
    }
    return
  }

  // 2. 嘗試從 localStorage 還原（這也視為使用者選過）
  const saved = restoreSavedVoice()
  if (saved) {
    chosenVoice = saved
    userSelectedManually = true
    return
  }

  // 3. 沒有任何使用者偏好 → 永遠選當下最高分的 voice
  //    這條的重點：即使 chosenVoice 已存在，只要新清單裡有更高分的選項（例如 Google
  //    voice 後到），就升級過去，避免被一開始的低分 voice 卡住。
  const best = getChineseVoices()[0]?.voice || getAllVoicesScored()[0]?.voice || voicesCache[0]
  if (best && best !== chosenVoice) {
    if (chosenVoice && best !== chosenVoice) {
      console.info("[tts] voice upgraded:", chosenVoice?.name, "→", best.name, `(${best.lang})`)
    }
    chosenVoice = best
  }
}

// 在使用者點「開始遊戲」的手勢內 reset TTS 狀態（清空隊列、refresh voice）。
// 注意：不做 volume=0 的 priming utterance — 那會被緊接著的 speakNow("三") cancel 掉，
// 反而把 Chrome engine 卡進 cancel/speak 競態。真正的解鎖靠**接著呼叫的 speakNow 在同步堆疊內
// 直接呼叫 synth.speak()**（見 speakNow 的 idle path）。
export function unlockTTS() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return

  refreshVoices()

  const synth = window.speechSynthesis
  if (synth.speaking || synth.pending) synth.cancel()
  if (synth.paused) synth.resume()
  speakChain = Promise.resolve()
}

export function selectVoice(voice) {
  chosenVoice = voice
  userSelectedManually = true
  if (voice?.name) {
    try {
      localStorage.setItem(STORAGE_KEY, voice.name)
    } catch {
      // localStorage quota / privacy mode → silent
    }
  }
}

// 讓使用者重設「自動選最佳」（移除手動選擇記憶）
export function resetVoiceChoice() {
  userSelectedManually = false
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  refreshVoices()
}

// 偵錯資訊：給 UI 用
export function getVoiceDebugInfo() {
  if (!chosenVoice) {
    return {
      hasVoice: false,
      summary: "尚未載入語音清單",
      tier: "none",
    }
  }
  const score = scoreVoice(chosenVoice)
  let tier, label, advice
  if (score >= 700) {
    tier = "great"
    label = "🟢 高品質語音"
    advice = null
  } else if (score >= 400) {
    tier = "good"
    label = "🟡 中等品質"
    advice = "可用，但冷僻字可能會跳過。Chrome / Edge 通常有更好的 Google / Microsoft 線上語音"
  } else if (score >= 100) {
    tier = "ok"
    label = "🟠 基本品質"
    advice = "macOS 內建語音對冷僻字（紅龜粿、椪餅等）涵蓋率較差。建議改用 Chrome / Edge"
  } else {
    tier = "low"
    label = "🔴 非中文語音"
    advice = "目前選的不是中文語音，多數中文字會念不出來"
  }
  const chineseCount = voicesCache.filter(v => /^zh/i.test(v.lang)).length
  const hasGoogle = voicesCache.some(v => /google/i.test(v.name) && /^zh/i.test(v.lang))
  const hasMS = voicesCache.some(v => /microsoft|hsiaochen|yating|hanhan|xiaoxiao/i.test(v.name) && /^zh/i.test(v.lang))
  return {
    hasVoice: true,
    name: chosenVoice.name,
    lang: chosenVoice.lang,
    localService: chosenVoice.localService,
    score,
    tier,
    label,
    advice,
    chineseCount,
    totalCount: voicesCache.length,
    hasGoogle,
    hasMS,
    isManual: userSelectedManually,
  }
}

// ─── 初始化 ─────────────────────────────────────
export function initTTS() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return

  refreshVoices()

  // voice list 異步載入（Chrome 通常要等 voiceschanged 才有資料）
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices)

  // 多次 retry 避免某些瀏覽器只觸發一次 voiceschanged
  setTimeout(refreshVoices, 300)
  setTimeout(refreshVoices, 1000)
  setTimeout(refreshVoices, 3000)

  // Chrome 長句防暫停 watchdog：Chrome 連續念超過 ~15 秒會自動暫停。
  // 只在 utterance 已連續播超過 12 秒才介入 pause/resume，避免短句被切音。
  if (watchdogTimer) clearInterval(watchdogTimer)
  watchdogTimer = setInterval(() => {
    const synth = window.speechSynthesis
    if (!synth?.speaking || synth.paused) return
    const elapsed = Date.now() - currentSpeechStartedAt
    if (elapsed < 12000) return
    synth.pause()
    synth.resume()
  }, 4000)
}

// ─── 核心 speak（Promise 鏈接版） ──────────────
// 連續呼叫 speak 不會互相 cancel，而是排隊播報
function speakOne(text, opts = {}) {
  return new Promise(resolve => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve()
      return
    }
    if (opts.disabled || !text) {
      resolve()
      return
    }

    refreshVoices()

    const synth = window.speechSynthesis

    // 確保不在 paused state
    if (synth.paused) synth.resume()

    const u = new SpeechSynthesisUtterance(String(text))
    u.lang = opts.lang || (chosenVoice ? chosenVoice.lang : "zh-TW")
    u.rate = opts.rate ?? 1.0
    u.pitch = opts.pitch ?? 1.0
    u.volume = opts.volume ?? 1.0

    // 中文 utterance 一律綁 chosenVoice，避免引擎隨機挑語音
    if (chosenVoice && (!opts.lang || /^zh/i.test(opts.lang))) {
      u.voice = chosenVoice
    }

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }

    // 安全網：8 秒內 onend 沒觸發就強制 resolve（不阻塞 chain）
    const safetyTimer = setTimeout(finish, 8000)
    u.onstart = () => { currentSpeechStartedAt = Date.now() }
    u.onend = () => {
      clearTimeout(safetyTimer)
      finish()
    }
    u.onerror = () => {
      clearTimeout(safetyTimer)
      finish()
    }

    try {
      synth.speak(u)
    } catch (e) {
      console.warn("[tts] speak error", e)
      finish()
    }
  })
}

// 排隊播報：每次呼叫都接到 chain 後面
export function speak(text, opts = {}) {
  if (opts.disabled) return Promise.resolve()
  speakChain = speakChain.then(() => speakOne(text, opts))
  return speakChain
}

// 立即播報（中斷上一個）— 用在 user gesture 內或要打斷時
// 所有路徑都回 Promise，方便配 Promise.all([speakNow(...), sleep(N)]) 控節奏
//
// idle path 為何要同步：在 user gesture handler 內第一次呼叫時，必須**同步**
// 呼叫 synth.speak() 才能用掉 user activation 解鎖 Chrome 後續的 TTS。
// 一旦走 setTimeout 就跳出 gesture 同步堆疊，Chrome 會把首句靜默丟掉。
export function speakNow(text, opts = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve()
  }
  if (opts.disabled) return Promise.resolve()
  const synth = window.speechSynthesis
  const wasSpeaking = synth.speaking || synth.pending

  if (wasSpeaking) {
    synth.cancel()
    // Chrome cancel→speak race：120ms 緩衝給內部狀態清乾淨
    speakChain = new Promise(r => setTimeout(r, 120)).then(() => speakOne(text, opts))
  } else {
    // idle — 同步 speak 以保留 user gesture activation（首次解鎖必須這樣）
    speakChain = speakOne(text, opts)
  }
  return speakChain
}

// 清空播報佇列（換題、重開遊戲等）
export function cancelAllSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  const synth = window.speechSynthesis
  if (synth.speaking || synth.pending) synth.cancel()
  speakChain = Promise.resolve()
}

// 給 user gesture 內的測試用（不 cancel，最穩）
export function speakDirect(text, lang = "zh-TW") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 1.0
  u.volume = 1.0
  if (chosenVoice && /^zh/i.test(lang)) u.voice = chosenVoice
  window.speechSynthesis.speak(u)
}

// ─── 簡易 beep（Web Audio） ─────────────────────
export function playBeep(freq = 660, duration = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.value = 0.18
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // AudioContext unavailable
  }
}
