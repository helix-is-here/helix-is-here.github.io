import { divisions } from "./divisions.js";

const seasonGamesCache = new Map();

async function getCachedSeasonGames(seasonId) {
  if (!seasonGamesCache.has(seasonId)) {
    const data = await getSeasonGamesData(seasonId);
    seasonGamesCache.set(seasonId, data.data);
  }
  return seasonGamesCache.get(seasonId);
}


function populateDivisionSelect() {
  // Populate the division select element
  const select = document.getElementById("divisionSelect");

  divisions.forEach((div) => {
    const option = document.createElement("option");
    option.value = div.id;
    option.textContent = div.name;
    select.appendChild(option);
  });

  // Listen for user selection
  select.addEventListener("change", () => {
    const selectedId = select.value;
    if (selectedId) {
      populateSeasonSelect(selectedId);
    }
  });
}

async function getDivisionSeasonsData(divisionId) {
  const url = "https://prod.services.nbl.com.au/api_cache/bbv/synergy";
  const params = new URLSearchParams({
    route: `competitions/${divisionId}/seasons`,
    format: "true"
  });

  try {
    const response = await fetch(`${url}?${params}`);
    if (response.ok) {
      const data = await response.json();
      console.log("Division seasons data:", data);
      return data;
    } else {
      console.error("Request failed:", response.status);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

async function populateSeasonSelect(divisionId) {
  const seasonsData = await getDivisionSeasonsData(divisionId);
  const select = document.getElementById("seasonSelect");

  // Clear all options except the first one ("Select Season")
  select.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select Season";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  // Enable the select element
  select.disabled = false;

  // Add new season options
  seasonsData.data.forEach((season) => {
    const option = document.createElement("option");
    option.value = season.seasonId;
    option.textContent = season.year;
    select.appendChild(option);
  });

  // Remove any existing event listener by cloning the element
  const newSelect = select.cloneNode(true);
  select.parentNode.replaceChild(newSelect, select);

  // Add fresh event listener
  newSelect.addEventListener("change", () => {
    const selectedSeasonId = newSelect.value;
    if (selectedSeasonId) {
      populateRoundSelect(selectedSeasonId);
    }
  });
}

async function getSeasonGamesData(seasonId) {
  const url = "https://prod.services.nbl.com.au/api_cache/bbv/synergy";
  const params = new URLSearchParams({
    route: `seasons/${seasonId}/fixtures`,
    format: "true"
  });

  try {
    const response = await fetch(`${url}?${params}`);
    if (response.ok) {
      const data = await response.json();
      console.log("Season games data:", data);
      return data
    } else {
      console.error("Request failed:", response.status);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

async function populateRoundSelect(seasonId) {
  const seasonGameData = await getSeasonGamesData(seasonId);
  const oldSelect = document.getElementById("roundSelect");

  // Clear and reset the select
  const newSelect = oldSelect.cloneNode(false); // clone without children
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select Round";
  defaultOption.value = "";
  newSelect.appendChild(defaultOption);

  // Extract unique round numbers
  const games = seasonGameData.data;
  const roundSet = new Set();

  games.forEach((game) => {
    if (game.roundNumber) {
      roundSet.add(game.roundNumber);
    }
  });

  // Convert to sorted array
  const uniqueRounds = Array.from(roundSet).sort((a, b) => Number(a) - Number(b));

  // Populate select
  uniqueRounds.forEach((round) => {
    const option = document.createElement("option");
    option.value = round;
    option.textContent = `Round ${round}`;
    newSelect.appendChild(option);
  });

  // Enable select
  newSelect.disabled = false;

  // Replace old select with new one
  oldSelect.parentNode.replaceChild(newSelect, oldSelect);

  // Add change event listener
  newSelect.addEventListener("change", () => {
    const selectedRound = newSelect.value;
    if (selectedRound) {
      handleRoundSelect(selectedRound); // Define this function as needed
    }
  });
}

function handleRoundSelect(roundNumber) {
  console.log("Selected round:", roundNumber);
  // Add your logic here to handle what happens when a round is selected
}


// once the DOM content has finished loading
document.addEventListener("DOMContentLoaded", function () {
  populateDivisionSelect();
})



