export function sortTable(list, sortConditions) {
    var map;
    const currentSortCondition = sortConditions[0];
    if (currentSortCondition.criteria === "resultsBetweenTied") {
        const tiedIds = list.map(team => team.id)
        map = list.reduce((mapObject, team) => {
            var wins = 0
            var losses = 0
            team.matchesPlayed.forEach((match) => {
                if (
                    match.home === team.id && tiedIds.includes(match.away) && match.scoreHome > match.scoreAway ||
                    (match.away === team.id && tiedIds.includes(match.home) && match.scoreHome < match.scoreAway)
                ) {
                    wins++
                }
                if (
                    match.home === team.id && tiedIds.includes(match.away) && match.scoreHome < match.scoreAway ||
                    (match.away === team.id && tiedIds.includes(match.home) && match.scoreHome > match.scoreAway)
                ) {
                    losses++
                }
            })

            team.resultsBetweenTied = `${wins} - ${losses}`
            const stat = Math.round( (wins / (wins + losses + 0.0000000000000001)) * 1000 ) / 1000 
            if (mapObject[`${stat}`]) {
                mapObject[`${stat}`].push(team)
            } else {
                mapObject[`${stat}`] = [team]
            }
            return mapObject
        }, {})
    } else {
        map = list.reduce((mapObject, team) => {
            var stat;
            if (currentSortCondition.criteria.includes("custom:")) {
                stat = team.custom[currentSortCondition.criteria.replace("custom:", "")]
            } else {
                stat = team[currentSortCondition.criteria]
            }

            if (mapObject[`${stat}`]) {
                mapObject[`${stat}`].push(team)
            } else {
                mapObject[`${stat}`] = [team]
            }
            return mapObject
        }, {})
    }
    

    const groups = []
    for(const [key, value] of Object.entries(map)) {
        groups.push({amount: key, teams: value})
    }
    return groups
        .sort((objA, objB) => { return (Number(objB.amount) - Number(objA.amount)) * (currentSortCondition.modifier ?? 1) })
        .map((obj) => {
            if (obj.teams.length === 1) {
                return obj.teams[0]
            }
            if (sortConditions.length < 2) {
                return obj.teams
            }
            return sortTable(obj.teams, sortConditions.filter((a, i) => i !== 0))
        })
        .flat()

}