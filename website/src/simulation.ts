import { Car, CarSprite } from "./sprites";
import { Application } from "pixi.js";

// Direction enums matching the Python implementation
export enum Direction {
  CRASH = -2,
  UNKNOWN = -1,
  LEFT = 0,
  RIGHT = 1,
  DOWN = 2,
  UP = 3,
}

// Track enums matching the Python implementation
export enum Track {
  EMPTY = 0,
  HORIZONTAL_TRACK = 1,
  VERTICAL_TRACK = 2,
  CAR_ENDING_TRACK = 3,
  ROADBLOCK = 4,
  BOTTOM_RIGHT_TURN = 5,
  BOTTOM_LEFT_TURN = 6,
  TOP_RIGHT_TURN = 7,
  TOP_LEFT_TURN = 8,
  BOTTOM_RIGHT_LEFT_3WAY = 9,
  BOTTOM_RIGHT_TOP_3WAY = 10,
  BOTTOM_LEFT_RIGHT_3WAY = 11,
  BOTTOM_LEFT_TOP_3WAY = 12,
  TOP_RIGHT_LEFT_3WAY = 13,
  TOP_RIGHT_BOTTOM_3WAY = 14,
  TOP_LEFT_RIGHT_3WAY = 15,
  TOP_LEFT_BOTTOM_3WAY = 16,
  LEFT_FACING_TUNNEL = 17,
  UP_FACING_TUNNEL = 18,
  RIGHT_FACING_TUNNEL = 19,
  DOWN_FACING_TUNNEL = 20,
  NCAR_ENDING_TRACK_RIGHT = 21,
  NCAR_ENDING_TRACK_LEFT = 22,
}

// Movement directions for each track type based on car's facing direction
// This mirrors the Python 'directions' dictionary
const TRACK_DIRECTIONS: {
  [track: number]: { [direction: number]: Direction };
} = {
  [Track.EMPTY]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.CRASH,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.HORIZONTAL_TRACK]: {
    [Direction.LEFT]: Direction.LEFT,
    [Direction.RIGHT]: Direction.RIGHT,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.VERTICAL_TRACK]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.CRASH,
    [Direction.DOWN]: Direction.DOWN,
    [Direction.UP]: Direction.UP,
  },
  [Track.CAR_ENDING_TRACK]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.UNKNOWN,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.ROADBLOCK]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.CRASH,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.BOTTOM_RIGHT_TURN]: {
    [Direction.LEFT]: Direction.DOWN,
    [Direction.RIGHT]: Direction.CRASH,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.RIGHT,
  },
  [Track.BOTTOM_LEFT_TURN]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.DOWN,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.LEFT,
  },
  [Track.TOP_RIGHT_TURN]: {
    [Direction.LEFT]: Direction.UP,
    [Direction.RIGHT]: Direction.CRASH,
    [Direction.DOWN]: Direction.RIGHT,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.TOP_LEFT_TURN]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.UP,
    [Direction.DOWN]: Direction.LEFT,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.BOTTOM_RIGHT_LEFT_3WAY]: {
    [Direction.LEFT]: Direction.DOWN,
    [Direction.RIGHT]: Direction.RIGHT,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.RIGHT,
  },
  [Track.BOTTOM_RIGHT_TOP_3WAY]: {
    [Direction.LEFT]: Direction.DOWN,
    [Direction.RIGHT]: Direction.CRASH,
    [Direction.DOWN]: Direction.DOWN,
    [Direction.UP]: Direction.RIGHT,
  },
  [Track.BOTTOM_LEFT_RIGHT_3WAY]: {
    [Direction.LEFT]: Direction.LEFT,
    [Direction.RIGHT]: Direction.DOWN,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.LEFT,
  },
  [Track.BOTTOM_LEFT_TOP_3WAY]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.DOWN,
    [Direction.DOWN]: Direction.DOWN,
    [Direction.UP]: Direction.LEFT,
  },
  [Track.TOP_RIGHT_LEFT_3WAY]: {
    [Direction.LEFT]: Direction.UP,
    [Direction.RIGHT]: Direction.RIGHT,
    [Direction.DOWN]: Direction.RIGHT,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.TOP_RIGHT_BOTTOM_3WAY]: {
    [Direction.LEFT]: Direction.UP,
    [Direction.RIGHT]: Direction.CRASH,
    [Direction.DOWN]: Direction.RIGHT,
    [Direction.UP]: Direction.UP,
  },
  [Track.TOP_LEFT_RIGHT_3WAY]: {
    [Direction.LEFT]: Direction.LEFT,
    [Direction.RIGHT]: Direction.UP,
    [Direction.DOWN]: Direction.LEFT,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.TOP_LEFT_BOTTOM_3WAY]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.UP,
    [Direction.DOWN]: Direction.LEFT,
    [Direction.UP]: Direction.UP,
  },
  [Track.NCAR_ENDING_TRACK_RIGHT]: {
    [Direction.LEFT]: Direction.CRASH,
    [Direction.RIGHT]: Direction.UNKNOWN,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.CRASH,
  },
  [Track.NCAR_ENDING_TRACK_LEFT]: {
    [Direction.LEFT]: Direction.UNKNOWN,
    [Direction.RIGHT]: Direction.CRASH,
    [Direction.DOWN]: Direction.CRASH,
    [Direction.UP]: Direction.CRASH,
  },
};

// Convert direction strings to enum values
function stringToDirection(dirStr: string): Direction {
  switch (dirStr.toUpperCase()) {
    case "LEFT":
      return Direction.LEFT;
    case "RIGHT":
      return Direction.RIGHT;
    case "DOWN":
      return Direction.DOWN;
    case "UP":
      return Direction.UP;
    default:
      return Direction.CRASH;
  }
}

// Convert direction enum to string
function directionToString(dir: Direction): string {
  switch (dir) {
    case Direction.LEFT:
      return "LEFT";
    case Direction.RIGHT:
      return "RIGHT";
    case Direction.DOWN:
      return "DOWN";
    case Direction.UP:
      return "UP";
    default:
      return "CRASHED";
  }
}

// Get direction vector
function getDirectionVector(dir: Direction): [number, number] {
  switch (dir) {
    case Direction.LEFT:
      return [0, -1];
    case Direction.RIGHT:
      return [0, 1];
    case Direction.DOWN:
      return [1, 0];
    case Direction.UP:
      return [-1, 0];
    default:
      return [0, 0];
  }
}

export interface SimulationCar {
  pos: [number, number];
  direction: Direction;
  num: number;
  type: string;
  crashed: boolean;
  finished: boolean;
  sprite: CarSprite;
}

export class CarSimulation {
  private cars: SimulationCar[];
  private initialCars: Car[]; // Store initial state for reset
  private board: number[][];
  private app: Application;
  private isRunning: boolean = false;
  private animationSpeed: number = 500; // milliseconds per step
  private tileSize: number;
  private gridOffsetX: number;
  private gridOffsetY: number;
  private stepCount: number = 0;
  private onStateChangeCallback?: (state: "running" | "stopped") => void;
  private onLogCallback?: (message: string) => void;

  constructor(
    cars: Car[],
    board: number[][],
    app: Application,
    tileSize: number,
    gridOffsetX: number,
    gridOffsetY: number
  ) {
    this.app = app;
    this.board = board;
    this.tileSize = tileSize;
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetY = gridOffsetY;
    this.initialCars = JSON.parse(JSON.stringify(cars)); // Deep copy for reset

    // Convert cars to simulation cars
    this.cars = cars.map((car) => ({
      pos: [car.pos[0], car.pos[1]] as [number, number],
      direction: stringToDirection(car.direction),
      num: car.num,
      type: car.type,
      crashed: false,
      finished: false,
      sprite: new CarSprite(car, tileSize),
    }));

    // Initialize car sprite positions
    this.updateCarSpritePositions();
  }

  private updateCarSpritePositions(): void {
    this.cars.forEach((car) => {
      const x =
        this.gridOffsetX + car.pos[1] * this.tileSize + this.tileSize / 2;
      const y =
        this.gridOffsetY + car.pos[0] * this.tileSize + this.tileSize / 2;
      car.sprite.setPosition(x, y);
      car.sprite.updateDirection(directionToString(car.direction));
    });
  }

  private isPositionValid(pos: [number, number]): boolean {
    const [row, col] = pos;
    return (
      row >= 0 &&
      row < this.board.length &&
      col >= 0 &&
      col < this.board[0].length
    );
  }

  private moveCar(car: SimulationCar): boolean {
    if (car.crashed || car.finished) {
      return false;
    }

    const [row, col] = car.pos;

    // Check if position is valid
    if (!this.isPositionValid([row, col])) {
      car.crashed = true;
      this.log(`Car ${car.num} crashed: out of bounds`);
      return false;
    }

    const currentTrack = this.board[row][col];

    // Get next direction based on current track and car direction
    const trackDirections = TRACK_DIRECTIONS[currentTrack];
    if (!trackDirections) {
      car.crashed = true;
      this.log(`Car ${car.num} crashed: unknown track type ${currentTrack}`);
      return false;
    }

    const nextDirection = trackDirections[car.direction];

    if (nextDirection === Direction.CRASH) {
      car.crashed = true;
      this.log(
        `Car ${car.num} crashed: incompatible track/direction combination`
      );
      return false;
    }

    if (nextDirection === Direction.UNKNOWN) {
      // Car reached ending track
      car.finished = true;
      this.log(`Car ${car.num} finished!`);
      return false;
    }

    // Calculate next position
    const [deltaRow, deltaCol] = getDirectionVector(nextDirection);
    const nextPos: [number, number] = [row + deltaRow, col + deltaCol];

    // Check if next position is valid
    if (!this.isPositionValid(nextPos)) {
      car.crashed = true;
      this.log(`Car ${car.num} crashed: would move out of bounds`);
      return false;
    }

    // Update car position and direction
    car.pos = nextPos;
    car.direction = nextDirection;

    // Log car movement
    this.log(
      `Car ${car.num} moved to (${nextPos[0]}, ${nextPos[1]}) facing ${directionToString(nextDirection)}`
    );

    return true;
  }

  private checkCollisions(): void {
    // Check for cars at the same position
    for (let i = 0; i < this.cars.length; i++) {
      for (let j = i + 1; j < this.cars.length; j++) {
        const car1 = this.cars[i];
        const car2 = this.cars[j];

        if (
          !car1.crashed &&
          !car2.crashed &&
          !car1.finished &&
          !car2.finished
        ) {
          if (car1.pos[0] === car2.pos[0] && car1.pos[1] === car2.pos[1]) {
            car1.crashed = true;
            car2.crashed = true;
            this.log(`Cars ${car1.num} and ${car2.num} collided!`);
          }
        }
      }
    }
  }

  private async animateStep(): Promise<void> {
    return new Promise((resolve) => {
      this.stepCount++;
      this.log(`--- Step ${this.stepCount} ---`);

      // Move all cars
      let anyCarMoved = false;
      this.cars.forEach((car) => {
        if (this.moveCar(car)) {
          anyCarMoved = true;
        }
      });

      // Check for collisions
      this.checkCollisions();

      // Update sprite positions and directions
      this.updateCarSpritePositions();

      // Update sprite appearance for crashed/finished cars
      this.cars.forEach((car) => {
        if (car.crashed) {
          car.sprite.getContainer().alpha = 0.5; // Make crashed cars semi-transparent
          car.sprite.getContainer().tint = 0xff0000; // Make crashed cars red
        } else if (car.finished) {
          car.sprite.getContainer().tint = 0x00ff00; // Make finished cars green
        }
      });

      // Check if simulation should continue
      const activeCars = this.cars.filter(
        (car) => !car.crashed && !car.finished
      );
      if (activeCars.length === 0 || !anyCarMoved) {
        this.isRunning = false;
        const finishedCount = this.cars.filter((car) => car.finished).length;
        const crashedCount = this.cars.filter((car) => car.crashed).length;
        this.log(
          `Simulation completed after ${this.stepCount} steps! Finished: ${finishedCount}, Crashed: ${crashedCount}`
        );
        // Notify UI that simulation has stopped
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback("stopped");
        }
      }

      setTimeout(() => resolve(), this.animationSpeed);
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      this.log("Simulation is already running");
      return;
    }

    this.log("Starting car simulation...");
    this.isRunning = true;

    // Add car sprites to the stage if not already added
    this.cars.forEach((car) => {
      if (car.sprite.getContainer().parent === null) {
        this.app.stage.addChild(car.sprite.getContainer());
      }
    });

    let steps = 0;
    const maxSteps = 100; // Safety limit to prevent infinite loops

    while (this.isRunning && steps < maxSteps) {
      await this.animateStep();
      steps++;
    }

    if (steps >= maxSteps) {
      this.log("Simulation stopped: maximum steps reached");
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback("stopped");
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.log("Simulation stopped");
  }

  public reset(): void {
    this.stop();
    this.stepCount = 0;

    // Remove existing car sprites
    this.cars.forEach((car) => {
      if (car.sprite.getContainer().parent) {
        this.app.stage.removeChild(car.sprite.getContainer());
      }
    });

    // Recreate cars from initial state
    this.cars = this.initialCars.map((car) => ({
      pos: [car.pos[0], car.pos[1]] as [number, number],
      direction: stringToDirection(car.direction),
      num: car.num,
      type: car.type,
      crashed: false,
      finished: false,
      sprite: new CarSprite(car, this.tileSize),
    }));

    // Add car sprites back to stage and position them
    this.cars.forEach((car) => {
      this.app.stage.addChild(car.sprite.getContainer());
    });

    this.updateCarSpritePositions();
    this.log("Simulation reset");
  }

  public setSpeed(speed: number): void {
    this.animationSpeed = Math.max(100, Math.min(2000, speed)); // Clamp between 100ms and 2000ms
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getStatus(): string {
    const crashed = this.cars.filter((car) => car.crashed).length;
    const finished = this.cars.filter((car) => car.finished).length;
    const active = this.cars.length - crashed - finished;

    return `Step: ${this.stepCount} | Active: ${active}, Finished: ${finished}, Crashed: ${crashed}`;
  }

  public setStateChangeCallback(
    callback: (state: "running" | "stopped") => void
  ): void {
    this.onStateChangeCallback = callback;
  }

  public setLogCallback(callback: (message: string) => void): void {
    this.onLogCallback = callback;
  }

  private log(message: string): void {
    console.log(message);
    if (this.onLogCallback) {
      this.onLogCallback(message);
    }
  }
}
