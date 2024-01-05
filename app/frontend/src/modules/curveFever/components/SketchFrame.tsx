import p5Types from "p5";
import AbstractCanvas, {DefaultCanvasProps} from "../../../framework/components/DrawingCanvas/AbstractCanvas";

interface IProps extends DefaultCanvasProps {

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
        if (this.lineLayer) {
            p5.image(this.lineLayer, 0, 0);
        }

        // TODO draw players

    }

}