export interface Team {
  id: string;
  name: string;
  imageUrl?: string;
  conferenceId?: string;
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  weekId: string;
  spreadTeamId: string;
  spread: number;
  winningTeamId?: string;
  startDate: string;
}

export interface SelectGamesListGame {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  startDate: string;
  spread: {
    value: number;
    team: {
      id: string;
      name: string;
      imageUrl?: string;
    };
    formatted: string;
  } | null;
  inDb: boolean;
  dbGameId?: string;
}
