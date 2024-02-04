export type VectorObj = {x: number, y: number};
export type LineObj = {
	start: VectorObj,
	end: VectorObj,
}

export type OnPlayerPositionUpdateEventData = {
	playerData: {
		playerId: string;
		position: VectorObj
		rotation: number
	}[]
};

export type CFLine = {
	thickness: number;
	line: LineObj;
	color: number;
};

export type OnLineBufferUpdateEventData = {
	lineBuffer: CFLine[]
};

export type InputData = {
	left: boolean;
	right: boolean;
	up: boolean;
	down: boolean;
}

export type OnInputChangedEventData = {
	inputs: InputData
};

export type GeneralGameStateEventData = {
	startingTicks: number,
	arenaSize: VectorObj
}