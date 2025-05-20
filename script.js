import { divisions } from "./divisions.js";

// --------------------
// FETCHING AND CACHING
// --------------------

// Division Seasons Caching
const divisionSeasonsCache = new Map();

async function getCachedDivisionSeasons(divisionId) {
  if (!divisionSeasonsCache.has(divisionId)) {
    const data = await getDivisionSeasonsData(divisionId);
    divisionSeasonsCache.set(divisionId, data.data);
  }
  return divisionSeasonsCache.get(divisionId);
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

// Season Games Caching
const seasonGamesCache = new Map();

async function getCachedSeasonGames(seasonId) {
  if (!seasonGamesCache.has(seasonId)) {
    const data = await getSeasonGamesData(seasonId);
    seasonGamesCache.set(seasonId, data.data);
  }
  return seasonGamesCache.get(seasonId);
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

// Game Stats Caching
const gameStatsCache = new Map();

async function getCachedGameStatistics(fixtureId) {
  if (!gameStatsCache.has(fixtureId)) {
    const data = await getGameStatistics(fixtureId);
    gameStatsCache.set(fixtureId, data.data);
  }
  return gameStatsCache.get(fixtureId);
}

async function getGameStatistics(fixtureId) {
  const url = "https://eapi.web.prod.cloud.atriumsports.com/v1/embed/2/fixture_detail";
  const params = new URLSearchParams({
    sub: "statistics",
    fixtureId: fixtureId
  });

  try {
    const response = await fetch(`${url}?${params}`);
    if (response.ok) {
      const data = await response.json();
      console.log("Game stats:", data);
      return data
    } else {
      console.error("Request failed:", response.status);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// --------------------------
// POPULATING SELECT ELEMENTS
// --------------------------

// once the DOM content has finished loading
document.addEventListener("DOMContentLoaded", function () {
  populateDivisionSelect();
})

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

async function populateRoundSelect(seasonId) {
  const games = await getCachedSeasonGames(seasonId);
  const oldSelect = document.getElementById("roundSelect");

  // Clear and reset the select
  const newSelect = oldSelect.cloneNode(false);
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select Round";
  defaultOption.value = "";
  newSelect.appendChild(defaultOption);

  // Extract and sort unique round numbers
  const roundSet = new Set();
  games.forEach((game) => {
    if (game.roundNumber) roundSet.add(game.roundNumber);
  });

  const uniqueRounds = Array.from(roundSet).sort((a, b) => Number(a) - Number(b));

  // Populate select
  uniqueRounds.forEach((round) => {
    const option = document.createElement("option");
    option.value = round;
    option.textContent = `Round ${round}`;
    newSelect.appendChild(option);
  });

  newSelect.disabled = false;
  oldSelect.parentNode.replaceChild(newSelect, oldSelect);

  // Add event listener for round selection
  newSelect.addEventListener("change", () => {
    const selectedRound = newSelect.value;
    if (selectedRound) {
      handleRoundSelect(seasonId, selectedRound);
    }
  });
}

async function handleRoundSelect(seasonId, roundNumber) {
  const table = document.getElementById("statsTable");
  const progressContainer = document.getElementById("progressContainer")
  const progressBar = document.getElementById("progressBar")

  // show progress bat and set it to 0%
  progressContainer.classList.remove("d-none");
  progressBar.style.width = "0%";
  progressBar.setAttribute("aria-valuenow", "0");

  const seasonGames = await getCachedSeasonGames(seasonId);
  const seasonGamesThisRound = seasonGames.filter(game => game.roundNumber === roundNumber);

  const roundPlayers = [];

  // Progress tracking
  const totalGames = seasonGamesThisRound.length;
  let completedGames = 0;

  // get game stats and fill in player stats
  for (const game of seasonGamesThisRound) {
    const gameStats = await getCachedGameStatistics(game.fixtureId);

    let homeTeamName = "Unknown"
    let awayTeamName = "Unknown"
    if (gameStats.banner.fixture.competitors[0].isHome) {
      homeTeamName = gameStats.banner.fixture.competitors[0].name
      awayTeamName = gameStats.banner.fixture.competitors[1].name
    }
    else {
      homeTeamName = gameStats.banner.fixture.competitors[1].name
      awayTeamName = gameStats.banner.fixture.competitors[0].name
    }

    // fill in the stats for home team
    const homePlayers = gameStats.statistics.data.base.home.persons[0].rows;
    for (const player of homePlayers) {
      roundPlayers.push(fillInPlayerStats(player, homeTeamName));
    }
    
    // fill in the stats for away team
    const awayPlayers = gameStats.statistics.data.base.away.persons[0].rows;
    for (const player of awayPlayers) {
      roundPlayers.push(fillInPlayerStats(player, awayTeamName));
    }
    
    // Update progress
    completedGames++;
    const percent = Math.round((completedGames / totalGames) * 100);
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", percent.toString());
  }

  // Sort players by Game Score descending
  roundPlayers.sort((a, b) => b.statistics.gameScore - a.statistics.gameScore);

  // Insert top 15 rows
  const topPlayers = roundPlayers.slice(0, 15);
  const tbody = table.querySelector("tbody");

  topPlayers.forEach((player, index) => {
    const stats = player.statistics;
    const row = document.createElement("tr");
    row.innerHTML = `
      <th scope="row">${player.bib}</th>
      <td>${player.personName}</td>
      <td>${player.teamName}</td>
      <td>${formatDuration(stats.minutes)}</td>
      <td>${stats.points || 0}</td>
      <td>${(stats.fieldGoalsPercentage|| 0).toFixed(1)}%</td>
      <td>${(stats.trueShootingPercentage).toFixed(1)}%</td>
      <td>${stats.foulsPersonal || 0}</td>
      <td>${stats.plusMinus || 0}</td>
      <td>${stats.efficiency || 0}</td>
      <td>${stats.gameScore.toFixed(1)}</td>
    `;
    tbody.appendChild(row);
  });

  
  // Hide progress bar and set it to 100%
  progressContainer.classList.remove("d-none");
  progressBar.style.width = `100%`;
  progressBar.setAttribute("aria-valuenow", "100");
}

// ----------------
// HELPER FUNCTIONS
// ----------------

function fillInPlayerStats(player, teamName) {
  const stats = player.statistics;
  const FGA = stats.fieldGoalsAttempted || 0;
  const FTA = stats.freeThrowsAttempted || 0;
  const PTS = stats.points || 0;

  // True Shooting Percentage
  stats.trueShootingPercentage = (FGA === 0 && FTA === 0)
    ? 0
    : PTS / (2 * (FGA + 0.44 * FTA)) * 100;

  // Game Score
  stats.gameScore =
    PTS
    + 0.4 * (stats.fieldGoalsMade || 0)
    - 0.7 * FGA
    - 0.4 * ((FTA - (stats.freeThrowsMade || 0)))
    + 0.7 * (stats.reboundsOffensive || 0)
    + 0.3 * (stats.reboundsDefensive || 0)
    + (stats.steals || 0)
    + 0.7 * (stats.assists || 0)
    + 0.7 * (stats.blocks || 0)
    - 0.4 * (stats.foulsPersonal || 0)
    - (stats.turnovers || 0);

  // Add player team
  player.teamName = teamName

  return player;
}

function formatDuration(duration) {
  if (!duration || typeof duration !== 'string') return '0:00';
  
  const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const minutes = parseInt(match[1] || '0', 10);
  const seconds = parseInt(match[2] || '0', 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
