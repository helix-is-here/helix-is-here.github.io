/* =========================
   ADF Ranks Quiz
   ========================= */

const STORAGE_KEY = "ranksQuiz.settings.v1";
const OPTION_COUNT = 4;

const state = {
  settings: {
    mode: "insignia-to-name",
    services: new Set(Object.keys(SERVICES)),
    groups: new Set(Object.keys(GROUPS))
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
const poolCount = document.getElementById("pool-count");

const scoreDisplay = document.getElementById("score");
const streakDisplay = document.getElementById("streak");
const resetButton = document.getElementById("reset-button");

const questionText = document.getElementById("question-text");
const promptArea = document.getElementById("prompt");
const optionsArea = document.getElementById("options");
const feedback = document.getElementById("feedback");
const nextButton = document.getElementById("next-button");

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
  feedback.textContent = "";
  feedback.className = "feedback";
  nextButton.hidden = true;
  optionsArea.innerHTML = "";
  promptArea.innerHTML = "";

  if (!question) {
    questionText.textContent = "Select at least one service and one rank group to start.";
    return;
  }

  const { answer, mode, options } = question;
  const service = SERVICES[answer.service];

  if (mode === "insignia-to-name") {
    questionText.textContent = `Which ${service} rank wears this insignia?`;
    promptArea.innerHTML = `<div class="prompt-insignia">${insigniaMarkup(answer)}</div>`;
  } else {
    questionText.textContent = "Which insignia belongs to this rank?";
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
      button.innerHTML = `${key}<span class="option-insignia">${insigniaMarkup(rank)}</span>`;
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
        <div class="study-insignia">${insigniaMarkup(rank)}</div>
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

  optionsArea.querySelectorAll(".option").forEach(button => {
    button.disabled = true;
    if (button.dataset.id === question.answer.id) button.classList.add("correct");
    else if (button.dataset.id === id) button.classList.add("wrong");
  });

  if (correct) {
    feedback.textContent = `Correct: ${rankLabel(question.answer)}`;
    feedback.className = "feedback feedback-correct";
  } else {
    const chosen = RANKS.find(rank => rank.id === id);
    feedback.textContent = `Not quite. That was ${rankLabel(question.answer)}; you picked ${rankLabel(chosen)}.`;
    feedback.className = "feedback feedback-wrong";
  }

  nextButton.hidden = false;
  nextButton.focus();
}

function resetScore() {
  state.score = 0;
  state.total = 0;
  state.streak = 0;
  renderScore();
  nextQuestion();
}

/* =========================
   Settings
   ========================= */

function syncSettingsFromUI() {
  state.settings.mode = document.querySelector('input[name="quiz-mode"]:checked')?.value || "insignia-to-name";
  state.settings.services = new Set([...serviceInputs].filter(i => i.checked).map(i => i.value));
  state.settings.groups = new Set([...groupInputs].filter(i => i.checked).map(i => i.value));
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: state.settings.mode,
      services: [...state.settings.services],
      groups: [...state.settings.groups]
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

[...modeInputs, ...serviceInputs, ...groupInputs].forEach(input => {
  input.addEventListener("change", onSettingsChanged);
});

resetButton.addEventListener("click", resetScore);
nextButton.addEventListener("click", nextQuestion);

// 1-4 pick an answer; Space/Enter moves on once answered
document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.target.closest("input, select, textarea")) return;

  const number = Number(event.key);
  if (number >= 1 && number <= OPTION_COUNT && state.question && !state.question.answered) {
    const option = state.question.options[number - 1];
    if (option) answerQuestion(option.id);
    return;
  }

  // a focused button already handles Space/Enter itself
  if ((event.key === " " || event.key === "Enter") && !event.target.closest("button, summary, a")) {
    if (state.question?.answered) {
      event.preventDefault();
      nextQuestion();
    }
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
