import PlayerHelper, { PlayerData } from './PlayerHelper';
import Random from '../../../framework/math/Random';
import { PlayerScore } from '@edelgames/types/src/modules/darkVoice/dVTypes';

export default class MonsterHelper {
	private readonly playerHelper: PlayerHelper;
	private readonly monsterRange: number;
	private monsterData: PlayerData;

	constructor(playerHelper: PlayerHelper, monsterRange: number) {
		this.playerHelper = playerHelper;
		this.monsterRange = monsterRange;
		this.monsterData = Random.fromArray(this.playerHelper.getPlayerData());
	}

	public getMonsterData(): PlayerData {
		return this.monsterData;
	}

	public setMonster(playerId: string): void {
		this.playerHelper.removePlayerModifier(this.monsterData, 'MONSTERBOOST');
		this.monsterData = this.playerHelper.getPlayerDataById(playerId);
		this.playerHelper.removeAllPlayerModifiers(this.monsterData);
		this.playerHelper.addPlayerModifier(this.monsterData, {
			type: 'MONSTERBOOST',
			value: 1.5,
		});
	}

	public checkMonsterPlayerCollision(): void {
		const rangeSqr = this.monsterRange * this.monsterRange;
		const monsterPosition = this.monsterData.position;

		for (const player of this.playerHelper.getPlayerData()) {
			if (player.isRespawning) {
				player.isRespawning = false;
				continue;
			}

			if (player === this.monsterData) {
				continue;
			}

			if (monsterPosition.distSqr(player.position) < rangeSqr) {
				// player is caught
				this.monsterData.score++;

				const steelPointsFromVictim = true;
				if (steelPointsFromVictim && player.score > 0) {
					player.score--;
				}

				// respawn player
				this.playerHelper.respawnPlayer(player);
			}
		}
	}
}
