import ModuleInterface from '../../framework/modules/ModuleInterface';
import preview from './preview.png';
import DarkVoiceGame from './DarkVoiceGame';
import { ReactNode } from 'react';
import { PlayerRangeDefinition } from '@edelgames/types/src/app/ModuleTypes';

/*
 * A static singleton class, that contains technical details and a render method for showing the game
 */
class DarkVoice implements ModuleInterface {
	getPreviewImage(): string | undefined {
		return preview;
	}

	getTitle(): string {
		return 'Voice in the dark';
	}

	getUniqueId(): string {
		return 'darkVoice';
	}

	getPlayerRequirements(): PlayerRangeDefinition {
		return {min: 2, max: 10};
	}

	renderGame(): ReactNode {
		return <DarkVoiceGame />;
	}
}

const darkVoice = new DarkVoice();
export default darkVoice;
