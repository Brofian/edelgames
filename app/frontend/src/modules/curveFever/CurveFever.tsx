import ModuleInterface from '../../framework/modules/ModuleInterface';
import preview from './preview.png';
import CurveFeverGame from './CurveFeverGame';
import { ReactNode } from 'react';
import { PlayerRangeDefinition } from '@edelgames/types/src/app/ModuleTypes';

/*
 * A static singleton class, that contains technical details and a render method for showing the game
 */
class CurveFever implements ModuleInterface {
	getPreviewImage(): string | undefined {
		return preview;
	}

	getTitle(): string {
		return 'Curve Fever';
	}

	getUniqueId(): string {
		return 'curveFever';
	}

	getPlayerRequirements(): PlayerRangeDefinition {
		return { min: 2, max: 20 };
	}

	renderGame(): ReactNode {
		return <CurveFeverGame />;
	}
}

const curveFever = new CurveFever();
export default curveFever;