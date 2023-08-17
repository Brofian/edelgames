import ModuleApi from '../ModuleApi';
import Room from '../../Room';
import SocketManager from '../../util/SocketManager';
import User from '../../User';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';

/**
 * @description This class will be passed to the game instance to allow for restricted access to the room data.
 * That way, a game cannot influence a room more than it is supposed to
 */
export default class ModulePlayerApi {
	private readonly room: Room;
	private readonly moduleApi: ModuleApi;

	constructor(room: Room, moduleApi: ModuleApi) {
		this.room = room;
		this.moduleApi = moduleApi;
	}

	/**
	 * @description Send a socket-event-message as a broadcast to every player in the current room
	 */
	public sendRoomMessage(eventName: string, eventData: EventDataObject): void {
		const event = this.moduleApi.getGameId() + '_' + eventName;
		SocketManager.broadcast(
			this.room.getRoomId(),
			'ServerToClientGameMessage',
			{
				messageTypeId: event,
				...eventData,
			}
		);
	}

	/**
	 * @description Send a socket-event-message to a specific player
	 */
	public sendPlayerMessage(
		playerId: string,
		eventName: string,
		eventData: EventDataObject
	): void {
		const event = this.moduleApi.getGameId() + '_' + eventName;
		const user = this.getRoomMembers().find(
			(user) => user.getId() === playerId
		);
		SocketManager.directMessageToSocket(
			user.getSocket(),
			'ServerToClientGameMessage',
			{
				messageTypeId: event,
				...eventData,
			}
		);
	}

	/**
	 * @description Display a notification bubble to the player with the given id
	 */
	public sendPlayerBubble(
		playerId: string,
		message: string,
		type: 'info' | 'error' | 'success' | 'warning' = 'info'
	): void {
		const user = this.getRoomMembers().find(
			(user) => user.getId() === playerId
		);
		SocketManager.sendNotificationBubbleToSocket(
			user.getSocket(),
			message,
			type
		);
	}

	/**
	 * @description Display a notification bubble to every player in the room
	 */
	public sendRoomBubble(
		message: string,
		type: 'info' | 'error' | 'success' | 'warning' = 'info'
	): void {
		this.getRoomMembers().forEach((user) => {
			this.sendPlayerBubble(user.getId(), message, type);
		});
	}

	public getRoom(): Room {
		return this.room;
	}

	public getRoomMembers(onlyConnected = false): User[] {
		let members = this.room.getRoomMembers();
		if (onlyConnected) {
			members = members.filter((member) => member.isConnected());
		}
		return members;
	}

	public getRoomMaster(): User {
		return this.room.getRoomMaster();
	}

	public getPlayerById(id: string): User | undefined {
		return this.getRoomMembers().find((user) => user.getId() === id);
	}

	public getRandomPlayer(): User {
		const members = this.getRoomMembers();
		return members[Math.floor(Math.random() * members.length)];
	}
}
