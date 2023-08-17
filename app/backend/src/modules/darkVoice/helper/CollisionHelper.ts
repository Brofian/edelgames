import Vector from '../../../framework/math/Geometry/Vector';

export default class CollisionHelper {
	static isCircleLineCollision(
		cRadius: number,
		cOrigin: Vector,
		point1: Vector,
		point2: Vector
	): boolean {
		const lineLength = point1.dist(point2);

		const abVec = Vector.sub(point1, cOrigin);
		const acVec = Vector.sub(point2, cOrigin);
		const cross = abVec.cross(acVec);
		const minDist = cross.mag() / lineLength;
		const isLineInRange = minDist < cRadius;
		if (!isLineInRange) {
			return false;
		}

		const combination = abVec.copy();
		combination.add(acVec);

		return combination.mag() < lineLength + 2 * cRadius;
	}
}
