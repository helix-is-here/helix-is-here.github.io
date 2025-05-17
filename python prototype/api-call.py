import requests

from divisions import divisions
# gets the divisionId from the divisions list.
def getDivisionId(choice: int) -> str:
    # map input number onto division values
    try:
        choice_index = int(choice)
        if 0 <= choice_index < len(divisions):
            division_id = divisions[choice_index]["id"]
            division_name = divisions[choice_index]["name"]
            print(f"You selected: {division_name} (ID: {division_id})")
            print()
            return division_id
        else:
            print("Invalid selection: number out of range.")
    except ValueError:
        print("Invalid input: please enter a number.")

# prints a list of divisions, gets the user to select one, then returns the divisionId.
def selectDivision() -> str:
    print("Select Divison:")
    for index, div in enumerate(divisions):
        print(f"{index}) {div['name']}")

    # get user input
    choice = input("Enter the number of your choice: ")

    return getDivisionId(choice)

# calls the API for the seasons in a division
def getDivisionSeasonsData(divisionId: str) -> list:
    url = "https://prod.services.nbl.com.au/api_cache/bbv/synergy"

    params = {
        "route": "competitions/" + divisionId + "/seasons",
        "format": "true"
    }

    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Request failed with status code {response.status_code}")

# prints a list of seasons, then asks the user to select one, and returns the season id
def selectSeason(divisionId: str) -> str:
    divisionSeasons = getDivisionSeasonsData(divisionId)
    
    print("Select Season:")
    for index, season in enumerate(divisionSeasons["data"]):
        print(f"{index}) {season['year']}")

    # get user input
    seasonChoiceIndex = int(input("Enter the number of your choice: "))
    yearChoice = divisionSeasons["data"][seasonChoiceIndex]["year"]
    
    seasonId = divisionSeasons["data"][seasonChoiceIndex]["seasonId"]
    
    print(f"You selected: {yearChoice} (Season ID: {seasonId})")
    print()

    return seasonId

# calls the API for the games in a season
def getSeasonGames(competitionId: str) -> list:

    url = "https://prod.services.nbl.com.au/api_cache/bbv/synergy"
    params = {
        "route": "seasons/" + competitionId + "/fixtures",
        "limit": "200",
        "include": "entities,venues",
        "fields": "startTimeLocal,fixtureId,roundNumber,status,competitors,venue",
        "format": "true"
    }

    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Request failed with status code {response.status_code}")

    # print(len(data["data"]))
    # for i in range(0, len(data["data"])):
    #     if (data["data"][i]["competitors"][0]["score"] is not None and data["data"][i]["competitors"][0]["score"] is not None):
    #         print(data["data"][i]["fixtureId"] + " - " + data["data"][i]["roundNumber"] + " | Scores: " + data["data"][i]["competitors"][0]["score"] + " - " + data["data"][i]["competitors"][0]["score"])
    #     else:
    #         print(data["data"][i]["fixtureId"] + " - " + data["data"][i]["roundNumber"] + " | Scores: N/A - N/A")

def selectRound(seasonGames) -> str:
    rounds = set()
    
    for index, game in enumerate(seasonGames["data"]):
        if game["roundNumber"] not in rounds:
            print("adding " + game["roundNumber"])
            rounds.add(game["roundNumber"])

    rounds = sorted(rounds)
    
    print("Select Round:")
    print(rounds)
    
    roundChoice = input()
    
    return roundChoice

def selectGame(competitionId: str) -> str:
    seasonGames = getSeasonGames(competitionId)
    
    # print(seasonGames)
    
    roundNumber = selectRound(seasonGames)
    
    print(f"you selected {roundNumber}")
    
    selectedRoundGames = []
    for index, game in enumerate(seasonGames["data"]):
        if game["roundNumber"] == roundNumber:
            print("selected round with game with fixtureId: " + game["fixtureId"])
            selectedRoundGames.append(game)
    
    roundGamesStatistics = []
    for index, game in enumerate(selectedRoundGames):
        roundGamesStatistics.append(getGameStatistics(game["fixtureId"]))
    

# calls the API for the statistics in a game
def getGameStatistics(fixtureId: str) -> list:
    url = "https://eapi.web.prod.cloud.atriumsports.com/v1/embed/2/fixture_detail"
    params = {
        "sub": "statistics",
        "fixtureId": fixtureId
    }

    response = requests.get(url, params=params)

    if response.status_code == 200:
        competitor1 = response.json()["data"]["banner"]["fixture"]["competitors"][0]["name"]
        competitor2 = response.json()["data"]["banner"]["fixture"]["competitors"][1]["name"]
        print("received game data for " + fixtureId + " | " + competitor1 + " vs " + competitor2)
        return response.json()
    else:
        print(f"Request failed with status code {response.status_code}")

    #print(data["data"]["statistics"]["data"]["base"]["home"]["persons"][0]["rows"])
    #print(data["data"]["statistics"]["data"]["base"]["away"]["persons"][0]["rows"])
    # for i in range(0, len(data["data"]["statistics"]["data"]["base"]["home"]["persons"][0]["rows"])):
    #     print(data["data"]["statistics"]["data"]["base"]["home"]["persons"][0]["rows"][i]["personName"])


def main():
    divisionId = selectDivision()
    
    competitionId = selectSeason(divisionId)
    
    fixtureId = selectGame(competitionId)
    

#print(getGameStatistics("f849bfc9-b6ee-11ef-852a-89deb67de033"))
#print(getSeasonGames("ee3cafaa-76a3-11eb-a481-2a86bfd2d24d"))
#print(getSeasonGames("728c222a-c9a0-11ee-a13a-49cca5d46df0"))
#print(test_me())
main()