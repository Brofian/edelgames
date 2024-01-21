export enum drawingModes {
	DRAW = 'draw',
	ERASE = 'erase',
	FILL = 'fill',
	CLEAR = 'clear',
}

export enum eventTypes {
	POINT = 'point',
	LINE = 'line',
	FILL = 'fill',
	CLEAR = 'clear',
}

export type canvasChangedEvent = {
	type: eventTypes;
	mode: drawingModes;
	weight: number;
	color: string;
	x: number;
	y: number;
	px: number | undefined;
	py: number | undefined;
};