import {
	ColorGrid,
	ColorGridPublicDefinition,
	Coordinate,
	GameStates,
	GridScoreboard,
} from './CCTypes';

export const enum C2SEvents {
	ON_SELECTION_MADE = 'onSelectionMade',
	ON_JOKER_REQUESTED = 'onJokerRequested',
}

export type OnSelectionMadeEventData = {
	cells: Coordinate[];
};

export type OnJokerRequestedEventData = {
	type: 'number' | 'color';
};

export const enum S2CEvents {
	ON_GAME_STATE_UPDATE = 'onGameStateUpdate',
	ON_PLAYER_STATE_UPDATE = 'onPlayerStateUpdate',
	ON_GRID_CHANGED = 'onGridChanged',
	ON_SCORES_CALCULATED = 'onScoresCalculated',
	ON_REMAINING_PLAYERS_CHANGED = 'onRemainingPlayersChanged',
}

export type OnRemainingPlayersChangedEventData = {
	finishedPlayers: string[];
};

export type OnScoresCalculatedEventData = {
	points: GridScoreboard;
};

export type OnGameStateUpdateEventData = {
	gameState: GameStates;
	activePlayerId?: string;
	finishedPlayers: string[];
	currentDiceValues: number[];
	lastRollTimestamp: number;
	reservedDiceIndices: number[];
	reservedBonusPoints: (string | undefined)[];
	reservedColumnPoints: (string | undefined)[];
	playerGrids?: ColorGridPublicDefinition[];
};

export type OnPlayerStateUpdateEventData = {
	usingColorJoker: boolean;
	usingNumberJoker: boolean;
	remainingJokers: number;
	isPlayerWaiting: boolean;
	finishedColors: boolean[];
	finishedColumns: boolean[];
};

export type OnGridChangedEventData = {
	newGrid: ColorGrid;
};