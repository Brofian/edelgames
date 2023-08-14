type TimerListEntry = {
	name: string;
	timeoutId: NodeJS.Timer;
};
type IntervalListEntry = {
	name: string;
	intervalId: NodeJS.Timer;
	maxCallCount: number | undefined;
};

/**
 * @description Provides improved usability for nodeJS Timeout and Interval, such as custom strings as identifiers or a maximum number of interval call
 */
export default class Timer {
	private timerList: TimerListEntry[] = [];
	private intervalList: IntervalListEntry[] = [];

	/**
	 * @description Executes the callback function after n milliseconds
	 * @param name
	 * @param callback
	 * @param ms
	 */
	public startTimeout(name: string, callback: { (): void }, ms: number) {
		this.stopTimeout(name);
		const timer: TimerListEntry = {
			name: name,
			timeoutId: setTimeout(
				this.onTimeoutTriggered.bind(this, name, callback),
				ms
			),
		};
		this.timerList.push(timer);
	}

	public stopTimeout(name: string): void {
		this.timerList = this.timerList.filter((timer) => {
			if (timer.name === name) {
				// stop and remove matching
				clearTimeout(timer.timeoutId);
				return false;
			}
			// keep others
			return true;
		});
	}

	private onTimeoutTriggered(name: string, callback: { (): void }): void {
		this.stopTimeout(name);
		callback();
	}

	/**
	 * @description Executes the callback function every n milliseconds. Optionally, a maximum number of calls can be defined
	 * @param name
	 * @param callback
	 * @param ms
	 * @param maxCallCount
	 */
	public startInterval(
		name: string,
		callback: { (): void },
		ms: number,
		maxCallCount: number | undefined = undefined
	) {
		this.stopInterval(name);
		const interval: IntervalListEntry = {
			name: name,
			intervalId: setInterval(
				this.onIntervalTriggered.bind(this, name, callback),
				ms
			),
			maxCallCount: maxCallCount,
		};
		this.intervalList.push(interval);
	}

	public stopInterval(name: string): void {
		this.intervalList = this.intervalList.filter((interval) => {
			if (interval.name === name) {
				// stop and remove matching
				clearInterval(interval.intervalId);
				return false;
			}
			// keep others
			return true;
		});
	}

	private onIntervalTriggered(name: string, callback: { (): void }): void {
		const interval = this.intervalList.find(
			(interval) => interval.name === name
		);
		if (interval && interval.maxCallCount !== undefined) {
			if (interval.maxCallCount <= 0) {
				this.stopInterval(name);
				return;
			}

			interval.maxCallCount -= 1;
		}

		callback();
	}

	public clearAll(): void {
		for (const timer of this.timerList) {
			clearTimeout(timer.timeoutId);
		}
		this.timerList = [];

		for (const interval of this.intervalList) {
			clearInterval(interval.intervalId);
		}
		this.intervalList = [];
	}
}
