import AbstractItem from './AbstractItem';
import { PlayerData } from '../PlayerHelper';

export const MonsterizerItemIdentifier = 'monsterizer';
export default class MonsterizerItem extends AbstractItem {
	// monsterizer can only be activated once per item!
	protected wasActivated = false;

	willActivate(playerData: PlayerData): boolean {
		return (
			!this.wasActivated &&
			playerData.playerId !== this.monsterHelper.getMonsterData().playerId
		);
	}

	activate(playerData: PlayerData): void {
		this.monsterHelper.setMonster(playerData.playerId);
		this.wasActivated = true;
	}

	getIdentifier(): string {
		return MonsterizerItemIdentifier;
	}
}
