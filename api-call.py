import requests

from divisions import divisions

def getGameStatistics(fixtureId):
    url = "https://eapi.web.prod.cloud.atriumsports.com/v1/embed/2/fixture_detail"
    params = {
        "sub": "statistics",
        "fixtureId": fixtureId
    }

    response = requests.get(url, params=params)
    data = response.json()

    #print(data["data"]["statistics"]["data"]["base"]["home"]["persons"][0]["rows"])
    #print(data["data"]["statistics"]["data"]["base"]["away"]["persons"][0]["rows"])
    for i in range(0, len(data["data"]["statistics"]["data"]["base"]["home"]["persons"][0]["rows"])):
        print(data["data"]["statistics"]["data"]["base"]["home"]["persons"][0]["rows"][i]["personName"])

def getMensChamp2025FixtureIds():

    url = "https://prod.services.nbl.com.au/api_cache/bbv/synergy"
    # params = {
    #     "route": "seasons/f622e8a8-b1d9-11ef-a813-7beee0b79583/fixtures",
    #     "limit": "200",
    #     "include": "entities,venues",
    #     "fields": "startTimeLocal,fixtureId,roundNumber,status,competitors,venue",
    #     "format": "true"
    # }
    params = {
        "route": "seasons/7385ec55-c9a0-11ee-82c2-b99d64b17a9e/fixtures",
        "limit": "200",
        "include": "entities,venues",
        "fields": "startTimeLocal,fixtureId,roundNumber,status,competitors,venue",
        "format": "true"
    }

    response = requests.get(url, params=params)
    data = response.json()

    print(len(data["data"]))
    for i in range(0, len(data["data"])):
        if (data["data"][i]["competitors"][0]["score"] is not None and data["data"][i]["competitors"][0]["score"] is not None):
            print(data["data"][i]["fixtureId"] + " - " + data["data"][i]["roundNumber"] + " | Scores: " + data["data"][i]["competitors"][0]["score"] + " - " + data["data"][i]["competitors"][0]["score"])
        else:
            print(data["data"][i]["fixtureId"] + " - " + data["data"][i]["roundNumber"] + " | Scores: N/A - N/A")

def selectDivision() -> str:
        # print divisons for selection
    print("Select Divison:")
    for index, div in enumerate(divisions):
        print(f"{index}) {div['name']}")

    # get user input
    choice = input("Enter the number of your choice: ")

    # map input number onto division values
    try:
        choice_index = int(choice)
        if 0 <= choice_index < len(divisions):
            division_value = divisions[choice_index]["value"]
            division_id = divisions[choice_index]["name"]
            print(f"You selected: {division_value} (ID: {division_id})")
        else:
            print("Invalid selection: number out of range.")
    except ValueError:
        print("Invalid input: please enter a number.")

def main():
    divisionSelection = selectDivision()

    
    
    

        

#getGameStatistics("f849bfc9-b6ee-11ef-852a-89deb67de033")
getMensChamp2025FixtureIds()
#main()
