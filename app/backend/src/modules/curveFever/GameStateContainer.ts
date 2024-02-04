import Vector from "../../framework/structures/Vector";

export default class GameStateContainer {

    private arenaSize: Vector = Vector.create(600, 400);
    private startingTicks: number = 160;

    getArenaSize(): Vector {
        return this.arenaSize;
    }

    getStartingTicks(): number {
        return this.startingTicks;
    }

    decreaseStartingTicks(): void {
        if (this.startingTicks > 0) {
            this.startingTicks--;
        }
    }

}