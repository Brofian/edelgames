import React, { ReactNode } from 'react';
import ModuleGameInterface from '../../framework/modules/ModuleGameInterface';
import ModuleApi from '../../framework/modules/ModuleApi';
import darkVoice from './DarkVoice';
import Maze from './components/Maze';

interface IState {}

export default class DarkVoiceGame
	extends React.Component<{}, IState>
	implements ModuleGameInterface
{
	private readonly api: ModuleApi;

	state = {};

	constructor(props: {}) {
		super(props);
		this.api = new ModuleApi(darkVoice, this);
	}

	componentDidMount() {}

	componentWillUnmount() {}

	render(): ReactNode {
		return (
			<div id={'darkVoice'}>
				<Maze api={this.api} />
			</div>
		);
	}
}
