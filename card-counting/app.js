/* =========================
   Settings (saved in the browser)
   ========================= */

const STORAGE_KEY = "cardCounting.settings.v1";
const BEST_TIMES_KEY = "cardCounting.bestTimes.v1";

const SLIDERS = [
  { id: "flash-group", format: v => v },
  { id: "flash-speed", format: v => Number(v).toFixed(1) },
  { id: "flash-count", format: v => v },
  { id: "countdown-group", format: v => v },
  { id: "countdown-holdback", format: v => v }
];

const CHECKBOXES = ["flash-show-values"];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.); settings just won't persist
  }
}

function saveSettings() {
  const settings = { mode: currentMode };
  SLIDERS.forEach(({ id }) => { settings[id] = document.getElementById(id).value; });
  CHECKBOXES.forEach(id => { settings[id] = document.getElementById(id).checked; });
  saveJSON(STORAGE_KEY, settings);
}

function restoreSettings() {
  const settings = loadJSON(STORAGE_KEY, {});
  SLIDERS.forEach(({ id }) => {
    if (settings[id] !== undefined) document.getElementById(id).value = settings[id];
  });
  CHECKBOXES.forEach(id => {
    if (settings[id] !== undefined) document.getElementById(id).checked = settings[id];
  });
  return settings;
}

function updateSliderDisplays() {
  SLIDERS.forEach(({ id, format }) => {
    document.getElementById(`${id}-display`).textContent = format(document.getElementById(id).value);
  });
  // a single deck caps how many flashes fit
  const group = Number(document.getElementById("flash-group").value);
  const countInput = document.getElementById("flash-count");
  countInput.max = Math.floor(52 / group);
  if (Number(countInput.value) > Number(countInput.max)) countInput.value = countInput.max;
  document.getElementById("flash-count-display").textContent = countInput.value;
}

const num = id => Number(document.getElementById(id).value);

/* =========================
   Shared result view
   ========================= */

function showResult(container, { guess, actual, cards, groupSize, extraHtml = "" }) {
  const correct = guess === actual;
  container.hidden = false;
  container.className = `result ${correct ? "correct" : "wrong"}`;
  container.innerHTML = `
    <p class="result-headline">${correct ? "Correct!" : "Not quite."}
      The count was <strong>${formatCount(actual)}</strong>${correct ? "" : `; you said ${formatCount(guess)}`}.
    </p>
    ${extraHtml}
    <details class="review" ${correct ? "" : "open"}>
      <summary>Review the cards</summary>
      <div class="review-grid"></div>
    </details>`;

  // one review cell per group, with its value and the running total after it
  const grid = container.querySelector(".review-grid");
  let running = 0;
  for (let i = 0; i < cards.length; i += groupSize) {
    const group = cards.slice(i, i + groupSize);
    const delta = countOf(group);
    running += delta;
    const cell = document.createElement("div");
    cell.className = "review-cell";
    const row = document.createElement("div");
    row.className = "review-cards";
    group.forEach(card => row.appendChild(renderCard(card, { small: true })));
    cell.appendChild(row);
    cell.insertAdjacentHTML("beforeend",
      `<div class="review-count"><span>${formatCount(delta)}</span> → <strong>${formatCount(running)}</strong></div>`);
    grid.appendChild(cell);
  }
}

function readGuess(input) {
  // accept the typographic minus too, just in case it gets pasted in
  return parseInt(String(input.value).replace("−", "-"), 10);
}

/* =========================
   Flash Drill
   ========================= */

const flash = {
  running: false,
  token: 0,
  cards: [],
  groupSize: 1
};

const flashEls = {
  cards: document.getElementById("flash-cards"),
  status: document.getElementById("flash-status"),
  form: document.getElementById("flash-answer"),
  guess: document.getElementById("flash-guess"),
  result: document.getElementById("flash-result"),
  start: document.getElementById("flash-start"),
  stop: document.getElementById("flash-stop")
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function startFlash() {
  const token = ++flash.token;
  const groupSize = num("flash-group");
  const flashes = num("flash-count");
  const speedMs = num("flash-speed") * 1000;
  const showValues = document.getElementById("flash-show-values").checked;

  flash.running = true;
  flash.groupSize = groupSize;
  flash.cards = buildShoe(1).slice(0, groupSize * flashes);

  flashEls.form.hidden = true;
  flashEls.result.hidden = true;
  flashEls.start.disabled = true;
  flashEls.stop.disabled = false;
  setSettingsDisabled("flash", true);

  for (let i = 0; i < flashes; i++) {
    flashEls.status.textContent = `Flash ${i + 1} of ${flashes}`;
    flashEls.cards.replaceChildren(
      ...flash.cards.slice(i * groupSize, (i + 1) * groupSize).map(card => renderCard(card, { showValue: showValues }))
    );
    await wait(speedMs);
    if (token !== flash.token) return;
    // a short blank between flashes so two similar flashes don't blur together
    flashEls.cards.replaceChildren();
    await wait(120);
    if (token !== flash.token) return;
  }

  flash.running = false;
  flashEls.cards.replaceChildren(renderCardBack());
  flashEls.status.textContent = "Done. Enter your count.";
  flashEls.stop.disabled = true;
  flashEls.form.hidden = false;
  flashEls.guess.value = "";
  flashEls.guess.focus();
}

function stopFlash() {
  flash.token++;
  flash.running = false;
  flashEls.cards.replaceChildren();
  flashEls.status.textContent = "Stopped. Press Start to go again.";
  flashEls.form.hidden = true;
  resetFlashButtons();
}

function resetFlashButtons() {
  flashEls.start.disabled = false;
  flashEls.stop.disabled = true;
  setSettingsDisabled("flash", false);
}

flashEls.form.addEventListener("submit", event => {
  event.preventDefault();
  const guess = readGuess(flashEls.guess);
  if (Number.isNaN(guess)) return;
  flashEls.form.hidden = true;
  flashEls.status.textContent = "Press Start to go again.";
  showResult(flashEls.result, {
    guess,
    actual: countOf(flash.cards),
    cards: flash.cards,
    groupSize: flash.groupSize
  });
  resetFlashButtons();
  flashEls.start.focus();
});

flashEls.start.addEventListener("click", startFlash);
flashEls.stop.addEventListener("click", stopFlash);

/* =========================
   Deck Countdown
   ========================= */

const countdown = {
  running: false,
  deck: [],
  heldBack: [],
  position: 0,
  groupSize: 1,
  startedAt: null,
  elapsed: 0,
  timerId: null
};

const countdownEls = {
  cards: document.getElementById("countdown-cards"),
  status: document.getElementById("countdown-status"),
  left: document.getElementById("countdown-left"),
  timer: document.getElementById("countdown-timer"),
  form: document.getElementById("countdown-answer"),
  guess: document.getElementById("countdown-guess"),
  result: document.getElementById("countdown-result"),
  start: document.getElementById("countdown-start"),
  next: document.getElementById("countdown-next"),
  stop: document.getElementById("countdown-stop"),
  best: document.getElementById("countdown-best")
};

function countdownKey() {
  return `${num("countdown-group")}-${num("countdown-holdback")}`;
}

function startCountdown() {
  const shoe = buildShoe(1);
  const holdback = num("countdown-holdback");
  countdown.heldBack = shoe.slice(0, holdback);
  countdown.deck = shoe.slice(holdback);
  countdown.position = 0;
  countdown.groupSize = num("countdown-group");
  countdown.startedAt = null;
  countdown.elapsed = 0;
  countdown.running = true;

  countdownEls.form.hidden = true;
  countdownEls.result.hidden = true;
  countdownEls.start.disabled = true;
  countdownEls.next.disabled = false;
  countdownEls.stop.disabled = false;
  countdownEls.cards.disabled = false;
  setSettingsDisabled("countdown", true);

  countdownEls.cards.replaceChildren(renderCardBack());
  countdownEls.left.textContent = countdown.deck.length;
  countdownEls.timer.textContent = "0.0s";
  countdownEls.status.textContent = "The clock starts when you turn the first card.";
  countdownEls.next.focus();
}

function turnNext() {
  if (!countdown.running) return;
  if (countdown.startedAt === null) {
    countdown.startedAt = performance.now();
    countdown.timerId = setInterval(updateTimer, 100);
  }

  const group = countdown.deck.slice(countdown.position, countdown.position + countdown.groupSize);
  countdown.position += group.length;
  countdownEls.cards.replaceChildren(...group.map(card => renderCard(card)));
  countdownEls.left.textContent = countdown.deck.length - countdown.position;
  countdownEls.status.textContent = "Keep going…";

  if (countdown.position >= countdown.deck.length) finishCountdown();
}

function updateTimer() {
  countdown.elapsed = (performance.now() - countdown.startedAt) / 1000;
  countdownEls.timer.textContent = `${countdown.elapsed.toFixed(1)}s`;
}

function stopTimer() {
  clearInterval(countdown.timerId);
  countdown.timerId = null;
}

function finishCountdown() {
  updateTimer();
  stopTimer();
  countdown.running = false;
  countdownEls.next.disabled = true;
  countdownEls.stop.disabled = true;
  countdownEls.cards.disabled = true;
  countdownEls.status.textContent = `Deck done in ${countdown.elapsed.toFixed(1)}s. Enter your count.`;
  countdownEls.form.hidden = false;
  countdownEls.guess.value = "";
  countdownEls.guess.focus();
}

function stopCountdown() {
  stopTimer();
  countdown.running = false;
  countdownEls.cards.replaceChildren();
  countdownEls.cards.disabled = true;
  countdownEls.left.textContent = "–";
  countdownEls.status.textContent = "Stopped. Press Start to go again.";
  countdownEls.form.hidden = true;
  resetCountdownButtons();
}

function resetCountdownButtons() {
  countdownEls.start.disabled = false;
  countdownEls.next.disabled = true;
  countdownEls.stop.disabled = true;
  setSettingsDisabled("countdown", false);
}

countdownEls.form.addEventListener("submit", event => {
  event.preventDefault();
  const guess = readGuess(countdownEls.guess);
  if (Number.isNaN(guess)) return;

  const actual = countOf(countdown.deck);
  const time = countdown.elapsed;
  const bestTimes = loadJSON(BEST_TIMES_KEY, {});
  const key = countdownKey();
  const previousBest = bestTimes[key];
  let timeNote;

  if (guess !== actual) {
    timeNote = `Time ${time.toFixed(1)}s doesn't count, because the count was off.`;
  } else if (previousBest === undefined || time < previousBest) {
    bestTimes[key] = time;
    saveJSON(BEST_TIMES_KEY, bestTimes);
    timeNote = previousBest === undefined
      ? `Time: ${time.toFixed(1)}s, your first recorded time for this setup.`
      : `New best: ${time.toFixed(1)}s (was ${previousBest.toFixed(1)}s).`;
  } else {
    timeNote = `Time: ${time.toFixed(1)}s (best ${previousBest.toFixed(1)}s).`;
  }

  const heldBackHtml = countdown.heldBack.length
    ? `<p class="held-back-note">Held back: ${countdown.heldBack.map(c => c.rank + c.suit.symbol).join(" ")}
         (${formatCount(countOf(countdown.heldBack))}). With those, the full deck balances to 0.</p>`
    : "";

  countdownEls.form.hidden = true;
  countdownEls.status.textContent = "Press Start to go again.";
  showResult(countdownEls.result, {
    guess,
    actual,
    cards: countdown.deck,
    groupSize: countdown.groupSize,
    extraHtml: `<p class="time-note">${timeNote}</p>${heldBackHtml}`
  });
  resetCountdownButtons();
  renderBestTimes();
  countdownEls.start.focus();
});

function renderBestTimes() {
  const bestTimes = loadJSON(BEST_TIMES_KEY, {});
  const best = bestTimes[countdownKey()];
  countdownEls.best.textContent = best === undefined
    ? "No best time yet for this setup."
    : `Best time for this setup: ${best.toFixed(1)}s`;
}

countdownEls.start.addEventListener("click", startCountdown);
countdownEls.next.addEventListener("click", turnNext);
countdownEls.cards.addEventListener("click", turnNext);
countdownEls.stop.addEventListener("click", stopCountdown);

/* =========================
   Modes, settings and keyboard
   ========================= */

let currentMode = "flash";

function setSettingsDisabled(mode, disabled) {
  document.querySelectorAll(`[data-panel="${mode}"] .settings-section input`)
    .forEach(input => { input.disabled = disabled; });
}

function setMode(mode) {
  if (flash.running) stopFlash();
  if (countdown.running) stopCountdown();
  currentMode = mode;
  document.querySelectorAll(".mode-tabs [data-mode]").forEach(tab => {
    tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
  });
  document.querySelectorAll("[data-panel]").forEach(panel => {
    panel.hidden = panel.dataset.panel !== mode;
  });
  saveSettings();
}

document.querySelectorAll(".mode-tabs [data-mode]").forEach(tab => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

document.querySelectorAll(".settings-section input").forEach(input => {
  input.addEventListener("input", () => {
    updateSliderDisplays();
    renderBestTimes();
    saveSettings();
  });
});

document.addEventListener("keydown", event => {
  const typing = event.target.matches("input, textarea, select");

  if (event.key === "Escape") {
    if (currentMode === "flash" && flash.running) stopFlash();
    if (currentMode === "countdown" && countdown.running) stopCountdown();
    return;
  }

  if (event.key !== " " || typing || event.repeat) return;
  event.preventDefault();

  if (currentMode === "flash") {
    if (!flash.running && flashEls.form.hidden) startFlash();
  } else if (currentMode === "countdown") {
    if (countdown.running) turnNext();
    else if (countdownEls.form.hidden) startCountdown();
  }
});

const restored = restoreSettings();
updateSliderDisplays();
renderBestTimes();
if (restored.mode === "countdown") setMode("countdown");
// open the explainer for first-time visitors
if (!restored.mode) document.getElementById("explainer").open = true;
