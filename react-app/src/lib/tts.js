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
let speakChain = Promise.resolve()
let watchdogTimer = null

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
  voicesCache = window.speechSynthesis.getVoices()
  if (voicesCache.length === 0) return

  // 還原使用者選擇 > 最高分 voice > 第一個
  if (!chosenVoice || !voicesCache.includes(chosenVoice)) {
    chosenVoice =
      restoreSavedVoice() ||
      getChineseVoices()[0]?.voice ||
      getAllVoicesScored()[0]?.voice ||
      voicesCache[0] ||
      null
  }
}

export function selectVoice(voice) {
  chosenVoice = voice
  if (voice?.name) {
    try {
      localStorage.setItem(STORAGE_KEY, voice.name)
    } catch {
      // localStorage quota / privacy mode → silent
    }
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

  // Chrome 防 idle 暫停 watchdog（每 5 秒喚醒一次）
  if (watchdogTimer) clearInterval(watchdogTimer)
  watchdogTimer = setInterval(() => {
    const synth = window.speechSynthesis
    if (synth?.speaking && !synth.paused) {
      synth.pause()
      synth.resume()
    }
  }, 5000)
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

    u.onend = finish
    u.onerror = () => finish()

    // 安全網：5 秒內 onend 沒觸發就強制 resolve（不阻塞 chain）
    const safetyTimer = setTimeout(finish, 5000)
    u.onend = () => {
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
export function speakNow(text, opts = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  if (opts.disabled) return
  const synth = window.speechSynthesis
  if (synth.speaking || synth.pending) synth.cancel()
  speakChain = speakOne(text, opts)
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
