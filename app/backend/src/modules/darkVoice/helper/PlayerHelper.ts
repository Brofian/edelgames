import {
	ControlKey,
	PlayerModifier,
	PlayerModifierType,
	PlayerPosition,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import Vector from '../../../framework/math/Geometry/Vector';
import User from '../../../framework/User';

type PlayerInputData = {
	[key in ControlKey]: boolean;
};

export type PlayerData = {
	playerId: string;
	inputs: PlayerInputData;
	inputsBlockedByCollision: boolean;
	position: Vector;
	velocity: Vector;
	acceleration: number;
	modifier: PlayerModifier[];
	isMonster: boolean;
};

export default class PlayerHelper {
	private readonly playerData: PlayerData[] = [];
	private playerSize: number;
	private playerMaxSpeed: number;
	private playerAcceleration: number;

	constructor(
		defaultPlayerSize: number,
		defaultPlayerMaxSpeed: number,
		defaultPlayerAcceleration: number
	) {
		this.playerSize = defaultPlayerSize;
		this.playerMaxSpeed = defaultPlayerMaxSpeed;
		this.playerAcceleration = defaultPlayerAcceleration;
	}

	public getPlayerSize(): number {
		return this.playerSize;
	}

	public getPlayerMaxSpeed(): number {
		return this.playerMaxSpeed;
	}

	public getPlayerAcceleration(): number {
		return this.playerAcceleration;
	}

	public initializePlayerData(
		playerList: User[],
		sWidth: number,
		sHeight: number
	): void {
		// clear playerData
		this.playerData.filter(() => false);

		// rebuild player Data
		for (const player of playerList) {
			this.playerData.push({
				playerId: player.getId(),
				position: new Vector(
					Math.floor(Math.random() * sWidth) + 0.5,
					Math.floor(Math.random() * sHeight) + 0.5
				),
				velocity: new Vector(0, 0),
				acceleration: this.playerAcceleration,
				modifier: [],
				inputs: {
					UP: false,
					DOWN: false,
					RIGHT: false,
					LEFT: false,
				},
				inputsBlockedByCollision: false,
				isMonster: false,
			});
		}
	}

	public getPlayerDataById(playerId: string): PlayerData | undefined {
		return this.playerData.find((data) => data.playerId === playerId);
	}

	public getPlayerPositions(): PlayerPosition[] {
		return this.playerData.map((data) => {
			return {
				playerId: data.playerId,
				coords: data.position.toCoordinate(),
			};
		});
	}

	public getPlayerData(): PlayerData[] {
		return this.playerData;
	}

	/**
	 * Apply a new modifier to a player. Each modifier can only
	 * @param playerId
	 * @param modifier
	 * @param replace
	 */
	public addPlayerModifier(
		playerId: string,
		modifier: PlayerModifier,
		replace = true
	): void {
		const playerData = this.getPlayerDataById(playerId);
		const existingModifier = playerData.modifier.find(
			(mod) => mod.type === modifier.type
		);

		if (existingModifier !== undefined && !replace) {
			return;
		} else if (existingModifier !== undefined) {
			// remove old modifier
			playerData.modifier.filter((mod) => mod !== existingModifier);
		}

		playerData.modifier.push(modifier);
	}

	public removePlayerModifier(
		playerId: string,
		modifierType: PlayerModifierType
	): void {
		const playerData = this.getPlayerDataById(playerId);
		playerData.modifier.filter((mod) => mod.type !== modifierType);
	}

	public getPlayerModifier(
		playerId: string,
		modifierType: string
	): PlayerModifier | undefined {
		return this.getPlayerDataById(playerId)?.modifier.find(
			(mod) => mod.type === modifierType
		);
	}

	public getMonsterPlayerId(): string {
		return this.playerData.find((data) => data.isMonster)?.playerId || 'none';
	}
}
