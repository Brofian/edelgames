import { NativeConfiguration } from './ConfigurationTypes';
import { anyObject } from './BasicTypes';

export type authDataContainer = {
	authCookie: string;
	username: string;
	profileImageUrl: string;
	user_id: number;
	group_id: number;
	custom_title: string;
};

// the data carried by an event on publish
export type EventDataObject = {
	senderId?: string|undefined;
	messageTypeId?: string|undefined;
} & anyObject;

export type EventHandlerFunction = (eventData: EventDataObject) => void;

// a function, that can be passed as a listener to an event
export type ListenerFunction = (data?: EventDataObject) => void;

export type ServerRoomMember = {
	id: string;
	username: string;
	picture: string | null;
	isRoomMaster: boolean;
	isConnected: boolean;
};

export type ServerRoomObject = {
	roomId: string;
	roomName: string;
	requirePassphrase: boolean;
	roomMembers: ServerRoomMember[];
	currentGameId: string;
	currentGameConfig: NativeConfiguration | null;
	isEditingGameConfig: boolean;
};

export interface IUser {
	getUsername(): string;
	getId(): string;
	getPicture(): string | null;
}