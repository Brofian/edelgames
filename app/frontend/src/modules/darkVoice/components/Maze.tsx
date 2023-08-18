import { Component } from 'react';
import DrawingCanvas from '../../../framework/components/DrawingCanvas/DrawingCanvas';
import p5Types from 'p5';
import {
	ControlKey,
	ControlKeyMap,
	GameProgressState,
	ItemObject,
	MazeGrid,
	PlayerPosition,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import ModuleApi from '../../../framework/modules/ModuleApi';
import { Coordinate } from '@edelgames/types/src/modules/colorChecker/CCTypes';
import { EventDataObject } from '@edelgames/types/src/app/ApiTypes';
import {
	ItemPositionsChangedEventData,
	MazeLayoutChangedEventData,
	PlayerInputChangedEventData,
	PlayerPositionsChangedEventData,
} from '@edelgames/types/src/modules/darkVoice/dVEvents';
import EyeEvilSvg from '../images/eye-evil.svg';
import TurtleSvg from '../images/turtle.svg';
import RabbitRunningSvg from '../images/rabbit-running.svg';

interface IProps {
	api: ModuleApi;
	gameProgressState: GameProgressState;
	monsterPlayerId: string;
}

interface IState {}

const canvasWidth = 700;
const canvasHeight = 700;
const playerSize = 0.3 * 1.1; // tileSize * 0.3, then increase by 1.1 to draw a bigger sprite than hitbox

const mazeColors: { [key in GameProgressState]: string } = {
	BEGINNING: '#ceffaf',
	MIDDLE: '#fff4af',
	ENDGAME: '#ffa798',
};
const monsterColor: string = '#ec2d2d';
const playerColor: string = '#334eff';

export default class Maze extends Component<IProps, IState> {
	protected bufferedMaze: p5Types.Graphics | undefined = undefined;
	protected zoom: number = 1.2;
	protected inputMap: ControlKeyMap = {
		UP: false,
		DOWN: false,
		LEFT: false,
		RIGHT: false,
	};
	protected tileSize = canvasWidth / 14;
	protected playerSize = this.tileSize * playerSize;
	protected playerVisibilityRange = 3;
	protected playerCoords: PlayerPosition[] = [];
	protected nextPlayerCoords: PlayerPosition[] = [];
	protected fpsPerTick = 1;
	protected frameSinceTick = 0;
	protected maze: MazeGrid | undefined = undefined;
	protected mazeLayoutRequested = 0;
	protected readonly localePlayerId: string;
	protected items: ItemObject[] = [];
	protected canvasImages: { [key: string]: p5Types.Image | undefined } = {
		monsterizer: undefined,
		accelerator: undefined,
		slowdown: undefined,
	};

	constructor(props: IProps) {
		super(props);
		this.localePlayerId = this.props.api
			.getPlayerApi()
			.getLocalePlayer()
			.getId();
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
		this.props.api
			.getEventApi()
			.addEventHandler(
				'itemPositionsChanged',
				this.onItemPositionsChanged.bind(this)
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
		nextProps: Readonly<IProps>,
		nextState: Readonly<IState>
	): boolean {
		if (this.props.gameProgressState !== nextProps.gameProgressState) {
			this.bufferedMaze = undefined;
		}
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
		this.mazeLayoutRequested = 0;
		this.bufferedMaze = undefined;
	}

	onPlayerPositionsChanged(eventData: EventDataObject): void {
		const event = eventData as PlayerPositionsChangedEventData;
		this.playerCoords = this.nextPlayerCoords;
		this.nextPlayerCoords = event.positions;
		this.fpsPerTick = Math.max(1, this.frameSinceTick);
		this.frameSinceTick = 0;
	}

	onItemPositionsChanged(eventData: EventDataObject): void {
		const event = eventData as ItemPositionsChangedEventData;
		this.items = event.items;
	}

	setup(p5: p5Types): undefined {
		//p5.frameRate(40);
		p5.ellipseMode(p5.CENTER);
		p5.textSize(16);
		// preload images
		p5.loadImage(EyeEvilSvg, (img) => {
			this.canvasImages['monsterizer'] = img;
		});
		p5.loadImage(RabbitRunningSvg, (img) => {
			this.canvasImages['accelerator'] = img;
		});
		p5.loadImage(TurtleSvg, (img) => {
			this.canvasImages['slowdown'] = img;
		});
		return undefined;
	}

	requestMazeLayout(): void {
		this.mazeLayoutRequested = Date.now();
		this.props.api.getEventApi().sendMessageToServer('mazeLayoutRequest', {});
	}

	draw(p5: p5Types): undefined {
		if (!this.maze) {
			if (Date.now() - this.mazeLayoutRequested > 5000) {
				this.requestMazeLayout();
			}
			return;
		}

		if (!this.bufferedMaze) {
			this.bufferedMaze = p5.createGraphics(
				this.maze.length * this.tileSize,
				this.maze[0].length * this.tileSize
			);
			this.createBufferedMaze(p5, this.bufferedMaze);
		}

		this.frameSinceTick++;
		const portionOfMoveToDisplay = Math.min(
			this.frameSinceTick * (20 / p5.frameRate()),
			1
		);

		// calculate smoothed out values for all players
		let playerPositionList: PlayerPosition[] = [];
		let localePlayerPos: Coordinate | undefined = undefined;

		for (const playerPos of this.playerCoords) {
			const nextPlayerPos = this.nextPlayerCoords.find(
				(npc) => npc.playerId === playerPos.playerId
			);

			if (nextPlayerPos) {
				const oldPos = playerPos.coords;
				const newPos = nextPlayerPos.coords;

				const smoothedPos = nextPlayerPos.teleport
					? p5.createVector(newPos.x, newPos.y)
					: p5
							.createVector(oldPos.x, oldPos.y)
							.lerp(
								p5.createVector(newPos.x, newPos.y),
								portionOfMoveToDisplay
							);

				if (playerPos.playerId === this.localePlayerId) {
					localePlayerPos = smoothedPos;
				} else {
					playerPositionList.push({
						playerId: playerPos.playerId,
						coords: smoothedPos,
					});
				}
			}
		}

		if (!localePlayerPos) {
			return; // I don't know why this should happen. But just to be sure...
		}

		playerPositionList = playerPositionList.filter(
			((localePlayerPos: Coordinate, otherPos: PlayerPosition) => {
				const distSquared =
					Math.pow(otherPos.coords.x - localePlayerPos.x, 2) +
					Math.pow(otherPos.coords.y - localePlayerPos.y, 2);
				return (
					distSquared < this.playerVisibilityRange * this.playerVisibilityRange
				);
			}).bind(null, localePlayerPos)
		);

		// translate absolute grid coordinates into relative canvas coordinates
		playerPositionList =
			this.generateAbsoluteCoordsFromRelative(playerPositionList);
		// do the same for the locale player
		localePlayerPos = this.generateAbsoluteCoordsFromRelative([
			{ playerId: this.localePlayerId, coords: localePlayerPos },
		])[0].coords;

		p5.push();
		// eslint-disable-next-line no-lone-blocks
		{
			p5.scale(this.zoom);
			p5.translate(
				canvasWidth / (2 * this.zoom),
				canvasHeight / (2 * this.zoom)
			);

			p5.background('#222');
			p5.image(
				this.bufferedMaze as p5Types.Graphics,
				-localePlayerPos.x / this.zoom,
				-localePlayerPos.y / this.zoom
			);

			// draw items
			for (const item of this.items) {
				const icon = this.canvasImages[item.identifier];
				if (icon) {
					const iconPosition = this.absoluteCoordsToRelative({
						x: item.position.x - 0.15,
						y: item.position.y - 0.15,
					});
					p5.image(
						icon,
						(iconPosition.x - localePlayerPos.x) / this.zoom,
						(iconPosition.y - localePlayerPos.y) / this.zoom,
						this.playerSize,
						this.playerSize
					);
				}
			}

			// draw locale player
			p5.stroke('#eee');
			p5.fill(
				this.props.monsterPlayerId === this.localePlayerId
					? monsterColor
					: playerColor
			);
			p5.circle(0, 0, this.playerSize);

			for (const otherPos of playerPositionList) {
				p5.fill(
					this.props.monsterPlayerId === otherPos.playerId
						? monsterColor
						: playerColor
				);

				p5.circle(
					(otherPos.coords.x - localePlayerPos.x) / this.zoom,
					(otherPos.coords.y - localePlayerPos.y) / this.zoom,
					this.playerSize
				);
			}
		}
		p5.pop();

		p5.noStroke();
		p5.fill(255);
		p5.text(Math.floor(p5.frameRate()), 5, 21);

		return undefined; // return type to match p5 standards
	}

	/**
	 * @description Applies zoom and client specific tileSize to the relative grid coordinates
	 * @param coords
	 */
	generateAbsoluteCoordsFromRelative(
		coords: PlayerPosition[]
	): PlayerPosition[] {
		return coords.map((playerCoord) => {
			return {
				playerId: playerCoord.playerId,
				coords: this.absoluteCoordsToRelative(playerCoord.coords),
			};
		});
	}

	absoluteCoordsToRelative(coords: Coordinate): Coordinate {
		return {
			x: coords.x * this.zoom * this.tileSize,
			y: coords.y * this.zoom * this.tileSize,
		};
	}

	createBufferedMaze(p5: p5Types, graphics: p5Types.Graphics): void {
		if (!this.maze) {
			return;
		}

		// draw tiles
		graphics.stroke(mazeColors[this.props.gameProgressState]);
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

	render() {
		return (
			<DrawingCanvas
				drawFunction={this.draw.bind(this)}
				setupFunction={this.setup.bind(this)}
				canvasWidth={canvasWidth}
				canvasHeight={canvasHeight}
				enableManualDrawing={false}
			/>
		);
	}
}
