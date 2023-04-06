import EventManager from './EventManager';
import Cookies from 'universal-cookie';
import socketManager from './SocketManager';
import RoomManager from './RoomManager';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';

/**
 * Stores and manages all data concerning the users own profile
 */

export const ProfileEventNames = {
	profileChangedEventNotified: 'profileChangedEventNotified',
	profileUpdated: 'profileUpdated',
};

type ServerProfileObject = {
	id: string;
	username: string;
	pictureUrl: string | null;
	verified: boolean;
	authSessionId: string | null;
};

class ProfileManager {
	private id: string = '0';
	private username: string = 'loading';
	private verified: boolean = false;
	private picture: string | null = null;
	private authSessionId: string | null = null;

	constructor() {
		EventManager.subscribe(
			ProfileEventNames.profileChangedEventNotified,
			this.onProfileChangedEventNotified.bind(this)
		);
	}

	onProfileChangedEventNotified(data?: EventDataObject): void {
		if (!data) {
			return;
		}

		data = data as ServerProfileObject; // just for correct typechecking

		// try automatic login, if the user has no session set
		if (data.authSessionId === null) {
			this.attemptAutomaticAuthLogin();
		}

		if (this.authSessionId !== data.authSessionId) {
			// if we have received an authSessionId after successful login, we store it as a cookie
			const cookies = new Cookies();
			cookies.set('authSession', data.authSessionId, {
				path: '/',
				sameSite: true,
				maxAge: 30 * 24 * 60 * 60, // 30 days
			});
		}

		this.id = data.id;
		this.username = data.username;
		this.verified = data.verified;
		this.picture = data.pictureUrl;
		this.authSessionId = data.authSessionId;

		EventManager.publish(ProfileEventNames.profileUpdated);
	}

	public attemptAutomaticAuthLogin(): void {
		const cookies = new Cookies();
		let authSessionCookie = cookies.get('authSession');
		if (authSessionCookie) {
			this.attemptAuthentication(true, '', authSessionCookie);
		}
	}

	public getUsername(): string {
		return this.username;
	}

	public getId(): string {
		return this.id;
	}

	public getPicture(): string | null {
		return this.picture;
	}

	public isVerified(): boolean {
		return this.verified;
	}

	public isRoomMaster(): boolean {
		return this.id === RoomManager.getRoomMaster()?.getId();
	}

	public attemptAuthentication(
		isAuthSession: boolean,
		username: string,
		password: string
	): void {
		if (password) {
			socketManager.sendEvent('userLoginAttempt', {
				isAuthSessionId: isAuthSession,
				username: username,
				password: password,
			});
		}
	}
}

const profileManager = new ProfileManager();
export default profileManager;
