import ModuleGame from '../../framework/modules/ModuleGame';
import {
	GameStateUpdateEventData,
	ItemPositionsChangedEventData,
	MazeLayoutChangedEventData,
	PlayerInputChangedEventData,
	PlayerPositionsChangedEventData,
} from '@edelgames/types/src/modules/darkVoice/dVEvents';
import {
	GameProgressState,
	MazeGrid,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import MazeGenerator from './helper/MazeGenerator';
import MotionHelper from './helper/MotionHelper';
import Line from '../../framework/math/Geometry/Line';
import PlayerHelper from './helper/PlayerHelper';
import MonsterHelper from './helper/MonsterHelper';
import ItemHelper from './helper/ItemHelper';

/*
 * The actual game instance, that controls and manages the game
 */
export default class DarkVoiceGame extends ModuleGame {
	private maze: MazeGrid;
	private mazeBorderList: Line[];
	private gameProgressState: GameProgressState = 'BEGINNING';

	private playerHelper: PlayerHelper;
	private monsterHelper: MonsterHelper;
	private itemHelper: ItemHelper;
	private motionHelper: MotionHelper;

	onGameInitialize(): void {
		const sWidth = 10;
		const sHeight = 10;
		const playerSize = 0.3;

		this.maze = MazeGenerator.generate(sWidth, sHeight, 40);
		this.mazeBorderList = MazeGenerator.generateMazeBorderListFromMaze(
			this.maze
		);

		this.playerHelper = new PlayerHelper(
			sWidth,
			sHeight,
			playerSize,
			0.15,
			0.075
		);
		this.playerHelper.initializePlayerData(
			this.api.getPlayerApi().getRoomMembers()
		);
		this.monsterHelper = new MonsterHelper(this.playerHelper, playerSize * 0.6);
		this.motionHelper = new MotionHelper(sWidth, sHeight, this.playerHelper);
		this.itemHelper = new ItemHelper(
			sWidth,
			sHeight,
			this.playerHelper,
			this.monsterHelper
		);

		this.sendMazeUpdate();
		this.sendPlayerPositions();
		this.api
			.getUtilApi()
			.getTimer()
			.startInterval('call_game_state_update', this.gameLoop.bind(this), 50);
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

	gameLoop(): void {
		this.monsterHelper.checkMonsterPlayerCollision();
		this.itemHelper.checkPlayerItemCollision();
		this.motionHelper.updatePlayerPositionsFromInputs(this.mazeBorderList);
		// send data to players
		this.sendPlayerPositions();
		this.sendGameStateUpdate();
		if (this.itemHelper.didItemsChange()) {
			this.sendItemPositions();
		}

		// todo: send changes in modifiers to the player to display them accordingly
	}

	sendPlayerPositions(): void {
		this.api.getEventApi().sendRoomMessage('playerPositionsChanged', {
			positions: this.playerHelper.getPlayerPositions(),
		} as PlayerPositionsChangedEventData);
	}

	sendItemPositions(): void {
		this.api.getEventApi().sendRoomMessage('itemPositionsChanged', {
			items: this.itemHelper.getItemList(),
		} as ItemPositionsChangedEventData);
	}

	sendMazeUpdate(): void {
		this.api.getEventApi().sendRoomMessage('mazeLayoutChanged', {
			maze: this.maze,
		} as MazeLayoutChangedEventData);
	}

	sendGameStateUpdate(): void {
		this.api.getEventApi().sendRoomMessage('gameStateUpdate', {
			monsterPlayerId: this.monsterHelper.getMonsterData().playerId,
			scores: this.playerHelper.getPlayerScores(),
			gameProgressState: this.gameProgressState,
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
