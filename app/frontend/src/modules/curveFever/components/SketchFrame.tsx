import p5Types from "p5";
import AbstractCanvas, {DefaultCanvasProps} from "../../../framework/components/DrawingCanvas/AbstractCanvas";
import ServerConnector from "./ServerConnector";
import GameStateManager from "./GameStateManager";
import {InputData} from "@edelgames/types/src/modules/curveFever/CFEvents";
import {SketchProps} from "react-p5";
import type P5 from "p5";

interface IProps extends DefaultCanvasProps {
    connector: ServerConnector,
    gameState: GameStateManager
}

export default class Sketch extends AbstractCanvas<IProps, {}> {

    lineLayer?: p5Types.Graphics;

    colorLookup: {[key: string]: [number,number,number]} = {};

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
        p5.smooth();
        p5.colorMode(p5.HSB);
        this.lineLayer = p5.createGraphics(this.props.width, this.props.height);
    }

    draw(p5: p5Types): void {
        p5.background(200);
        if (!this.lineLayer) return;


        // draw new lines to lineLayer
        const lineBuffer = this.props.gameState.getLineBuffer();
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

        p5.stroke(0);
        p5.fill(0,0,200);
        for (const playerId of this.props.gameState.getRegisteredPlayerIds()) {
            const data = this.props.gameState.getPlayerData(playerId);
            if (!data) {
                continue;
            }
            p5.circle(data.position.x, data.position.y, 10);
        }
    }

}