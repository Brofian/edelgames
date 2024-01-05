import ModuleGame from '../../framework/modules/ModuleGame';
import PlayerManager from "./PlayerManager";
import Vector from "../../framework/structures/Vector";
import ClientConnector from "./ClientConnector";
import {EventDataObject} from "@edelgames/types/src/app/ApiTypes";

/*
 * The actual game instance, that controls and manages the game
 */
export default class CurveFeverGame extends ModuleGame {

	width: number = 600;
	height: number = 400;

	players: PlayerManager = new PlayerManager();
	clientConnector: ClientConnector;

	onGameInitialize(): void {
		this.clientConnector = new ClientConnector(this.players, this.api);
		this.api.getUtilApi().getTimer().startInterval('tick', this.onTick.bind(this), 50);


		const fieldMinPosition = Vector.create(0,0);
		const fieldMaxPosition = Vector.create(this.width,this.height);

		for (const player of this.api.getPlayerApi().getRoomMembers()) {
			this.players.createPlayerData(
				player.getId(),
				fieldMinPosition,
				fieldMaxPosition
			);
		}
	}

	onGameStopped(eventData: EventDataObject | null) {
		super.onGameStopped(eventData);
		this.api.getUtilApi().getTimer().stopInterval('tick');
	}

	onTick(): void {
		// TODO do calculations
		this.players.calculateStep();

		// TODO send client updates
		this.clientConnector.updateClients();
	}


}