/* =========================
   Application State
   ========================= */

let transmissionToken = 0;
let wasManuallyStopped = false;
let autoRevealInProgress = false;

const state = {
  settings: {
    wpm: 20,
    dotLengthMs: 60,
    enablePreroll: false,
    wordLength: 5,
    autoRepeat: false,
    autoReveal: "3s",
    wordCount: 1,
    enabledChars: new Set(),
    includeII: false
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

const PROSIGNS_MAP = {
    IX: "..-..-",
    BT: "-...-",
    AR: ".-.-.",
    AS: ".-...",
    INT: "..-.-",
    PT: ".--.-",
    IMI: "..--..",
    AA: ".-.-",
    AAA: ".-.-.-",
    MIM: "--..--"
};

const CHARACTER_GROUPS = [
  { key: "lettersAM", label: "Letters A–M", chars: [..."ABCDEFGHIJKLM"] },
  { key: "lettersNZ", label: "Letters N–Z", chars: [..."NOPQRSTUVWXYZ"] },
  { key: "numbers", label: "Numbers", chars: [..."0123456789"] },
  { key: "prosigns", label: "Prosigns", chars: Object.keys(PROSIGNS_MAP) }
];

function getMorseFor(token) {
  return token.length > 1 ? PROSIGNS_MAP[token] : MORSE_MAP[token];
}

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

const startButton = document.getElementById("start-button");
const revealButton = document.getElementById("reveal-button");
const stopButton = document.getElementById("stop-button");

const messageOutput = document.getElementById("message-output");
const statusText = document.getElementById("status-text");
const signalLight = document.getElementById("signal-light");

function revealGeneratedMessage() {
  autoRevealInProgress = false;

  renderMessageBoxes(state.generatedMessage);
  updateStatus("Result revealed");
}

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
    const wordWrapper = document.createElement("span");
    wordWrapper.className = "word-group";

    word.forEach(token => {
      const span = document.createElement("span");
      span.className = "char-box";
      if (token.length > 1) span.classList.add("prosign");
      span.textContent = token;
      wordWrapper.appendChild(span);
    });

    container.appendChild(wordWrapper);

    if (wordIndex < words.length - 1) {
      const spacerBefore = document.createElement("span");
      spacerBefore.className = "word-gap";
      container.appendChild(spacerBefore);

      if (state.settings.includeII) {
        const iiWrapper = document.createElement("span");
        iiWrapper.className = "word-group ii-group";

        const iiSpan = document.createElement("span");
        iiSpan.className = "char-box";
        iiSpan.textContent = "II";
        iiWrapper.appendChild(iiSpan);

        container.appendChild(iiWrapper);

        const spacerAfter = document.createElement("span");
        spacerAfter.className = "word-gap";
        container.appendChild(spacerAfter);
      }
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
  state.settings.wpm = Number(wpmInput.value);
  state.settings.dotLengthMs = 1200 / state.settings.wpm;
  state.settings.enablePreroll = enableMessagePreroll.checked;
  state.settings.includeII = enableIIInput.checked;
  state.settings.autoRepeat = enableAutoRepeat.checked;
  state.settings.autoReveal = document.querySelector('input[name="auto-reveal"]:checked')?.value || "3s";
  state.settings.wordLength = Number(wordLengthInput.value);
  state.settings.wordCount = Number(wordCountInput.value);
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
      input.checked = state.settings.enabledChars.has(char);
      input.addEventListener("change", () => {
        if (input.checked) state.settings.enabledChars.add(char);
        else state.settings.enabledChars.delete(char);
        refreshCharacterUI();
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

  const total = CHARACTER_GROUPS.reduce((n, g) => n + g.chars.length, 0);
  charCount.textContent = `${enabled.size} of ${total} enabled`;
}

function updateDisplays() {
  wpmDisplay.textContent = state.settings.wpm;
  wordLengthDisplay.textContent = state.settings.wordLength;
  wordCountDisplay.textContent = state.settings.wordCount;
}

/* =========================
   Message Generation
   ========================= */

function buildCharacterPool(settings) {
  const pool = [];

  CHARACTER_GROUPS.forEach(group => {
    group.chars.forEach(char => {
      if (settings.enabledChars.has(char)) pool.push(char);
    });
  });

  return pool;
}

function generateMessage(settings) {
  const pool = buildCharacterPool(settings);

  if (pool.length === 0) {
    alert("At least one character must be enabled.");
    return [];
  }

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
    word.forEach((token, tokenIndex) => {
      if (token.length > 1) {
        // run-on prosign
        queue.push(...encodeRunOnProsign(token, timing));
      } else {
        const morse = MORSE_MAP[token];
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
      }

      if (tokenIndex < word.length - 1) {
        queue.push({ on: false, duration: timing.interCharGap });
      }
    });

    // between words we optionally insert II with proper gaps
    if (wordIndex < words.length - 1) {
      if (settings.includeII) {
        // pre-gap
        queue.push({ on: false, duration: timing.interWordGap });
        // two separate Is with inter-character gap
        const morseI = MORSE_MAP['I'];
        [...morseI].forEach((symbol, symbolIndex) => {
          queue.push({ on: true, duration: symbol === '.' ? timing.dot : timing.dash });
          if (symbolIndex < morseI.length - 1) {
            queue.push({ on: false, duration: timing.intraSymbolGap });
          }
        });
        queue.push({ on: false, duration: timing.interCharGap });
        [...morseI].forEach((symbol, symbolIndex) => {
          queue.push({ on: true, duration: symbol === '.' ? timing.dot : timing.dash });
          if (symbolIndex < morseI.length - 1) {
            queue.push({ on: false, duration: timing.intraSymbolGap });
          }
        });
        // post-gap
        queue.push({ on: false, duration: timing.interWordGap });
      } else {
        queue.push({ on: false, duration: timing.interWordGap });
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

function setControlsEnabled(enabled) {
  wpmInput.disabled = !enabled;
  wordLengthInput.disabled = !enabled;
  wordCountInput.disabled = !enabled;
  groupInputs.forEach(input => {
    input.disabled = !enabled;
  });
  charPickerGroups.querySelectorAll("input[data-char]").forEach(input => {
    input.disabled = !enabled;
  });
  enableIIInput.disabled = !enabled;
  enableAutoRepeat.disabled = !enabled;
  autoRevealInputs.forEach(input => {
    input.disabled = !enabled;
  });
  startButton.disabled = !enabled;
}

/* =========================
   Event Handlers
   ========================= */

wpmInput.addEventListener("input", () => {
  syncSettingsFromUI();
  updateDisplays();
});

wordLengthInput.addEventListener("input", () => {
  syncSettingsFromUI();
  updateDisplays();
});

wordCountInput.addEventListener("input", () => {
  syncSettingsFromUI();
  updateDisplays();
});

groupInputs.forEach(input => {
  input.addEventListener("change", () => {
    const group = CHARACTER_GROUPS.find(g => g.key === input.dataset.group);
    group.chars.forEach(char => {
      if (input.checked) state.settings.enabledChars.add(char);
      else state.settings.enabledChars.delete(char);
    });
    refreshCharacterUI();
  });
});
enableIIInput.addEventListener("change", syncSettingsFromUI);
enableAutoRepeat.addEventListener("change", syncSettingsFromUI);
autoRevealInputs.forEach(input => {
  input.addEventListener("change", syncSettingsFromUI);
});

startButton.addEventListener("click", async () => {
  syncSettingsFromUI();

  transmissionToken++;
  const token = transmissionToken;

  wasManuallyStopped = false;
  autoRevealInProgress = false;

  // delay clearing the previous result until just before transmitting
  // this lets the revealed text stay on screen during the countdown
  stopButton.disabled = false;
  revealButton.disabled = true;

  state.generatedMessage = generateMessage(state.settings);
  if (state.generatedMessage.length === 0) return;

  state.isTransmitting = true;
  state.hasCompleted = false;

  setControlsEnabled(false);

  // always include a short countdown before transmitting
  await startDelayCountdown(3, token);
  if (token !== transmissionToken) return;

  // wipe the previous message now that we're about to send a new one
  messageOutput.hidden = true;
  messageOutput.innerHTML = "";

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

  if (!wasManuallyStopped) {
    if (state.settings.autoReveal === "immediate") {
      revealGeneratedMessage();
    } else if (state.settings.autoReveal === "3s") {
      await autoRevealCountdown(3, token);
    }

    if (
      state.settings.autoRepeat &&
      token === transmissionToken &&
      !wasManuallyStopped &&
      state.settings.autoReveal !== "disabled"
    ) {
      setTimeout(() => startButton.click(), 0);
    }
  }
});

revealButton.addEventListener("click", () => {
  if (!state.hasCompleted) return;

  autoRevealInProgress = false;

  revealGeneratedMessage();

  // if user manually revealed and auto-repeat is enabled, start again
  if (state.settings.autoRepeat && !wasManuallyStopped) {
    setTimeout(() => startButton.click(), 0);
  }
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

groupInputs.forEach(input => {
  if (!input.checked) return;
  const group = CHARACTER_GROUPS.find(g => g.key === input.dataset.group);
  group.chars.forEach(char => state.settings.enabledChars.add(char));
});
buildCharacterPicker();
refreshCharacterUI();

syncSettingsFromUI();
updateDisplays();
updateStatus("Not Transmitting");
setSignal(false);
