import {
	MazeGrid,
	MazeTile,
} from '@edelgames/types/src/modules/darkVoice/dVTypes';
import { Coordinate } from '@edelgames/types/src/modules/colorChecker/CCTypes';
import Line from '../../../framework/math/Geometry/Line';
import Vector from '../../../framework/math/Geometry/Vector';

type MazeGenTileInfo = {
	visited: boolean;
	lastX: number;
	lastY: number;
};

export default class MazeGenerator {
	public static generate(
		sWidth: number,
		sHeight: number,
		possibleMutations: number
	): MazeGrid {
		const maze: MazeGrid = [];
		const mazeGenInfo: MazeGenTileInfo[][] = [];
		MazeGenerator.setupDefaultMaze(maze, mazeGenInfo, sWidth, sHeight);

		let visitedTiles = 0;
		// start at a random position
		let currentPos: Coordinate = {
			x: Math.floor(Math.random() * sWidth),
			y: Math.floor(Math.random() * sHeight),
		};
		while (visitedTiles < sWidth * sHeight) {
			const currentInfo = mazeGenInfo[currentPos.x][currentPos.y];
			if (!currentInfo.visited) {
				currentInfo.visited = true;
				visitedTiles++;
			}

			const availableSides = [];
			if (
				currentPos.x > 0 &&
				!mazeGenInfo[currentPos.x - 1][currentPos.y].visited
			)
				availableSides.push({ x: currentPos.x - 1, y: currentPos.y });
			if (
				currentPos.y > 0 &&
				!mazeGenInfo[currentPos.x][currentPos.y - 1].visited
			)
				availableSides.push({ x: currentPos.x, y: currentPos.y - 1 });
			if (
				currentPos.x < sWidth - 1 &&
				!mazeGenInfo[currentPos.x + 1][currentPos.y].visited
			)
				availableSides.push({ x: currentPos.x + 1, y: currentPos.y });
			if (
				currentPos.y < sHeight - 1 &&
				!mazeGenInfo[currentPos.x][currentPos.y + 1].visited
			)
				availableSides.push({ x: currentPos.x, y: currentPos.y + 1 });

			if (availableSides.length > 0) {
				const nextPos =
					availableSides[Math.floor(Math.random() * availableSides.length)];
				const nextInfo = mazeGenInfo[nextPos.x][nextPos.y];
				nextInfo.lastY = currentPos.y;
				nextInfo.lastX = currentPos.x;

				// make way for this new path
				if (nextPos.x - currentPos.x > 0)
					maze[nextPos.x][nextPos.y].borderLeft = false;
				else if (nextPos.x - currentPos.x < 0)
					maze[currentPos.x][currentPos.y].borderLeft = false;
				else if (nextPos.y - currentPos.y > 0)
					maze[nextPos.x][nextPos.y].borderTop = false;
				else if (nextPos.y - currentPos.y < 0)
					maze[currentPos.x][currentPos.y].borderTop = false;

				currentPos = nextPos;
			} else {
				// go back and search there
				currentPos = {
					x: currentInfo.lastX,
					y: currentInfo.lastY,
				};
			}
		}

		MazeGenerator.applyMutations(maze, sWidth, sHeight, possibleMutations);

		return maze;
	}

	private static applyMutations(
		maze: MazeGrid,
		sWidth: number,
		sHeight: number,
		possibleMutations: number
	): void {
		// mutations, to create loops
		for (let i = 0; i < possibleMutations; i++) {
			const randX = Math.floor(Math.random() * sWidth);
			const randY = Math.floor(Math.random() * sHeight);

			maze[randX][randY].borderTop =
				maze[randX][randY].borderTop && Math.random() > 0.5;
			maze[randX][randY].borderLeft =
				maze[randX][randY].borderLeft && Math.random() > 0.5;
		}
	}

	private static setupDefaultMaze(
		maze: MazeGrid,
		mazeGenInfo: MazeGenTileInfo[][],
		sWidth: number,
		sHeight: number
	): void {
		for (let x = 0; x < sWidth; x++) {
			const col: MazeGenTileInfo[] = [];
			const mazeColumn: MazeTile[] = [];

			for (let y = 0; y < sHeight; y++) {
				col.push({
					visited: false,
					lastX: undefined,
					lastY: undefined,
				});
				mazeColumn.push({
					borderTop: true,
					borderLeft: true,
				});
			}
			mazeGenInfo.push(col);
			maze.push(mazeColumn);
		}
	}

	public static generateMazeBorderListFromMaze(maze: MazeGrid): Line[] {
		// initialize with outer walls
		const tilesWidth = maze.length;
		const tilesHeight = maze[0].length;
		const upperLeft = new Vector(0, 0);
		const lowerRight = new Vector(tilesWidth, tilesHeight);
		const borders = [
			new Line(upperLeft, new Vector(0, tilesHeight)),
			new Line(upperLeft, new Vector(tilesWidth, 0)),
			new Line(new Vector(tilesWidth, 0), lowerRight),
			new Line(new Vector(0, tilesHeight), lowerRight),
		];

		// add borders
		for (let x = 0; x < tilesWidth; x++) {
			for (let y = 0; y < tilesHeight; y++) {
				const tile = maze[x][y];
				if (tile.borderTop) {
					borders.push(new Line(new Vector(x, y), new Vector(x + 1, y)));
				}
				if (tile.borderLeft) {
					borders.push(new Line(new Vector(x, y), new Vector(x, y + 1)));
				}
			}
		}

		return borders;
	}
}
