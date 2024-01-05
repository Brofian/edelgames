import React, { ReactNode } from 'react';
import ModuleGameInterface from '../../framework/modules/ModuleGameInterface';
import ModuleApi from '../../framework/modules/ModuleApi';
import curveFever from "./CurveFever";
import SketchFrame from "./components/SketchFrame";
import ServerConnector from "./components/ServerConnector";
import GameStateManager from "./components/GameStateManager";
import Vector from "../../framework/structures/Vector";


interface IState {

}

export default class CurveFeverGame
	extends React.Component<{}, IState>
	implements ModuleGameInterface
{
	private readonly api: ModuleApi;
	private readonly gameState: GameStateManager;
	private readonly serverConnector: ServerConnector;

	constructor(props: any) {
		super(props);
		this.api = new ModuleApi(curveFever, this);
		this.gameState = new GameStateManager();
		this.serverConnector = new ServerConnector(this.gameState, this.api);
	}

	render(): ReactNode {
		return (
			<div id={'curveFever'}>
				<SketchFrame
					width={600}
					height={400}
					connector={this.serverConnector}
					gameState={this.gameState}
				/>
			</div>
		);
	}
}