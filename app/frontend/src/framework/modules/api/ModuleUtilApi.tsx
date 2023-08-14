import ModuleApi from "../ModuleApi";
import Timer from "./apiUtil/Timer";


export default class ModuleUtilApi {

	private readonly api: ModuleApi;
	private readonly timer: Timer;


	constructor(api: ModuleApi) {
		this.api = api;
		this.timer = new Timer();
	}


	public getTimer(): Timer {
		return this.timer;
	}

}
