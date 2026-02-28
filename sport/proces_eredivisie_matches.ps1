$raw = Get-Content .\jsondata\eredivisie_raw.json | ConvertFrom-Json
$processed = Get-Content .\jsondata\eredivisie.json | ConvertFrom-Json

$idMap = @{
    "Fortuna Sittard" = 5
    "Go Ahead Eagles" = 6
    "NEC" = 11
    "SBV Excelsior" = 3
    "Feyenoord Rotterdam" = 4
    "NAC Breda" = 10
    "SC Heerenveen" = 8
    "FC Volendam" = 18
    "PSV" = 13
    "Sparta Rotterdam" = 14
    "PEC Zwolle" = 12
    "FC Twente '65" = 16
    "AFC Ajax" = 1
    "Telstar 1963" = 15
    "AZ" = 2
    "FC Groningen" = 7
    "FC Utrecht" = 17
    "Heracles Almelo" = 9
}
# clean out existing matchdata
$processed.stages[0].rounds = @()
for ($i = 0; $i -lt 34; $i++)
{
    $processed.stages[0].rounds += @{
        "matches" = @()
    }
}

foreach ($match in $raw.matches)
{
    $round = [int]($match.round.replace("Matchday ", ""))
    $isPlayed = Get-Member -InputObject $match.score -name "ft"

    $matchobject = @{
        "date" = "$($match.date) $($match.time)"
        "home" = [int]($idMap[$match.team1])
        "away" = [int]($idMap[$match.team2])
    }

    if ($isPlayed)
    {
        $matchobject.scoreHome = $match.score.ft[0]
        $matchobject.scoreAway = $match.score.ft[1]
        $matchobject.finished = $true
        $processed.stages[0].rounds[$round - 1].matches += $matchobject
    } else {
        $matchobject.scoreHome = 0
        $matchobject.scoreAway = 0
        $matchobject.finished = $false
        $processed.stages[0].rounds[$round - 1].matches += $matchobject
    }
}

$json = $processed | ConvertTo-Json -depth 8
Set-Content -path .\jsondata\eredivisie.json -Value $json
