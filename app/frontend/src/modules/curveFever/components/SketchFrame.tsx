import p5Types from "p5";
import AbstractCanvas, {DefaultCanvasProps} from "../../../framework/components/DrawingCanvas/AbstractCanvas";
import ServerConnector from "./ServerConnector";
import GameStateManager from "./GameStateManager";

interface IProps extends DefaultCanvasProps {
    connector: ServerConnector,
    gameState: GameStateManager
}

export default class Sketch extends AbstractCanvas<IProps, {}> {

    lineLayer?: p5Types.Graphics;

    colorLookup: {[key: string]: [number,number,number]} = {};

    preload(p5: p5Types): void {}

    setup(p5: p5Types): void {
        p5.smooth();
        this.lineLayer = p5.createGraphics(this.props.width, this.props.height);
    }

    draw(p5: p5Types): void {
        p5.background(200);
        if (!this.lineLayer) return;


        // draw new lines to lineLayer
        const lineBuffer = this.props.gameState.getLineBuffer();
        for (const line of lineBuffer) {

            if (!(line.playerId in this.colorLookup)) {
                const n = parseInt(line.playerId, 36)*262144;
                this.colorLookup[line.playerId] = [(n%4289%255), (n%3583%255), (n%5393%255)];
            }
            const col = this.colorLookup[line.playerId];
            this.lineLayer.stroke(...col);

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