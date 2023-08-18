import AbstractItem from './AbstractItem';
import { PlayerData } from '../PlayerHelper';

export const SlowdownItemIdentifier = 'slowdown';
export default class SlowdownItem extends AbstractItem {
	willActivate(): boolean {
		return true;
	}

	activate(playerData: PlayerData): void {
		this.playerHelper.addPlayerModifier(playerData, {
			type: 'ACCELERATION',
			value: 0.5,
			timer: 40,
		});
	}

	getIdentifier(): string {
		return SlowdownItemIdentifier;
	}
}
