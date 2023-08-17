import {
	ControlKey,
	PlayerPosition,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import User from '../../../framework/User';
import Vector from '../../../framework/math/Geometry/Vector';
import CollisionHelper from './CollisionHelper';
import Line from '../../../framework/math/Geometry/Line';

type PlayerInputData = {
	[key in ControlKey]: boolean;
};

type PlayerData = {
	playerId: string;
	inputs: PlayerInputData;
	position: Vector;
};

export default class MotionHelper {
	private playerData: PlayerData[] = [];
	private readonly playerSize: number;
	private readonly playerSpeed: number;

	constructor(
		sWidth: number,
		sHeight: number,
		playerList: User[],
		playerSize: number,
		playerSpeed: number
	) {
		this.playerSize = playerSize;
		this.playerSpeed = playerSpeed;
		this.initializePlayerData(sWidth, sHeight, playerList);
	}

	private initializePlayerData(
		sWidth: number,
		sHeight: number,
		playerList: User[]
	): void {
		this.playerData = [];

		for (const player of playerList) {
			this.playerData.push({
				playerId: player.getId(),
				position: new Vector(
					Math.floor(Math.random() * sWidth) + 0.5,
					Math.floor(Math.random() * sHeight) + 0.5
				),
				inputs: {
					UP: false,
					DOWN: false,
					RIGHT: false,
					LEFT: false,
				},
			});
		}
	}

	public getPlayerPositions(): PlayerPosition[] {
		return this.playerData.map((data) => {
			return {
				playerId: data.playerId,
				coords: data.position.toCoordinate(),
			};
		});
	}

	private getPlayerDataById(playerId: string): PlayerData | undefined {
		return this.playerData.find((data) => data.playerId === playerId);
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

	public isKeyValidControlKey(key: string): key is ControlKey {
		return ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(key);
	}

	updatePlayerPositionsFromInputs(mazeBorders: Line[]): void {
		for (const data of this.playerData) {
			const desiredMotion: Vector = new Vector(0, 0);
			if (data.inputs.UP) desiredMotion.y -= this.playerSpeed;
			if (data.inputs.DOWN) desiredMotion.y += this.playerSpeed;
			if (data.inputs.LEFT) desiredMotion.x -= this.playerSpeed;
			if (data.inputs.RIGHT) desiredMotion.x += this.playerSpeed;

			if (desiredMotion.x === 0 && desiredMotion.y === 0) {
				continue;
			}

			const newPosition = this.restrictMotionByCollision(
				data.position,
				desiredMotion,
				mazeBorders
			);
			if (newPosition) {
				data.position = newPosition;
			}
		}
	}

	restrictMotionByCollision(
		oldPosition: Vector,
		motion: Vector,
		mazeBorders: Line[]
	): Vector | false {
		const nextPosition: Vector = Vector.add(oldPosition, motion);

		const distanceTravelled = nextPosition.dist(oldPosition);
		// 0.01 <= collisionStepSize <= 0.3
		//const collisionStepSize = Math.max(0.01, Math.min(distanceTravelled/5, 0.3));
		const collisionStepSize = distanceTravelled / 5;

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

			const isCollision = this.checkMazeCollision(lerpedPosition, mazeBorders);
			if (isCollision) {
				return calculatedEndPosition;
			} else {
				calculatedEndPosition = lerpedPosition;
			}
		}

		const isCollision = this.checkMazeCollision(nextPosition, mazeBorders);
		if (isCollision) {
			return calculatedEndPosition;
		}

		return nextPosition;
	}

	checkMazeCollision(playerPos: Vector, mazeBorders: Line[]): boolean {
		for (const line of mazeBorders) {
			const isHit = CollisionHelper.isCircleLineCollision(
				this.playerSize / 2,
				playerPos,
				line.start,
				line.end
			);
			if (isHit) {
				return true;
			}
		}

		return false;
	}
}
