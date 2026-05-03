export enum GameType {
  FREE_FIRE = 'free_fire',
  PUBG = 'pubg'
}

export interface Tournament {
  id: string;
  name: string;
  gameType: GameType;
  code: string;
  createdAt: any;
  status: 'ongoing' | 'completed';
  creatorId: string;
  completedAt?: any;
  deletionEligibleAt?: any;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string;
  totalPoints: number;
  totalKills: number;
  matchesPlayed: number;
  wins?: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  totalKills: number;
}

export interface MatchResult {
  id: string;
  teamId: string;
  matchNumber: number;
  placement: number;
  kills: number;
  placementPoints: number;
  totalMatchPoints: number;
  timestamp: any;
}

export interface PlayerMatchResult {
  id: string;
  tournamentId: string;
  teamId: string;
  playerId: string;
  matchNumber: number;
  kills: number;
  timestamp: any;
}

export const SCORING = {
  [GameType.FREE_FIRE]: {
    placement: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0], // 1st to 12th
    kill: 1
  },
  [GameType.PUBG]: {
    placement: [10, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], // 1st to 16th
    kill: 1
  }
};
