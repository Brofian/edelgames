import ModuleGame from '../../framework/modules/ModuleGame';
import PlayerManager from "./PlayerManager";
import Vector from "../../framework/structures/Vector";
import ClientConnector from "./ClientConnector";
import {EventDataObject} from "@edelgames/types/src/app/ApiTypes";
import GameStateContainer from "./GameStateContainer";

/*
 * The actual game instance, that controls and manages the game
 */
export default class CurveFeverGame extends ModuleGame {

	tick: number = 0;

	gameState: GameStateContainer = new GameStateContainer();
	players: PlayerManager = new PlayerManager(this.gameState);
	clientConnector: ClientConnector;

	onGameInitialize(): void {
		this.clientConnector = new ClientConnector(this.players, this.gameState, this.api);
		this.api.getUtilApi().getTimer().startInterval('tick', this.onTick.bind(this), 50);

		for (const player of this.api.getPlayerApi().getRoomMembers()) {
			this.players.createPlayerData(
				player.getId(),
				Vector.create(0,0),
				this.gameState.getArenaSize()
			);
		}
	}

	onGameStopped(eventData: EventDataObject | null) {
		super.onGameStopped(eventData);
		this.api.getUtilApi().getTimer().stopInterval('tick');
	}

	onTick(): void {
		this.tick++;
		this.gameState.decreaseStartingTicks();


		this.players.calculateStep(this.tick);

		this.clientConnector.sendPlayerPositions();
		this.clientConnector.sendCreatedLines();
		if (this.gameState.getStartingTicks() > 0) {
			this.clientConnector.sendGeneralGameState();
		}
	}

	onPlayerJoin(eventData: EventDataObject | null) {
		super.onPlayerJoin(eventData);
		this.clientConnector.sendGeneralGameState();
	}

	onPlayerReconnect(eventData: EventDataObject | null) {
		super.onPlayerReconnect(eventData);
		this.clientConnector.sendGeneralGameState();
	}


}