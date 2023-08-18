import { Coordinate } from '../colorChecker/CCTypes';

export type MazeTile = {
	borderTop: boolean;
	borderLeft: boolean;
};

export type MazeGrid = MazeTile[][];

export type PlayerPosition = {
	playerId: string;
	coords: Coordinate;
	teleport?: boolean;
};

// draws the maze in another color, based on how near the best player is to winning the game
export type GameProgressState = 'BEGINNING' | 'MIDDLE' | 'ENDGAME';

export type PlayerModifierType = 'ACCELERATION' | 'RANGE' | 'MONSTERBOOST';

export type PlayerModifier = {
	type: PlayerModifierType;
	value: number;
	timer?: number;
};

export type ControlKey = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type ControlKeyMap = {
	[key in ControlKey]: boolean;
};

export type PlayerScore = {
	playerId: string;
	score: number;
};

export type ItemObject = {
	identifier: string;
	position: Coordinate;
};
