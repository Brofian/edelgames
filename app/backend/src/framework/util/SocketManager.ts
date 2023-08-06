import Controller from '../Controller';
import { Socket } from 'socket.io';
import {
	EventDataObject,
	ListenerFunction,
} from '@edelgames/types/src/app/ApiTypes';

// https://socket.io/docs/v3/emit-cheatsheet/
export default class SocketManager {
	// send a message to all sockets! use wisely
	public static globalBroadcast(eventName: string, eventData: object) {
		Controller.io.emit('message', {
			eventName: eventName,
			eventData: eventData,
		});
	}

	// send a message to all sockets via the given eventName in a room
	public static broadcast(room: string, eventName: string, eventData: object) {
		Controller.io.in(room).emit('message', {
			eventName: eventName,
			eventData: eventData,
		});
	}

	// send a message to a specific socket via the given channel
	public static directMessage(
		socketId: string,
		eventName: string,
		eventData: object
	): void {
		Controller.io.to(socketId).emit('message', {
			eventName: eventName,
			eventData: eventData,
		});
	}

	// does the same thing as directMessage, but skips the id search of the socket by passing it directly
	public static directMessageToSocket(
		socket: Socket,
		eventName: string,
		eventData: EventDataObject = {}
	): void {
		if (socket) {
			socket.emit('message', {
				eventName: eventName,
				eventData: eventData,
			});
		}
	}

	public static sendNotificationBubbleToSocket(
		socket: Socket,
		message: string,
		type: 'info' | 'error' | 'success' | 'warning' = 'info'
	): void {
		SocketManager.directMessageToSocket(socket, 'showNotificationBubble', {
			type: type,
			message: message,
		});
	}

	// register a subscriber to an event, that will be called upon receiving such a message
	public static subscribeEvent(
		eventName: string,
		listener: ListenerFunction
	): void {
		Controller.io.on(eventName, listener);
	}

	// register a subscriber to an event, that will be called upon receiving such a message
	public static subscribeEventToSocket(
		socket: Socket,
		eventName: string,
		listener: ListenerFunction
	): void {
		socket.on(eventName, listener);
	}
}
