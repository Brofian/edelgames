import { Coordinate } from '@edelgames/types/src/modules/colorChecker/CCTypes';

export const TWO_PI = 2 * Math.PI;

export default class Vector {
	public x: number;
	public y: number;
	public z: number;

	constructor(x: number, y: number, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.heading();
	}

	/**
	 * @description Create a Vector Object from a 2D Coordinate Structure
	 * @param coord
	 */
	public static fromCoordinate(coord: Coordinate): Vector {
		return new Vector(coord.x, coord.y);
	}

	/**
	 * @description Create a 2D Coordinate Structure from thisVector Object
	 */
	public toCoordinate(): Coordinate {
		return { x: this.x, y: this.y };
	}

	/**
	 * @description Set the values for x, y and optionally z
	 * @param x
	 * @param y
	 * @param z
	 */
	public set(x: number, y: number, z: number | undefined = undefined): Vector {
		this.x = x;
		this.y = y;
		if (z !== undefined) {
			this.z = z;
		}
		return this;
	}

	/**
	 * @description Create and return an exact copy of this Vector
	 */
	public copy(): Vector {
		return new Vector(this.x, this.y, this.z);
	}

	/**
	 * @description Create and return an exact copy of the given Vector
	 * @param source
	 */
	public static copy(source: Vector): Vector {
		return new Vector(source.x, source.y, source.z);
	}

	/**
	 * @description Checks if this vector is equal to another vector
	 * @param other
	 */
	public equals(other: Vector): boolean {
		return this.x === other.x && this.y === other.y && this.z === other.z;
	}

	/**
	 * @description Addition of the given Vector to this Vector
	 * @param other
	 */
	public add(other: Vector): Vector {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
		return this;
	}

	/**
	 * @description Addition of the given Vectors, then return the result as a new Vector
	 * @param v1
	 * @param v2
	 */
	public static add(v1: Vector, v2: Vector): Vector {
		return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
	}

	/**
	 * @description Subtraction of the given Vector from this Vector
	 * @param other
	 */
	public sub(other: Vector): Vector {
		this.x -= other.x;
		this.y -= other.y;
		this.z -= other.z;
		return this;
	}

	/**
	 * @description Subtraction of the second vector from the first, then returning the result as a new vector
	 * @param v1
	 * @param v2
	 */
	public static sub(v1: Vector, v2: Vector): Vector {
		return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
	}

	/**
	 * @description Multiplication with either one scalar value or different scalars for x,y,z
	 * @param scalar
	 * @param scalarY
	 * @param scalarZ
	 */
	public mul(
		scalar: number,
		scalarY: number = undefined,
		scalarZ: number = undefined
	): Vector {
		this.x *= scalar;
		this.y *= scalarY === undefined ? scalar : scalarY;
		this.z *= scalarZ === undefined ? scalar : scalarZ;
		return this;
	}

	/**
	 * @description Multiplication of the given vector with either one scalar value or different scalars for x,y,z
	 * @param source
	 * @param scalar
	 * @param scalarY
	 * @param scalarZ
	 */
	public static mul(
		source: Vector,
		scalar: number,
		scalarY: number = undefined,
		scalarZ: number = undefined
	): Vector {
		return new Vector(
			source.x * scalar,
			source.y * (scalarY === undefined ? scalar : scalarY),
			source.z * (scalarZ === undefined ? scalar : scalarZ)
		);
	}

	/**
	 * @description Division with either one scalar value or different scalars for x,y,z
	 * @param scalar
	 * @param scalarY
	 * @param scalarZ
	 */
	public div(
		scalar: number,
		scalarY: number = undefined,
		scalarZ: number = undefined
	): Vector {
		this.x /= scalar;
		this.y /= scalarY === undefined ? scalar : scalarY;
		this.z /= scalarZ === undefined ? scalar : scalarZ;
		return this;
	}

	/**
	 * @description Division of the given vector with either one scalar value or different scalars for x,y,z
	 * @param source
	 * @param scalar
	 * @param scalarY
	 * @param scalarZ
	 */
	public static div(
		source: Vector,
		scalar: number,
		scalarY: number = undefined,
		scalarZ: number = undefined
	): Vector {
		return new Vector(
			source.x / scalar,
			source.y / (scalarY === undefined ? scalar : scalarY),
			source.z / (scalarZ === undefined ? scalar : scalarZ)
		);
	}

	/**
	 * @description Calculate the magnitude (length) of this Vector
	 */
	public mag(): number {
		return Math.sqrt(this.magSqr());
	}

	/**
	 * @description Calculate the squared magnitude (length) of this Vector. Faster than mag() if the exact magnitude is not relevant
	 */
	public magSqr(): number {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}

	/**
	 * @description Calculate the dot product of this vector with another Vector
	 */
	public dot(other: Vector): number {
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}

	/**
	 * @description Calculate the cross product of this Vector with the given Vector
	 * @param other
	 */
	public cross(other: Vector): Vector {
		return new Vector(
			this.y * other.z - this.z * other.y,
			this.z * other.x - this.x * other.z,
			this.x * other.y - this.y * other.x
		);
	}

	/**
	 * @description Calculate the euclidean distance between this and another Vector
	 * @param other
	 */
	public dist(other: Vector): number {
		return Math.sqrt(this.distSqr(other));
	}

	/**
	 * @description Calculate the euclidean distance squared between this and another Vector. Faster than dist() if the exact distance is not required
	 * @param other
	 */
	public distSqr(other: Vector): number {
		return (
			Math.pow(this.x - other.x, 2) +
			Math.pow(this.y - other.y, 2) +
			Math.pow(this.z - other.z, 2)
		);
	}

	/**
	 * @description Normalize this Vector to the unit distance of one
	 */
	public normalize(): Vector {
		this.limit(1);
		return this;
	}

	/**
	 * @description Limit this vector to a certain magnitude
	 * @param limit
	 */
	public limit(limit: number): Vector {
		const mag = this.mag();
		if (mag != 0 && mag > limit) {
			this.mul(limit / mag);
		}
		return this;
	}

	/**
	 * @description Set the magnitude of this vector to a certain value, effectively trimming or stretching the vector
	 * @param len
	 */
	public setMag(len: number): Vector {
		const mag = this.mag();
		if (mag != 0) {
			this.mul(len / mag);
		}
		return this;
	}

	/**
	 * @description Calculates the angle of this Vector in 2D
	 */
	public heading(): number {
		return Math.atan2(this.y, this.x);
	}

	/**
	 * @description Rotate this Vector to face the given angle in degree
	 * @param angle
	 */
	public setHeading(angle: number): Vector {
		const heading = this.heading();
		this.rotate(angle - heading, heading);
		return this;
	}

	/**
	 * @description Rotate this Vector by the given angle in degree counter-clockwise
	 * @param angle
	 * @param assumedHeading
	 */
	public rotate(angle: number, assumedHeading: number = undefined): Vector {
		const baseAngle =
			assumedHeading === undefined ? this.heading() : assumedHeading;
		const length = this.mag();
		this.x = length * Math.cos(baseAngle + angle);
		this.y = length * Math.sin(baseAngle + angle);
		return this;
	}

	/**
	 * @description Calculates the angle between the two Vectors
	 * @param other
	 */
	public angleBetween(other: Vector): number {
		return this.heading() - other.heading();
	}

	/**
	 * @description Create a unit vector with the given Angle
	 * @param angle
	 */
	public static fromAngle(angle: number): Vector {
		const rad = (angle / 360) * TWO_PI;

		return new Vector(Math.sin(rad), Math.cos(rad));
	}

	/**
	 * @description Create a new Vector, that is linearly interpolated between this and another Vector by the given amount
	 * @param other
	 * @param amount
	 */
	public lerp(other: Vector, amount: number): Vector {
		// do not use other method here, to provide a better performance to this task
		const amountInv = 1 - amount;
		return new Vector(
			amount * this.x + amountInv * other.x,
			amount * this.y + amountInv * other.y,
			amount * this.z + amountInv * other.z
		);
	}
}
