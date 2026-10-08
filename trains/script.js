import Stations from './jsondata/stations.json' with { type: 'json' }
import Runs from './jsondata/runs.json' with { type: 'json' }
import Lines from './jsondata/lines.json' with { type: 'json' }

let selectorHTML = ""
Stations
    .sort((stationA, stationB) => stationA.name > stationB.name ? 1 : -1)
    .forEach(station => {
        selectorHTML += `<option value="${station.id}">${station.name}</option>`
    })

document.getElementById("stationSelector").innerHTML = selectorHTML

// listeners
document.getElementById("stationSelector").addEventListener("change", () => {
     displayDepartures() 
})

displayDepartures()

function displayDepartures()
{
    const selectedStationId = Number(document.getElementById("stationSelector").value)
    const selectedStation = Stations.find(station => station.id = selectedStationId)

    const runsDeparting = Runs.filter(run => {
        return run.stops.findIndex(stop => Number(stop.id) === selectedStationId && stop.departure) !== -1
    })

    const now = new Date()

    const lineItems = runsDeparting.reduce((list, run) => {
        const line = Lines.find(line => line.id === run.lineId)
        const stop = run.stops.find(stop => stop.id === selectedStationId)

        const then = new Date()
        then.setHours(Number(stop.departure.split(":")[0])) 
        then.setMinutes(Number(stop.departure.split(":")[1]))

        if (now > then)
        {
            if (run.days.includes(now.getDay() + 1))
            {
                then.setDate(then.getDate() + 1)
            } else {
                return list
            }
        }

        let diff = then - now

        return [...list, {
            type: run.type,
            lineName: line.name,
            lineColour: line.colour,
            runDestination: Stations.find(station => station.id === run.stops[run.stops.length - 1].id).name,
            departure: stop.departure,
            platform: stop.platform,
            difference: diff
        }]
    }, [])

    lineItems.sort((a, b) => a.difference - b.difference)

    let newHTML = `<table class="departure">
    <tr>
        <th class="type">type</th>
        <th class="line">line</th>
        <th class="time">time</th>
        <th class="destination">Destination</th>
        <th class="platform">platform</th>
    </tr>`
    let i = 0
    while (i < 10 && i < lineItems.length)
    {
        const item = lineItems[i]
        let tdstyle = ""
        if (item.type === "Limited Express")
        {
            tdstyle = "limited"
        }
        newHTML += `<tr>
            <td class="type ${tdstyle}">${item.type}</td>
            <td class="line" style="color:${item.lineColour}">${item.lineName}</td>
            <td class="time">${item.departure}</td>
            <td class="destination">${item.runDestination}</td>
            <td class="platform">${item.platform}</td>
        </tr>`
        i++
    }
    newHTML += "</span>"
    
    document.getElementById("departures").innerHTML = newHTML
}
