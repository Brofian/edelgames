import PlayerManager from "./PlayerManager";
import ModuleApi from "../../framework/modules/ModuleApi";
import {
    CFLine, OnInputChangedEventData,
    OnLineBufferUpdateEventData,
    OnPlayerPositionUpdateEventData
} from "@edelgames/types/src/modules/curveFever/CFEvents";
import {EventDataObject} from "@edelgames/types/src/app/ApiTypes";


const OutgoingEventNames = {
    playerPositionUpdate: 'playerPositionUpdate',
    lineBufferUpdate: 'lineBufferUpdate',
}

const IncomingEventNames = {
    inputChangedEvent: 'inputChangedEvent'
}

export default class ClientConnector {

    private players: PlayerManager;
    private api: ModuleApi;

    constructor(players: PlayerManager, api: ModuleApi) {
        this.players = players;
        this.api = api;
        this.api.getEventApi().addEventHandler(IncomingEventNames.inputChangedEvent, this.onPlayerInputChangedEvent.bind(this));
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
        const lineBuffer = this.players.getLineBuffer();
        if (lineBuffer.length === 0) {
            return;
        }

        this.api.getEventApi().sendRoomMessage(
            OutgoingEventNames.lineBufferUpdate,
            {
                lineBuffer: lineBuffer.map(line => {
                    return {
                        thickness: line.thickness,
                        line: line.line,
                        color: line.color
                    } as CFLine;
                })
            } as OnLineBufferUpdateEventData
        );
    }

    private onPlayerInputChangedEvent(eventData: EventDataObject): void {
        const {inputs} = eventData as OnInputChangedEventData;

        const playerData = this.players.getPlayerData(eventData.senderId);
        if (playerData) {
            playerData.inputs = inputs;
        }
    }

}