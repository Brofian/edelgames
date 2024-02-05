import PlayerManager from "./PlayerManager";
import ModuleApi from "../../framework/modules/ModuleApi";
import {
    CFLine, GeneralGameStateEventData, OnInputChangedEventData,
    OnLineBufferUpdateEventData,
    OnPlayerPositionUpdateEventData, UpgradesChangedEventData
} from "@edelgames/types/src/modules/curveFever/CFEvents";
import {EventDataObject} from "@edelgames/types/src/app/ApiTypes";
import GameStateContainer from "./GameStateContainer";


const OutgoingEventNames = {
    playerPositionUpdate: 'playerPositionUpdate',
    lineBufferUpdate: 'lineBufferUpdate',
    gameStateUpdate: 'gameStateUpdate',
    upgradesChanged: 'upgradesChanged',
}

const IncomingEventNames = {
    inputChangedEvent: 'inputChangedEvent'
}

export default class ClientConnector {

    private readonly players: PlayerManager;
    private readonly gameState: GameStateContainer;
    private readonly api: ModuleApi;

    constructor(players: PlayerManager, gameState: GameStateContainer, api: ModuleApi) {
        this.players = players;
        this.gameState = gameState;
        this.api = api;
        this.api.getEventApi().addEventHandler(IncomingEventNames.inputChangedEvent, this.onPlayerInputChangedEvent.bind(this));
    }

    sendUpgradeChanged(): void {
        this.api.getEventApi().sendRoomMessage(
            OutgoingEventNames.upgradesChanged,
            {
                upgrades: this.gameState.getActiveUpgrades()
            } as UpgradesChangedEventData
        );
    }

    sendGeneralGameState(): void {
        this.api.getEventApi().sendRoomMessage(
            OutgoingEventNames.gameStateUpdate,
            {
                startingTicks: this.gameState.getStartingTicks(),
                arenaSize: this.gameState.getArenaSize().toObject()
            } as GeneralGameStateEventData
        );
    }

    sendPlayerPositions(): void {
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

    sendCreatedLines(): void {
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