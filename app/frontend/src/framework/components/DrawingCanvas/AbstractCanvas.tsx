import {Component} from "react";
import Sketch, {SketchProps} from "react-p5";
import p5Types from "p5";

export interface DefaultCanvasProps {
    width: number,
    height: number
}

export default abstract class AbstractCanvas<IProps extends DefaultCanvasProps, IState> extends Component<IProps, IState> {

    additionalSketchProps: Partial<SketchProps> = {};

    abstract preload(p5: p5Types): void;
    abstract setup(p5: p5Types): void;
    abstract draw(p5: p5Types): void;

    shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<IState>, nextContext: any): boolean {
        return false; // never update a canvas component, even though the props can change
    }

    _prepareCanvas(p5: p5Types, canvasParentRef: Element): void {
        p5.createCanvas(this.props.width, this.props.height).parent(
            canvasParentRef
        );
        this.setup(p5);
    }

    render () {
        return (
            <Sketch
                preload={this.preload.bind(this)}
                setup={this._prepareCanvas.bind(this)}
                draw={this.draw.bind(this)}
                {...this.additionalSketchProps}
            />
        );
    }

}