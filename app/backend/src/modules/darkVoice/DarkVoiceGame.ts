import ModuleGame from '../../framework/modules/ModuleGame';
import {
	GameStateUpdateEventData,
	MazeLayoutChangedEventData,
	PlayerInputChangedEventData,
	PlayerPositionsChangedEventData,
} from '@edelgames/types/src/modules/darkVoice/dVEvents';
import { MazeGrid } from '@edelgames/types/src/modules/darkVoice/dVTypes';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import MazeGenerator from './helper/MazeGenerator';
import MotionHelper from './helper/MotionHelper';
import Line from '../../framework/math/Geometry/Line';
import PlayerHelper from './helper/PlayerHelper';

/*
 * The actual game instance, that controls and manages the game
 */
export default class DarkVoiceGame extends ModuleGame {
	private maze: MazeGrid;
	private mazeBorderList: Line[];

	private playerHelper: PlayerHelper;
	private motionHelper: MotionHelper;

	onGameInitialize(): void {
		const sWidth = 10;
		const sHeight = 10;

		this.maze = MazeGenerator.generate(sWidth, sHeight, 40);
		this.mazeBorderList = MazeGenerator.generateMazeBorderListFromMaze(
			this.maze
		);

		this.playerHelper = new PlayerHelper(0.3, 0.15, 0.075);
		this.playerHelper.initializePlayerData(
			this.api.getPlayerApi().getRoomMembers(),
			sWidth,
			sHeight
		);

		this.motionHelper = new MotionHelper(this.playerHelper);

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
		this.sendGameStateUpdate();
	}

	sendPlayerPositions(): void {
		this.api.getEventApi().sendRoomMessage('playerPositionsChanged', {
			positions: this.playerHelper.getPlayerPositions(),
		} as PlayerPositionsChangedEventData);
	}

	sendMazeUpdate(): void {
		this.api.getEventApi().sendRoomMessage('mazeLayoutChanged', {
			maze: this.maze,
		} as MazeLayoutChangedEventData);
	}

	sendGameStateUpdate(): void {
		this.api.getEventApi().sendRoomMessage('gameStateUpdate', {
			monsterPlayerId: this.playerHelper.getMonsterPlayerId(),
			scores: {},
		} as GameStateUpdateEventData);
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
