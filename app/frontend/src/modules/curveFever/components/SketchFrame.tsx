import p5Types from "p5";
import AbstractCanvas, {DefaultCanvasProps} from "../../../framework/components/DrawingCanvas/AbstractCanvas";
import ServerConnector, {IncomingEventNames} from "./ServerConnector";
import GameStateManager, {PlayerData} from "./GameStateManager";
import {InputData, UpgradeObj} from "@edelgames/types/src/modules/curveFever/CFEvents";
import {SketchProps} from "react-p5";
import type P5 from "p5";
import ProfileManager from "../../../framework/util/ProfileManager";
import {VectorObj} from "../../../framework/structures/Vector";
import ModuleEventApi from "../../../framework/modules/api/ModuleEventApi";

interface IProps extends DefaultCanvasProps {
    connector: ServerConnector,
    gameState: GameStateManager
    eventApi: ModuleEventApi
}

export default class Sketch extends AbstractCanvas<IProps, {}> {

    // number between 0 and 1, indicating what step of the tick the frame happens in
    frameSinceTick: number = 0;

    lineLayer?: p5Types.Graphics;

    inputs: InputData = {
        right: false,
        left: false,
        up: false,
        down: false,
    };

    additionalSketchProps: Partial<SketchProps> = {
        keyPressed: this.keyPressed.bind(this),
        keyReleased: this.keyReleased.bind(this)
    }

    constructor(props: IProps) {
        super(props);
        this.props.eventApi.addEventHandler(IncomingEventNames.playerPositionUpdate, this.onServerTicked.bind(this));
    }

    keyPressed(p5: P5, event?: UIEvent): void {
        if (!event) return;
        const keyboardEvent = event as KeyboardEvent;
        this.setKey(keyboardEvent.key, true);
    }

    keyReleased(p5: P5, event?: UIEvent): void {
        if (!event) return;
        const keyboardEvent = event as KeyboardEvent;
        this.setKey(keyboardEvent.key, false);
    }

    setKey(key: string, isKeyDown: boolean): void {
        switch (key) {
            case 'w':
                this.inputs.up = isKeyDown;
                break;
            case 'a':
                this.inputs.left = isKeyDown;
                break;
            case 's':
                this.inputs.down = isKeyDown;
                break;
            case 'd':
                this.inputs.right = isKeyDown;
                break;
        }

        this.props.connector.sendInputChangeEvent(this.inputs);
    }

    preload(p5: p5Types): void {}

    setup(p5: p5Types): void {
        p5.colorMode(p5.HSL);
        p5.rectMode(p5.CENTER);
        this.lineLayer = p5.createGraphics(this.props.width, this.props.height);
        this.lineLayer.colorMode(p5.HSL);
    }

    onServerTicked(): void {
        this.frameSinceTick = 0;
    }

    draw(p5: p5Types): void {
        p5.background(200);
        const localPlayerData = this.props.gameState.getPlayerData(ProfileManager.getId());
        if (!localPlayerData) return;

        const tickPercentage = (20/(p5.frameRate() || 1)) * this.frameSinceTick;
        this.frameSinceTick++;

        this.drawLineBuffer(p5);

        for (const upgrade of this.props.gameState.activeUpgrades) {
            this.drawUpgrade(p5, upgrade);
        }

        for (const playerId of this.props.gameState.getRegisteredPlayerIds()) {
            const data = this.props.gameState.getPlayerData(playerId);
            if (!data) continue;

            this.drawPlayer(p5, data, tickPercentage, data === localPlayerData);
        }
    }

    drawLineBuffer(p5: p5Types): void {
        if (!this.lineLayer) return;

        // draw new lines to lineLayer
        const lineBuffer = this.props.gameState.getLineBuffer()
        for (const line of lineBuffer) {
            this.lineLayer.stroke(line.color, 80, 70);

            this.lineLayer.strokeWeight(line.thickness * 2);
            this.lineLayer.line(
                line.line.start.x,
                line.line.start.y,
                line.line.end.x,
                line.line.end.y
            );
        }

        p5.image(this.lineLayer, 0, 0);
    }

    drawPlayer(p5: p5Types, data: PlayerData, interpolationDelta: number, isLocalPlayer: boolean): void {
        p5.stroke(0);
        p5.fill(0,100,100);

        const interpolatedPosition: VectorObj = {
            x: data.previousPosition.x + (data.position.x - data.previousPosition.x) * interpolationDelta,
            y: data.previousPosition.y + (data.position.y - data.previousPosition.y) * interpolationDelta,
        };

        p5.push();
        p5.translate(interpolatedPosition.x, interpolatedPosition.y);

        if (isLocalPlayer) {
            const startingTicks = Math.min(this.props.gameState.startingTicks, 100);
            if (startingTicks > 0) {
                p5.circle(0, 0, startingTicks);
            }
        }

        p5.rotate(data.rotation);
        p5.beginShape();
        {
            p5.vertex(15, 0);
            p5.vertex(-10, -10);
            p5.vertex(-5, 0);
            p5.vertex(-10, 10);
            p5.vertex(15, 0);
        }
        p5.endShape();
        p5.pop();
    }

    drawUpgrade(p5: p5Types, upgrade: UpgradeObj): void {
        p5.push();
        p5.translate(upgrade.position.x, upgrade.position.y);

        p5.stroke(0);
        p5.strokeWeight(2);

        switch (upgrade.type) {
            case "thicken":
                p5.fill(200,100,80);
                p5.circle(0, 0, 30);
                p5.rect(0, 0, 20, 10);

                p5.beginShape(p5.LINES)
                p5.vertex( -7, -8)
                p5.vertex(  0,-10)
                p5.vertex(  0,-10)
                p5.vertex(  7, -8)

                p5.vertex( -7,  8)
                p5.vertex(  0, 10)
                p5.vertex(  0, 10)
                p5.vertex(  7,  8)
                p5.endShape();
                break;
            case "thin":
                p5.fill(100,100,80);
                p5.circle(0, 0, 30);
                p5.rect(0, 0, 20, 10);

                p5.beginShape(p5.LINES)
                p5.vertex( -7, -10)
                p5.vertex(  0,-8)
                p5.vertex(  0,-8)
                p5.vertex(  7, -10)

                p5.vertex( -7,  10)
                p5.vertex(  0, 8)
                p5.vertex(  0, 8)
                p5.vertex(  7,  10)
                p5.endShape();
                break;
            case "invisible":
                p5.fill(300,100,80);
                p5.circle(0, 0, 30);
                p5.beginShape()
                p5.vertex(-4, 4);
                p5.vertex(0, 10);
                p5.vertex(4, 4);
                p5.vertex(10, 0);
                p5.vertex(4, -3);
                p5.vertex(0, -10);
                p5.vertex(-4, -3);
                p5.vertex(-10, 0);
                p5.vertex(-4, 4);
                p5.endShape();
                break;
        }

        p5.pop();
    }

}