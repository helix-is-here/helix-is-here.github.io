const divisions = [
    { competitionId: "ee3cafaa-76a3-11eb-a481-2a86bfd2d24d", name: "Championship Men" },
    { competitionId: "ee4035f8-76a3-11eb-a481-2a86bfd2d24d", name: "Championship Women" },
    { competitionId: "ee43298e-76a3-11eb-a481-2a86bfd2d24d", name: "Division One Men" },
    { competitionId: "ee46747c-76a3-11eb-a481-2a86bfd2d24d", name: "Division One Women" },
    { competitionId: "ee4a0420-76a3-11eb-a481-2a86bfd2d24d", name: "Division Two Men" },
    { competitionId: "ee4d24e8-76a3-11eb-a481-2a86bfd2d24d", name: "Division Two Women" },
    { competitionId: "ee501d7e-76a3-11eb-a481-2a86bfd2d24d", name: "Victorian Youth Championship Men" },
    { competitionId: "ee53fe30-76a3-11eb-a481-2a86bfd2d24d", name: "Victorian Youth Championship Women" },
    { competitionId: "ee57fec2-76a3-11eb-a481-2a86bfd2d24d", name: "Youth League One Men" },
    { competitionId: "ee64436c-76a3-11eb-a481-2a86bfd2d24d", name: "Youth League One Women" },
    { competitionId: "ee615c24-76a3-11eb-a481-2a86bfd2d24d", name: "Youth League Two Men" },
    { competitionId: "ee6709f8-76a3-11eb-a481-2a86bfd2d24d", name: "Youth League Two Women" },
    { competitionId: "a5809a1b-b1d9-11ef-823f-656618bcf3f0", name: "Youth League Three Men" }
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

// --------------------------
// POPULATING SELECT ELEMENTS
// --------------------------

// once the DOM content has finished loading
document.addEventListener("DOMContentLoaded", function () {
    populateSeasonSelect();
})


async function populateSeasonSelect() {
    const yearsSet = new Set();

    for (const div of divisions) {
        const seasonData = await getCachedDivisionSeasons(div.competitionId);

        seasonData.forEach(season => {
            yearsSet.add(season.year);
        });
    }

    const select = document.getElementById("seasonSelect");

    const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

    sortedYears.forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });

    // Add change event listener
    select.addEventListener("change", () => {
        const selectedYear = select.value;
        if (selectedYear) {
            populateWeekSelect(selectedYear);
        }
    });

    // Enable the select
    select.disabled = false;
}

async function populateWeekSelect(year) {
    const weeksSet = new Set();

    // for every season in cache of the correct year
        // get season game data
            // using estimatedFinishTimeUTC populate the set of weeks
            // (probs should have a helper function to convert)

    // sort weeks

    // populate week select 
    const select = document.getElementById('weekSelect');

    // enable the select

}

function populateTable(sortBy) {
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

function enableLoadingSpinner() {
    console.log('loading spinner on');
}

function disableLoadingSpinner() {
    console.log('loading spinner off')
}

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
