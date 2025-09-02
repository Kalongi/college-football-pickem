import type { SelectGamesListGame, Team } from '@/types/game';

export function parseFormattedSpread(formattedSpread: string, dbTeams: Team[]): { spreadTeamId: string, spread: number } | null {
  // Try to parse formattedSpread, e.g. "Alabama -7.5"
  const match = formattedSpread.match(/^(.*?) ([+-]?[0-9]*\.?[0-9]+)/);
  if (match) {
    const spreadTeamName = match[1].trim().toLowerCase();
    const spreadValue = parseFloat(match[2]);
    const spreadTeam = dbTeams.find(t => t.name.trim().toLowerCase() === spreadTeamName);
    if (spreadTeam) {
      return { spreadTeamId: spreadTeam.id, spread: spreadValue };
    }
  }
  return null;
}

export function findTeamIdByName(name: string, dbTeams: Team[]): string {
  const team = dbTeams.find(t => t.name.trim().toLowerCase() === name.trim().toLowerCase());
  return team ? team.id : '';
}

export function isGameInDb(apiGame: any, dbGames: any[], homeTeamId: string, awayTeamId: string, weekId: string): { inDb: boolean, dbGameId?: string } {
  const match = dbGames.find(g =>
    g.homeTeamId === homeTeamId &&
    g.awayTeamId === awayTeamId &&
    g.weekId === weekId
  );
  return match ? { inDb: true, dbGameId: match.id } : { inDb: false };
}

export function filterAndEnrichGames({
  apiGames,
  dbTeams,
  dbConfs,
  linesData,
  rankingsData,
  dbGames
}: {
  apiGames: any[];
  dbTeams: Team[];
  dbConfs: any[];
  linesData: any[];
  rankingsData: any[];
  dbGames: any[];
}): SelectGamesListGame[] {
  // Build lookup maps
  const dbTeamMap = new Map<string, any>();
  const confMap = Object.fromEntries(dbConfs.map((c: any) => [c.id, c]));
  dbTeams.forEach((team: any) => {
    if (team.name) {
      dbTeamMap.set(team.name.trim().toLowerCase(), {
        ...team,
        conference: confMap[team.conferenceId],
      });
    }
  });
  const linesMap = new Map();
  for (const line of linesData) {
    if (line.id && Array.isArray(line.lines) && line.lines.length > 0) {
      linesMap.set(line.id, line.lines[0]);
    }
  }
  // Build Top 25 set
  const top25Schools = new Set<string>();
  const polls = rankingsData[0]?.polls;
  const apPoll = polls?.find((p: any) => p.poll === "AP Top 25");
  if (apPoll && apPoll.ranks) {
    for (const rank of apPoll.ranks) {
      if (rank.school) top25Schools.add(rank.school.trim().toLowerCase());
    }
  }
  // Filter and enrich
  return apiGames
    .map((game: any) => {
      const homeName = game.homeTeam?.trim().toLowerCase();
      const awayName = game.awayTeam?.trim().toLowerCase();
      const homeDb = dbTeamMap.get(homeName);
      const awayDb = dbTeamMap.get(awayName);
      if (!homeDb || !awayDb) return null;
      // Apply original filter
      const isTop25 = top25Schools.has(homeName) || top25Schools.has(awayName);
      const isSEC = homeDb.conference?.name === "SEC" || awayDb.conference?.name === "SEC";
      const isUAB = homeDb.name === "UAB" || awayDb.name === "UAB";
      if (!(isTop25 || isSEC || isUAB)) return null;
      const line = linesMap.get(game.id);
      let spread = null;
      if (line && line.formattedSpread) {
        const match = line.formattedSpread.match(/^(.*?) ([+-]?[0-9]*\.?[0-9]+)/);
        if (match) {
          const spreadTeamName = match[1].trim().toLowerCase();
          const spreadValue = parseFloat(match[2]);
          const spreadTeamDb = dbTeamMap.get(spreadTeamName);
          if (spreadTeamDb) {
            spread = {
              value: spreadValue,
              team: {
                id: spreadTeamDb.id,
                name: spreadTeamDb.name,
                imageUrl: spreadTeamDb.imageUrl || undefined,
              },
              formatted: line.formattedSpread,
            };
          }
        }
      }
      // Check if this game is in the DB
      const weekId = game.season || game.weekId || '';
      const { inDb, dbGameId } = isGameInDb(game, dbGames, homeDb.id, awayDb.id, weekId);
      return {
        id: game.id,
        homeTeam: {
          id: homeDb.id,
          name: homeDb.name,
          ...(homeDb.imageUrl ? { imageUrl: homeDb.imageUrl } : {}),
        },
        awayTeam: {
          id: awayDb.id,
          name: awayDb.name,
          ...(awayDb.imageUrl ? { imageUrl: awayDb.imageUrl } : {}),
        },
        startDate: game.startDate,
        spread,
        inDb,
        dbGameId,
      };
    })
    .filter(g => g !== null) as SelectGamesListGame[];
}
