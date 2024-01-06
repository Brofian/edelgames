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
	playerId: string;
};

export type OnLineBufferUpdateEventData = {
	lineBuffer: CFLine[]
};