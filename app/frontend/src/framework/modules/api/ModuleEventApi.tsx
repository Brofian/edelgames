import ModuleApi from '../ModuleApi';
import EventManager from '../../util/EventManager';
import SocketManager from '../../util/SocketManager';
import {
	EventDataObject,
	EventHandlerFunction,
} from '@edelgames/types/src/app/ApiTypes';
import EventBuffer from '../../util/EventBuffer';

// is used to store the event handlers for each event
type EventHandlerFunctionList = {
	[key: string]: EventHandlerFunction[];
};

export default class ModuleEventApi {
	private api: ModuleApi;
	private eventListeners: EventHandlerFunctionList = {};
	private eventBuffer: EventBuffer = new EventBuffer();

	constructor(api: ModuleApi) {
		this.api = api;
		EventManager.subscribe(
			'ServerToClientGameMessageEventNotified',
			this.onServerToClientMessageEventNotified.bind(this)
		);
	}

	/**
	 * @internal
	 */
	private onServerToClientMessageEventNotified(eventData?: EventDataObject) {
		if (!eventData) {
			return;
		}

		this.alertEvent(eventData.messageTypeId as string, eventData, true);
	}

	/*
	 * This method will be called automatically, every time an event is triggered.
	 * It can also be used to manage internal events for the current game
	 */
	public alertEvent(
		eventName: string,
		eventData: EventDataObject = {},
		skipPrefix: boolean = false
	): number {
		let event = skipPrefix ? eventName : this.api.getGameId() + '_' + eventName;

		let alertedListenerCount = 0;
		if (this.eventListeners[event]) {
			for (let listener of this.eventListeners[event]) {
				listener(eventData);
				alertedListenerCount++;
			}
		}

		if (alertedListenerCount === 0) {
			this.eventBuffer.addBufferedEvent(event, eventData);
		}

		return alertedListenerCount;
	}

	public addEventHandler(
		eventName: string,
		handler: EventHandlerFunction
	): void {
		let event = this.api.getGameId() + '_' + eventName;
		if (!this.eventListeners[event]) {
			this.eventListeners[event] = [];
		}
		this.eventListeners[event].push(handler);

		for (let bufferedEvent of this.eventBuffer.getBufferedEvents(event)) {
			handler(bufferedEvent);
		}
	}

	public removeEvent(eventName: string): void {
		let event = this.api.getGameId() + '_' + eventName;
		if (!this.eventListeners[event]) {
			return;
		}

		this.eventListeners[event] = [];
	}

	public sendMessageToServer(
		messageTypeId: string,
		eventData: EventDataObject
	): void {
		SocketManager.sendEvent('clientToServerGameMessage', {
			messageTypeId: this.api.getGameId() + '_' + messageTypeId,
			...eventData,
		});
	}
}