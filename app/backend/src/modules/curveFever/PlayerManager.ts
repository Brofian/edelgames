import Vector from "../../framework/structures/Vector";
import Line from "../../framework/structures/Line";
import {InputData} from "@edelgames/types/src/modules/curveFever/CFEvents";
import GameStateContainer from "./GameStateContainer";

export type PlayerData = {
    position: Vector,
    velocity: Vector,
    rotation: number;
    rotationSpeed: number;
    isTurning: boolean;
    inputs: InputData;
    dead: boolean;
    color: number;
    lastLine?: GeneratedLine;
    ticksSinceRotation: number;
    lineTimer: number;
}

type GeneratedLine = {
    line: Line,
    tick: number,
    thickness: number,
    color: number
};

type PlayerDataStorage = {[key: string]: PlayerData};

const PI = 3.14159265359;
const TICKS_UNTIL_SPACE = 100;
const TICKS_FOR_SPACE = 10;

export default class PlayerManager {

    private readonly gameState: GameStateContainer;

    constructor(gameState: GameStateContainer) {
        this.gameState = gameState;
    }

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
            velocity: Vector.create(0,0),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: PI/30,
            isTurning: false,
            inputs: {
              right: false,
              left: false,
              up: false,
              down: false,
            },
            dead: false,
            color: parseInt(playerId, 36)%360,
            lastLine: undefined,
            ticksSinceRotation: 0,
            lineTimer: 0
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

        const turningSlowDown: number = 0.9;

        for (const playerId of this.registeredPlayerIds) {
            const data = this.data[playerId];
            if (data.dead) continue;

            const prevPosition = data.position.copy();

            // apply inputs
            this.handlePlayerInputs(data);

            if (this.gameState.getStartingTicks() > 0) {
                // players can turn, but will not move and not create any lines
                continue;
            }

            // apply new velocity according to rotation automatically
            const acceleration: Vector = Vector.fromAngle(data.rotation).setMag(1);
            const isSlippery = false;
            if (isSlippery) {
                data.velocity.add(acceleration);
                data.velocity.limit(data.isTurning ? (5*turningSlowDown) : 5);

                data.position.add(data.velocity);
                data.velocity.scale(0.9);
            }
            else {
                acceleration.setMag(data.isTurning ? (5*turningSlowDown) : 5);
                data.position.add(acceleration);
            }

            // do collision checks
            if (data.velocity.mag() >= 4.4) {
                data.dead =
                    this.checkLineCollision(tick, data.position, 5) ||
                    this.checkArenaCollision(data.position);
            }

            data.lineTimer--;
            if (data.lineTimer > 0) {
                // create a new collision line
                this.linesBuffer.push(
                    this.generateLine(data, tick, prevPosition)
                );
            }
            else if (data.lineTimer > -TICKS_FOR_SPACE) {
                data.lastLine = undefined;
            }
            else {
                data.lineTimer = TICKS_UNTIL_SPACE;
            }

        }

        this.generatedLines.push(...this.linesBuffer);
    }

    generateLine(data: PlayerData, tick: number, prevPosition: Vector): GeneratedLine {
        let newLine: GeneratedLine;
        if (!data.isTurning && data.lastLine && data.ticksSinceRotation > 20) {
            // player is going straight forward. Just extend the last line
            newLine = data.lastLine;
            newLine.tick = tick;
            newLine.line.end = data.position.copy();

            const oldIndex = this.generatedLines.indexOf(newLine);
            if (oldIndex !== -1) {
                this.generatedLines.splice(oldIndex, 1);
            }
        }
        else {
            // player is turning. Create a new line segment
            newLine = {
                line: Line.create(prevPosition, data.position.copy()),
                tick: tick,
                thickness: 5,
                color: data.color
            }

            data.lastLine = newLine;
        }

        return newLine;
    }

    handlePlayerInputs(data: PlayerData): void {
        data.isTurning = data.inputs.left || data.inputs.right;
        data.ticksSinceRotation = data.isTurning ? 0 : data.ticksSinceRotation+1;

        if (data.inputs.left) {
            data.rotation -= data.rotationSpeed;
        }
        if (data.inputs.right) {
            data.rotation += data.rotationSpeed;
        }
    }

    checkArenaCollision(position: Vector): boolean {
        const arenaSize: Vector = Vector.create(600,400);

        return (
            position.x < 0 ||
            position.x > arenaSize.x ||
            position.y < 0 ||
            position.y > arenaSize.y
        );
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