import { Component } from 'react';
import { GuessingProps } from '../types/SLFTypes';
import { Guesses } from '@edelgames/types/src/modules/stadtLandFluss/SLFTypes';

/**
 * Component for the guessing screen.
 */
export default class SLFGuessing extends Component<GuessingProps, {}> {
	/**
	 * Holds a reference to the timeout, after which unsaved guesses will be saved.
	 */
	private blurTimeout: NodeJS.Timeout | null = null;

	/**
	 * Send the current guesses to the server.
	 *
	 * @param {boolean} ready
	 */
	private sendGuessesToServer(ready: boolean) {
		// @ts-ignore
		let guessInputs = document
			.getElementById('slfGuessing')
			.getElementsByTagName('input');
		let guesses: Guesses = {};
		for (let i = 0; i < guessInputs.length; i++) {
			const guessMetadata = guessInputs.item(i)?.id?.split('_') ?? [];

			if (!guesses[guessMetadata[0]]) {
				guesses[guessMetadata[0]] = {};
			}
			if (!guesses[guessMetadata[0]][guessMetadata[1]]) {
				guesses[guessMetadata[0]][guessMetadata[1]] = {};
			}

			guesses[guessMetadata[0]][guessMetadata[1]][guessMetadata[2]] =
				guessInputs.item(i)?.value?.trim() ?? '';
		}

		this.props.gameApi
			.getEventApi()
			.sendMessageToServer('updateGuesses', { guesses: guesses, ready: ready });
	}

	/**
	 * Start timer when an input field is left.
	 */
	private onBlur() {
		if (this.blurTimeout !== null) {
			clearTimeout(this.blurTimeout);
		}
		this.blurTimeout = setTimeout(
			this.sendGuessesToServer.bind(this, false),
			2500
		);
	}

	/**
	 * Submit guesses and toggle the ready state.
	 */
	private onSubmitGuesses() {
		if (this.blurTimeout !== null) {
			clearTimeout(this.blurTimeout);
		}
		let guessInputCollection: HTMLCollectionOf<HTMLInputElement> = document
			.getElementById('slfGuessing')
			?.getElementsByTagName('input') as HTMLCollectionOf<HTMLInputElement>;
		let button: HTMLButtonElement = document.getElementById(
			'submitGuesses'
		) as HTMLButtonElement;

		if (button.classList.contains('submitted')) {
			button.classList.remove('submitted');
			for (let i = 0; i < guessInputCollection.length; i++) {
				guessInputCollection.item(i)?.classList.remove('blocked');
			}
			this.props.gameApi.getEventApi().sendMessageToServer('unready', {});
		} else {
			button.classList.add('submitted');
			for (let i = 0; i < guessInputCollection.length; i++) {
				guessInputCollection.item(i)?.classList.add('blocked');
			}
			this.sendGuessesToServer(true);
		}
	}

	/**
	 * Render the component.
	 */
	render() {
		let localePlayerId = this.props.gameApi
			.getPlayerApi()
			.getLocalePlayer()
			.getId();

		return (
			<div id={'slfGuessing'}>
				<p>
					Runde {this.props.round} von {this.props.max_rounds}
				</p>
				<p>Buchstabe: {this.props.letter}</p>
				<table>
					<thead>
						<tr>
							<th>Kategorie</th>
							<th>Deine Antwort</th>
						</tr>
					</thead>
					<tbody>
						{this.props.categories.map((c: string) => (
							<tr>
								<td>{c}</td>
								{/* @ts-ignore */}
								<td>
									<input
										onBlur={this.onBlur.bind(this)}
										type={'text'}
										id={`${localePlayerId}_${this.props.letter}_${c}`}
										key={`${localePlayerId}_${this.props.letter}_${c}`}
										defaultValue={
											this.props.guesses[localePlayerId]?.[this.props.letter]?.[
												c
											]
										}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<br />
				<button id={'submitGuesses'} onClick={this.onSubmitGuesses.bind(this)}>
					Fertig! ({this.props.ready_users} von {this.props.user_count})
				</button>
			</div>
		);
	}
}
