import { ControlKey, MazeGrid, PlayerPosition } from './dVTypes';
import { EventDataObject } from '../../app/ApiTypes';

export interface PlayerInputChangedEventData extends EventDataObject {
	key: ControlKey;
	state: boolean;
}

export interface MazeLayoutChangedEventData extends EventDataObject {
	maze: MazeGrid;
}

export interface PlayerPositionsChangedEventData extends EventDataObject {
	positions: PlayerPosition[];
}

export interface GameStateUpdateEventData extends EventDataObject {
	monsterPlayerId: string;
	scores: {
		[playerId: string]: number;
	};
}
