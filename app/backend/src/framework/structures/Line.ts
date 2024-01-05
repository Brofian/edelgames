import Vector, {VectorObj} from "./Vector";

export type LineObj = {
    start: VectorObj,
    end: VectorObj,
}

export default class Line {

    start: Vector;
    end: Vector;

    constructor(start: Vector, end: Vector) {
        this.start = start;
        this.end = end;
    }

    static create(start: Vector, end: Vector): Line {
        return new Line(start, end);
    }

    static fromObject(obj: LineObj): Line {
        return new Line(
            Vector.fromObject(obj.start),
            Vector.fromObject(obj.end),
        );
    }

    toObject(): LineObj {
        return {
            start: this.start.toObject(),
            end: this.end.toObject(),
        }
    }

    distToPoint(point: Vector): number {
        const numerator: number = Math.abs(
            (this.end.x-this.start.x)*(this.start.y-point.y) -
            (this.start.x-point.x)*(this.end.y-this.start.y)
        );
        const denominator: number = Math.sqrt(
            Math.pow(this.end.x-this.start.x,2) +
            Math.pow(this.end.y-this.start.y,2)
        );

        return numerator/denominator;
    }

}