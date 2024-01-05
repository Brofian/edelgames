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

export type OnLineBufferUpdateEventData = {
	lineBuffer: LineObj[]
};