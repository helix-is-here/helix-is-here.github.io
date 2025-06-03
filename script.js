const divisions = [
    { competitionId: "ee3cafaa-76a3-11eb-a481-2a86bfd2d24d", value: "champMen", name: "Championship Men" },
    { competitionId: "ee4035f8-76a3-11eb-a481-2a86bfd2d24d", value: "champWomen", name: "Championship Women" },
    { competitionId: "ee43298e-76a3-11eb-a481-2a86bfd2d24d", value: "divisionOneMen", name: "Division One Men" },
    { competitionId: "ee46747c-76a3-11eb-a481-2a86bfd2d24d", value: "divisionOneWomen", name: "Division One Women" },
    { competitionId: "ee4a0420-76a3-11eb-a481-2a86bfd2d24d", value: "divisionTwoMen", name: "Division Two Men" },
    { competitionId: "ee4d24e8-76a3-11eb-a481-2a86bfd2d24d", value: "divisionTwoWomen", name: "Division Two Women" },
    { competitionId: "ee501d7e-76a3-11eb-a481-2a86bfd2d24d", value: "victorianYouthChampMen", name: "Victorian Youth Championship Men" },
    { competitionId: "ee53fe30-76a3-11eb-a481-2a86bfd2d24d", value: "victorianYouthChampWomen", name: "Victorian Youth Championship Women" },
    { competitionId: "ee57fec2-76a3-11eb-a481-2a86bfd2d24d", value: "youthLeagueOneMen", name: "Youth League One Men" },
    { competitionId: "ee64436c-76a3-11eb-a481-2a86bfd2d24d", value: "youthLeagueOneWomen", name: "Youth League One Women" },
    { competitionId: "ee615c24-76a3-11eb-a481-2a86bfd2d24d", value: "youthLeagueTwoMen", name: "Youth League Two Men" },
    { competitionId: "ee6709f8-76a3-11eb-a481-2a86bfd2d24d", value: "youthLeagueTwoWomen", name: "Youth League Two Women" },
    { competitionId: "a5809a1b-b1d9-11ef-823f-656618bcf3f0", value: "youthLeagueThreeMen", name: "Youth League Three Men" }
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
            // console.log("Division seasons data:", data);
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
            // console.log("Season games data:", data);
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
            // console.log("Game stats:", data);
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
    // add event listener to sort table on sortBy select
    document.getElementById('sortBy').addEventListener('change', populateTable);

    // add event listener to filter by comp when checkboxes changed
    document.querySelectorAll('.form-check-input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', populateTable);
    });
    
    populateSeasonSelect();
})

async function populateSeasonSelect() {
    const seasonSelect = document.getElementById("seasonSelect");
    seasonSelect.disabled = true;

    const yearsSet = new Set();

    for (const div of divisions) {
        const seasonData = await getCachedDivisionSeasons(div.competitionId);

        seasonData.forEach(season => {
            yearsSet.add(season.year);
        });
    }

    const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Clear existing options
    seasonSelect.innerHTML = '';

    // Add the default "Select Season" option
    const defaultSeasonOption = document.createElement('option');
    defaultSeasonOption.value = '';
    defaultSeasonOption.textContent = 'Select Season';
    defaultSeasonOption.disabled = true;
    defaultSeasonOption.selected = true;
    seasonSelect.appendChild(defaultSeasonOption);

    sortedYears.forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        seasonSelect.appendChild(option);
    });

    seasonSelect.disabled = false;

    seasonSelect.addEventListener("change", () => {
        const selectedYear = seasonSelect.value;
        if (selectedYear) {
            fetchSeasonData(selectedYear);
        }
    });
}

async function fetchSeasonData(year) {
    const weekSelect = document.getElementById('weekSelect');
    weekSelect.disabled = true;
    showProgressBar();
    disableInputsAndSelects();

    const weeksSet = new Set();

    const totalSeasons = divisions.length;
    let retrievedSeasons = 0;

    for (const div of divisions) {
        const seasons = await getCachedDivisionSeasons(div.competitionId);

        // Filter only seasons matching the selected year
        const matchingSeasons = seasons.filter(season => season.year == year);

        for (const season of matchingSeasons) {
            const games = await getCachedSeasonGames(season.seasonId);

            games.forEach(game => {
                if (game.status === "CONFIRMED" && game.estimatedFinishTimeUTC) {
                    const week = convertToWeek(game.estimatedFinishTimeUTC);
                    weeksSet.add(week);
                }
            });
        }

        retrievedSeasons++;
        const percent = Math.round((retrievedSeasons / totalSeasons) * 100);
        updateProgressBar(percent);
    }

    // Sort weeks numerically
    const sortedWeeks = Array.from(weeksSet).sort((a, b) => a - b);

    // Populate week select dropdown
    weekSelect.innerHTML = ''; // Clear old options

    // Re-add the default "Select Week" option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Week';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    weekSelect.appendChild(defaultOption);

    sortedWeeks.forEach(week => {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = `Week ${week}`;
        weekSelect.appendChild(option);
    });

    // Enable the weekSelect element
    weekSelect.disabled = false;
    hideProgressBar();
    enableInputsAndSelects();

    weekSelect.addEventListener("change", () => {
        const selectedWeek = weekSelect.value;
        if (selectedWeek) {
            fetchWeekData(selectedWeek);
        }
    });
}

let weekPlayers = [];

async function fetchWeekData(week) {
    const year = document.getElementById('seasonSelect').value;

    weekPlayers = []; // Reset from previous run
    const gamesThisWeek = [];

    // Gather all games for the selected year and filter by week
    for (const div of divisions) {
        const seasons = await getCachedDivisionSeasons(div.competitionId);
        const matchingSeasons = seasons.filter(season => season.year == year);

        for (const season of matchingSeasons) {
            const games = await getCachedSeasonGames(season.seasonId);

            games.forEach(game => {
                if (
                    game.status === "CONFIRMED" &&
                    game.estimatedFinishTimeUTC &&
                    convertToWeek(game.estimatedFinishTimeUTC) == week
                ) {
                    gamesThisWeek.push(game);
                }
            });
        }
    }

    disableInputsAndSelects();
    showProgressBar();
    const totalGames = gamesThisWeek.length;
    let retrievedGames = 0;

    // Process each game
    for (const game of gamesThisWeek) {
        try {
            const gameStats = await getCachedGameStatistics(game.fixtureId);
            const competitionName = gameStats.banner.competition.name;

            const competitors = gameStats.banner.fixture.competitors;
            let homeTeamName = "Unknown";
            let awayTeamName = "Unknown";

            if (competitors[0].isHome) {
                homeTeamName = competitors[0].name;
                awayTeamName = competitors[1].name;
            } else {
                homeTeamName = competitors[1].name;
                awayTeamName = competitors[0].name;
            }

            // Home players
            const homePlayers = gameStats.statistics.data.base.home.persons[0].rows;
            for (const player of homePlayers) {
                weekPlayers.push(fillInPlayerStats(player, homeTeamName, awayTeamName, competitionName));
            }

            // Away players
            const awayPlayers = gameStats.statistics.data.base.away.persons[0].rows;
            for (const player of awayPlayers) {
                weekPlayers.push(fillInPlayerStats(player, awayTeamName, homeTeamName, competitionName));
            }

        } catch (error) {
            console.error(`Error processing game ${game.fixtureId}:`, error);
        }

        retrievedGames++;
        const percent = Math.round((retrievedGames / totalGames) * 100);
        updateProgressBar(percent);
    }

    populateTable(); // Sort and display the final player list

    hideProgressBar();
    enableInputsAndSelects();
}

function populateTable() {
    const sortSelect = document.getElementById("sortBy");
    const sortBy = sortSelect.value;

    const checkedComps = Array.from(document.querySelectorAll('.form-check-input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    // Filter players by checked competitions
    const filteredPlayers = weekPlayers.filter(player =>
        checkedComps.includes(player.competitionName)
    );

    const key = sortBy || "gameScore";

    filteredPlayers.sort((a, b) => {
        const aVal = a.statistics?.[key] ?? a[key] ?? 0;
        const bVal = b.statistics?.[key] ?? b[key] ?? 0;
        return bVal - aVal; // descending
    });

    // Sort players by Game Score descending
    filteredPlayers.sort((a, b) => b.statistics[sortBy] - a.statistics[sortBy]);

    // Insert top 15 rows
    const topPlayers = filteredPlayers.slice(0, 20);
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

// ----------------
// HELPER FUNCTIONS
// ----------------

function showProgressBar() {
    const container = document.getElementById("progressContainer");
    const bar = document.getElementById("progressBar");
    const table = document.getElementById("statsTable");

    table.classList.add('d-none');
    container.classList.remove("d-none");
    bar.style.width = "0%";
    container.setAttribute("aria-valuenow", "0");
    bar.textContent = "0%";
}

function updateProgressBar(percent) {
    const container = document.getElementById("progressContainer");
    const bar = document.getElementById("progressBar");
    const clamped = Math.min(100, Math.max(0, percent));

    bar.style.width = `${clamped}%`;
    container.setAttribute("aria-valuenow", clamped.toString());
    bar.textContent = `${clamped}%`;
}

function hideProgressBar() {
    const container = document.getElementById("progressContainer");
    const table = document.getElementById("statsTable");

    table.classList.remove('d-none');
    container.classList.add("d-none");
}

function disableInputsAndSelects() {
    document.querySelectorAll('input, select').forEach(el => {
        el.disabled = true;
    });
}

function enableInputsAndSelects() {
    document.querySelectorAll('input, select').forEach(el => {
        el.disabled = false;
    });
}

function convertToWeek(utcString) {
    const date = new Date(utcString);
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - oneJan) / (1000 * 60 * 60 * 24)) + 1;
    return Math.ceil(dayOfYear / 7);
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
