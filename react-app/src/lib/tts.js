// Web Speech 語音引擎輔助工具
let voicesCache = [];
let chosenVoice = null;
let lastSpeakAt = 0;
let lastStartAt = 0;

const PRIORITY = [
  v => /zh[-_]TW/i.test(v.lang),
  v => /zh[-_]HK/i.test(v.lang),
  v => /zh[-_]CN/i.test(v.lang),
  v => /^zh/i.test(v.lang),
  v => /Mei-Jia|Sin-ji|Ting-Ting|Yu-shu/i.test(v.name),
];

export function getVoices() { return voicesCache; }
export function getChosenVoice() { return chosenVoice; }

export function refreshVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  voicesCache = window.speechSynthesis.getVoices();
  if (!chosenVoice || !voicesCache.includes(chosenVoice)) {
    for (const test of PRIORITY) {
      const v = voicesCache.find(test);
      if (v) { chosenVoice = v; break; }
    }
    if (!chosenVoice && voicesCache.length) chosenVoice = voicesCache[0];
  }
}

export function selectVoice(voice) { chosenVoice = voice; }

export function initTTS() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
  setTimeout(refreshVoices, 300);
  setTimeout(refreshVoices, 1500);
  // Chrome 防 idle 暫停
  setInterval(() => {
    const synth = window.speechSynthesis;
    if (synth && synth.speaking) { synth.pause(); synth.resume(); }
  }, 10000);
}

export function speak(text, opts = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (opts.disabled) return;
  const synth = window.speechSynthesis;
  try {
    if (synth.paused) synth.resume();
    if (synth.speaking || synth.pending) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang || (chosenVoice ? chosenVoice.lang : "zh-TW");
    u.rate = opts.rate ?? 1.0;
    u.pitch = opts.pitch ?? 1.0;
    u.volume = opts.volume ?? 1.0;
    if (chosenVoice && (!opts.lang || opts.lang.startsWith("zh"))) u.voice = chosenVoice;
    u.onstart = () => { lastStartAt = Date.now(); };
    synth.speak(u);
    lastSpeakAt = Date.now();
    // watchdog
    setTimeout(() => {
      if (lastSpeakAt > lastStartAt && Date.now() - lastSpeakAt > 1500 && synth.speaking) {
        synth.cancel();
        setTimeout(() => synth.resume(), 50);
      }
    }, 1600);
  } catch (e) {
    console.warn("speak error", e);
  }
}

export function speakDirect(text, lang = "zh-TW") {
  // 不 cancel，給 user gesture 內最穩
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.0;
  u.volume = 1.0;
  if (chosenVoice && lang.startsWith("zh")) u.voice = chosenVoice;
  window.speechSynthesis.speak(u);
}

export function playBeep(freq = 660, duration = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.18;
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}
