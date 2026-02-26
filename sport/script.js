import curlingOlympicsWomen from './jsondata/curlingOlympicsWomen.json' with { type: 'json' }
import eredivisie from './jsondata/eredivisie.json' with { type: 'json' }
import { sortTable } from './sorting.js'

//const competition = curlingOlympicsWomen
const competition = eredivisie

const stage = competition.stages[0]
const columns = [
    {
        data: "name",
        name: "Team",
        compactName: "Team"
    },
    ...stage.table.columns
]

// Determine the current standings
var standings = competition.competitors.map(((competitor) => {
    const result = {
        ...competitor,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        scoreFor: 0,
        scoreAgainst: 0,
        scoreDifference: 0,
        points: 0,
        resultsBetweenTied: "0 - 0"
    }

    const matchesPlayed = stage.rounds.reduce((list, round) => {
        const roundMatches = round.matches.filter(match => match.finished && (match.home === competitor.id || match.away === competitor.id))

        return [...list, ...roundMatches]
    }, [])
    const matchesLeft = stage.rounds.reduce((list, round) => {
        const roundMatches = round.matches.filter(match => !match.finished && (match.home === competitor.id || match.away === competitor.id))

        return [...list, ...roundMatches]
    }, [])

    matchesPlayed.forEach(match => {
        result.played++;
        if (
            (match.home === competitor.id && match.scoreHome > match.scoreAway) ||
            (match.away === competitor.id && match.scoreHome < match.scoreAway)
        ) {
            result.wins++;
            result.points += stage?.pointsOnWin ?? 2
        }
        if ((match.home === competitor.id || match.away === competitor.id) && match.scoreHome === match.scoreAway) {
            result.draws++;
            result.points += stage?.pointsOnDraw ?? 1
        }
        if (
            (match.home === competitor.id && match.scoreHome < match.scoreAway) ||
            (match.away === competitor.id && match.scoreHome > match.scoreAway)
        ) {
            result.losses++;
        }
        if (match.home === competitor.id) {
            result.scoreFor += match.scoreHome
            result.scoreAgainst += match.scoreAway
        }
        if (match.away === competitor.id) {
            result.scoreFor += match.scoreAway
            result.scoreAgainst += match.scoreHome
        }
    })
    result.scoreDifference = result.scoreFor - result.scoreAgainst
    result.matchesPlayed = matchesPlayed
    result.matchesLeft = matchesLeft

    return result
}))
standings = sortTable(standings, stage.tiebreakers)

const positionQualifications = {}
for (var i = 1; i <= competition.competitors.length; i++)
{
    positionQualifications[i] = null
}
stage.qualifications.forEach(qualification => {
    qualification.placements.forEach(postition => positionQualifications[postition] = qualification)
})

// Simple check for qualifications (doing more than this on runtime would be insane for larger sets with more games left to play)
standings.forEach(team => {
    const tempListMax = standings.map(team => { return { ...team } })
    const tempListMin = standings.map(team => { return { ...team } })
    const index = tempListMax.findIndex(item => item.id === team.id)

    tempListMax[index].wins += tempListMax[index].matchesLeft.length
    const maxPos = sortTable(tempListMax, stage.tiebreakers).findIndex(item => item.id === team.id) + 1

    tempListMin.forEach(item => {
        if (item.id === team.id) {return}
        item.wins += item.matchesLeft.length
    })

    const minPos = sortTable(tempListMin, stage.tiebreakers).findIndex(item => item.id === team.id) + 1
    if (minPos < maxPos) { return }

    const positions = []
    for (var i = maxPos; i <= minPos; i++)
    {
        positions.push({ position: i, qualifiedStage: positionQualifications[i] })
    }
    // In the case there is a possible position which qualifies to noting we return
    if (~positions.findIndex(position => !position.qualifiedStage)) { return }
    if (positions[0].qualifiedStage.shorthand === positions[positions.length - 1].qualifiedStage.shorthand) 
    {
        team.qualification = positions[0].qualifiedStage
        team.qualificationIsChangeable = false
        return
    }
    var certainQualification = true
    var isPositive = null;
    positions.forEach(position => {
        if (!position.qualifiedStage) { return }
        if (isPositive === null) { isPositive = position.qualifiedStage.isPositive }

        if (isPositive !== position.qualifiedStage.isPositive) { certainQualification = false }
    })

    if (certainQualification)
    {
        team.qualificationIsChangeable = true
        if (isPositive) 
        {
            team.qualification = positions[positions.length - 1].qualifiedStage
        } else {
            team.qualification = positions[0].qualifiedStage
        }
    }
})


// Build the table html
var html = "<table>"
// Build the table header
html += "<tr>"
columns.forEach(column => {
    html += `<th class="${column.name}">${column.name}</th>`
})
html +="</tr>"
// Fill the table
//html += "<tr>"
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
                stat = `<span class="icon"><img class="flag-icon" src="../flags/${team.country.toLowerCase()}.png"></span>`
            } else if (stage.table.showIcons) {
                stat = `<span class="icon"><img src="../icons/${team.name.toLowerCase()}.png"></span>`
            } else {
                stat = ""
            }
            stat += `<span class="name" >${team.name}</span>`
            if (team.qualification) 
            {
                stat += `<span class="qualification"><span class="pill" style="background-color:${team.qualification.color}; border-style:${team.qualificationIsChangeable ? "dotted" : "solid"}">${team.qualification.shorthand}</span></span>`
            } else { stat += `<span class="qualification"></span>` }
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