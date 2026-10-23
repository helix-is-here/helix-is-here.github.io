/* =========================
   ADF Ranks Quiz
   ========================= */

const STORAGE_KEY = "ranksQuiz.settings.v1";
const OPTION_COUNT = 4;

const state = {
  settings: {
    mode: "insignia-to-name",
    services: new Set(Object.keys(SERVICES)),
    groups: new Set(Object.keys(GROUPS)),
    starStyle: "slides"
  },
  score: 0,
  total: 0,
  streak: 0,
  question: null,
  recentIds: []
};

/* =========================
   DOM References
   ========================= */

const modeInputs = document.querySelectorAll('input[name="quiz-mode"]');
const serviceInputs = document.querySelectorAll('input[name="service"]');
const groupInputs = document.querySelectorAll('input[name="group"]');
const starStyleInputs = document.querySelectorAll('input[name="star-style"]');
const poolCount = document.getElementById("pool-count");

const scoreDisplay = document.getElementById("score");
const streakDisplay = document.getElementById("streak");
const resetButton = document.getElementById("reset-button");

const promptArea = document.getElementById("prompt");
const optionsArea = document.getElementById("options");
const lastResult = document.getElementById("last-result");

const studyGrid = document.getElementById("study-grid");

/* =========================
   Helpers
   ========================= */

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getPool() {
  return RANKS.filter(
    rank => state.settings.services.has(rank.service) && state.settings.groups.has(rank.group)
  );
}

// officers are compared with officers, everyone else with everyone else
function tier(rank) {
  return rank.group === "officer" ? "officer" : "other";
}

function rankLabel(rank) {
  return `${rank.name} (${rank.abbr})`;
}

function insigniaFor(rank) {
  return insigniaMarkup(rank, state.settings.starStyle === "boards");
}

/* =========================
   Question Generation
   ========================= */

// Wrong answers come from the same service, preferring the same tier,
// so the service colours alone don't give the answer away.
function pickDistractors(answer) {
  const sameService = shuffle(RANKS.filter(r => r.service === answer.service && r.id !== answer.id));
  const sameTier = sameService.filter(r => tier(r) === tier(answer));
  const otherTier = sameService.filter(r => tier(r) !== tier(answer));
  return [...sameTier, ...otherTier].slice(0, OPTION_COUNT - 1);
}

function pickAnswer(pool) {
  const fresh = pool.filter(rank => !state.recentIds.includes(rank.id));
  const choices = fresh.length ? fresh : pool;
  const answer = choices[Math.floor(Math.random() * choices.length)];

  state.recentIds.push(answer.id);
  const memory = Math.min(6, pool.length - 1);
  while (state.recentIds.length > memory) state.recentIds.shift();

  return answer;
}

function buildQuestion() {
  const pool = getPool();
  if (pool.length === 0) return null;

  const answer = pickAnswer(pool);
  const mode =
    state.settings.mode === "mixed"
      ? (Math.random() < 0.5 ? "insignia-to-name" : "name-to-insignia")
      : state.settings.mode;

  return {
    answer,
    mode,
    options: shuffle([answer, ...pickDistractors(answer)]),
    answered: false
  };
}

/* =========================
   Rendering
   ========================= */

function renderScore() {
  scoreDisplay.textContent = `${state.score} / ${state.total}`;
  streakDisplay.textContent = state.streak;
}

function renderQuestion() {
  const question = state.question;
  optionsArea.innerHTML = "";
  promptArea.innerHTML = "";

  if (!question) {
    promptArea.innerHTML = `<p class="empty-message">Select at least one service and one rank group to start.</p>`;
    return;
  }

  const { answer, mode, options } = question;
  const service = SERVICES[answer.service];

  if (mode === "insignia-to-name") {
    promptArea.innerHTML = `<div class="prompt-insignia">${insigniaFor(answer)}</div>`;
  } else {
    promptArea.innerHTML = `
      <div class="prompt-name">
        <span class="prompt-service">${service}</span>
        <span class="prompt-rank">${answer.name}</span>
        <span class="prompt-abbr">${answer.abbr}</span>
      </div>`;
  }

  optionsArea.className = `options options-${mode}`;
  options.forEach((rank, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    button.dataset.id = rank.id;

    const key = `<span class="option-key">${index + 1}</span>`;
    if (mode === "insignia-to-name") {
      button.innerHTML = `${key}<span class="option-name">${rank.name}</span><span class="option-abbr">${rank.abbr}</span>`;
    } else {
      button.innerHTML = `${key}<span class="option-insignia">${insigniaFor(rank)}</span>`;
      button.setAttribute("aria-label", `Option ${index + 1}`);
    }

    button.addEventListener("click", () => answerQuestion(rank.id));
    optionsArea.appendChild(button);
  });
}

function renderStudySheet() {
  const pool = getPool();
  studyGrid.innerHTML = "";

  Object.entries(SERVICES).forEach(([key, label]) => {
    const ranks = pool.filter(rank => rank.service === key);
    if (ranks.length === 0) return;

    const section = document.createElement("section");
    section.className = "study-service";
    section.innerHTML = `<h3>${label}</h3>`;

    const grid = document.createElement("div");
    grid.className = "study-cards";
    ranks.forEach(rank => {
      const card = document.createElement("div");
      card.className = "study-card";
      card.innerHTML = `
        <div class="study-insignia">${insigniaFor(rank)}</div>
        <div class="study-name">${rank.name}</div>
        <div class="study-abbr">${rank.abbr}</div>`;
      grid.appendChild(card);
    });

    section.appendChild(grid);
    studyGrid.appendChild(section);
  });
}

function renderPoolCount() {
  const count = getPool().length;
  poolCount.textContent = `${count} rank${count === 1 ? "" : "s"} selected`;
}

/* =========================
   Actions
   ========================= */

function nextQuestion() {
  state.question = buildQuestion();
  renderQuestion();
}

function answerQuestion(id) {
  const question = state.question;
  if (!question || question.answered) return;
  question.answered = true;

  const correct = id === question.answer.id;
  state.total++;
  if (correct) {
    state.score++;
    state.streak++;
  } else {
    state.streak = 0;
  }
  renderScore();
  renderLastResult(question.answer, RANKS.find(rank => rank.id === id));
  nextQuestion();
}

// The previous answer stays on show below the new question.
function renderLastResult(answer, chosen) {
  const correct = answer.id === chosen.id;
  const entry = (rank, note) => `
    <div class="result-entry">
      <span class="result-insignia">${insigniaFor(rank)}</span>
      <span class="result-text">
        <span class="result-note">${note}</span>
        <span class="result-name">${rankLabel(rank)}</span>
        <span class="result-service">${SERVICES[rank.service]}</span>
      </span>
    </div>`;

  lastResult.className = `last-result ${correct ? "result-correct" : "result-wrong"}`;
  lastResult.innerHTML = correct
    ? entry(answer, "Correct")
    : entry(answer, "Answer") + entry(chosen, "You picked");
}

function clearLastResult() {
  lastResult.className = "last-result";
  lastResult.innerHTML = "";
}

function resetScore() {
  state.score = 0;
  state.total = 0;
  state.streak = 0;
  renderScore();
  clearLastResult();
  nextQuestion();
}

/* =========================
   Settings
   ========================= */

function syncSettingsFromUI() {
  state.settings.mode = document.querySelector('input[name="quiz-mode"]:checked')?.value || "insignia-to-name";
  state.settings.services = new Set([...serviceInputs].filter(i => i.checked).map(i => i.value));
  state.settings.groups = new Set([...groupInputs].filter(i => i.checked).map(i => i.value));
  state.settings.starStyle = document.querySelector('input[name="star-style"]:checked')?.value || "slides";
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: state.settings.mode,
      services: [...state.settings.services],
      groups: [...state.settings.groups],
      starStyle: state.settings.starStyle
    }));
  } catch {
    // storage unavailable; settings just won't persist
  }
}

function loadSavedSettings() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return;
  }
  if (!saved || typeof saved !== "object") return;

  const savedMode = [...modeInputs].find(input => input.value === saved.mode);
  if (savedMode) savedMode.checked = true;
  if (Array.isArray(saved.services)) {
    serviceInputs.forEach(input => { input.checked = saved.services.includes(input.value); });
  }
  if (Array.isArray(saved.groups)) {
    groupInputs.forEach(input => { input.checked = saved.groups.includes(input.value); });
  }
  const savedStarStyle = [...starStyleInputs].find(input => input.value === saved.starStyle);
  if (savedStarStyle) savedStarStyle.checked = true;
}

function onSettingsChanged() {
  syncSettingsFromUI();
  saveSettings();
  state.recentIds = [];
  renderPoolCount();
  renderStudySheet();
  nextQuestion();
}

/* =========================
   Event Handlers
   ========================= */

[...modeInputs, ...serviceInputs, ...groupInputs, ...starStyleInputs].forEach(input => {
  input.addEventListener("change", onSettingsChanged);
});

resetButton.addEventListener("click", resetScore);

// 1-4 pick an answer
document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.target.closest("input, select, textarea")) return;

  const number = Number(event.key);
  if (number >= 1 && number <= OPTION_COUNT && state.question && !state.question.answered) {
    const option = state.question.options[number - 1];
    if (option) answerQuestion(option.id);
  }
});

/* =========================
   Initialisation
   ========================= */

loadSavedSettings();
syncSettingsFromUI();
renderScore();
renderPoolCount();
renderStudySheet();
nextQuestion();
