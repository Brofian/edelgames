import ModuleGame from '../../framework/modules/ModuleGame';
import User from '../../framework/User';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import {
	ColorGrid,
	GameStates,
	GridColorOptions,
} from '@edelgames/types/src/modules/colorChecker/CCTypes';
import {
	C2SEvents,
	OnGameStateUpdateEventData,
	OnGridChangedEventData,
	OnJokerRequestedEventData,
	OnPlayerStateUpdateEventData,
	OnRemainingPlayersChangedEventData,
	OnScoresCalculatedEventData,
	OnSelectionMadeEventData,
	S2CEvents,
} from '@edelgames/types/src/modules/colorChecker/CCEvents';
import { defaultGrid } from './gridTemplates/default';
import GridHelper from './helper/GridHelper';
import PlayerHelper from './helper/PlayerHelper';
import DiceHelper from './helper/DiceHelper';
import { variant1Grid } from './gridTemplates/variant_1';
import { variant2Grid } from './gridTemplates/variant_2';
import { variant3Grid } from './gridTemplates/variant_3';

/*
 * The actual game instance, that controls and manages the game
 */
export default class ColorCheckerGame extends ModuleGame {
	// technical properties
	playerIndex = 0;
	activePlayerId: string;
	gameState: GameStates = GameStates.INIT;
	columnOwners: (string | undefined)[] = Array(15).fill(undefined);
	bonusOwners: (string | undefined)[] = Array(5).fill(undefined);
	showOpponentsGrids = false;

	playerHelper = new PlayerHelper();
	diceHelper = new DiceHelper();

	onGameInitialize(): void {
		this.showOpponentsGrids = this.api
			.getConfigApi()
			.getBooleanConfigValue('show_opponents_grids', false);
		const gridTemplateConfig = this.api
			.getConfigApi()
			.getSingleStringConfigValue('grid_template_name', 'default') as string;
		let template = this.getTemplateGrid(gridTemplateConfig);

		for (const member of this.api.getPlayerApi().getRoomMembers()) {
			const newPlayer = this.playerHelper.initiateNewPlayer(member, template);
			this.updateClientPlayerGrid(member.getId(), newPlayer.grid);
			if (gridTemplateConfig === 'random_everyone') {
				template = this.getTemplateGrid('random');
			}
		}

		const eventApi = this.api.getEventApi();
		eventApi.addEventHandler(
			C2SEvents.ON_SELECTION_MADE,
			this.onPlayerSelectionMadeEvent.bind(this)
		);
		eventApi.addEventHandler(
			C2SEvents.ON_JOKER_REQUESTED,
			this.onPlayerRequestedJokerEvent.bind(this)
		);

		this.startNewRound(false);
	}

	getTemplateGrid(gridTemplateConfig: string): ColorGrid {
		switch (gridTemplateConfig) {
			case 'variant_1':
				return variant1Grid;
			case 'variant_2':
				return variant2Grid;
			case 'variant_3':
				return variant3Grid;
			case 'default':
				return defaultGrid;
			default:
				return [variant1Grid, variant2Grid, variant3Grid][
					Math.floor(Math.random() * 3)
				];
		}
	}

	onPlayerSelectionMadeEvent(event: EventDataObject): void {
		const { senderId } = event;
		const { cells } = event as OnSelectionMadeEventData;
		const playerData = this.playerHelper.getDataByPlayerId(senderId);

		if (!playerData || this.playerHelper.isPlayerReady(senderId)) {
			return; // this player has already made a selection or could not be found
		}

		const isActivePlayerPlaying =
			this.gameState === GameStates.ACTIVE_PLAYER_SELECTS &&
			this.activePlayerId === playerData.playerId;
		const isPassivePlayerPlaying =
			this.gameState === GameStates.PASSIVE_PLAYERS_SELECTS &&
			this.activePlayerId !== playerData.playerId;
		if (!isActivePlayerPlaying && !isPassivePlayerPlaying) {
			return; // somehow a player did a move, but was not supposed to
		}

		if (
			GridHelper.isSelectionValid(
				cells,
				playerData.grid,
				playerData.isUsingNumberJoker,
				playerData.isUsingColorJoker,
				this.diceHelper
			)
		) {
			const selectedColor =
				cells.length <= 0
					? '#fff'
					: GridHelper.checkCellsInGrid(cells, playerData.grid);

			this.playerHelper.addReadyPlayer(senderId);
			this.updateClientRemainingPlayers(this.playerHelper.readyPlayers);

			if (cells.length > 0 && selectedColor !== '#fff') {
				playerData.addCellsToHistory(cells);

				// check if the user completed a color
				if (
					GridHelper.checkIfColorIsCompleted(selectedColor, playerData.grid)
				) {
					const colorIndex = SelectableColors.indexOf(selectedColor);
					playerData.finishedColors[colorIndex] = true;
					this.api
						.getPlayerApi()
						.sendRoomBubble(
							`${playerData.playerName} hat eine Farbe vervollständigt!`,
							'info'
						);
					if (!this.bonusOwners[colorIndex]) {
						this.bonusOwners[colorIndex] = playerData.playerId;
					}
				}

				// check if the user completed any column
				const checkedColumns: number[] = [];
				for (const cell of cells) {
					if (checkedColumns.includes(cell.x)) {
						continue;
					}
					checkedColumns.push(cell.x);
					if (GridHelper.checkIfColumnIsCompleted(cell.x, playerData.grid)) {
						playerData.finishedColumns[cell.x] = true;
						this.api
							.getPlayerApi()
							.sendRoomBubble(
								`${playerData.playerName} hat die Spalte  ${
									ColumnIdentifiers[cell.x]
								} vervollständigt!`,
								'info'
							);
						if (!this.columnOwners[cell.x]) {
							this.columnOwners[cell.x] = playerData.playerId;
						}
					}
				}

				this.updateClientPlayerGrid(playerData.playerId, playerData.grid);
			}
			this.updateClientPlayerState(playerData.playerId);

			if (this.playerHelper.allPlayersReady()) {
				// this was probably a passive or a single player. If all of them made their turn, start the next round
				this.startNewRound();
			} else if (isActivePlayerPlaying) {
				// this was the first player, now the others can make their turn, but without the selected dices

				if (selectedColor !== '#fff') {
					this.diceHelper.reserveDicesByValues(
						playerData.isUsingNumberJoker ? 'joker' : cells.length,
						playerData.isUsingColorJoker ? 'joker' : selectedColor
					);
				}

				this.gameState = GameStates.PASSIVE_PLAYERS_SELECTS;
				this.updateClientGameStates();
			}
		} else {
			this.api
				.getEventApi()
				.sendPlayerBubble(senderId, 'Ungültige Auswahl!', 'error');
		}
	}

	onPlayerRequestedJokerEvent(event: EventDataObject): void {
		const { senderId } = event;
		const { type } = event as OnJokerRequestedEventData;
		const playerData = this.playerHelper.getDataByPlayerId(senderId);

		if (!playerData || this.playerHelper.isPlayerReady(senderId)) {
			return; // this player has already made a selection, is not found or has no jokers remaining
		}

		if (
			this.gameState === GameStates.ACTIVE_PLAYER_SELECTS &&
			this.activePlayerId !== playerData.playerId
		) {
			return; // the active player is taking a turn, but this player is not the active one
		}

		if (
			this.gameState === GameStates.PASSIVE_PLAYERS_SELECTS &&
			this.activePlayerId === playerData.playerId
		) {
			return; // the passive players are taking a turn, but this player is the active one
		}

		if (playerData.remainingJokers <= 0) {
			this.api
				.getEventApi()
				.sendPlayerBubble(
					playerData.playerId,
					'Du hast keine Joker mehr übrig!',
					'warning'
				);
			return;
		}

		if (
			type === 'color' &&
			!playerData.isUsingColorJoker &&
			this.diceHelper.isColorAvailable('joker')
		) {
			playerData.isUsingColorJoker = true;
			playerData.remainingJokers--;
			this.updateClientPlayerState(playerData.playerId);
		} else if (
			type === 'number' &&
			!playerData.isUsingNumberJoker &&
			this.diceHelper.isNumberAvailable('joker')
		) {
			playerData.isUsingNumberJoker = true;
			playerData.remainingJokers--;
			this.updateClientPlayerState(playerData.playerId);
		} else {
			this.api
				.getEventApi()
				.sendPlayerBubble(
					playerData.playerId,
					'Du kannst diesen Joker nicht benutzen',
					'warning'
				);
		}
	}

	updateClientRemainingPlayers(finishedPlayers: string[]): void {
		const eventData: OnRemainingPlayersChangedEventData = {
			finishedPlayers: finishedPlayers,
		};
		this.api
			.getEventApi()
			.sendRoomMessage(S2CEvents.ON_REMAINING_PLAYERS_CHANGED, eventData);
	}

	updateClientPlayerGrid(playerId: string, grid: ColorGrid): void {
		const newGridData: OnGridChangedEventData = {
			newGrid: grid,
		};
		// notify player
		this.api
			.getEventApi()
			.sendPlayerMessage(playerId, S2CEvents.ON_GRID_CHANGED, newGridData);
	}

	startNewRound(advancePlayer = true): void {
		if (this.isGameFinished()) {
			this.initiateEndGame();
			return;
		}

		const roomMembers = this.api.getPlayerApi().getRoomMembers();
		if (advancePlayer) {
			this.playerIndex++;
		}
		this.activePlayerId =
			roomMembers[this.playerIndex % roomMembers.length].getId();

		this.diceHelper.roll();
		this.diceHelper.resetDiceReservation();
		this.playerHelper.resetAllJokerUsage();
		this.playerHelper.clearReadyPlayers();
		this.gameState = GameStates.ACTIVE_PLAYER_SELECTS;
		this.updateClientGameStates();

		for (const member of roomMembers) {
			this.updateClientPlayerState(member.getId());
		}
	}

	/*
		The game is finished, if one player has at least two colors fully checked
	 */
	isGameFinished(): boolean {
		for (const playerData of this.playerHelper.players) {
			const finishedColors = playerData.finishedColors.filter(
				(el) => el
			).length;
			if (finishedColors >= 2) {
				return true;
			}
		}
		return false;
	}

	initiateEndGame(): void {
		this.gameState = GameStates.ENDING_SCREEN;
		const points = this.playerHelper.players
			.map((playerData) => {
				return {
					player: playerData.playerId,
					score: playerData.getScore(this.columnOwners, this.bonusOwners),
					grid: playerData.grid,
					history: playerData.cellHistory,
				};
			})
			.sort((a, b) => (a.score.total > b.score.total ? -1 : 1));

		this.updateClientGameStates();
		const eventData: OnScoresCalculatedEventData = {
			points: points,
		};
		this.api
			.getEventApi()
			.sendRoomMessage(S2CEvents.ON_SCORES_CALCULATED, eventData);
	}

	updateClientPlayerState(playerId: string): void {
		const playerData = this.playerHelper.getDataByPlayerId(playerId);
		if (!playerData) {
			return;
		}

		const eventData: OnPlayerStateUpdateEventData = {
			usingNumberJoker: playerData.isUsingNumberJoker,
			usingColorJoker: playerData.isUsingColorJoker,
			remainingJokers: playerData.remainingJokers,
			isPlayerWaiting: this.playerHelper.isPlayerReady(playerId),
			finishedColors: playerData.finishedColors,
			finishedColumns: playerData.finishedColumns,
		};
		this.api
			.getEventApi()
			.sendPlayerMessage(playerId, S2CEvents.ON_PLAYER_STATE_UPDATE, eventData);
	}

	updateClientGameStates(): void {
		const eventData: OnGameStateUpdateEventData = {
			gameState: this.gameState,
			activePlayerId: this.activePlayerId,
			reservedColumnPoints: this.columnOwners,
			currentDiceValues: this.diceHelper.diceValues,
			lastRollTimestamp: this.diceHelper.lastRollTimestamp,
			reservedBonusPoints: this.bonusOwners,
			reservedDiceIndices: this.diceHelper.getReservedDiceIndices(),
			finishedPlayers: this.playerHelper.readyPlayers,
			playerGrids: this.showOpponentsGrids
				? this.playerHelper.getPublicGridData()
				: undefined,
		};
		this.api
			.getEventApi()
			.sendRoomMessage(S2CEvents.ON_GAME_STATE_UPDATE, eventData);
	}

	onPlayerLeave(eventData: EventDataObject): void {
		const removedUser = eventData.removedUser as User;

		if (this.api.getPlayerApi().getRoomMembers().length === 0) {
			this.api.cancelGame();
			return;
		}

		const wasActivePlayer = removedUser.getId() === this.activePlayerId;
		// remove player from list
		this.playerHelper.removePlayer(removedUser.getId());

		if (
			wasActivePlayer &&
			this.gameState === GameStates.ACTIVE_PLAYER_SELECTS
		) {
			// we need a new active player
			this.startNewRound(false);
		} else if (
			wasActivePlayer &&
			this.gameState === GameStates.PASSIVE_PLAYERS_SELECTS
		) {
			// do nothing, let the players finish this round
		} else if (
			!wasActivePlayer &&
			this.gameState === GameStates.ACTIVE_PLAYER_SELECTS
		) {
			// do nothing, let the players finish this round
		} else if (
			!wasActivePlayer &&
			this.gameState === GameStates.PASSIVE_PLAYERS_SELECTS &&
			this.playerHelper.allPlayersReady()
		) {
			// seems like all other players have already finished
			this.startNewRound(true);
		}

		this.api
			.getPlayerApi()
			.sendRoomBubble(removedUser.getUsername() + ' left the game', 'error');
	}

	public onPlayerReconnect(eventData: EventDataObject | null) {
		const user = eventData.user as User;
		const playerId = user.getId();
		setTimeout(this.onPlayerReconnectDelayed.bind(this, playerId), 500);
	}

	// execute this after a timeout, to ensure the frontend is loaded
	public onPlayerReconnectDelayed(playerId: string) {
		this.updateClientPlayerState(playerId);
		this.updateClientRemainingPlayers(this.playerHelper.readyPlayers);
		this.updateClientGameStates();
		this.updateClientPlayerGrid(
			playerId,
			this.playerHelper.getDataByPlayerId(playerId).grid
		);
	}
}

export const SelectableColors = [
	GridColorOptions.RED,
	GridColorOptions.YELLOW,
	GridColorOptions.ORANGE,
	GridColorOptions.GREEN,
	GridColorOptions.BLUE,
];

export const ColumnIdentifiers = [
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
];
