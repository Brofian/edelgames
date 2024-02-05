import Vector from "../../framework/structures/Vector";
import {UpgradeTypes} from "@edelgames/types/src/modules/curveFever/CFEvents";

export type Upgrade = {
    type: UpgradeTypes,
    position: Vector
}

export default class GameStateContainer {

    private arenaSize: Vector = Vector.create(600, 600);
    private startingTicks: number = 120;
    private activeUpgrades: Upgrade[] = [];
    public activeUpgradesHaveChanged: boolean = false;

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

    getActiveUpgrades(): Upgrade[] {
        return this.activeUpgrades;
    }

    setUpgradeAsPickedUp(upgrade: Upgrade): void {
        this.activeUpgrades.splice(this.activeUpgrades.indexOf(upgrade), 1);
        this.activeUpgradesHaveChanged = true;
    }

    attemptCreatingUpgrade(): void {
        if (this.activeUpgrades.length < 3 && Math.random() < 0.05) {
            const availableUpgrades: UpgradeTypes[] = ['invisible','thicken','thin'];
            this.activeUpgrades.push({
                type: availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)],
                position: Vector.create(
                    10 + (this.arenaSize.x - 20) * Math.random(),
                    10 + (this.arenaSize.y - 20) * Math.random()
                )
            });
            this.activeUpgradesHaveChanged = true;
        }
    }

}