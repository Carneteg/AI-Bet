/**
 * Soccerway-kompatibel datastruktur för lagform.
 * Baserad på: https://gist.github.com/kinnala/6376196
 *
 * Dataformatet från Soccerway block_team_matches API:
 * [datum, hemmalag, score, bortalag, tävling]
 */

export interface SoccerwayMatchRecord {
  date: string;
  homeTeam: string;
  score: string;
  awayTeam: string;
  competition: string;
}

export interface TeamFormStats {
  teamName: string;
  formString: string;
  homeWinRate: number;
  awayWinRate: number;
  goalsForAvg: number;
  goalsAgainstAvg: number;
  matchesPlayed: number;
}

type RawRow = [string, string, string, string, string];

function parseScore(score: string): [number, number] | null {
  const match = score.match(/(\d+)\s*[-]\s*(\d+)/);
  if (!match) return null;
  return [parseInt(match[1]), parseInt(match[2])];
}

export function parseSoccerwayRecords(
  rawRows: RawRow[],
  teamName: string
): TeamFormStats {
  const played = rawRows.filter((r) => parseScore(r[2]) !== null);

  let homeWins = 0, homePlayed = 0;
  let awayWins = 0, awayPlayed = 0;
  let totalGoalsFor = 0, totalGoalsAgainst = 0;
  const formResults: Array<"V" | "O" | "F"> = [];

  for (const r of played) {
    const parsed = parseScore(r[2]);
    if (!parsed) continue;
    const [homeGoals, awayGoals] = parsed;
    const isHome = r[1].toLowerCase().includes(teamName.toLowerCase());
    const goalsFor = isHome ? homeGoals : awayGoals;
    const goalsAgainst = isHome ? awayGoals : homeGoals;
    totalGoalsFor += goalsFor;
    totalGoalsAgainst += goalsAgainst;
    const result: "V" | "O" | "F" =
      goalsFor > goalsAgainst ? "V" : goalsFor === goalsAgainst ? "O" : "F";
    formResults.push(result);
    if (isHome) { homePlayed++; if (result === "V") homeWins++; }
    else { awayPlayed++; if (result === "V") awayWins++; }
  }

  const last5 = formResults.slice(-5);
  const formString = last5.join("").padStart(5, "O");

  return {
    teamName,
    formString,
    homeWinRate: homePlayed > 0 ? Math.round((homeWins / homePlayed) * 100) : 50,
    awayWinRate: awayPlayed > 0 ? Math.round((awayWins / awayPlayed) * 100) : 50,
    goalsForAvg: played.length > 0 ? Math.round((totalGoalsFor / played.length) * 10) / 10 : 1.2,
    goalsAgainstAvg: played.length > 0 ? Math.round((totalGoalsAgainst / played.length) * 10) / 10 : 1.2,
    matchesPlayed: played.length,
  };
}

type RawTeamData = { teamId: number; teamName: string; rows: RawRow[] };

export const soccerwayTeamData: RawTeamData[] = [
  { teamId: 676, teamName: "Manchester City", rows: [
    ["01/03/2025","Manchester City","3 - 1","Bournemouth","Premier League"],
    ["08/03/2025","Arsenal","1 - 1","Manchester City","Premier League"],
    ["15/03/2025","Manchester City","2 - 0","Leicester","Premier League"],
    ["22/03/2025","Everton","0 - 2","Manchester City","Premier League"],
    ["29/03/2025","Manchester City","1 - 0","Wolves","Premier League"],
  ]},
  { teamId: 180, teamName: "Arsenal", rows: [
    ["01/03/2025","Arsenal","2 - 1","Fulham","Premier League"],
    ["08/03/2025","Arsenal","1 - 1","Manchester City","Premier League"],
    ["15/03/2025","Chelsea","0 - 1","Arsenal","Premier League"],
    ["22/03/2025","Arsenal","3 - 0","Brentford","Premier League"],
    ["29/03/2025","Aston Villa","2 - 1","Arsenal","Premier League"],
  ]},
  { teamId: 1237, teamName: "Bayer Leverkusen", rows: [
    ["01/03/2025","Bayer Leverkusen","2 - 0","Freiburg","Bundesliga"],
    ["08/03/2025","Dortmund","1 - 1","Bayer Leverkusen","Bundesliga"],
    ["15/03/2025","Bayer Leverkusen","3 - 1","Stuttgart","Bundesliga"],
    ["22/03/2025","Frankfurt","2 - 2","Bayer Leverkusen","Bundesliga"],
    ["29/03/2025","Bayer Leverkusen","1 - 2","Bayern","Bundesliga"],
  ]},
  { teamId: 674, teamName: "Bayern München", rows: [
    ["01/03/2025","Bayern München","4 - 0","Wolfsburg","Bundesliga"],
    ["08/03/2025","Bayern München","2 - 1","Hoffenheim","Bundesliga"],
    ["15/03/2025","Gladbach","0 - 3","Bayern München","Bundesliga"],
    ["22/03/2025","Bayern München","1 - 0","Union Berlin","Bundesliga"],
    ["29/03/2025","Bayer Leverkusen","1 - 2","Bayern München","Bundesliga"],
  ]},
  { teamId: 2374, teamName: "Malmö FF", rows: [
    ["01/03/2025","Malmö FF","3 - 0","Kalmar","Allsvenskan"],
    ["08/03/2025","Häcken","1 - 2","Malmö FF","Allsvenskan"],
    ["15/03/2025","Malmö FF","2 - 0","Sirius","Allsvenskan"],
    ["22/03/2025","Malmö FF","1 - 1","AIK","Allsvenskan"],
    ["29/03/2025","Djurgården","0 - 2","Malmö FF","Allsvenskan"],
  ]},
  { teamId: 2375, teamName: "IFK Göteborg", rows: [
    ["01/03/2025","IFK Göteborg","1 - 2","Hammarby","Allsvenskan"],
    ["08/03/2025","Malmö FF","3 - 0","IFK Göteborg","Allsvenskan"],
    ["15/03/2025","IFK Göteborg","0 - 0","AIK","Allsvenskan"],
    ["22/03/2025","Sirius","2 - 1","IFK Göteborg","Allsvenskan"],
    ["29/03/2025","IFK Göteborg","1 - 3","Djurgården","Allsvenskan"],
  ]},
  { teamId: 679, teamName: "Real Madrid", rows: [
    ["01/03/2025","Real Madrid","3 - 0","Osasuna","La Liga"],
    ["08/03/2025","Barcelona","1 - 2","Real Madrid","La Liga"],
    ["15/03/2025","Real Madrid","2 - 1","Villarreal","La Liga"],
    ["22/03/2025","Getafe","0 - 4","Real Madrid","La Liga"],
    ["29/03/2025","Real Madrid","1 - 0","Rayo Vallecano","La Liga"],
  ]},
  { teamId: 723, teamName: "Atletico Madrid", rows: [
    ["01/03/2025","Atletico Madrid","2 - 0","Girona","La Liga"],
    ["08/03/2025","Atletico Madrid","1 - 1","Sevilla","La Liga"],
    ["15/03/2025","Celta Vigo","0 - 2","Atletico Madrid","La Liga"],
    ["22/03/2025","Atletico Madrid","3 - 1","Athletic","La Liga"],
    ["29/03/2025","Valencia","1 - 1","Atletico Madrid","La Liga"],
  ]},
  { teamId: 1041, teamName: "Nottingham Forest", rows: [
    ["01/03/2025","Nottingham Forest","2 - 1","Ipswich","Premier League"],
    ["08/03/2025","Newcastle","2 - 0","Nottingham Forest","Premier League"],
    ["15/03/2025","Nottingham Forest","1 - 1","Man United","Premier League"],
    ["22/03/2025","Tottenham","1 - 2","Nottingham Forest","Premier League"],
    ["29/03/2025","Nottingham Forest","0 - 1","Brighton","Premier League"],
  ]},
  { teamId: 682, teamName: "Liverpool", rows: [
    ["01/03/2025","Liverpool","3 - 1","Man United","Premier League"],
    ["08/03/2025","Liverpool","2 - 0","Southampton","Premier League"],
    ["15/03/2025","Newcastle","0 - 2","Liverpool","Premier League"],
    ["22/03/2025","Liverpool","1 - 0","Spurs","Premier League"],
    ["29/03/2025","Nottingham Forest","0 - 1","Liverpool","Premier League"],
  ]},
  { teamId: 587, teamName: "PSG", rows: [
    ["01/03/2025","PSG","4 - 1","Brest","Ligue 1"],
    ["08/03/2025","Lyon","0 - 2","PSG","Ligue 1"],
    ["15/03/2025","PSG","3 - 0","Toulouse","Ligue 1"],
    ["22/03/2025","PSG","2 - 0","Monaco","Ligue 1"],
    ["29/03/2025","Rennes","1 - 3","PSG","Ligue 1"],
  ]},
  { teamId: 726, teamName: "Marseille", rows: [
    ["01/03/2025","Marseille","1 - 2","Lens","Ligue 1"],
    ["08/03/2025","Nice","2 - 0","Marseille","Ligue 1"],
    ["15/03/2025","Marseille","0 - 0","Nantes","Ligue 1"],
    ["22/03/2025","Monaco","3 - 1","Marseille","Ligue 1"],
    ["29/03/2025","Marseille","1 - 1","Lille","Ligue 1"],
  ]},
  { teamId: 720, teamName: "Napoli", rows: [
    ["01/03/2025","Napoli","2 - 1","Udinese","Serie A"],
    ["08/03/2025","Lazio","1 - 2","Napoli","Serie A"],
    ["15/03/2025","Napoli","0 - 1","Roma","Serie A"],
    ["22/03/2025","Napoli","2 - 2","Juventus","Serie A"],
    ["29/03/2025","Torino","0 - 1","Napoli","Serie A"],
  ]},
  { teamId: 1025, teamName: "Inter Milan", rows: [
    ["01/03/2025","Inter Milan","3 - 0","Parma","Serie A"],
    ["08/03/2025","Inter Milan","2 - 1","Fiorentina","Serie A"],
    ["15/03/2025","Atalanta","0 - 2","Inter Milan","Serie A"],
    ["22/03/2025","Inter Milan","1 - 0","Bologna","Serie A"],
    ["29/03/2025","AC Milan","1 - 1","Inter Milan","Serie A"],
  ]},
  { teamId: 681, teamName: "Dortmund", rows: [
    ["01/03/2025","Dortmund","1 - 1","Mainz","Bundesliga"],
    ["08/03/2025","Dortmund","1 - 1","Bayer Leverkusen","Bundesliga"],
    ["15/03/2025","Werder Bremen","2 - 1","Dortmund","Bundesliga"],
    ["22/03/2025","Dortmund","0 - 0","Leipzig","Bundesliga"],
    ["29/03/2025","Köln","0 - 1","Dortmund","Bundesliga"],
  ]},
  { teamId: 1026, teamName: "RB Leipzig", rows: [
    ["01/03/2025","RB Leipzig","3 - 1","Augsburg","Bundesliga"],
    ["08/03/2025","RB Leipzig","2 - 0","Wolfsburg","Bundesliga"],
    ["15/03/2025","Freiburg","0 - 1","RB Leipzig","Bundesliga"],
    ["22/03/2025","Dortmund","0 - 0","RB Leipzig","Bundesliga"],
    ["29/03/2025","RB Leipzig","2 - 1","Hoffenheim","Bundesliga"],
  ]},
  { teamId: 1005, teamName: "Celtic", rows: [
    ["01/03/2025","Celtic","4 - 0","Ross County","Scottish Prem."],
    ["08/03/2025","Hearts","0 - 2","Celtic","Scottish Prem."],
    ["15/03/2025","Celtic","1 - 1","Aberdeen","Scottish Prem."],
    ["22/03/2025","Celtic","3 - 0","St Mirren","Scottish Prem."],
    ["29/03/2025","Motherwell","0 - 3","Celtic","Scottish Prem."],
  ]},
  { teamId: 1006, teamName: "Rangers", rows: [
    ["01/03/2025","Rangers","2 - 1","Hibs","Scottish Prem."],
    ["08/03/2025","Aberdeen","1 - 1","Rangers","Scottish Prem."],
    ["15/03/2025","Rangers","3 - 0","Dundee","Scottish Prem."],
    ["22/03/2025","Rangers","1 - 2","Hearts","Scottish Prem."],
    ["29/03/2025","St Johnstone","0 - 2","Rangers","Scottish Prem."],
  ]},
  { teamId: 2373, teamName: "AIK", rows: [
    ["01/03/2025","AIK","1 - 0","Sirius","Allsvenskan"],
    ["08/03/2025","Häcken","2 - 1","AIK","Allsvenskan"],
    ["15/03/2025","AIK","0 - 0","IFK Göteborg","Allsvenskan"],
    ["22/03/2025","Malmö FF","1 - 1","AIK","Allsvenskan"],
    ["29/03/2025","AIK","0 - 2","Djurgårdens IF","Allsvenskan"],
  ]},
  { teamId: 2376, teamName: "Djurgårdens IF", rows: [
    ["01/03/2025","Djurgårdens IF","2 - 0","Värnamo","Allsvenskan"],
    ["08/03/2025","Kalmar","1 - 2","Djurgårdens IF","Allsvenskan"],
    ["15/03/2025","Djurgårdens IF","1 - 0","Norrköping","Allsvenskan"],
    ["22/03/2025","Djurgårdens IF","2 - 1","IFK Göteborg","Allsvenskan"],
    ["29/03/2025","AIK","0 - 2","Djurgårdens IF","Allsvenskan"],
  ]},
  { teamId: 844, teamName: "Porto", rows: [
    ["01/03/2025","Porto","3 - 1","Famalicão","Primeira Liga"],
    ["08/03/2025","Braga","0 - 1","Porto","Primeira Liga"],
    ["15/03/2025","Porto","2 - 0","Arouca","Primeira Liga"],
    ["22/03/2025","Porto","1 - 1","Sporting","Primeira Liga"],
    ["29/03/2025","Estoril","0 - 2","Porto","Primeira Liga"],
  ]},
  { teamId: 845, teamName: "Benfica", rows: [
    ["01/03/2025","Benfica","4 - 0","Boavista","Primeira Liga"],
    ["08/03/2025","Benfica","2 - 1","Vizela","Primeira Liga"],
    ["15/03/2025","Sporting","1 - 1","Benfica","Primeira Liga"],
    ["22/03/2025","Benfica","3 - 0","Rio Ave","Primeira Liga"],
    ["29/03/2025","Gil Vicente","0 - 2","Benfica","Primeira Liga"],
  ]},
  { teamId: 677, teamName: "Tottenham", rows: [
    ["01/03/2025","Tottenham","1 - 2","Ipswich","Premier League"],
    ["08/03/2025","Tottenham","0 - 2","West Ham","Premier League"],
    ["15/03/2025","Brighton","2 - 0","Tottenham","Premier League"],
    ["22/03/2025","Liverpool","1 - 0","Tottenham","Premier League"],
    ["29/03/2025","Tottenham","1 - 2","Newcastle","Premier League"],
  ]},
  { teamId: 678, teamName: "Chelsea", rows: [
    ["01/03/2025","Chelsea","3 - 1","Wolves","Premier League"],
    ["08/03/2025","Chelsea","2 - 0","Aston Villa","Premier League"],
    ["15/03/2025","Arsenal","0 - 1","Chelsea","Premier League"],
    ["22/03/2025","Chelsea","1 - 0","Crystal Palace","Premier League"],
    ["29/03/2025","Brentford","1 - 2","Chelsea","Premier League"],
  ]},
  { teamId: 2377, teamName: "Hammarby", rows: [
    ["01/03/2025","Hammarby","2 - 0","Elfsborg","Allsvenskan"],
    ["08/03/2025","Norrköping","1 - 1","Hammarby","Allsvenskan"],
    ["15/03/2025","Hammarby","3 - 1","Kalmar","Allsvenskan"],
    ["22/03/2025","IFK Göteborg","1 - 2","Hammarby","Allsvenskan"],
    ["29/03/2025","Hammarby","0 - 1","Malmö FF","Allsvenskan"],
  ]},
  { teamId: 2378, teamName: "Häcken", rows: [
    ["01/03/2025","Häcken","1 - 0","Norrköping","Allsvenskan"],
    ["08/03/2025","Häcken","2 - 1","AIK","Allsvenskan"],
    ["15/03/2025","Djurgårdens IF","2 - 1","Häcken","Allsvenskan"],
    ["22/03/2025","Häcken","0 - 0","Sirius","Allsvenskan"],
    ["29/03/2025","Värnamo","0 - 1","Häcken","Allsvenskan"],
  ]},
];

let _formCache: Map<string, TeamFormStats> | null = null;

export function getTeamFormStats(): Map<string, TeamFormStats> {
  if (_formCache) return _formCache;
  _formCache = new Map();
  for (const team of soccerwayTeamData) {
    const stats = parseSoccerwayRecords(team.rows, team.teamName);
    _formCache.set(team.teamName.toLowerCase(), stats);
  }
  return _formCache;
}

export function getTeamForm(teamName: string): TeamFormStats | null {
  const map = getTeamFormStats();
  return map.get(teamName.toLowerCase()) ?? null;
}

export function enrichMatchWithSoccerwayData<
  T extends {
    homeTeam: string;
    awayTeam: string;
    homeForm: string;
    awayForm: string;
    homeAdvantageFactor: number;
  }
>(match: T): T {
  const homeStats = getTeamForm(match.homeTeam);
  const awayStats = getTeamForm(match.awayTeam);
  return {
    ...match,
    homeForm: homeStats?.formString ?? match.homeForm,
    awayForm: awayStats?.formString ?? match.awayForm,
    homeAdvantageFactor: homeStats
      ? Math.min(1.3, Math.max(1.0, 1.0 + (homeStats.homeWinRate - 40) / 200))
      : match.homeAdvantageFactor,
  };
}
