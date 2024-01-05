import React, { ReactNode } from 'react';
import ModuleGameInterface from '../../framework/modules/ModuleGameInterface';
import ModuleApi from '../../framework/modules/ModuleApi';
import curveFever from "./CurveFever";
import SketchFrame from "./components/SketchFrame";


interface IState {

}

export default class CurveFeverGame
	extends React.Component<{}, IState>
	implements ModuleGameInterface
{
	private readonly api: ModuleApi;

	constructor(props: any) {
		super(props);
		this.api = new ModuleApi(curveFever, this);
	}

	render(): ReactNode {
		return (
			<div id={'curveFever'}>
				<SketchFrame
					width={600}
					height={400}
				/>
			</div>
		);
	}
}