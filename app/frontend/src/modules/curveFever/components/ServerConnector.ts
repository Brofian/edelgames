import ModuleApi from "../../../framework/modules/ModuleApi";
import {EventDataObject} from "@edelgames/types/src/app/ApiTypes";
import {
    GeneralGameStateEventData,
    InputData, OnInputChangedEventData,
    OnLineBufferUpdateEventData,
    OnPlayerPositionUpdateEventData, UpgradesChangedEventData
} from "@edelgames/types/src/modules/curveFever/CFEvents";
import GameStateManager from "./GameStateManager";

const OutgoingEventNames = {
    inputChangedEvent: 'inputChangedEvent'
}

export const IncomingEventNames = {
    playerPositionUpdate: 'playerPositionUpdate',
    lineBufferUpdate: 'lineBufferUpdate',
    gameStateUpdate: 'gameStateUpdate',
    upgradesChanged: 'upgradesChanged',
}

export default class ServerConnector {

    private api: ModuleApi;
    private gameState: GameStateManager;

    constructor(gameState: GameStateManager, api: ModuleApi) {
        this.gameState = gameState;
        this.api = api;
        api.getEventApi().addEventHandler(IncomingEventNames.playerPositionUpdate, this.onPlayerPositionUpdate.bind(this));
        api.getEventApi().addEventHandler(IncomingEventNames.lineBufferUpdate, this.onLineBufferUpdate.bind(this));
        api.getEventApi().addEventHandler(IncomingEventNames.gameStateUpdate, this.onGameStateUpdate.bind(this));
        api.getEventApi().addEventHandler(IncomingEventNames.upgradesChanged, this.onUpdatesChanged.bind(this));
    }

    onUpdatesChanged(eventData: EventDataObject): void {
        const {upgrades} = eventData as UpgradesChangedEventData;
        this.gameState.activeUpgrades = upgrades;
        console.log(upgrades);
    }

    onGameStateUpdate(eventData: EventDataObject): void {
        const {startingTicks, arenaSize} = eventData as GeneralGameStateEventData;
        this.gameState.startingTicks = startingTicks;
        this.gameState.arenaSize = arenaSize;
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
        const {lineBuffer} = eventData as OnLineBufferUpdateEventData;

        this.gameState.setLineBuffer(lineBuffer);
    }

    sendInputChangeEvent(inputs: InputData): void {
        this.api.getEventApi().sendMessageToServer(
            OutgoingEventNames.inputChangedEvent,
            {
                inputs: inputs
            } as OnInputChangedEventData
        );
    }

}