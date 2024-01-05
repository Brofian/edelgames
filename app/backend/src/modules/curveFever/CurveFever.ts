import Module from '../../framework/modules/Module';
import ModuleGame from '../../framework/modules/ModuleGame';
import ModuleConfig from '../../framework/modules/configuration/ModuleConfig';
import CurveFeverGame from "./CurveFeverGame";

/*
 * This singleton is used to register the game to the ModuleList
 */
class CurveFever extends Module {
	getUniqueId(): string {
		return 'curveFever';
	}

	getGameConfig(): ModuleConfig {
		return new ModuleConfig([]);
	}

	allowLateJoin(): boolean {
		return false;
	}

	getGameInstance(): ModuleGame {
		return new CurveFeverGame();
	}
}

const curveFever = new CurveFever();
export default curveFever;