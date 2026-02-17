/* =========================
   Application State
   ========================= */

let transmissionToken = 0;
let wasManuallyStopped = false;
let autoRevealInProgress = false;

const state = {
  settings: {
    dotLengthMs: 250,
    enableStartDelay: true,
    enableAutoReveal: true,
    enablePreroll: false,
    wordLength: 5,
    wordCount: 1,
    enableLetters: true,
    enableNumbers: false
  },

  generatedMessage: [],
  isTransmitting: false,
  hasCompleted: false
};

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

/* =========================
   DOM References
   ========================= */

const dotLengthInput = document.getElementById("dot-length");
const enableStartDelay = document.getElementById("enable-start-delay");
const enableAutoReveal = document.getElementById("enable-auto-reveal");
const enableMessagePreroll = document.getElementById("enable-preroll");

const wordLengthInput = document.getElementById("word-length");
const wordLengthDisplay = document.getElementById("word-length-display");

const wordCountInput = document.getElementById("word-count");
const wordCountDisplay = document.getElementById("word-count-display");

const enableLettersInput = document.getElementById("enable-letters");
const enableNumbersInput = document.getElementById("enable-numbers");

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

function renderMessageBoxes(words) {
  const container = messageOutput;
  container.innerHTML = "";
  container.hidden = false;

  words.forEach((word, wordIndex) => {
    [...word].forEach(char => {
      const span = document.createElement("span");
      span.className = "char-box";
      span.textContent = char;
      container.appendChild(span);
    });

    if (wordIndex < words.length - 1) {
      const spacer = document.createElement("span");
      spacer.className = "word-gap";
      container.appendChild(spacer);
    }
  });
}

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

  for (let i = seconds; i > 0; i--) {
    if (
      token !== transmissionToken ||
      !state.hasCompleted ||
      !autoRevealInProgress
    ) return;

    updateStatus(`Auto-reveal in ${i}…`);
    await sleep(1000);
  }

  if (
    token !== transmissionToken ||
    !state.hasCompleted ||
    !autoRevealInProgress
  ) return;

  renderMessageBoxes(state.generatedMessage);
  updateStatus("Result revealed");
}

/* =========================
   Settings Sync
   ========================= */

function syncSettingsFromUI() {
  state.settings.dotLengthMs = Number(dotLengthInput.value);
  state.settings.enableStartDelay = enableStartDelay.checked;
  state.settings.enableAutoReveal = enableAutoReveal.checked;
  state.settings.enablePreroll = enableMessagePreroll.checked;
  state.settings.wordLength = Number(wordLengthInput.value);
  state.settings.wordCount = Number(wordCountInput.value);
  state.settings.enableLetters = enableLettersInput.checked;
  state.settings.enableNumbers = enableNumbersInput.checked;
}

function updateDisplays() {
  wordLengthDisplay.textContent = state.settings.wordLength;
  wordCountDisplay.textContent = state.settings.wordCount;
}

/* =========================
   Message Generation
   ========================= */

function buildCharacterPool(settings) {
  const pool = [];

  if (settings.enableLetters) pool.push(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if (settings.enableNumbers) pool.push(...'0123456789');

  return pool;
}

function generateMessage(settings) {
  const pool = buildCharacterPool(settings);

  if (pool.length === 0) {
    alert("At least one character set must be enabled.");
    return [];
  }

  const words = [];

  for (let w = 0; w < settings.wordCount; w++) {
    let word = "";
    for (let c = 0; c < settings.wordLength; c++) {
      const index = Math.floor(Math.random() * pool.length);
      word += pool[index];
    }
    words.push(word);
  }

  return words;
}

/* =========================
   Morse Encoding
   ========================= */

function encodeRunOnProsign(sequence, timing) {
  const queue = [];

  [...sequence].forEach((char, charIndex) => {
    const morse = MORSE_MAP[char];
    if (!morse) return;

    [...morse].forEach((symbol, symbolIndex) => {
      queue.push({
        on: true,
        duration: symbol === "." ? timing.dot : timing.dash
      });

      if (symbolIndex < morse.length - 1) {
        queue.push({ on: false, duration: timing.intraSymbolGap });
      }
    });

    if (charIndex < sequence.length - 1) {
      queue.push({ on: false, duration: timing.intraSymbolGap });
    }
  });

  return queue;
}

function encodeMessageToQueue(words, settings) {
  const timing = getTiming(settings.dotLengthMs);
  const queue = [];

  if (settings.enablePreroll) {
    for (let i = 0; i < 3; i++) {
      queue.push(
        ...encodeRunOnProsign("AAA", timing),
        { on: false, duration: timing.interWordGap }
      );
    }
  }

  words.forEach((word, wordIndex) => {
    [...word].forEach((char, charIndex) => {
      const morse = MORSE_MAP[char];
      if (!morse) return;

      [...morse].forEach((symbol, symbolIndex) => {
        queue.push({
          on: true,
          duration: symbol === "." ? timing.dot : timing.dash
        });

        if (symbolIndex < morse.length - 1) {
          queue.push({ on: false, duration: timing.intraSymbolGap });
        }
      });

      if (charIndex < word.length - 1) {
        queue.push({ on: false, duration: timing.interCharGap });
      }
    });

    if (wordIndex < words.length - 1) {
      queue.push({ on: false, duration: timing.interWordGap });
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

function setControlsEnabled(enabled) {
  dotLengthInput.disabled = !enabled;
  wordLengthInput.disabled = !enabled;
  wordCountInput.disabled = !enabled;
  enableLettersInput.disabled = !enabled;
  enableNumbersInput.disabled = !enabled;
  startButton.disabled = !enabled;
}

/* =========================
   Event Handlers
   ========================= */

dotLengthInput.addEventListener("change", syncSettingsFromUI);

wordLengthInput.addEventListener("input", () => {
  syncSettingsFromUI();
  updateDisplays();
});

wordCountInput.addEventListener("input", () => {
  syncSettingsFromUI();
  updateDisplays();
});

enableLettersInput.addEventListener("change", syncSettingsFromUI);
enableNumbersInput.addEventListener("change", syncSettingsFromUI);

startButton.addEventListener("click", async () => {
  syncSettingsFromUI();

  transmissionToken++;
  const token = transmissionToken;

  wasManuallyStopped = false;
  autoRevealInProgress = false;

  messageOutput.hidden = true;
  messageOutput.innerHTML = "";

  stopButton.disabled = false;
  revealButton.disabled = true;

  state.generatedMessage = generateMessage(state.settings);
  if (state.generatedMessage.length === 0) return;

  state.isTransmitting = true;
  state.hasCompleted = false;

  setControlsEnabled(false);

  if (state.settings.enableStartDelay) {
    await startDelayCountdown(3, token);
    if (token !== transmissionToken) return;
  }

  updateStatus("Transmitting...");

  const queue = encodeMessageToQueue(
    state.generatedMessage,
    state.settings
  );

  await transmitQueue(queue, token);
  if (token !== transmissionToken) return;

  state.isTransmitting = false;
  state.hasCompleted = true;

  stopButton.disabled = true;
  revealButton.disabled = false;
  setControlsEnabled(true);

  updateStatus(
    wasManuallyStopped
      ? "Transmission stopped"
      : "Transmission complete"
  );

  if (state.settings.enableAutoReveal && !wasManuallyStopped) {
    autoRevealCountdown(5, token);
  }
});

revealButton.addEventListener("click", () => {
  if (!state.hasCompleted) return;

  autoRevealInProgress = false;

  renderMessageBoxes(state.generatedMessage);
  updateStatus("Result revealed");
});

stopButton.addEventListener("click", () => {
  if (!state.isTransmitting) return;

  wasManuallyStopped = true;
  transmissionToken++;
  autoRevealInProgress = false;

  state.isTransmitting = false;
  state.hasCompleted = true;

  setSignal(false);

  stopButton.disabled = true;
  revealButton.disabled = false;
  setControlsEnabled(true);

  updateStatus("Transmission stopped");
});

/* =========================
   Initialisation
   ========================= */

syncSettingsFromUI();
updateDisplays();
updateStatus("Not Transmitting");
setSignal(false);

/* =========================
   Vue App Setup
   ========================= */

Vue.createApp({
  components: {
    'navbar-component': NavbarComponent,
    'footer-component': FooterComponent
  }
}).mount('#app');
