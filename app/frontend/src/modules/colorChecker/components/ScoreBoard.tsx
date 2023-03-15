import { Component } from 'react';
import { SelectableColors } from './ColorGridBox';
import {
	ColorGrid,
	GameStates,
} from '@edelgames/types/src/modules/colorChecker/CCTypes';

interface IProps {
	reservedBonusPoints: boolean[];
	finishedColors: boolean[];
	grid: ColorGrid;
	gameState: GameStates;
	remainingPlayers: number;
}

export default class ScoreBoard extends Component<IProps, {}> {
	render() {
		return (
			<div className={'scoreboard'}>
				<div className={'bonus-panel'}>
					{SelectableColors.map(this.renderBonusPanelRow.bind(this))}
				</div>

				<div className={'point-hints'}>
					<div className={'bold'}>Gesamtpunktzahl =</div>
					<div className={'indent'}>+ Vollständige Spalten</div>
					<div className={'indent'}>+ Vollständig ausgefüllte Farben</div>
					<div className={'indent'}>+ Übrige Joker</div>
					<div className={'indent'}>- Offene Sterne x2</div>
				</div>

				<div className={'status-board'}>
					<div className={'bold'}>Status:</div>
					{this.getGameStateMessage()}
				</div>
			</div>
		);
	}

	getGameStateMessage(): string {
		switch (this.props.gameState) {
			case GameStates.ACTIVE_PLAYER_SELECTS:
				return 'Der aktive Spieler darf zuerst seinen Zug machen';
			case GameStates.PASSIVE_PLAYERS_SELECTS:
				return `Alle nicht aktiven Spielern, dürfen ihren Zug mit den übrigen Würfeln machen. ${this.props.remainingPlayers} verbleibend`;
		}
		return '';
	}

	renderBonusPanelRow(color: string, index: number): JSX.Element {
		const isReserved = this.props.reservedBonusPoints[index];
		const isReached = this.props.finishedColors[index];

		return (
			<div className={'color-bonus-row'} key={'color-bonus-' + color}>
				<div
					className={'color-bonus-cell color-bonus-preview'}
					style={{
						backgroundColor: color,
					}}
				></div>
				<div className={'color-bonus-cell'}>
					<span className={isReserved ? 'striked' : isReached ? 'circled' : ''}>
						5
					</span>
				</div>
				<div className={'color-bonus-cell'}>
					<span className={isReserved && isReached ? 'circled' : ''}>3</span>
				</div>
			</div>
		);
	}
}