import ModuleApi from "../../../framework/modules/ModuleApi";
import {EventDataObject} from "@edelgames/types/src/app/ApiTypes";
import {
    OnLineBufferUpdateEventData,
    OnPlayerPositionUpdateEventData
} from "@edelgames/types/src/modules/curveFever/CFEvents";
import GameStateManager from "./GameStateManager";

const OutgoingEventNames = {

}

const IncomingEventNames = {
    playerPositionUpdate: 'playerPositionUpdate',
    lineBufferUpdate: 'lineBufferUpdate',
}

export default class ServerConnector {

    private api: ModuleApi;
    private gameState: GameStateManager;

    constructor(gameState: GameStateManager, api: ModuleApi) {
        this.gameState = gameState;
        this.api = api;
        api.getEventApi().addEventHandler(IncomingEventNames.playerPositionUpdate, this.onPlayerPositionUpdate.bind(this));
        api.getEventApi().addEventHandler(IncomingEventNames.lineBufferUpdate, this.onLineBufferUpdate.bind(this));
    }

    onPlayerPositionUpdate(eventData: EventDataObject): void {
        const playersPositionData = eventData as OnPlayerPositionUpdateEventData;

        for (const newPlayerData of playersPositionData.playerData) {
            const data = this.gameState.getPlayerData(newPlayerData.playerId);
            if (data) {
                data.previousPosition = data.position;
                data.previousRotation = data.rotation;
                data.position = newPlayerData.position;
                data.rotation = newPlayerData.rotation;
            }
            else {
                this.gameState.addPlayerData(newPlayerData.playerId, {
                    playerId: newPlayerData.playerId,
                    position: newPlayerData.position,
                    previousPosition: newPlayerData.position,
                    rotation: newPlayerData.rotation,
                    previousRotation: newPlayerData.rotation,
                })
            }
        }
    }

    onLineBufferUpdate(eventData: EventDataObject): void {
        const lineBufferData = eventData as OnLineBufferUpdateEventData;

        this.gameState.setLineBuffer(lineBufferData.lineBuffer);
    }



}