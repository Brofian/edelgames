import {VectorObj} from "../../../framework/structures/Vector";
import {CFLine, UpgradeObj} from "@edelgames/types/src/modules/curveFever/CFEvents";

export type PlayerData = {
    playerId: string;
    position: VectorObj;
    previousPosition: VectorObj;
    rotation: number;
    previousRotation: number;
};

type PlayerDataStorage = {[key: string]: PlayerData};

export default class GameStateManager {

    public startingTicks: number = 0;
    public arenaSize: VectorObj = {x: 0, y: 0};
    public activeUpgrades: UpgradeObj[] = [];

    private registeredPlayerIds: string[] = [];
    private playerData: PlayerDataStorage = {};

    private lineBuffer: CFLine[] = [];

    getPlayerData(playerId: string): PlayerData|undefined {
        return (playerId in this.playerData) ? this.playerData[playerId] : undefined;
    }

    addPlayerData(playerId: string, data: PlayerData): void {
        this.registeredPlayerIds.push(playerId);
        this.playerData[playerId] = data;
    }

    getRegisteredPlayerIds(): string[] {
        return this.registeredPlayerIds;
    }

    setLineBuffer(buffer: CFLine[]): void {
        this.lineBuffer = buffer;
    }

    getLineBuffer(): CFLine[] {
        const buffer = [...this.lineBuffer];
        this.lineBuffer.length = 0;
        return buffer;
    }

}