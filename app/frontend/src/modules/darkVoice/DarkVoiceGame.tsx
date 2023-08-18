import React, { ReactNode } from 'react';
import ModuleGameInterface from '../../framework/modules/ModuleGameInterface';
import ModuleApi from '../../framework/modules/ModuleApi';
import darkVoice from './DarkVoice';
import Maze from './components/Maze';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import {
	GameProgressState,
	PlayerScore,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import { GameStateUpdateEventData } from '@edelgames/types/src/modules/darkVoice/dVEvents';
import DataBoard from './components/DataBoard';

interface IState {
	gameProgressState: GameProgressState;
	scores: PlayerScore[];
	monsterPlayerId: string;
}

export default class DarkVoiceGame
	extends React.Component<{}, IState>
	implements ModuleGameInterface
{
	private readonly api: ModuleApi;

	state = {
		gameProgressState: 'BEGINNING' as GameProgressState,
		scores: [],
		monsterPlayerId: 'none',
	};

	constructor(props: {}) {
		super(props);
		this.api = new ModuleApi(darkVoice, this);
		this.api
			.getEventApi()
			.addEventHandler('gameStateUpdate', this.onGameStateUpdated.bind(this));
	}

	componentDidMount() {}

	componentWillUnmount() {}

	onGameStateUpdated(eventData: EventDataObject): void {
		const event = eventData as GameStateUpdateEventData;
		this.setState({
			monsterPlayerId: event.monsterPlayerId,
			gameProgressState: event.gameProgressState,
			scores: event.scores,
		});
	}

	render(): ReactNode {
		return (
			<div id={'darkVoice'}>
				<Maze
					api={this.api}
					gameProgressState={this.state.gameProgressState}
					monsterPlayerId={this.state.monsterPlayerId}
				/>

				<DataBoard
					scores={this.state.scores}
					monsterPlayerId={this.state.monsterPlayerId}
				/>
			</div>
		);
	}
}
