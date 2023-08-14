import { Component } from 'react';
import DrawingCanvas from '../../../framework/components/DrawingCanvas/DrawingCanvas';
import p5Types from 'p5';
import {
	ControlKey,
	ControlKeyMap,
	MazeGrid,
	PlayerPosition,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import ModuleApi from '../../../framework/modules/ModuleApi';
import { Coordinate } from '@edelgames/types/src/modules/colorChecker/CCTypes';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import {
	MazeLayoutChangedEventData,
	PlayerInputChangedEventData,
	PlayerPositionsChangedEventData,
} from '@edelgames/types/src/modules/darkVoice/dVEvents';

interface IProps {
	api: ModuleApi;
}

interface IState {}

const width = 700;
const height = 700;
export default class Maze extends Component<IProps, IState> {
	protected bufferedMaze: p5Types.Graphics | undefined = undefined;
	protected zoom: number = 1;
	protected inputMap: ControlKeyMap = {
		UP: false,
		DOWN: false,
		LEFT: false,
		RIGHT: false,
	};
	protected tileSize = width / 28;
	protected playerCoords: PlayerPosition[] = [];
	protected maze: MazeGrid | undefined = undefined;

	constructor(props: IProps) {
		super(props);
		this.props.api
			.getEventApi()
			.addEventHandler(
				'mazeLayoutChanged',
				this.onMazeLayoutChanged.bind(this)
			);
		this.props.api
			.getEventApi()
			.addEventHandler(
				'playerPositionsChanged',
				this.onPlayerPositionsChanged.bind(this)
			);
	}

	private keyDownListener = this.onInputChanged.bind(this, true);
	private keyUpListener = this.onInputChanged.bind(this, false);

	componentDidMount() {
		document.addEventListener('keydown', this.keyDownListener);
		document.addEventListener('keyup', this.keyUpListener);
	}

	componentWillUnmount() {
		document.removeEventListener('keydown', this.keyDownListener);
		document.removeEventListener('keyup', this.keyUpListener);
	}

	shouldComponentUpdate(
		nextProps: Readonly<{}>,
		nextState: Readonly<IState>
	): boolean {
		return false;
	}

	onInputChanged(isKeyDown: boolean, event: KeyboardEvent): void {
		let controlKey: ControlKey | undefined = undefined;

		switch (event.key) {
			case 'ArrowLeft':
				controlKey = 'LEFT';
				break;
			case 'ArrowRight':
				controlKey = 'RIGHT';
				break;
			case 'ArrowUp':
				controlKey = 'UP';
				break;
			case 'ArrowDown':
				controlKey = 'DOWN';
				break;
		}

		if (controlKey !== undefined && this.inputMap[controlKey] !== isKeyDown) {
			this.inputMap[controlKey] = isKeyDown;
			const data: PlayerInputChangedEventData = {
				key: controlKey,
				state: isKeyDown,
			};
			this.props.api
				.getEventApi()
				.sendMessageToServer('playerInputChanged', data as EventDataObject);
		}
	}

	onMazeLayoutChanged(eventData: EventDataObject): void {
		const event = eventData as MazeLayoutChangedEventData;
		this.maze = event.maze;
		this.bufferedMaze = undefined;
	}

	onPlayerPositionsChanged(eventData: EventDataObject): void {
		const event = eventData as PlayerPositionsChangedEventData;
		this.playerCoords = event.positions;
	}

	createBufferedMaze(p5: p5Types, graphics: p5Types.Graphics): void {
		if (!this.maze) {
			return;
		}

		// draw tiles
		graphics.stroke('#000');
		graphics.noFill();
		for (let x = 0; x < this.maze.length; x++) {
			for (let y = 0; y < this.maze[x].length; y++) {
				const tile = this.maze[x][y];
				const xSrc = this.tileSize * x;
				const ySrc = this.tileSize * y;

				if (tile.borderTop)
					graphics.line(xSrc, ySrc, xSrc + this.tileSize, ySrc);
				if (tile.borderLeft)
					graphics.line(xSrc, ySrc, xSrc, ySrc + this.tileSize);
			}
		}

		let width = this.maze.length * this.tileSize;
		let height = this.maze[0].length * this.tileSize;

		graphics.strokeWeight(5);
		graphics.line(0, 0, width - 1, 0);
		graphics.line(0, height, width, height);
		graphics.line(0, 0, 0, height);
		graphics.line(width, 0, width, height);
	}

	setup(p5: p5Types): undefined {
		p5.frameRate(40);
		return undefined;
	}

	draw(p5: p5Types): undefined {
		if (!this.maze) {
			return;
		}

		if (!this.bufferedMaze) {
			this.bufferedMaze = p5.createGraphics(width, height);
			this.createBufferedMaze(p5, this.bufferedMaze);
		}

		const localePlayerId = this.props.api
			.getPlayerApi()
			.getLocalePlayer()
			.getId();
		const players: PlayerPosition[] = this.playerCoords.map((playerCoord) => {
			return {
				playerId: playerCoord.playerId,
				coords: {
					x: playerCoord.coords.x * this.zoom * this.tileSize,
					y: playerCoord.coords.y * this.zoom * this.tileSize,
				},
			};
		});

		const localePlayer = players.splice(
			players.findIndex((p) => p.playerId === localePlayerId),
			1
		);
		if (!localePlayer || localePlayer.length === 0) {
			return;
		}
		const playerPos = localePlayer[0].coords;

		const center: Coordinate = { x: width / 2, y: height / 2 };

		p5.push();
		// eslint-disable-next-line no-lone-blocks
		{
			p5.scale(this.zoom);
			p5.translate(center.x / this.zoom, center.y / this.zoom);

			p5.background('#222');
			p5.image(
				this.bufferedMaze as p5Types.Graphics,
				-playerPos.x / this.zoom,
				-playerPos.y / this.zoom
			);

			// draw player
			p5.fill('#f00');
			p5.circle(0, 0, 10);

			p5.fill('#33f');
			for (const otherPlayer of players) {
				const otherPos = otherPlayer.coords;
				p5.circle(
					(otherPos.x - playerPos.x) / this.zoom,
					(otherPos.y - playerPos.y) / this.zoom,
					10
				);
			}
		}
		p5.pop();

		return undefined; // return type to match p5 standards
	}

	render() {
		return (
			<DrawingCanvas
				drawFunction={this.draw.bind(this)}
				setupFunction={this.setup.bind(this)}
				canvasWidth={700}
				canvasHeight={700}
				enableManualDrawing={false}
			/>
		);
	}
}
