import ModuleGame from '../../framework/modules/ModuleGame';
import ModuleApi from '../../framework/modules/ModuleApi';
import AbstractState from './gameStates/AbstractState';
import InitialState from './gameStates/InitialState';
import { Team } from './Team';
import Room from '../../framework/Room';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import { Category, Hint } from '@edelgames/types/src/modules/codenames/CNTypes';
import { BoardElement } from './BoardElement';

/*
 * The actual game instance, that controls and manages the game
 */
export default class CodenamesGame extends ModuleGame {
	gameApi: ModuleApi | null = null;
	gameState: AbstractState;
	gameMembers: Team[];
	room: Room;
	board: BoardElement[] = [];
	hint: Hint[] = [];

	onGameInitialize(): void {
		this.gameApi = this.api;
		this.room = this.gameApi.getPlayerApi().getRoom();
		this.gameApi
			.getEventApi()
			.addEventHandler(
				'userMessageSend',
				this.onUserMessageReceived.bind(this)
			);
		this.gameApi
			.getEventApi()
			.addEventHandler('requestGameState', this.onGameStateRequest.bind(this));
		this.gameState = new InitialState(this.gameApi);
		this.gameMembers = [new Team('A', 5), new Team('B', 5)];
		this.sendCurrentStateOfGame();
	}

	onPlayerJoin() {
		this.sendCurrentStateOfGame();
	}

	onPlayerLeave(eventData: EventDataObject) {
		this.gameState.handleUserLeave(this.gameMembers, eventData.senderId);
		this.sendCurrentStateOfGame();
	}

	onUserMessageReceived(eventData: EventDataObject) {
		this.gameApi
			.getLogger()
			.debug(
				`User ID ${eventData.senderId} send in message: `,
				eventData.action
			);
		this.gameState = this.gameState.onStateChange(
			eventData,
			this.gameMembers,
			this.room,
			this.board,
			this.hint
		);

		this.sendCurrentStateOfGame();
	}

	onGameStateRequest(eventData: EventDataObject) {
		this.gameApi
			.getLogger()
			.debug(`User ID ${eventData.senderId} requestes current gameState`);
		this.sendCurrentStateOfGame();
	}

	sendCurrentStateOfGame() {
		this.gameApi.getEventApi().sendRoomMessage('serverMessageSend', {
			state: this.gameState.getName(),
			teams: this.gameMembers.map(
				(team) =>
					({
						name: team.name,
						spymaster: this.getUserNameById(team.spymaster),
						wordsLeft: team.wordsLeft,
						investigators: team.investigators.map((inv) =>
							this.getUserNameById(inv)
						),
						active: team.active,
					} as Team)
			),
			hint: this.hint.pop(),
			historyHints: this.hint,
		});
		this.gameApi
			.getPlayerApi()
			.getRoom()
			.getRoomMembers()
			.forEach((member) =>
				this.gameApi
					.getEventApi()
					.sendPlayerMessage(member.getId(), 'userSpecificBoardViewSent', {
						board: this.generateUserBoard(member.getId()),
					})
			);
		this.gameApi
			.getLogger()
			.debug(
				`New internal State: `,
				this.gameMembers,
				this.gameState.getName()
			);
	}

	getUserNameById(userId: string): string {
		return (
			this.room
				.getRoomMembers()
				?.find((member) => member.getId() === userId)
				?.getUsername() ?? ''
		);
	}

	generateUserBoard(receiverId: string): BoardElement[] {
		return this.board.map((element: BoardElement) => ({
			word: element.word,
			marks: element.marks,
			category: this.filterCategory(
				receiverId,
				element.category,
				element.categoryVisibleForEveryone
			),
			teamName: this.filterTeamName(
				receiverId,
				element.teamName,
				element.categoryVisibleForEveryone
			),
			categoryVisibleForEveryone: element.categoryVisibleForEveryone,
		}));
	}

	filterCategory(
		receiverId: string,
		cardCategory: Category,
		cardVisible: boolean
	): Category | undefined {
		if (
			this.gameMembers.find((team) => team.spymaster === receiverId) ||
			cardVisible
		) {
			return cardCategory;
		}
		return undefined;
	}

	filterTeamName(
		receiverId: string,
		cardTeamName: string,
		cardVisible: boolean
	): string | undefined {
		if (
			this.gameMembers.find((team) => team.spymaster === receiverId) ||
			cardVisible
		) {
			return cardTeamName;
		}
		return undefined;
	}

	public onPlayerReconnect() {
		//const user = eventData.user as User;
		this.sendCurrentStateOfGame();

		// todo: test this and/or extend this method, if necessary
	}
}
