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
        const l2 = this.start.distSqr(this.end);
        if (l2 === 0) {
            return point.dist(this.start);
        }
        else {
            let t = (
                (point.x - this.end.x) * (this.start.x - this.end.x) +
                (point.y - this.end.y) * (this.start.y - this.end.y)
            ) / l2;
            t = Math.max(0, Math.min(t, 1));
            return point.dist(Vector.create(
                this.end.x + t * (this.start.x - this.end.x),
                this.end.y + t * (this.start.y - this.end.y)
            ));
        }
    }

}