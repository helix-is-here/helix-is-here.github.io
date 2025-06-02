const divisions = [
    { id: "ee3cafaa-76a3-11eb-a481-2a86bfd2d24d", name: "Championship Men" },
    { id: "ee4035f8-76a3-11eb-a481-2a86bfd2d24d", name: "Championship Women" },
    { id: "ee43298e-76a3-11eb-a481-2a86bfd2d24d", name: "Division One Men" },
    { id: "ee46747c-76a3-11eb-a481-2a86bfd2d24d", name: "Division One Women" },
    { id: "ee4a0420-76a3-11eb-a481-2a86bfd2d24d", name: "Division Two Men" },
    { id: "ee4d24e8-76a3-11eb-a481-2a86bfd2d24d", name: "Division Two Women" },
    { id: "ee501d7e-76a3-11eb-a481-2a86bfd2d24d", name: "Victorian Youth Championship Men" },
    { id: "ee53fe30-76a3-11eb-a481-2a86bfd2d24d", name: "Victorian Youth Championship Women" },
    { id: "ee57fec2-76a3-11eb-a481-2a86bfd2d24d", name: "Youth League One Men" },
    { id: "ee64436c-76a3-11eb-a481-2a86bfd2d24d", name: "Youth League One Women" },
    { id: "ee615c24-76a3-11eb-a481-2a86bfd2d24d", name: "Youth League Two Men" },
    { id: "ee6709f8-76a3-11eb-a481-2a86bfd2d24d", name: "Youth League Two Women" },
    { id: "a5809a1b-b1d9-11ef-823f-656618bcf3f0", name: "Youth League Three Men" }
];

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

const roundPlayers = [];

function getRoundPlayers(competitionName, roundNumber) {

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
    const dropdownMenu = document.getElementById('divisionDropdown')

    divisions.forEach(division => {
        const li = document.createElement('li');

        const checkWrapper = document.createElement('div');
        checkWrapper.className = 'form-check';

        const checkbox = document.createElement('input');
        checkbox.className = 'form-check-input';
        checkbox.type = 'checkbox';
        checkbox.value = division.id;
        checkbox.id = `div-${division.id}`;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.setAttribute('for', checkbox.id);
        label.textContent = division.name;

        checkWrapper.appendChild(checkbox);
        checkWrapper.appendChild(label);
        li.appendChild(checkWrapper);
        dropdownMenu.appendChild(li);

        // Prevent dropdown from closing on click
        checkWrapper.addEventListener('click', (e) => e.stopPropagation());
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
    const oldSelect = document.getElementById("roundSelect");
    oldSelect.disabled = true;
    const games = await getCachedSeasonGames(seasonId);

    // Clear and reset the select
    const newSelect = oldSelect.cloneNode(false);
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Select Round";
    defaultOption.value = "";
    newSelect.appendChild(defaultOption);

    // Extract and sort unique round numbers
    const roundSet = new Set();
    games.forEach((game) => {
        if (game.roundNumber && game.status == "CONFIRMED")
            roundSet.add(game.roundNumber);
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

function populateTable(competitionName, roundNumber, sortBy) {
    // default sort by is game score
    sortBy = sortBy || "gameScore";

    // Sort players by Game Score descending
    roundPlayers.sort((a, b) => b.statistics[sortBy] - a.statistics[sortBy]);

    // Insert top 15 rows
    const topPlayers = roundPlayers.slice(0, 15);
    const statsTableBody = document.getElementById("statsTableBody");
    statsTableBody.innerHTML = "";

    topPlayers.forEach((player, index) => {
        const stats = player.statistics;
        const row = document.createElement("tr");
        row.innerHTML = `
      <th scope="row">${player.bib}</th>
      <td>${player.personName}</td>
      <td>${player.teamName}</td>
      <td>${player.gameTitleHomeVsAway}</td>
      <td>${player.competitionName}</td>
      <td>${formatDuration(stats.minutes)}</td>
      <td>${stats.points || 0}</td>
      <td>${(stats.fieldGoalsPercentage || 0).toFixed(1)}%</td>
      <td>${(stats.trueShootingPercentage).toFixed(1)}%</td>
      <td>${stats.foulsPersonal || 0}</td>
      <td>${stats.plusMinus || 0}</td>
      <td>${stats.efficiency || 0}</td>
      <td>${stats.gameScore.toFixed(1)}</td>
    `;
        statsTableBody.appendChild(row);
    });

}

async function handleRoundSelect(seasonId, roundNumber) {
    // show progress bat and set it to 0%
    const progressContainer = document.getElementById("progressContainer")
    const progressBar = document.getElementById("progressBar")
    progressContainer.classList.remove("d-none");
    progressBar.style.width = "0%";
    progressBar.setAttribute("aria-valuenow", "0");

    const seasonGames = await getCachedSeasonGames(seasonId);
    const seasonGamesThisRound = seasonGames.filter(game => game.roundNumber === roundNumber);

    // get game stats and fill in player stats
    const roundPlayers = [];

    // Progress tracking
    const totalGames = seasonGamesThisRound.length;
    let completedGames = 0;

    for (const game of seasonGamesThisRound) {
        const gameStats = await getCachedGameStatistics(game.fixtureId);

        let competitionName = gameStats.banner.competition.name;
        let homeTeamName = "Unknown";
        let awayTeamName = "Unknown";
        if (gameStats.banner.fixture.competitors[0].isHome) {
            homeTeamName = gameStats.banner.fixture.competitors[0].name;
            awayTeamName = gameStats.banner.fixture.competitors[1].name;
        }
        else {
            homeTeamName = gameStats.banner.fixture.competitors[1].name;
            awayTeamName = gameStats.banner.fixture.competitors[0].name;
        }

        // fill in the stats for home team
        const homePlayers = gameStats.statistics.data.base.home.persons[0].rows;
        for (const player of homePlayers) {
            roundPlayers.push(fillInPlayerStats(player, homeTeamName, awayTeamName));
        }

        // fill in the stats for away team
        const awayPlayers = gameStats.statistics.data.base.away.persons[0].rows;
        for (const player of awayPlayers) {
            roundPlayers.push(fillInPlayerStats(player, awayTeamName, homeTeamName));
        }

        // Update progress
        completedGames++;
        const percent = Math.round((completedGames / totalGames) * 100);
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute("aria-valuenow", percent.toString());
    }


    // Hide progress bar and set it to 100%
    progressContainer.classList.add("d-none");
    progressBar.style.width = `100%`;
    progressBar.setAttribute("aria-valuenow", "100");

    populateTable()
}

// ----------------
// HELPER FUNCTIONS
// ----------------

function fillInPlayerStats(player, playerTeamName, opponentTeamName, competitionName) {
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

    player.teamName = playerTeamName;
    player.gameTitleHomeVsAway = playerTeamName + " vs " + opponentTeamName;
    player.competitionName = competitionName;

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
