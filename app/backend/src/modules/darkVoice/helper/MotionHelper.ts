import { ControlKey } from '@edelgames/types/src/modules/darkVoice/dVTypes';
import Vector from '../../../framework/math/Geometry/Vector';
import CollisionHelper from './CollisionHelper';
import Line from '../../../framework/math/Geometry/Line';
import PlayerHelper, { PlayerData } from './PlayerHelper';

export default class MotionHelper {
	private readonly playerHelper: PlayerHelper;
	private readonly friction: number;

	constructor(playerHelper: PlayerHelper) {
		this.playerHelper = playerHelper;

		// friction should cancel out the default acceleration at maxSpeed
		// maxSpeed = friction * (maxSpeed + acceleration)
		// calculate and assign friction
		const maxSpeed = this.playerHelper.getPlayerMaxSpeed();
		const acceleration = this.playerHelper.getPlayerAcceleration();
		this.friction = maxSpeed / (maxSpeed + acceleration);
	}

	private getPlayerDataById(playerId: string): PlayerData | undefined {
		return this.playerHelper.getPlayerDataById(playerId);
	}

	public onPlayerInputChanged(
		key: string,
		state: boolean,
		player: string
	): void {
		const playerInputs = this.getPlayerDataById(player);
		if (playerInputs && this.isKeyValidControlKey(key)) {
			playerInputs.inputs[key] = !!state;
		}
	}

	private isKeyValidControlKey(key: string): key is ControlKey {
		return ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(key);
	}

	updatePlayerPositionsFromInputs(mazeBorders: Line[]): void {
		for (const data of this.playerHelper.getPlayerData()) {
			this.applyPlayerModifiers(data);

			if (!data.inputsBlockedByCollision) {
				// calculate acceleration by user inputs
				const acceleration: Vector = new Vector(0, 0);
				if (data.inputs.UP) acceleration.y -= 1;
				if (data.inputs.DOWN) acceleration.y += 1;
				if (data.inputs.LEFT) acceleration.x -= 1;
				if (data.inputs.RIGHT) acceleration.x += 1;

				data.velocity.add(acceleration.setMag(data.acceleration));
			}

			// apply friction (this also prevents the player from gaining more velocity than intended)
			if (data.velocity.magSqr() > 0.001) {
				data.velocity.mul(this.friction);
			} else {
				// stop the player if the velocity is too low
				data.velocity.x = 0;
				data.velocity.y = 0;
			}

			// skip still standing players collision detection
			if (data.velocity.x === 0 && data.velocity.y === 0) {
				data.inputsBlockedByCollision = false;
				continue;
			}

			data.position = this.restrictMotionByCollision(mazeBorders, data);
		}
	}

	applyPlayerModifiers(playerData: PlayerData): void {
		// set default values
		playerData.acceleration = this.playerHelper.getPlayerAcceleration();

		// apply modifiers to them
		for (const modifier of playerData.modifier) {
			if (modifier.type === 'ACCELERATION') {
				playerData.acceleration *= modifier.value;
			}

			if (modifier.type === 'MONSTERBOOST') {
				playerData.acceleration *= modifier.value;
			}
		}
	}

	onCollisionHandler(playerData: PlayerData, collidedLine: Line): void {
		playerData.inputsBlockedByCollision = true;

		const bouncyWalls = true;
		if (bouncyWalls) {
			const isHorizontalLine = collidedLine.start.x === collidedLine.end.x;
			playerData.velocity.mul(
				isHorizontalLine ? -1.2 : 1,
				isHorizontalLine ? 1 : -1.2
			);
		} else {
			playerData.velocity.mul(0.3);
		}
	}

	restrictMotionByCollision(
		mazeBorders: Line[],
		playerData: PlayerData
	): Vector {
		const oldPosition = playerData.position;
		const motion = playerData.velocity;

		const nextPosition: Vector = Vector.add(oldPosition, motion);
		const distanceTravelled = nextPosition.dist(oldPosition);
		// attempt 5 collision steps, with the predicate:
		// 0.01 <= collisionStepSize <= 0.3
		const collisionStepSize = Math.max(
			0.01,
			Math.min(distanceTravelled / 5, 0.2)
		);

		let calculatedEndPosition = oldPosition;

		// only ever move the player by collisionStepSize, check the collision and then loop
		for (
			let i = collisionStepSize;
			i < distanceTravelled;
			i += collisionStepSize
		) {
			const lerpedPosition = oldPosition.lerp(
				nextPosition,
				i / distanceTravelled
			);

			// check collision
			let collidedLine = this.checkMazeCollision(lerpedPosition, mazeBorders);
			if (collidedLine === false) {
				calculatedEndPosition = lerpedPosition;
				continue;
			}

			// check collision at portions of the distance
			for (const precision of [0.5, 0.25, 0.125]) {
				const halfLerpedPosition = oldPosition.lerp(
					nextPosition,
					i + precision * collisionStepSize
				);
				const collidedLineTemp = this.checkMazeCollision(
					halfLerpedPosition,
					mazeBorders
				);
				if (collidedLineTemp === false) {
					calculatedEndPosition = halfLerpedPosition;
				} else {
					collidedLine = collidedLineTemp;
				}
			}

			// we definitely cannot do this step, so return the last valid position
			this.onCollisionHandler(playerData, collidedLine);
			return calculatedEndPosition;
		}

		// check the collision for the end position
		const collision = this.checkMazeCollision(nextPosition, mazeBorders);
		if (collision !== false) {
			this.onCollisionHandler(playerData, collision);
			return calculatedEndPosition;
		}

		playerData.inputsBlockedByCollision = false;
		return nextPosition;
	}

	checkMazeCollision(playerPos: Vector, mazeBorders: Line[]): Line | false {
		for (const line of mazeBorders) {
			const isHit = CollisionHelper.isCircleLineCollision(
				this.playerHelper.getPlayerSize() / 2,
				playerPos,
				line.start,
				line.end
			);
			if (isHit) {
				return line;
			}
		}

		return false;
	}
}
