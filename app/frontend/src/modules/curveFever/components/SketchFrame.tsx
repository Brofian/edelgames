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
        this.lineLayer.stroke(200,0,0);
        for (const line of lineBuffer) {
            this.lineLayer.line(line.start.x, line.start.y, line.end.x, line.end.y);
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