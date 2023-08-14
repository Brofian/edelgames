import ModuleGame from '../../framework/modules/ModuleGame';
import {
	MazeLayoutChangedEventData,
	PlayerInputChangedEventData,
	PlayerPositionsChangedEventData,
} from '@edelgames/types/src/modules/darkVoice/dVEvents';
import {
	ControlKey,
	MazeGrid,
	MazeTile,
	PlayerPosition,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';

type PlayerInputData = {
	playerId: string;
	inputs: {
		[key in ControlKey]: boolean;
	};
}[];

/*
 * The actual game instance, that controls and manages the game
 */
export default class DarkVoiceGame extends ModuleGame {
	private playerPositions: PlayerPosition[];
	private maze: MazeGrid;
	private playerInputs: PlayerInputData = [];
	private playerSpeed = 0.05;

	onGameInitialize(): void {
		this.maze = this.generateMazeGrid(15, 10);
		this.sendMazeUpdate();
		this.playerPositions = this.generatePlayerPositions(15, 10);
		this.sendPlayerPositions();
		this.api
			.getUtilApi()
			.getTimer()
			.startInterval(
				'call_game_state_update',
				this.sendGameStatePeriodically.bind(this),
				50
			);
		this.api
			.getEventApi()
			.addEventHandler(
				'playerInputChanged',
				this.onPlayerInputChanged.bind(this)
			);
	}

	generateMazeGrid(sWidth: number, sHeight: number): MazeGrid {
		const maze: MazeGrid = [];

		// todo improve this algorithm to generate a working maze
		for (let x = 0; x < sWidth; x++) {
			const mazeColumn: MazeTile[] = [];

			for (let y = 0; y < sHeight; y++) {
				mazeColumn.push({
					borderTop: Math.random() > 0.5,
					borderLeft: Math.random() > 0.5,
				});
			}
			maze.push(mazeColumn);
		}
		return maze;
	}

	generatePlayerPositions(sWidth: number, sHeight: number): PlayerPosition[] {
		// also reset player inputs
		this.playerInputs = [];

		const posList: PlayerPosition[] = [];
		for (const player of this.api.getPlayerApi().getRoomMembers()) {
			posList.push({
				playerId: player.getId(),
				coords: {
					x: Math.random() * sWidth + 0.5,
					y: Math.random() * sHeight + 0.5,
				},
			});
			// also generate default player Input
			this.playerInputs.push({
				playerId: player.getId(),
				inputs: {
					UP: false,
					DOWN: false,
					RIGHT: false,
					LEFT: false,
				},
			});
		}

		return posList;
	}

	sendGameStatePeriodically(): void {
		this.updatePlayerPositionsFromInputs();
		this.sendPlayerPositions();
		this.sendMazeUpdate();
	}

	sendPlayerPositions(): void {
		this.api.getEventApi().sendRoomMessage('playerPositionsChanged', {
			positions: this.playerPositions,
		} as PlayerPositionsChangedEventData);
	}

	sendMazeUpdate(): void {
		this.api.getEventApi().sendRoomMessage('mazeLayoutChanged', {
			maze: this.maze,
		} as MazeLayoutChangedEventData);
	}

	onPlayerInputChanged(eventData: EventDataObject): void {
		const event = eventData as PlayerInputChangedEventData;
		const playerInputs = this.playerInputs.find(
			(input) => input.playerId === event.senderId
		);
		if (playerInputs && this.isKeyValidControlKey(event.key)) {
			playerInputs.inputs[event.key] = !!event.state;
		}
	}

	isKeyValidControlKey(key: string): key is ControlKey {
		return ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(key);
	}

	updatePlayerPositionsFromInputs(): void {
		for (const pInput of this.playerInputs) {
			const posObject = this.playerPositions.find(
				(pos) => pos.playerId === pInput.playerId
			);
			if (posObject) {
				if (pInput.inputs.UP) posObject.coords.y -= this.playerSpeed;
				if (pInput.inputs.DOWN) posObject.coords.y += this.playerSpeed;
				if (pInput.inputs.LEFT) posObject.coords.x -= this.playerSpeed;
				if (pInput.inputs.RIGHT) posObject.coords.x += this.playerSpeed;
			}
		}
	}
}
