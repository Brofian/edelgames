import {
	ControlKey,
	PlayerModifier,
	PlayerModifierType,
	PlayerPosition,
	PlayerScore,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import Vector from '../../../framework/math/Geometry/Vector';
import User from '../../../framework/User';
import Random from '../../../framework/math/Random';

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
	isRespawning: boolean;
	score: number;
};

export default class PlayerHelper {
	private readonly sWidth: number;
	private readonly sHeight: number;

	private readonly playerData: PlayerData[] = [];
	private readonly playerSize: number;
	private readonly playerMaxSpeed: number;
	private readonly playerAcceleration: number;

	constructor(
		sWidth: number,
		sHeight: number,
		defaultPlayerSize: number,
		defaultPlayerMaxSpeed: number,
		defaultPlayerAcceleration: number
	) {
		this.sWidth = sWidth;
		this.sHeight = sHeight;
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

	public initializePlayerData(playerList: User[]): void {
		// clear playerData
		this.playerData.filter(() => false);

		// rebuild player Data
		for (const player of playerList) {
			this.playerData.push({
				playerId: player.getId(),
				position: new Vector(
					Random.intBelow(this.sWidth) + 0.5,
					Random.intBelow(this.sHeight) + 0.5
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
				isRespawning: false,
				score: 0,
			});
		}
	}

	public respawnPlayer(playerData: PlayerData): void {
		playerData.position.x = Random.intBelow(this.sWidth) + 0.5;
		playerData.position.y = Random.intBelow(this.sHeight) + 0.5;
		playerData.velocity.x = 0;
		playerData.velocity.y = 0;
		playerData.modifier = [];
		playerData.inputs.UP = false;
		playerData.inputs.DOWN = false;
		playerData.inputs.LEFT = false;
		playerData.inputs.RIGHT = false;
		playerData.isRespawning = true;
	}

	public getPlayerDataById(playerId: string): PlayerData | undefined {
		return this.playerData.find((data) => data.playerId === playerId);
	}

	public getPlayerPositions(): PlayerPosition[] {
		return this.playerData.map((data) => {
			return {
				playerId: data.playerId,
				coords: data.position.toCoordinate(),
				teleport: data.isRespawning,
			};
		});
	}

	public getPlayerData(): PlayerData[] {
		return this.playerData;
	}

	public getPlayerScores(): PlayerScore[] {
		return this.playerData.map((data) => {
			return {
				playerId: data.playerId,
				score: data.score,
			};
		});
	}

	public addPlayerModifierById(
		playerId: string,
		modifier: PlayerModifier,
		replace = true
	): void {
		const playerData = this.getPlayerDataById(playerId);
		this.addPlayerModifier(playerData, modifier, replace);
	}

	/**
	 * Apply a new modifier to a player. Each modifier can only
	 * @param playerData
	 * @param modifier
	 * @param replace
	 */
	public addPlayerModifier(
		playerData: PlayerData,
		modifier: PlayerModifier,
		replace = true
	): void {
		const existingModifier = playerData.modifier.find(
			(mod) => mod.type === modifier.type
		);

		if (existingModifier !== undefined && !replace) {
			return;
		} else if (existingModifier !== undefined) {
			// remove old modifier
			playerData.modifier = playerData.modifier.filter(
				(mod) => mod.type !== existingModifier.type
			);
		}

		playerData.modifier.push(modifier);
	}

	public removePlayerModifierById(
		playerId: string,
		modifierType: PlayerModifierType
	): void {
		const playerData = this.getPlayerDataById(playerId);
		this.removePlayerModifier(playerData, modifierType);
	}

	public removePlayerModifier(
		playerData: PlayerData,
		modifierType: PlayerModifierType
	): void {
		playerData.modifier.filter((mod) => mod.type !== modifierType);
	}

	public removeAllPlayerModifiers(playerData: PlayerData): void {
		playerData.modifier = [];
	}

	public getPlayerModifierById(
		playerId: string,
		modifierType: PlayerModifierType
	): PlayerModifier | undefined {
		const playerData = this.getPlayerDataById(playerId);
		return playerData
			? this.getPlayerModifier(playerData, modifierType)
			: undefined;
	}

	public getPlayerModifier(
		playerData: PlayerData,
		modifierType: string
	): PlayerModifier | undefined {
		return playerData.modifier.find((mod) => mod.type === modifierType);
	}
}
