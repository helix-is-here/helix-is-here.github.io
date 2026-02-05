/* =========================
   Application State
   ========================= */

const state = {
  settings: {
    dotLengthMs: 120,
    wordLength: 5,
    wordCount: 10,
    enableLetters: true,
    enableNumbers: false
    // enableProsigns: false (future)
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

const wordLengthInput = document.getElementById("word-length");
const wordLengthDisplay = document.getElementById("word-length-display");

const wordCountInput = document.getElementById("word-count");
const wordCountDisplay = document.getElementById("word-count-display");

const enableLettersInput = document.getElementById("enable-letters");
const enableNumbersInput = document.getElementById("enable-numbers");

const startButton = document.getElementById("start-button");
const revealButton = document.getElementById("reveal-button");
const resetButton = document.getElementById("reset-button");

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

/* =========================
   Settings Sync
   ========================= */

function syncSettingsFromUI() {
  state.settings.dotLengthMs = Number(dotLengthInput.value);
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

  if (settings.enableLetters) {
    pool.push(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  }

  if (settings.enableNumbers) {
    pool.push(...'0123456789');
  }

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

function encodeMessageToQueue(words, dotLengthMs) {
  const timing = getTiming(dotLengthMs);
  const queue = [];

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
          queue.push({
            on: false,
            duration: timing.intraSymbolGap
          });
        }
      });

      if (charIndex < word.length - 1) {
        queue.push({
          on: false,
          duration: timing.interCharGap
        });
      }
    });

    if (wordIndex < words.length - 1) {
      queue.push({
        on: false,
        duration: timing.interWordGap
      });
    }
  });

  return queue;
}

/* =========================
   Transmission Engine
   ========================= */

async function transmitQueue(queue) {
  for (const signal of queue) {
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

  state.generatedMessage = generateMessage(state.settings);
  if (state.generatedMessage.length === 0) return;

  state.isTransmitting = true;
  state.hasCompleted = false;

  messageOutput.hidden = true;
  revealButton.disabled = true;

  updateStatus("Transmitting...");
  setControlsEnabled(false);

  const queue = encodeMessageToQueue(
    state.generatedMessage,
    state.settings.dotLengthMs
  );

  await transmitQueue(queue);

  state.isTransmitting = false;
  state.hasCompleted = true;

  updateStatus("Transmission complete");
  revealButton.disabled = false;
  setControlsEnabled(true);
});

revealButton.addEventListener("click", () => {
  if (!state.hasCompleted) return;

  messageOutput.textContent = state.generatedMessage.join(" ");
  messageOutput.hidden = false;
});

resetButton.addEventListener("click", () => {
  state.generatedMessage = [];
  state.isTransmitting = false;
  state.hasCompleted = false;

  messageOutput.hidden = true;
  messageOutput.textContent = "";

  revealButton.disabled = true;
  updateStatus("Idle");
  setSignal(false);
  setControlsEnabled(true);
});

/* =========================
   Initialisation
   ========================= */

syncSettingsFromUI();
updateDisplays();
updateStatus("Idle");
setSignal(false);
