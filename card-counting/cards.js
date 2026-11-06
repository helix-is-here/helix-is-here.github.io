/* =========================
   Cards, decks and Hi-Lo values
   Shared by every mode (the blackjack table will reuse this too).
   ========================= */

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const SUITS = [
  { key: "spades", symbol: "♠", red: false },
  { key: "hearts", symbol: "♥", red: true },
  { key: "diamonds", symbol: "♦", red: true },
  { key: "clubs", symbol: "♣", red: false }
];

// Hi-Lo: 2–6 are +1, 7–9 are 0, tens and aces are −1.
function hiLoValue(rank) {
  if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
  if (["7", "8", "9"].includes(rank)) return 0;
  return -1;
}

function buildShoe(deckCount = 1) {
  const cards = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit });
      }
    }
  }
  return shuffle(cards);
}

// Fisher–Yates
function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function countOf(cards) {
  return cards.reduce((total, card) => total + hiLoValue(card.rank), 0);
}

function formatCount(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

/* Drawing. Cards are plain elements styled in styles.css. */

function renderCard(card, { showValue = false, small = false } = {}) {
  const el = document.createElement("div");
  el.className = `playing-card${card.suit.red ? " red" : ""}${small ? " small" : ""}`;
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", `${card.rank} of ${card.suit.key}`);
  el.innerHTML = `
    <span class="corner top">${card.rank}<br>${card.suit.symbol}</span>
    <span class="pip">${card.suit.symbol}</span>
    <span class="corner bottom">${card.rank}<br>${card.suit.symbol}</span>`;

  if (showValue) {
    const value = hiLoValue(card.rank);
    const tag = document.createElement("span");
    tag.className = `value-tag ${value > 0 ? "plus" : value < 0 ? "minus" : "zero"}`;
    tag.textContent = formatCount(value);
    el.appendChild(tag);
  }
  return el;
}

function renderCardBack() {
  const el = document.createElement("div");
  el.className = "playing-card back";
  el.setAttribute("aria-hidden", "true");
  return el;
}
