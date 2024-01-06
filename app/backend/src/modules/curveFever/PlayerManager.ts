import Vector from "../../framework/structures/Vector";
import Line, {LineObj} from "../../framework/structures/Line";

export type InputData = {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
}

export type PlayerData = {
    position: Vector,
    velocity: Vector,
    rotation: number;
    inputs: InputData;
    dead: boolean;
    invincibilityTicks: number;
}

type GeneratedLine = {
    line: Line,
    tick: number,
    thickness: number,
    playerId: string
};

type PlayerDataStorage = {[key: string]: PlayerData};

export default class PlayerManager {

    private registeredPlayerIds: string[] = [];
    private data: PlayerDataStorage = {};

    /**
     * A collection of all drawn lines
     * @private
     */
    private generatedLines: GeneratedLine[] = [];
    /**
     * A collection of the lines that were created in this tick
     * @private
     */
    private linesBuffer: GeneratedLine[] = [];

    createPlayerData(
        playerId: string,
        minPos: Vector,
        maxPos: Vector
    ): PlayerData {
        const playerData: PlayerData = {
            position: Vector.randomBetween(minPos, maxPos),
            rotation: Math.random() * Math.PI * 2,
            velocity: Vector.create(0,0),
            inputs: {
              right: false,
              left: false,
              up: false,
              down: false,
            },
            dead: false,
            invincibilityTicks: 20
        };
        this.data[playerId] = playerData;
        this.registeredPlayerIds.push(playerId);
        return playerData;
    }

    getPlayerData(playerId: string): PlayerData|undefined {
        return (playerId in this.data) ? this.data[playerId] : undefined;
    }

    getLineBuffer(): GeneratedLine[] {
        return this.linesBuffer;
    }

    calculateStep(tick: number): void {
        this.linesBuffer.length = 0;

        const rotationalDistance: number = 0.1;
        const arenaSize: Vector = Vector.create(600,400);

        for (const playerId of this.registeredPlayerIds) {
            const data = this.data[playerId];
            if (data.dead) {
                continue;
            }
            const prevPosition = data.position.copy();

            // apply inputs
            if (data.inputs.left) {
                data.rotation += rotationalDistance;
            }
            if (data.inputs.right) {
                data.rotation -= rotationalDistance;
            }

            // apply new velocity according to rotation automatically
            const acceleration: Vector = Vector.fromAngle(data.rotation).setMag(1);
            data.velocity.add(acceleration);
            data.velocity.limit(5);

            // apply position changes
            data.position.add(data.velocity);
            data.velocity.scale(0.9);

            // do collision checks
            if (data.invincibilityTicks > 0) {
                data.invincibilityTicks--;
            }
            else if (data.velocity.mag() >= 4.4) {
                data.dead = this.checkLineCollision(tick, data.position, 5);
            }


            const line: Line = Line.create(prevPosition, data.position.copy());
            data.position.mod(arenaSize);

            this.linesBuffer.push({
                line: line,
                tick: tick,
                thickness: 5,
                playerId: playerId
            });
        }

        this.generatedLines.push(...this.linesBuffer);
    }

    checkLineCollision(currentTick: number, position: Vector, radius: number): boolean {

        for (const generatedLine of this.generatedLines) {
            if (generatedLine.tick > currentTick-5) {
                continue;
            }

            const line = generatedLine.line;

            const d = line.distToPoint(position);
            const hitDistance = (radius + generatedLine.thickness);
            if (d < hitDistance) {
                return true;
            }
        }

        return false;
    }


}