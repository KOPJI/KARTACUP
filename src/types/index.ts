export interface Team {
  id: string;
  name: string;
  group: string;
  players: Player[];
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  teamId: string;
  goals: number;
  yellowCards: number;
  redCards: number;
  isBanned: boolean;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  time: string;
  venue: string;
  group: string;
  status: 'scheduled' | 'completed';
  scorers: GoalScorer[];
  cards: Card[];
}

export interface GoalScorer {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  minute: number;
}

export interface Card {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  type: 'yellow' | 'red';
  minute: number;
}

export interface Group {
  name: string;
  teams: string[];
}
