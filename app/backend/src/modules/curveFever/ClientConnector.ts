import PlayerManager from "./PlayerManager";
import ModuleApi from "../../framework/modules/ModuleApi";


const OutgoingEventNames = {
    playerPositionUpdate: 'playerPositionUpdate',
    lineBufferUpdate: 'lineBufferUpdate',
}

const IncomingEventNames = {

}

export default class ClientConnector {

    private players: PlayerManager;
    private api: ModuleApi;

    constructor(players: PlayerManager, api: ModuleApi) {
        this.players = players;
        this.api = api;
    }

    updateClients(): void {
        this.sendPlayerPositions();
        this.sendCreatedLines();
    }

    private sendPlayerPositions(): void {
        this.api.getEventApi().sendRoomMessage(
            OutgoingEventNames.playerPositionUpdate,
            this.api.getPlayerApi().getRoomMembers().map((player) => {
                const playerData = this.players.getPlayerData(player.getId());
                return {
                    playerId: player.getId(),
                    position: playerData.position,
                    rotation: playerData.rotation
                };
            })
        );
    }

    private sendCreatedLines(): void {
        this.api.getEventApi().sendRoomMessage(
            OutgoingEventNames.lineBufferUpdate,
            this.players.getLineBuffer().map(line => line.toObject())
        );
    }

}