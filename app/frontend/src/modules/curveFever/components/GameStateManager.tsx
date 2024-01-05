import {VectorObj} from "../../../framework/structures/Vector";
import {LineObj} from "../../../framework/structures/Line";

type PlayerData = {
    playerId: string;
    position: VectorObj;
    previousPosition: VectorObj;
    rotation: number;
    previousRotation: number;
};

type PlayerDataStorage = {[key: string]: PlayerData};

export default class GameStateManager {

    private registeredPlayerIds: string[] = [];
    private playerData: PlayerDataStorage = {};

    private lineBuffer: LineObj[] = [];

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

    setLineBuffer(buffer: LineObj[]): void {
        this.lineBuffer = buffer;
    }

    getLineBuffer(): LineObj[] {
        const buffer = [...this.lineBuffer];
        this.lineBuffer.length = 0;
        return buffer;
    }

}