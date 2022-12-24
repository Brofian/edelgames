import { Server, Socket } from 'socket.io';
import User from './User';
import RoomManager from './RoomManager';
import debug from './util/debug';

export default class Controller {
	public static io: Server;
	public static connectedUsers = 0;

	constructor(io: Server) {
		Controller.io = io;
	}

	onConnect(socket: Socket): void {
		// create user and register disconnect listener
		const user: User = new User(socket);
		socket.on('disconnect', this.onDisconnect.bind(this, socket, user));

		// debug output
		Controller.connectedUsers++;
		debug(
			2,
			`user ${user.getId()} (socket ${socket.id}) connected! (${
				Controller.connectedUsers
			} users in total)`
		);

		// switch user into lobby
		RoomManager.getLobbyRoom().joinRoom(user);
	}

	onDisconnect(socket: Socket, user: User): void {
		Controller.connectedUsers--;
		debug(
			2,
			`user ${user.getId()} (socket ${socket.id}) disconnected! (${
				Controller.connectedUsers
			} users remaining)`
		);
		user.destroyUser();
	}
}
