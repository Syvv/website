import curlingOlympicsWomen from './jsondata/curlingOlympicsWomen.json' with { type: 'json' }
import { sortTable } from './sorting.js'

const stage = curlingOlympicsWomen.stages[0]
const columns = [
    {
        data: "name",
        name: "Team",
        compactName: "Team"
    },
    ...stage.table.columns
]

// Determine the current standings
var standings = curlingOlympicsWomen.competitors.map(((competitor, competitorId) => {
    const result = {
        ...competitor,
        played: 0,
        wins: 0,
        losses: 0,
        id: competitorId
    }

    const matchesPlayed = stage.rounds.reduce((list, round) => {
        const roundMatches = round.matches.filter(match => match.finished && (match.home === competitorId || match.away === competitorId))

        return [...list, ...roundMatches]
    }, [])

    matchesPlayed.forEach(match => {
        result.played++;
        if (
            (match.home === competitorId && match.scoreHome > match.scoreAway) ||
            (match.away === competitorId && match.scoreHome < match.scoreAway)
        ) {
            result.wins++;
        }
        if (
            (match.home === competitorId && match.scoreHome < match.scoreAway) ||
            (match.away === competitorId && match.scoreHome > match.scoreAway)
        ) {
            result.losses++;
        }
    })

    result.matchesPlayed = matchesPlayed

    return result
}))

standings = sortTable(standings, stage.tiebreakers)

// Build the table html
var html = "<table>"
// Build the table header
html += "<tr>"
columns.forEach(column => {
    html += `<th class="${column.name}">${column.name}</th>`
})
html +="</tr>"
// Fill the table
html += "<tr>"
standings.forEach((team, positionIndex) => {
    const qualifyingObject = stage.qualifications.find(obj => obj.placements.includes(positionIndex + 1))
    if (qualifyingObject) {
        html += `<tr style="background-color:${qualifyingObject.color};">`
    } else {
        html += "<tr>"
    }
    columns.forEach(column => {
        var stat;
        if (column.data.includes("custom:")) {
            stat = team.custom[column.data.replace("custom:", "")]
        } else if (column.data === "name") {
            if (stage.table.showFlags) {
                stat = `<span class="icon"><img class="flag-icon" src="../flags/${team.country}.png"></span>`
            } else if (stage.table.showIcons) {
                stat = `<span class="icon"><img src="../icons/${team.name}.png"></span>`
            }
            stat += `<span class="name" >${team.name}</span>`
            stat = `<span class="competitor-table-name">${stat}</span>`
        } else {
            stat = team[column.data]
        }
        html += `<td>${stat}</td>`
    })
    html += "</tr>"
})

// Finish the table html
html += "</table>"

// display the table
document.getElementById("sportsTable").innerHTML = html