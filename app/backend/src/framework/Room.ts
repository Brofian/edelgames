import User from './User';
import SocketManager from './util/SocketManager';
import roomManager from './RoomManager';
import { systemLogger } from './util/Logger';
import ModuleApi from './modules/ModuleApi';
import {
	EventDataObject,
	ServerRoomMember,
	ServerRoomObject,
} from '@edelgames/types/src/app/ApiTypes';

export default class Room {
	protected roomId: string;
	protected roomName: string;
	protected roomMembers: User[] = [];
	protected roomMaster: User | null;
	protected roomPassword: string | null = null;
	protected moduleApi: ModuleApi | null = null;
	protected isEditingGameConfig = false;

	constructor(roomMaster: User | null) {
		this.roomId = this.createIdHash();
		this.roomName = `${roomMaster?.getUsername() || '???'}'s Raum`;
		this.roomMaster = roomMaster;
		if (roomMaster) this.roomMembers = [roomMaster];

		systemLogger.debug(
			`created room ${this.roomName} (${this.roomId}) with user ${
				this.roomMaster ? this.roomMaster.getId() : 'NONE'
			}`
		);
	}

	public getRoomId(): string {
		return this.roomId;
	}

	public getRoomName(): string {
		return this.roomName;
	}

	public getRoomMembers(): User[] {
		return this.roomMembers;
	}

	public getRoomPassword(): string | null {
		return this.roomPassword;
	}

	public getCurrentGameId(): string | null {
		return this.moduleApi ? this.moduleApi.getGameId() : null;
	}

	public isInConfigEditMode(): boolean {
		return this.isEditingGameConfig;
	}

	public shuffleMemberList(): void {
		for (let i = this.roomMembers.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.roomMembers[i], this.roomMembers[j]] = [
				this.roomMembers[j],
				this.roomMembers[i],
			];
		}
	}

	public getRoomMaster(): User | null {
		// if we don´t have a room master, we select another user as the room master
		if (this.roomMaster === null && this.roomMembers.length > 0) {
			this.roomMaster = this.roomMembers[0];
		}
		return this.roomMaster;
	}

	public setRoomName(newName: string): void {
		if (newName !== this.roomName) {
			this.roomName = newName;
			this.sendRoomChangedBroadcast();
		}
	}

	public setRoomPassword(newPassword: string | null): void {
		if (newPassword !== this.roomPassword) {
			this.roomPassword = newPassword;
			this.sendRoomChangedBroadcast();
		}
	}

	public setCurrentGame(roomApi: ModuleApi | null) {
		if (this.moduleApi && roomApi === null) {
			this.moduleApi.getEventApi().alertEvent('gameStopped', {});
			systemLogger.info(
				`stopped current game ${this.moduleApi.getGameId()} in room ${
					this.roomId
				}`
			);
		}

		if (roomApi !== null) {
			this.shuffleMemberList();
		}

		this.moduleApi = roomApi;
		// in case there is no config, we skip the configuration completely, otherwise set the room to the config edit state
		this.isEditingGameConfig =
			this.moduleApi &&
			this.moduleApi.getConfigApi().getInternalConfiguration().hasConfig();

		if (!this.isEditingGameConfig) {
			systemLogger.debug(
				`Skipping empty configuration for ${
					roomApi ? roomApi.getGameId() : 'IDLE'
				}`
			);
		}

		this.sendRoomChangedBroadcast();

		systemLogger.info(
			`started game ${roomApi ? roomApi.getGameId() : 'IDLE'} in room ${
				this.roomId
			}`
		);
	}

	public onUserNotifiedGame(
		userId: string,
		eventName: string,
		eventData: { [key: string]: unknown }
	) {
		if (this.moduleApi) {
			this.moduleApi.getEventApi().alertEvent(
				eventName,
				{
					senderId: userId,
					...eventData,
				},
				true
			);
			systemLogger.debug(`user ${userId} notified the gameEvent ${eventName}`);
		}
	}

	/*
	 * alerts every member of this room, that something has changed, so data can be refreshed
	 */
	public sendRoomChangedBroadcast(): void {
		const api = this.moduleApi;
		const config = api
			? api.getConfigApi().getInternalConfiguration().getNativeConfiguration()
			: null;

		const roomChangedData: ServerRoomObject = {
			roomId: this.roomId,
			roomName: this.roomName,
			requirePassphrase: !!this.roomPassword,
			roomMembers: this.getPublicRoomMemberList(),
			currentGameId: api ? api.getGameId() : null,
			currentGameConfig: config,
			isEditingGameConfig: this.isEditingGameConfig,
		};
		this.broadcastRoomMembers('roomChanged', roomChangedData);

		roomManager.updateLobbyMembersRoomData();
	}

	/*
	 * Sends a message with the given event to every member of this room
	 */
	public broadcastRoomMembers(eventName: string, data: object): void {
		SocketManager.broadcast(this.roomId, eventName, data);
	}

	private createIdHash(): string {
		return Math.random().toString().slice(2);
	}

	public getMemberCount(
		onlyConnected = false,
		onlyAuthenticated = false
	): number {
		let members = this.roomMembers;
		if (onlyConnected) {
			members = members.filter((member) => member.isConnected());
		}
		if (onlyAuthenticated) {
			members = members.filter((member) => member.isVerified());
		}
		return members.length;
	}

	/*
	 * Adds the given user to the current room. If a passphrase is used, it will be checked and eventually block the user from joining
	 */
	public joinRoom(newMember: User, passphrase: string | null = null): boolean {
		if (this.roomPassword && passphrase !== this.roomPassword) {
			SocketManager.sendNotificationBubbleToSocket(
				newMember.getSocket(),
				'Falsches Passwort',
				'error'
			);
			return false;
		}

		this.roomMembers.push(newMember);
		if (this.moduleApi) {
			this.moduleApi.getEventApi().alertEvent('userJoined', {
				newUser: newMember,
				userList: this.getPublicRoomMemberList(),
			});
		}
		newMember.switchRoom(this).then(this.sendRoomChangedBroadcast.bind(this));

		systemLogger.debug(
			`user ${newMember.getId()} joined room ${
				this.roomId
			} (using passphrase: ${this.roomPassword ? 'yes' : 'no'})`
		);
		return true;
	}

	public onUserReconnect(user: User): void {
		if (this.moduleApi) {
			this.moduleApi.getEventApi().alertEvent('userReconnected', {
				user: user,
			});
		}
	}

	/**
	 * @internal
	 * this should only be called, when the user object also changes! never on its own!
	 * otherwise there could be a user in a room, that is not registered in said room.
	 *
	 * So. simply. dont. use. this. method. if. you. dont. know. what. you. will. cause. thanks.
	 */
	public removeUserFromRoom(user: User) {
		this.roomMembers = this.roomMembers.filter((member) => member !== user);

		if (this.moduleApi) {
			this.moduleApi.getEventApi().alertEvent('userLeft', {
				removedUser: user,
				userList: this.getPublicRoomMemberList(),
			});
		}

		const hasAuthenticatedMembers = this.getMemberCount(false, true) > 0;
		const hasConnectedMembers = this.getMemberCount(true) > 0;
		if (!hasAuthenticatedMembers && !hasConnectedMembers) {
			this.setCurrentGame(null);
			for (const member of this.roomMembers.filter(
				(member) => !member.isConnected()
			)) {
				// destroy disconnected, unauthenticated users (as they are not able to rejoin)
				member.destroyUser();
			}
			roomManager.removeRoom(this);
		} else if (this.roomMaster === user) {
			this.roomMaster = this.roomMembers[0];
		}

		this.sendRoomChangedBroadcast();
		systemLogger.debug(`user ${user.getId()} left room ${this.roomId}`);
	}

	/*
	 * Returns a version of the member list of this room, that only contains public information
	 */
	getPublicRoomMemberList(): ServerRoomMember[] {
		return this.roomMembers.map((member: User) => {
			return {
				username: member.getUsername(),
				id: member.getId(),
				picture: member.getPicture(),
				isRoomMaster: member === this.roomMaster,
				isConnected: member.isConnected(),
			};
		});
	}

	updateGameConfig(eventData: EventDataObject, senderId: string): void {
		if (!this.isEditingGameConfig || !this.moduleApi || !this.getRoomMaster()) {
			return;
		}

		const config = this.moduleApi.getConfigApi().getInternalConfiguration();

		if (
			this.getRoomMaster().getId() !== senderId &&
			!config.isPublicEditable()
		) {
			this.moduleApi
				.getPlayerApi()
				.sendPlayerBubble(
					senderId,
					'Nur der Spielleiter kann aktuell die Konfiguration ändern',
					'error'
				);
			return;
		}

		const { changedValueName, newValue } = eventData;
		const result = config.setValueByName(changedValueName, newValue);

		if (result !== true) {
			this.moduleApi.getPlayerApi().sendPlayerBubble(senderId, result, 'error');
			return;
		}

		// update changes to all players
		this.sendRoomChangedBroadcast();
	}

	onGameConfigSaved(eventData: EventDataObject, senderId: string): void {
		if (
			!this.isEditingGameConfig ||
			!this.moduleApi ||
			!this.getRoomMaster() ||
			this.getRoomMaster().getId() !== senderId
		) {
			return;
		}

		const config = this.moduleApi.getConfigApi().getInternalConfiguration();

		if (config.isFullyConfigured()) {
			this.isEditingGameConfig = false;
			this.sendRoomChangedBroadcast();
			this.moduleApi.getGame().__initialize(this.moduleApi);
		}
	}

	onGameConfigPubliclyStateChanged(
		eventData: EventDataObject,
		senderId: string
	): void {
		if (!this.getRoomMaster() || senderId !== this.getRoomMaster().getId()) {
			return;
		}

		const { newVisibilityState } = eventData;
		this.moduleApi
			.getConfigApi()
			.getInternalConfiguration()
			.setPubliclyEditable(!!newVisibilityState);
		this.sendRoomChangedBroadcast();
	}

	// returns, if players can join the room
	public isPlayerJoinAllowed(): boolean {
		return (
			!this.moduleApi || this.moduleApi.getGameDefinition().allowLateJoin()
		);
	}
}
