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

// listed explicitly because JS objects always put numeric keys first
const DISPLAY_ORDER = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"];

const grid = document.getElementById("morse-grid");

DISPLAY_ORDER.forEach(char => {
  const code = MORSE_MAP[char];
  const card = document.createElement("div");
  card.className = "morse-card";

  const letter = document.createElement("div");
  letter.className = "morse-letter";
  letter.textContent = char;

  const morse = document.createElement("div");
  morse.className = "morse-code";
  morse.textContent = code;

  card.append(letter, morse);
  grid.appendChild(card);
});
