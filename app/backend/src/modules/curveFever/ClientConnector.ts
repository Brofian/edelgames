import PlayerManager from "./PlayerManager";
import ModuleApi from "../../framework/modules/ModuleApi";
import {
    CFLine,
    OnLineBufferUpdateEventData,
    OnPlayerPositionUpdateEventData
} from "@edelgames/types/src/modules/curveFever/CFEvents";


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
            {
                playerData: this.api.getPlayerApi().getRoomMembers().map((player) => {
                    const playerData = this.players.getPlayerData(player.getId());
                    return {
                        playerId: player.getId(),
                        position: playerData.position,
                        rotation: playerData.rotation
                    };
                })
            } as OnPlayerPositionUpdateEventData
        );
    }

    private sendCreatedLines(): void {
        this.api.getEventApi().sendRoomMessage(
            OutgoingEventNames.lineBufferUpdate,
            {
                lineBuffer: this.players.getLineBuffer().map(line => {
                    return {
                        thickness: line.thickness,
                        line: line.line,
                        playerId: line.playerId
                    } as CFLine;
                })
            } as OnLineBufferUpdateEventData
        );
    }

}