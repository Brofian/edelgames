import { Socket } from 'socket.io';
import Room from './Room';
import SocketManager from './util/SocketManager';
import RoomManager from './RoomManager';
import ModuleRegistry from './modules/ModuleRegistry';
import XenforoApi from './util/XenforoApi';
import { systemLogger } from './util/Logger';
import {
	authDataContainer,
	EventDataObject,
	IUser,
	ListenerFunction,
} from '@edelgames/types/src/app/ApiTypes';
import RandomNameGenerator from './util/RandomNameGenerator';
import serverConfiguration from './util/ServerConfiguration';
import { clearTimeout } from 'timers';

export default class User implements IUser {
	private readonly id: string = ''; // required for identifying users with the same name
	private name = ''; // basically the username or generated guest username
	private verified = false; // true, if the user did authenticate itself by login
	private currentRoom: Room | null = null;
	private pictureUrl: string | null = null;
	private authSessionId: string | null = null;
	private socket: Socket | null = null; // the connected web socket, or null if none connected
	private disconnectTimeout: NodeJS.Timer | null = null;

	private listeners: { event: string; handler: ListenerFunction }[] = [
		{ event: 'userLoginAttempt', handler: this.authenticate.bind(this) },
		{
			event: 'refreshLobbyRoomData',
			handler: this.onRefreshLobbyRoomData.bind(this),
		},
		{ event: 'createNewRoom', handler: this.onCreateNewRoom.bind(this) },
		{ event: 'returnToLobby', handler: this.onReturnToLobby.bind(this) },
		{ event: 'joinRoom', handler: this.onJoinRoom.bind(this) },
		{ event: 'startGame', handler: this.onStartGame.bind(this) },
		{
			event: 'clientToServerGameMessage',
			handler: this.onReceivedGameMessage.bind(this),
		},
		{
			event: 'returnToGameSelection',
			handler: this.onGameCancelRequested.bind(this),
		},
		{
			event: 'changeRoomName',
			handler: this.onRoomNameChangeRequested.bind(this),
		},
		{
			event: 'changeRoomPass',
			handler: this.onRoomPassChangeRequested.bind(this),
		},
		{ event: 'gameConfigEdited', handler: this.onGameConfigEdited.bind(this) },
		{
			event: 'gameConfigFinished',
			handler: this.onGameConfigFinished.bind(this),
		},
		{
			event: 'gameConfigPubliclyStateChanged',
			handler: this.onGameConfigPubliclyChanged.bind(this),
		},
	];

	constructor(socket: Socket) {
		this.id = this.createIdHash();
		this.name = RandomNameGenerator.generate();
		this.setSocket(socket, true);
		this.sendUserProfileChangedMessage();
	}

	/** This will remove the user from its current room, hopefully leaving no reference behind. Thus allowing it to be cleared by the garbage collection
	 *  Usually, this happens, when the user disconnects
	 */
	destroyUser() {
		if (this.currentRoom) {
			this.currentRoom.removeUserFromRoom(this);
			this.currentRoom = null;
		}
	}

	public setSocket(socket: Socket | null, isFirstConnection = false): void {
		this.socket = socket;

		if (socket) {
			if (!isFirstConnection) {
				systemLogger.debug(`user ${this.id} switched to socket ${socket.id}!`);
			}

			// prevent disconnect, when reconnecting
			if (this.disconnectTimeout) {
				clearTimeout(this.disconnectTimeout);
				this.disconnectTimeout = null;
			}

			// update the socket, according to the current room
			if (this.currentRoom) {
				this.socket.join(this.currentRoom.getRoomId());
			}

			// register generic listeners and remove old ones
			for (const eventDefinition of this.listeners) {
				this.socket.removeAllListeners(eventDefinition.event);
				SocketManager.subscribeEventToSocket(
					this.socket,
					eventDefinition.event,
					eventDefinition.handler
				);
			}
		} else {
			// socket was set to null... probably by disconnect. Wait for the given amount of time, before disconnecting entirely
			if (this.disconnectTimeout) {
				clearTimeout(this.disconnectTimeout);
			}
			this.disconnectTimeout = setTimeout(
				this.destroyUser.bind(this),
				serverConfiguration.apiDisconnectTimeoutSec * 1000
			);
		}

		if (this.currentRoom) {
			// update all other players. Is relevant to display the connection status of other players
			this.currentRoom.sendRoomChangedBroadcast();
			this.currentRoom.onUserReconnect(this);
		}

		// update this player
		this.sendUserProfileChangedMessage();
	}

	public getUsername(): string {
		return this.name;
	}

	public getId(): string {
		return this.id;
	}

	public getPicture(): string | null {
		return this.pictureUrl;
	}

	public getCurrentRoom(): Room | null {
		return this.currentRoom;
	}

	public getSocket(): Socket | null {
		return this.socket;
	}

	public isConnected(): boolean {
		return this.getSocket() !== null;
	}

	// avoid passing the authSessionId to the outside
	public matchAuthenticationId(authId: string): boolean {
		return authId === this.authSessionId;
	}

	public isVerified(): boolean {
		return this.verified;
	}

	private createIdHash(): string {
		return Math.random().toString(36).slice(2).substring(0, 5);
	}

	/**
	 * Switches the user to the given room
	 */
	public async switchRoom(newRoom: Room) {
		if (null === this.getSocket()) {
			// special handling for a disconnected user -> avoid all socket actions
			this.currentRoom.removeUserFromRoom(this);
			this.currentRoom = newRoom;
			return;
		}

		await this.socket.join(newRoom.getRoomId());

		if (this.currentRoom) {
			// SocketIo allows for multiple rooms at once, but we only want one at a time, so we leave the last one
			this.socket.leave(this.currentRoom.getRoomId());
			this.currentRoom.removeUserFromRoom(this);
		}

		this.currentRoom = newRoom;
	}

	public messageUser(eventName: string, data: object): void {
		if (this.socket) {
			SocketManager.directMessageToSocket(this.socket, eventName, data);
		}
	}

	private sendUserProfileChangedMessage(): void {
		this.messageUser('profileChanged', {
			id: this.id,
			username: this.name,
			pictureUrl: this.pictureUrl,
			verified: this.verified,
			authSessionId: this.authSessionId,
		});
	}

	public authenticate(loginData: {
		isAuthSessionId: boolean;
		username: string;
		password: string;
	}): void {
		const { username, password, isAuthSessionId } = loginData;

		if (this.isVerified()) {
			return;
		}

		setTimeout(
			this.onAuthResponse.bind(this, true, {
				user_id: 123,
				username: 'Brogamer5000',
				authCookie: 'blablablainvalid',
				custom_title: 'Den kenn ich nicht auswendig',
				profileImageUrl: 'https://httpbin.org/image',
				group_id: 1,
			} as authDataContainer),
			1
		);
		return;

		if (isAuthSessionId) {
			const sessionId = this.authSessionId ?? password;
			systemLogger.info(`user ${this.id} attempted login with authId`);
			XenforoApi.loginWithToken(sessionId, this.onAuthResponse.bind(this));
		} else {
			systemLogger.info(
				`user ${this.id} attempted login as ${username} using password`
			);
			XenforoApi.loginWithPassword(
				username,
				password,
				this.onAuthResponse.bind(this)
			);
		}
	}

	/**
	 * @internal
	 * @param success
	 * @param data
	 */
	public onAuthResponse(
		success: boolean,
		data: null | authDataContainer
	): void {
		if (!success || !data) {
			systemLogger.info(`authentication attempt failed for user ${this.id}`);
			SocketManager.sendNotificationBubbleToSocket(
				this.socket,
				'Authentication failed!',
				'error'
			);
			return;
		}

		// check if this authentication is already assigned to a user
		const existingSocketUser = RoomManager.isAuthenticatedUserAlreadyConnected(
			data.authCookie
		);
		if (existingSocketUser) {
			if (existingSocketUser.isConnected()) {
				// prevent login
				SocketManager.sendNotificationBubbleToSocket(
					this.socket,
					'Account already connected!',
					'error'
				);
			} else {
				// there is another authenticated user, that disconnected before -> switch to this user and throw away this one
				systemLogger.info(
					`user ${this.id} is redirected to ${existingSocketUser.getId()}!`
				);
				if (this.currentRoom) {
					this.getSocket().leave(this.currentRoom.getRoomId());
				}
				existingSocketUser.setSocket(this.getSocket());
				this.setSocket(null);
				this.destroyUser();
			}
			return;
		}

		// all clear, this user is not yet connected
		this.verified = true;
		this.name = data.username;
		this.pictureUrl = data.profileImageUrl;
		this.authSessionId = data.authCookie;

		// update data on client side
		this.sendUserProfileChangedMessage();
		this.currentRoom.sendRoomChangedBroadcast();

		systemLogger.info(`user ${this.id} authenticated as ${this.name}`);
	}

	public onRefreshLobbyRoomData(): void {
		this.messageUser('lobbyRoomsChanged', RoomManager.getLobbyMemberRoomData());
	}

	public onCreateNewRoom(): void {
		if (this.verified && this.currentRoom.getRoomId() === 'lobby') {
			RoomManager.createRoom(this);
		}
	}

	public onReturnToLobby(): void {
		if (this.currentRoom.getRoomId() !== 'lobby') {
			RoomManager.getLobbyRoom().joinRoom(this);
		}
	}

	public onJoinRoom(data: {
		roomId: string;
		password: string | undefined | null;
	}) {
		if (this.currentRoom.getRoomId() !== 'lobby') {
			return;
		}

		RoomManager.getRoomById(data.roomId).joinRoom(this, data.password);
	}

	public onStartGame(data: { gameId: string }): void {
		if (
			this.currentRoom &&
			this.currentRoom.getRoomMaster() === this &&
			this.currentRoom.getCurrentGameId() === null
		) {
			ModuleRegistry.createGame(this.currentRoom, data.gameId);
		}
	}

	public onReceivedGameMessage(eventData: EventDataObject): void {
		if (this.currentRoom) {
			this.currentRoom.onUserNotifiedGame(
				this.id,
				eventData.messageTypeId,
				eventData
			);
		}
	}

	public onGameCancelRequested(): void {
		if (
			this.currentRoom &&
			this.currentRoom.getRoomMaster() === this &&
			this.currentRoom.getCurrentGameId()
		) {
			this.currentRoom.setCurrentGame(null);
			for (const user of this.currentRoom.getRoomMembers()) {
				if (user.getSocket()) {
					SocketManager.sendNotificationBubbleToSocket(
						user.getSocket(),
						`${this.getUsername()} hat das Spiel beendet`,
						'info'
					);
				}
			}
		}
	}

	public onRoomNameChangeRequested(eventData: EventDataObject): void {
		const newRoomName = eventData.newRoomName || '';

		if (
			this.currentRoom &&
			this.currentRoom.getRoomMaster() === this &&
			newRoomName.length > 5 &&
			newRoomName.length <= 30
		) {
			this.currentRoom.setRoomName(newRoomName.substring(0, 30));
		}
	}

	public onRoomPassChangeRequested(eventData: EventDataObject): void {
		const newPassword = eventData.newPassword || '';

		if (
			this.currentRoom &&
			this.currentRoom.getRoomMaster() === this &&
			newPassword.length <= 50
		) {
			this.currentRoom.setRoomPassword(newPassword || null);
		}
	}

	public onGameConfigEdited(eventData: EventDataObject): void {
		if (this.currentRoom) {
			this.currentRoom.updateGameConfig(eventData, this.id);
		}
	}

	public onGameConfigFinished(eventData: EventDataObject): void {
		if (this.currentRoom) {
			this.currentRoom.onGameConfigSaved(eventData, this.id);
		}
	}

	public onGameConfigPubliclyChanged(eventData: EventDataObject): void {
		if (this.currentRoom) {
			this.currentRoom.onGameConfigPubliclyStateChanged(eventData, this.id);
		}
	}
}
