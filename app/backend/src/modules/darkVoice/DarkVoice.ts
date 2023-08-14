import Module from '../../framework/modules/Module';
import ModuleGame from '../../framework/modules/ModuleGame';
import DarkVoiceGame from './DarkVoiceGame';
import { PlayerRangeDefinition } from '@edelgames/types/src/app/ModuleTypes';

/*
 * This singleton is used to register the game to the ModuleList
 */
class DarkVoice extends Module {
	getUniqueId(): string {
		return 'darkVoice';
	}

	getRequiredPlayersRange(): PlayerRangeDefinition {
		return { min: 2, max: 10 };
	}

	getGameInstance(): ModuleGame {
		return new DarkVoiceGame();
	}
}

const darkVoice = new DarkVoice();
export default darkVoice;
