import PlayerHelper from './PlayerHelper';
import MonsterHelper from './MonsterHelper';
import AbstractItem from './Items/AbstractItem';
import Vector from '../../../framework/math/Geometry/Vector';
import Random from '../../../framework/math/Random';
import MonsterizerItem, {
	MonsterizerItemIdentifier,
} from './Items/MonsterizerItem';
import AccelerationItem from './Items/AccelerationItem';
import { ItemObject } from '@edelgames/types/src/modules/darkVoice/dVTypes';

export default class ItemHelper {
	private readonly sWidth: number;
	private readonly sHeight: number;
	private readonly playerHelper: PlayerHelper;
	private readonly monsterHelper: MonsterHelper;
	private items: AbstractItem[] = [];
	private readonly itemSize = 0.3;
	private readonly maxItemCount = 5;
	private readonly maxMonsterItemCount = 2;
	private monsterItemCount = 0;
	private itemsChanged = false;

	constructor(
		sWidth: number,
		sHeight: number,
		playerHelper: PlayerHelper,
		monsterHelper: MonsterHelper
	) {
		this.sWidth = sWidth;
		this.sHeight = sHeight;
		this.playerHelper = playerHelper;
		this.monsterHelper = monsterHelper;
	}

	public getItemList(): ItemObject[] {
		return this.items.map((item) => {
			return {
				identifier: item.getIdentifier(),
				position: {
					x: item.position.x,
					y: item.position.y,
				},
			};
		});
	}

	public didItemsChange(): boolean {
		const didChange = this.itemsChanged;
		this.itemsChanged = false;
		return didChange;
	}

	public checkPlayerItemCollision(): void {
		const itemReachDistance = this.itemSize * this.itemSize * 0.6;

		const itemsToRemove: AbstractItem[] = [];
		for (const item of this.items) {
			let removeItem = false;

			for (const playerData of this.playerHelper.getPlayerData()) {
				if (playerData.position.distSqr(item.position) > itemReachDistance) {
					continue;
				}

				if (item.willActivate(playerData)) {
					item.activate(playerData);
					removeItem = true;
				}
			}

			if (removeItem) {
				if (item.getIdentifier() === MonsterizerItemIdentifier) {
					this.monsterItemCount--;
				}

				itemsToRemove.push(item);
			}
		}

		if (itemsToRemove.length > 0) {
			this.items = this.items.filter((item) => !itemsToRemove.includes(item));
		}

		if (this.items.length < this.maxItemCount) {
			const newItem = this.createNewItem();
			if (newItem) {
				this.itemsChanged = true;
				this.items.push(newItem);
			}
		}
	}

	createNewItem(): AbstractItem | null {
		// ensure there is no other item on that position
		const position = new Vector(0, 0);
		do {
			position.x = Random.intBelow(this.sWidth) + 0.5;
			position.y = Random.intBelow(this.sHeight) + 0.5;
		} while (this.items.find((item) => item.position.equals(position)));

		if (this.monsterItemCount < this.maxMonsterItemCount) {
			this.monsterItemCount++;
			return new MonsterizerItem(
				this.playerHelper,
				this.monsterHelper,
				position
			);
		}

		switch (Random.intBelow(1)) {
			case 0:
				return new AccelerationItem(
					this.playerHelper,
					this.monsterHelper,
					position
				);
			default:
				return null;
		}
	}
}
