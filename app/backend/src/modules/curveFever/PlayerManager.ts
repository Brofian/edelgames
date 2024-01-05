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
}

type PlayerDataStorage = {[key: string]: PlayerData};

export default class PlayerManager {

    private registeredPlayerIds: string[] = [];
    private data: PlayerDataStorage = {};

    /**
     * A collection of all drawn lines
     * @private
     */
    private generatedLines: Line[] = [];
    /**
     * A collection of the lines that were created in this tick
     * @private
     */
    private linesBuffer: Line[] = [];

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
            dead: false
        };
        this.data[playerId] = playerData;
        this.registeredPlayerIds.push(playerId);
        return playerData;
    }

    getPlayerData(playerId: string): PlayerData|undefined {
        return (playerId in this.data) ? this.data[playerId] : undefined;
    }

    getLineBuffer(): Line[] {
        return this.linesBuffer;
    }

    calculateStep(): void {
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
            const acceleration: Vector = Vector.fromAngle(data.rotation);
            data.velocity.add(acceleration);
            data.velocity.limit(5);

            // apply position changes
            data.position.add(data.velocity);
            data.velocity.scale(0.9);

            // do collision checks
            data.dead = this.checkLineCollision(data.position, 10);

            const line: Line = Line.create(prevPosition, data.position.copy());
            data.position.mod(arenaSize);

            this.linesBuffer.push(line);
        }

        this.generatedLines.push(...this.linesBuffer);
    }

    checkLineCollision(position: Vector, radius: number): boolean {
        // do quick endpoint distance checks before doing heavy line distance checks
        // this is the maximum distance, the player could have moved since the last step
        const maxDistPerStepSqr = 10*10;

        for (const line of this.generatedLines) {
            const startDist = line.start.distSqr(position);
            const endDist = line.end.distSqr(position);
            if (startDist > maxDistPerStepSqr && endDist > maxDistPerStepSqr) {
                // this line is probably to far away
                continue;
            }

            // TODO lineToPoint distance calculation seems to be incorrect
            if (line.distToPoint(position) <= radius) {
                return true;
            }
        }

        return false;
    }


}