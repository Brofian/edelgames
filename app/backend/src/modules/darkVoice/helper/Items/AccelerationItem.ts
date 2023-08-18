import AbstractItem from './AbstractItem';
import { PlayerData } from '../PlayerHelper';

export const AccelerationItemIdentifier = 'accelerator';
export default class AccelerationItem extends AbstractItem {
	willActivate(playerData: PlayerData): boolean {
		return playerData.playerId !== this.monsterHelper.getMonsterData().playerId;
	}

	activate(playerData: PlayerData): void {
		this.playerHelper.addPlayerModifier(playerData, {
			type: 'ACCELERATION',
			value: 2,
			timer: 40,
		});
	}

	getIdentifier(): string {
		return AccelerationItemIdentifier;
	}
}
