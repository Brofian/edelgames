import ModuleGame from '../../framework/modules/ModuleGame';
import {
	GamePhase,
	GameState,
	HangmanScoreboard,
	LetterHint,
	PlayerGuessedEventData,
	PlayerSubmittedWordEventData,
} from '@edelgames/types/src/modules/hangman/HMTypes';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import DrawAndGuess from '../drawAndGuess/DrawAndGuess';
import {
	alphabet,
	specialChars,
} from '../../framework/modules/configuration/elements/Collections';

export enum HangmanClientToServerEventNames {
	PLAYER_GUESSED = 'playerGuessed',
	PLAYERS_SUBMITTED_WORD = 'playerSubmittedWord',
}

const syntaxCharacters = [' ', ',', '.', '-', '?', '!'];
const allowedCharacters = [...alphabet, ...specialChars, ...syntaxCharacters];

/*
 * The actual game instance, that controls and manages the game
 */
export default class HangmanGame extends ModuleGame {
	// technical properties
	clientUpdateInterval: NodeJS.Timer = null;

	// configuration
	generateWordsAutomatically: boolean;
	minWordLength: number;
	maxWordLength: number;
	scoreWinningThreshold: number;
	turnWinningThreshold: number;
	maxWrongGuesses: number;

	// game values
	turn = 0;
	round = 0;
	currentHostIndex = -1;
	activeGuesserIndex = -1;
	currentWord: string = undefined;
	guessedChars: string[] = [];
	isOnWinningTimeout = false;
	winningTimeoutMs = 3000;
	isOnGameOverTimeout = false;
	gameOverTimeoutMs = 6000;
	scoreboard: HangmanScoreboard = [];
	gameFinishState: string | undefined = undefined;

	// generated values
	activeGuesserId: string;
	currentHostId: string = undefined;

	onGameInitialize(): void {
		this.generateWordsAutomatically = this.api
			.getConfigApi()
			.getBooleanConfigValue('automated_words', false);
		this.minWordLength = this.api
			.getConfigApi()
			.getSingleNumberConfigValue('min_word_length', 5);
		this.maxWordLength = this.api
			.getConfigApi()
			.getSingleNumberConfigValue('max_word_length', 15);
		this.scoreWinningThreshold = this.api
			.getConfigApi()
			.getSingleNumberConfigValue('score_winning_threshold', 50);
		this.turnWinningThreshold = this.api
			.getConfigApi()
			.getSingleNumberConfigValue('turn_winning_threshold', 10);
		this.maxWrongGuesses = this.api
			.getConfigApi()
			.getSingleNumberConfigValue('max_wrong_guesses', 0);

		if (this.minWordLength > this.maxWordLength) {
			this.maxWordLength = this.minWordLength + 1;
			this.api
				.getPlayerApi()
				.sendRoomBubble(
					'Maximale Wortlänge geändert auf ' + this.maxWordLength,
					'warning'
				);
		}

		for (const member of this.api.getPlayerApi().getRoomMembers()) {
			this.scoreboard.push({
				playerId: member.getId(),
				points: 0,
			});
		}

		this.api
			.getEventApi()
			.addEventHandler(
				HangmanClientToServerEventNames.PLAYER_GUESSED,
				this.onPlayerGuessed.bind(this)
			);
		this.api
			.getEventApi()
			.addEventHandler(
				HangmanClientToServerEventNames.PLAYERS_SUBMITTED_WORD,
				this.onPlayerSubmittedWord.bind(this)
			);

		this.startNewRound();

		this.clientUpdateInterval = setInterval(
			this.updateClients.bind(this),
			5000
		);
	}

	onGameStopped(): void {
		clearInterval(this.clientUpdateInterval);
	}

	/**
	 * Starts a new round by resetting data and requesting or generating a new word
	 */
	startNewRound(): void {
		if (this.turn === 0) {
			this.round++;
		}

		this.turn =
			(this.turn + 1) % this.api.getPlayerApi().getRoomMembers().length;
		this.isOnWinningTimeout = false;
		this.isOnGameOverTimeout = false;

		if (this.scoreWinningThreshold > 0) {
			if (
				this.scoreboard.find((sb) => sb.points >= this.scoreWinningThreshold)
			) {
				this.finishGame('scoreLimitReached');
				return;
			}
		}

		if (
			this.turnWinningThreshold > 0 &&
			this.round > this.turnWinningThreshold
		) {
			this.finishGame('turnLimitReached');
			return;
		}

		// reset old data
		this.guessedChars = [];

		if (this.generateWordsAutomatically) {
			// generate the next word
			this.currentWord = this.generateNewWord();
		} else {
			// cycle to next word host
			const roomMembers = this.api.getPlayerApi().getRoomMembers();
			this.currentHostIndex = (this.currentHostIndex + 1) % roomMembers.length;
			this.currentHostId = roomMembers[this.currentHostIndex].getId();

			// unset the old word
			this.currentWord = undefined;
		}

		this.continueGuessingWithNextPlayer(false);
	}

	// sets the game into the finished state and displays the scoreboard
	finishGame(reason: string): void {
		this.gameFinishState = reason;
		clearInterval(this.clientUpdateInterval);
		this.updateClients();
	}

	/**
	 * Rotates the guessing player while skipping the current host
	 * @param preventUpdatingClients
	 */
	continueGuessingWithNextPlayer(preventUpdatingClients = false): void {
		const roomMembers = this.api.getPlayerApi().getRoomMembers();
		this.activeGuesserIndex =
			(this.activeGuesserIndex + 1) % roomMembers.length;
		this.activeGuesserId = roomMembers[this.activeGuesserIndex].getId();

		if (this.activeGuesserId === this.currentHostId && roomMembers.length > 1) {
			this.continueGuessingWithNextPlayer();
		}

		if (!preventUpdatingClients) {
			this.updateClients();
		}
	}

	/**
	 * Is called as soon as the active guesser sends a char.
	 * If it is valid, but not correct, the next user may guess.
	 * If it is valid and correct, the player can continue to guess (except if the word is complete)
	 * @param eventData
	 */
	onPlayerGuessed(eventData: EventDataObject): void {
		const { senderId } = eventData;
		let { char } = eventData as PlayerGuessedEventData;

		char = char.toLowerCase();

		if (senderId !== this.activeGuesserId) {
			return;
		}

		if (!allowedCharacters.includes(char)) {
			this.api
				.getPlayerApi()
				.sendPlayerBubble(
					senderId,
					`Das Symbol "${char}" ist nicht erlaubt!`,
					'error'
				);
			return;
		}

		if (this.guessedChars.includes(char)) {
			this.api
				.getPlayerApi()
				.sendPlayerBubble(
					senderId,
					`Das Symbol "${char.toUpperCase()}" wurde bereits geraten!`,
					'error'
				);
			return;
		}

		this.guessedChars.push(char);

		const isCorrectGuess = this.currentWord.includes(char);
		if (!isCorrectGuess) {
			const wrongChars = this.guessedChars.filter(
				(char) => !this.currentWord.includes(char)
			);

			if (
				this.maxWrongGuesses > 0 &&
				wrongChars.length > this.maxWrongGuesses
			) {
				this.isOnGameOverTimeout = true;
				setTimeout(this.startNewRound.bind(this), this.gameOverTimeoutMs);
				this.updateClients();
			} else {
				this.continueGuessingWithNextPlayer();
			}

			return;
		}

		// check winning condition
		const isWordGuessedCorrectly = this.currentWord
			.split('')
			.every(
				(char) =>
					this.guessedChars.includes(char) || syntaxCharacters.includes(char)
			);
		if (isWordGuessedCorrectly) {
			this.isOnWinningTimeout = true;
			setTimeout(this.startNewRound.bind(this), this.winningTimeoutMs);
			// two times the length of the word as points for the player, who solved it
			this.addPointsToPlayer(senderId, this.currentWord.length);
		} else if (isCorrectGuess) {
			// one point for every correct character, that does not solve the word
			const numMatchingChars = this.currentWord
				.split('')
				.filter((c) => c === char).length;
			this.addPointsToPlayer(senderId, numMatchingChars);
		}

		this.updateClients();
	}

	addPointsToPlayer(playerId: string, points: number): void {
		const playerScore = this.scoreboard.find((sb) => sb.playerId === playerId);
		if (playerScore) {
			playerScore.points += points;
		}
	}

	/**
	 * Is called as soon as the current host sends a word. If it is valid, the other players are allowed to guess now
	 * @param eventData
	 */
	onPlayerSubmittedWord(eventData: EventDataObject): void {
		const { senderId } = eventData;
		let { word } = eventData as PlayerSubmittedWordEventData;

		word = word.toLowerCase().trim();

		if (senderId !== this.currentHostId || typeof word !== 'string') {
			return;
		}

		let containsLetterChars = false;

		// check if every character is allowed
		for (const char of word.split('')) {
			if (!allowedCharacters.includes(char)) {
				this.api
					.getPlayerApi()
					.sendPlayerBubble(
						senderId,
						`Das Symbol "${char.toUpperCase()}" ist nicht erlaubt!`,
						'error'
					);
				return;
			} else if (
				!containsLetterChars &&
				(alphabet.includes(char) || specialChars.includes(char))
			) {
				containsLetterChars = true;
			}
		}

		if (!containsLetterChars) {
			this.api
				.getPlayerApi()
				.sendPlayerBubble(senderId, `Das Wort muss Buchstaben enthalten!`);
			return;
		}

		if (word.length < this.minWordLength || word.length > this.maxWordLength) {
			this.api
				.getPlayerApi()
				.sendPlayerBubble(
					senderId,
					`Das Wort muss zwischen ${this.minWordLength} und ${this.maxWordLength} Zeichen lang sein!`
				);
			return;
		}

		this.currentWord = word;
		this.updateClients();
	}

	/**
	 * Sends an update event to all connected clients, containing the current game data
	 */
	updateClients(): void {
		const solutionChars = (this.currentWord || '').split('');
		const letters: LetterHint[] = solutionChars.map((char) => {
			if (this.guessedChars.includes(char) || syntaxCharacters.includes(char)) {
				return { state: 'guessed', value: char };
			}
			if (this.isOnGameOverTimeout) {
				return { state: 'gameover', value: char };
			}

			return null;
		});
		const wrongChars = this.guessedChars.filter(
			(char) => !solutionChars.includes(char)
		);

		const currentPhase: GamePhase = this.getCurrentPhase();

		this.api.getPlayerApi().sendRoomMessage('gameStateUpdated', {
			phase: currentPhase,
			round: this.round,
			currentHostId: this.currentHostId,
			activeGuesserId: this.activeGuesserId,
			wrongChars: wrongChars,
			letters: letters,
			configuration: {
				autoGeneratedWords: this.generateWordsAutomatically,
				maxWordLength: this.maxWordLength,
				minWordLength: this.minWordLength,
				scoreWinningThreshold: this.scoreWinningThreshold,
				turnWinningThreshold: this.turnWinningThreshold,
				maxWrongGuesses: this.maxWrongGuesses,
			},
			scoreboard: this.scoreboard,
		} as GameState);
	}

	getCurrentPhase(): GamePhase {
		if (this.gameFinishState !== undefined) {
			return 'finished';
		}

		if (this.isOnWinningTimeout || this.isOnGameOverTimeout) {
			return 'waiting';
		}

		return this.currentWord === undefined ? 'spelling' : 'guessing';
	}

	/**
	 * Returns a new word from the DrawAndGuess Wordlist, trying to follow the configured word length (but not forcing)
	 */
	generateNewWord(): string {
		const wordList = DrawAndGuess.getWordList();
		const validWordList = wordList.filter((word) => {
			return (
				word.length >= this.minWordLength && word.length <= this.maxWordLength
			);
		});

		return validWordList.length
			? validWordList[Math.floor(Math.random() * validWordList.length)]
			: wordList[Math.floor(Math.random() * wordList.length)];
	}

	public onPlayerReconnect() {
		this.updateClients();
	}
}
