import ModuleGame from '../../framework/modules/ModuleGame';
import {
	MazeLayoutChangedEventData,
	PlayerInputChangedEventData,
	PlayerPositionsChangedEventData,
} from '@edelgames/types/src/modules/darkVoice/dVEvents';
import { MazeGrid } from '@edelgames/types/src/modules/darkVoice/dVTypes';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import MazeGenerator from './helper/MazeGenerator';
import MotionHelper from './helper/MotionHelper';
import Line from '../../framework/math/Geometry/Line';

/*
 * The actual game instance, that controls and manages the game
 */
export default class DarkVoiceGame extends ModuleGame {
	private maze: MazeGrid;
	private mazeBorderList: Line[];
	private playerSpeed = 0.15;
	private playerSize = 0.3;

	private motionHelper: MotionHelper;

	onGameInitialize(): void {
		const sWidth = 10;
		const sHeight = 10;

		this.maze = MazeGenerator.generate(sWidth, sHeight, 40);
		this.mazeBorderList = MazeGenerator.generateMazeBorderListFromMaze(
			this.maze
		);
		this.motionHelper = new MotionHelper(
			sWidth,
			sHeight,
			this.api.getPlayerApi().getRoomMembers(),
			this.playerSize,
			this.playerSpeed
		);

		this.sendMazeUpdate();
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
		this.api
			.getEventApi()
			.addEventHandler(
				'mazeLayoutRequest',
				this.onMazeLayoutRequested.bind(this)
			);
	}

	sendGameStatePeriodically(): void {
		this.motionHelper.updatePlayerPositionsFromInputs(this.mazeBorderList);
		this.sendPlayerPositions();
		//this.sendMazeUpdate();
	}

	sendPlayerPositions(): void {
		this.api.getEventApi().sendRoomMessage('playerPositionsChanged', {
			positions: this.motionHelper.getPlayerPositions(),
		} as PlayerPositionsChangedEventData);
	}

	sendMazeUpdate(): void {
		this.api.getEventApi().sendRoomMessage('mazeLayoutChanged', {
			maze: this.maze,
		} as MazeLayoutChangedEventData);
	}

	onMazeLayoutRequested(eventData: EventDataObject): void {
		this.api
			.getEventApi()
			.sendPlayerMessage(eventData.senderId, 'mazeLayoutChanged', {
				maze: this.maze,
			} as MazeLayoutChangedEventData);
	}

	onPlayerInputChanged(eventData: EventDataObject): void {
		const event = eventData as PlayerInputChangedEventData;
		this.motionHelper.onPlayerInputChanged(
			event.key,
			event.state,
			event.senderId
		);
	}
}
