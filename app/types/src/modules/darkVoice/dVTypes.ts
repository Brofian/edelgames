import { Coordinate } from '../colorChecker/CCTypes';

export type MazeTile = {
	borderTop: boolean;
	borderLeft: boolean;
};

export type MazeGrid = MazeTile[][];

export type PlayerPosition = {
	playerId: string;
	coords: Coordinate;
};

export type PlayerModifierType = 'ACCELERATION' | 'RANGE';

export type PlayerModifier = {
	type: PlayerModifierType;
	value: number;
};

export type ControlKey = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type ControlKeyMap = {
	[key in ControlKey]: boolean;
};
