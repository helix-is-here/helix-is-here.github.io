/* =========================
   Morse Definitions
   ========================= */

const MORSE_MAP = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",

  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----."
};

// Prosigns are run-on: their letters are sent with no gap between them,
// so their code is just the letters' codes joined together.
const PROSIGNS = ["IX", "BT", "AR", "AS", "INT", "PT", "IMI", "AA", "AAA", "MIM"];

const CHARACTER_GROUPS = [
  { key: "lettersAM", label: "Letters A–M", chars: [..."ABCDEFGHIJKLM"] },
  { key: "lettersNZ", label: "Letters N–Z", chars: [..."NOPQRSTUVWXYZ"] },
  { key: "numbers", label: "Numbers", chars: [..."0123456789"] },
  { key: "prosigns", label: "Prosigns", chars: PROSIGNS }
];

const ALL_CHARS = CHARACTER_GROUPS.flatMap(group => group.chars);

function getMorseFor(token) {
  return [...token].map(char => MORSE_MAP[char]).join("");
}

/* =========================
   Application State
   ========================= */

const STORAGE_KEY = "morseDrop.settings.v1";

let transmissionToken = 0;
let wasManuallyStopped = false;
let autoRevealInProgress = false;
let wakeLock = null;

const state = {
  // populated from the form by syncSettingsFromUI()
  settings: {
    enabledChars: new Set()
  },

  generatedMessage: [],
  isTransmitting: false,
  hasCompleted: false
};

/* =========================
   DOM References
   ========================= */

const wpmInput = document.getElementById("wpm");
const wpmDisplay = document.getElementById("wpm-display");
const enableMessagePreroll = document.getElementById("enable-preroll");
const enableIIInput = document.getElementById("enable-ii-between-words");
const enableAutoRepeat = document.getElementById("enable-auto-repeat");
const autoRevealInputs = document.querySelectorAll('input[name="auto-reveal"]');

const wordLengthInput = document.getElementById("word-length");
const wordLengthDisplay = document.getElementById("word-length-display");

const wordCountInput = document.getElementById("word-count");
const wordCountDisplay = document.getElementById("word-count-display");

const groupInputs = document.querySelectorAll("input[data-group]");
const charPickerGroups = document.getElementById("char-picker-groups");
const charCount = document.getElementById("char-count");
const noCharsWarning = document.getElementById("no-chars-warning");

const startButton = document.getElementById("start-button");
const revealButton = document.getElementById("reveal-button");
const stopButton = document.getElementById("stop-button");

const messageOutput = document.getElementById("message-output");
const statusText = document.getElementById("status-text");
const signalLight = document.getElementById("signal-light");

/* =========================
   Utility Functions
   ========================= */

function updateStatus(text) {
  statusText.textContent = text;
}

function setSignal(on) {
  signalLight.classList.toggle("on", on);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTiming(dotLengthMs) {
  return {
    dot: dotLengthMs,
    dash: 3 * dotLengthMs,
    intraSymbolGap: dotLengthMs,
    interCharGap: 3 * dotLengthMs,
    interWordGap: 7 * dotLengthMs
  };
}

function createCharBox(text, isProsign) {
  const span = document.createElement("span");
  span.className = "char-box";
  if (isProsign) span.classList.add("prosign");
  span.textContent = text;
  return span;
}

function createWordGap() {
  const spacer = document.createElement("span");
  spacer.className = "word-gap";
  return spacer;
}

function renderMessageBoxes(words) {
  messageOutput.innerHTML = "";
  messageOutput.hidden = false;

  words.forEach((word, wordIndex) => {
    const wordWrapper = document.createElement("span");
    wordWrapper.className = "word-group";
    word.forEach(token => {
      wordWrapper.appendChild(createCharBox(token, token.length > 1));
    });
    messageOutput.appendChild(wordWrapper);

    if (wordIndex < words.length - 1) {
      messageOutput.appendChild(createWordGap());

      if (state.settings.includeII) {
        const iiWrapper = document.createElement("span");
        iiWrapper.className = "word-group ii-group";
        iiWrapper.appendChild(createCharBox("II", false));
        messageOutput.appendChild(iiWrapper);
        messageOutput.appendChild(createWordGap());
      }
    }
  });
}

function revealGeneratedMessage() {
  autoRevealInProgress = false;
  renderMessageBoxes(state.generatedMessage);
  updateStatus("Result revealed");
}

/* =========================
   Screen Wake Lock
   Keeps phones from dimming mid-transmission. Not supported everywhere,
   so failures are ignored.
   ========================= */

async function acquireWakeLock() {
  if (!("wakeLock" in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

function releaseWakeLock() {
  if (wakeLock) wakeLock.release().catch(() => {});
  wakeLock = null;
}

// the browser drops the lock when the tab is hidden; take it back on return
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.isTransmitting) {
    acquireWakeLock();
  }
});

/* =========================
   Countdown Helpers
   ========================= */

async function startDelayCountdown(seconds, token) {
  for (let i = seconds; i > 0; i--) {
    if (token !== transmissionToken) return;
    updateStatus(`Starting in ${i}…`);
    await sleep(1000);
  }
}

async function autoRevealCountdown(seconds, token) {
  autoRevealInProgress = true;

  const isStillWaiting = () =>
    token === transmissionToken && state.hasCompleted && autoRevealInProgress;

  for (let i = seconds; i > 0; i--) {
    if (!isStillWaiting()) return;
    updateStatus(`Auto-reveal in ${i}…`);
    await sleep(1000);
  }

  if (!isStillWaiting()) return;
  revealGeneratedMessage();
}

/* =========================
   Settings Sync & Persistence
   ========================= */

function syncSettingsFromUI() {
  const settings = state.settings;
  settings.wpm = Number(wpmInput.value);
  settings.dotLengthMs = 1200 / settings.wpm;
  settings.enablePreroll = enableMessagePreroll.checked;
  settings.includeII = enableIIInput.checked;
  settings.autoRepeat = enableAutoRepeat.checked;
  settings.autoReveal = document.querySelector('input[name="auto-reveal"]:checked')?.value || "3s";
  settings.wordLength = Number(wordLengthInput.value);
  settings.wordCount = Number(wordCountInput.value);
}

function updateDisplays() {
  wpmDisplay.textContent = state.settings.wpm;
  wordLengthDisplay.textContent = state.settings.wordLength;
  wordCountDisplay.textContent = state.settings.wordCount;
}

function saveSettings() {
  const settings = state.settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      wpm: settings.wpm,
      enablePreroll: settings.enablePreroll,
      includeII: settings.includeII,
      autoRepeat: settings.autoRepeat,
      autoReveal: settings.autoReveal,
      wordLength: settings.wordLength,
      wordCount: settings.wordCount,
      enabledChars: [...settings.enabledChars]
    }));
  } catch {
    // storage unavailable (private browsing etc.); settings just won't persist
  }
}

// Writes saved values back into the form. Returns false if nothing was saved.
function loadSavedSettings() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
  if (!saved || typeof saved !== "object") return false;

  if (saved.wpm != null) wpmInput.value = saved.wpm;
  if (saved.wordLength != null) wordLengthInput.value = saved.wordLength;
  if (saved.wordCount != null) wordCountInput.value = saved.wordCount;
  enableMessagePreroll.checked = Boolean(saved.enablePreroll);
  enableIIInput.checked = Boolean(saved.includeII);
  enableAutoRepeat.checked = Boolean(saved.autoRepeat);
  const savedReveal = [...autoRevealInputs].find(input => input.value === saved.autoReveal);
  if (savedReveal) savedReveal.checked = true;

  if (Array.isArray(saved.enabledChars)) {
    state.settings.enabledChars = new Set(
      saved.enabledChars.filter(char => ALL_CHARS.includes(char))
    );
  }

  return true;
}

/* =========================
   Character Picker
   ========================= */

function createMorseGlyph(morse) {
  const glyph = document.createElement("span");
  glyph.className = "morse-glyph";
  glyph.setAttribute("aria-hidden", "true");

  [...morse].forEach(symbol => {
    const mark = document.createElement("span");
    mark.className = symbol === "." ? "morse-dot" : "morse-dash";
    glyph.appendChild(mark);
  });

  return glyph;
}

function buildCharacterPicker() {
  CHARACTER_GROUPS.forEach(group => {
    const section = document.createElement("div");
    section.className = "char-picker-group";

    const heading = document.createElement("div");
    heading.className = "char-picker-heading";
    heading.textContent = group.label;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "char-picker-grid";

    group.chars.forEach(char => {
      const morse = getMorseFor(char);

      const label = document.createElement("label");
      label.className = "char-toggle";
      label.title = `${char}  ${morse}`;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.char = char;
      input.setAttribute("aria-label", `${char} (${morse})`);
      input.addEventListener("change", () => {
        if (input.checked) state.settings.enabledChars.add(char);
        else state.settings.enabledChars.delete(char);
        onCharactersChanged();
      });

      const name = document.createElement("span");
      name.className = "char-toggle-name";
      if (char.length > 1) name.classList.add("prosign");
      name.textContent = char;

      label.append(input, name, createMorseGlyph(morse));
      grid.appendChild(label);
    });

    section.appendChild(grid);
    charPickerGroups.appendChild(section);
  });
}

function refreshCharacterUI() {
  const enabled = state.settings.enabledChars;

  charPickerGroups.querySelectorAll("input[data-char]").forEach(input => {
    input.checked = enabled.has(input.dataset.char);
  });

  groupInputs.forEach(input => {
    const group = CHARACTER_GROUPS.find(g => g.key === input.dataset.group);
    const count = group.chars.filter(c => enabled.has(c)).length;
    input.checked = count === group.chars.length;
    input.indeterminate = count > 0 && count < group.chars.length;
  });

  charCount.textContent = `${enabled.size} of ${ALL_CHARS.length} enabled`;
  noCharsWarning.hidden = enabled.size > 0;
  updateStartAvailability();
}

function onCharactersChanged() {
  refreshCharacterUI();
  saveSettings();
}

/* =========================
   Message Generation
   ========================= */

function buildCharacterPool(settings) {
  return ALL_CHARS.filter(char => settings.enabledChars.has(char));
}

function generateMessage(settings) {
  const pool = buildCharacterPool(settings);
  if (pool.length === 0) return [];

  const words = [];

  for (let w = 0; w < settings.wordCount; w++) {
    const word = [];
    for (let c = 0; c < settings.wordLength; c++) {
      const index = Math.floor(Math.random() * pool.length);
      word.push(pool[index]);
    }
    words.push(word);
  }

  return words;
}

/* =========================
   Morse Encoding
   ========================= */

// One character or run-on prosign: its dots and dashes with element gaps
function encodeToken(token, timing) {
  const morse = getMorseFor(token);
  const queue = [];

  [...morse].forEach((symbol, symbolIndex) => {
    queue.push({
      on: true,
      duration: symbol === "." ? timing.dot : timing.dash
    });

    if (symbolIndex < morse.length - 1) {
      queue.push({ on: false, duration: timing.intraSymbolGap });
    }
  });

  return queue;
}

// Tokens sent as separate characters, with character gaps between them
function encodeWord(tokens, timing) {
  const queue = [];

  tokens.forEach((token, tokenIndex) => {
    queue.push(...encodeToken(token, timing));

    if (tokenIndex < tokens.length - 1) {
      queue.push({ on: false, duration: timing.interCharGap });
    }
  });

  return queue;
}

function encodeMessageToQueue(words, settings) {
  const timing = getTiming(settings.dotLengthMs);
  const wordGap = { on: false, duration: timing.interWordGap };
  const queue = [];

  if (settings.enablePreroll) {
    // general call "AA AA AA": the unknown-station / all-stations call
    // (AAA is the full stop, not a call)
    for (let i = 0; i < 3; i++) {
      queue.push(...encodeToken("AA", timing), wordGap);
    }
  }

  words.forEach((word, wordIndex) => {
    queue.push(...encodeWord(word, timing));

    if (wordIndex < words.length - 1) {
      queue.push(wordGap);

      if (settings.includeII) {
        // separative sign: two separate Is, flanked by word gaps
        queue.push(...encodeWord(["I", "I"], timing), wordGap);
      }
    }
  });

  return queue;
}

/* =========================
   Transmission Engine
   ========================= */

async function transmitQueue(queue, token) {
  for (const signal of queue) {
    if (token !== transmissionToken) break;
    setSignal(signal.on);
    await sleep(signal.duration);
  }

  setSignal(false);
}

/* =========================
   UI State Control
   ========================= */

function updateStartAvailability() {
  startButton.disabled =
    state.isTransmitting || state.settings.enabledChars.size === 0;
}

function setControlsEnabled(enabled) {
  const controls = [
    wpmInput,
    wordLengthInput,
    wordCountInput,
    enableMessagePreroll,
    enableIIInput,
    enableAutoRepeat,
    ...autoRevealInputs,
    ...groupInputs,
    ...charPickerGroups.querySelectorAll("input[data-char]")
  ];

  controls.forEach(input => {
    input.disabled = !enabled;
  });

  updateStartAvailability();
}

function finishTransmission() {
  state.isTransmitting = false;
  state.hasCompleted = true;

  stopButton.disabled = true;
  revealButton.disabled = false;
  setControlsEnabled(true);
  releaseWakeLock();
}

/* =========================
   Actions
   ========================= */

async function startTransmission() {
  syncSettingsFromUI();

  const message = generateMessage(state.settings);
  if (message.length === 0) return;

  transmissionToken++;
  const token = transmissionToken;

  wasManuallyStopped = false;
  autoRevealInProgress = false;

  state.generatedMessage = message;
  state.isTransmitting = true;
  state.hasCompleted = false;

  stopButton.disabled = false;
  revealButton.disabled = true;
  setControlsEnabled(false);
  acquireWakeLock();

  // short countdown first; the previous result stays visible during it
  await startDelayCountdown(3, token);
  if (token !== transmissionToken) return;

  messageOutput.hidden = true;
  messageOutput.innerHTML = "";

  updateStatus("Transmitting...");

  const queue = encodeMessageToQueue(state.generatedMessage, state.settings);
  await transmitQueue(queue, token);

  // a manual stop bumps the token and handles its own cleanup
  if (token !== transmissionToken) return;

  finishTransmission();
  updateStatus("Transmission complete");

  if (state.settings.autoReveal === "immediate") {
    revealGeneratedMessage();
  } else if (state.settings.autoReveal === "3s") {
    await autoRevealCountdown(3, token);
  }

  if (
    state.settings.autoRepeat &&
    state.settings.autoReveal !== "disabled" &&
    token === transmissionToken
  ) {
    setTimeout(startTransmission, 0);
  }
}

function revealMessage() {
  if (!state.hasCompleted) return;

  revealGeneratedMessage();

  // if user manually revealed and auto-repeat is enabled, start again
  if (state.settings.autoRepeat && !wasManuallyStopped) {
    setTimeout(startTransmission, 0);
  }
}

function stopTransmission() {
  if (!state.isTransmitting) return;

  wasManuallyStopped = true;
  transmissionToken++;
  autoRevealInProgress = false;

  setSignal(false);
  finishTransmission();
  updateStatus("Transmission stopped");
}

/* =========================
   Event Handlers
   ========================= */

[wpmInput, wordLengthInput, wordCountInput].forEach(input => {
  input.addEventListener("input", () => {
    syncSettingsFromUI();
    updateDisplays();
    saveSettings();
  });
});

[enableMessagePreroll, enableIIInput, enableAutoRepeat, ...autoRevealInputs].forEach(input => {
  input.addEventListener("change", () => {
    syncSettingsFromUI();
    saveSettings();
  });
});

groupInputs.forEach(input => {
  input.addEventListener("change", () => {
    const group = CHARACTER_GROUPS.find(g => g.key === input.dataset.group);
    group.chars.forEach(char => {
      if (input.checked) state.settings.enabledChars.add(char);
      else state.settings.enabledChars.delete(char);
    });
    onCharactersChanged();
  });
});

startButton.addEventListener("click", startTransmission);
revealButton.addEventListener("click", revealMessage);
stopButton.addEventListener("click", stopTransmission);

// Space: start, or reveal a finished message that isn't showing yet. Esc: stop.
document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;

  // leave keys alone when a form control or button has focus
  if (event.target.closest("input, button, select, textarea, summary, a, label")) return;

  if (event.key === " ") {
    event.preventDefault();
    if (!revealButton.disabled && messageOutput.hidden) {
      revealMessage();
    } else if (!startButton.disabled) {
      startTransmission();
    }
  } else if (event.key === "Escape") {
    stopTransmission();
  }
});

/* =========================
   Initialisation
   ========================= */

if (!loadSavedSettings()) {
  // first visit: enable the groups that are ticked in the HTML
  groupInputs.forEach(input => {
    if (!input.checked) return;
    const group = CHARACTER_GROUPS.find(g => g.key === input.dataset.group);
    group.chars.forEach(char => state.settings.enabledChars.add(char));
  });
}

buildCharacterPicker();
syncSettingsFromUI();
updateDisplays();
refreshCharacterUI();
updateStatus("Not Transmitting");
setSignal(false);
