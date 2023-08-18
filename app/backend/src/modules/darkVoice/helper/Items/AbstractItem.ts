import PlayerHelper, { PlayerData } from '../PlayerHelper';
import MonsterHelper from '../MonsterHelper';
import Vector from '../../../../framework/math/Geometry/Vector';

export default abstract class AbstractItem {
	protected readonly playerHelper: PlayerHelper;
	protected readonly monsterHelper: MonsterHelper;
	public readonly position: Vector;

	constructor(
		playerHelper: PlayerHelper,
		monsterHelper: MonsterHelper,
		position: Vector
	) {
		this.playerHelper = playerHelper;
		this.monsterHelper = monsterHelper;
		this.position = position;
	}

	public getLifetime(): number | null {
		return null;
	}

	public abstract getIdentifier(): string;

	public abstract willActivate(playerData: PlayerData): boolean;

	public abstract activate(playerData: PlayerData): void;
}
