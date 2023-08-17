export default class Random {
	static fromArray<T>(array: Array<T>): T | undefined {
		if (array.length === 0) {
			return undefined;
		}
		return array[Math.floor(Math.random() * array.length)];
	}

	static fromRange(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	static intFromRange(min: number, max: number): number {
		return Math.floor(Random.fromRange(min, max));
	}

	static below(max: number): number {
		return Math.random() * max;
	}

	static intBelow(max: number): number {
		return Math.floor(Random.below(max));
	}

	static zeroToOne(): number {
		return Math.random();
	}
}
