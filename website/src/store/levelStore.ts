import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Track, Mod, Car, CarType, Direction } from "../../../algo/classes";

/**
 * Level data structure
 * Represents the actual game level with all placed pieces
 */
export interface LevelData {
  id: string;
  name?: string;
  grid: GridCell[][];
  car_nums: Map<CarType, boolean[]>;
  next_nums: Map<CarType, number>;
  width: number;
  height: number;
  max_tracks: number;
  max_semaphores: number;
  metadata?: Record<string, unknown>;
  createdAt?: number;
  modifiedAt?: number;
}

export interface jsonData {
  board: number[][];
  mods: number[][];
  mod_nums: number[][];
  cars: {
    pos: number[];
    direction: string;
    num: number;
    type: string;
  }[];
  tracks: number;
  semaphores: number;
}

/**
 * Individual grid cell in the level
 */
export interface GridCell {
  car: Car | undefined;
  track: Track;
  mod: Mod;
  mod_num: number;
}

/**
 * State snapshot for undo/redo functionality
 * Contains only level-related state that can be undone
 */
export interface LevelStateSnapshot {
  levelData: LevelData;
  timestamp: number;
  action?: string; // Optional description of what action created this snapshot
}

/**
 * LEVEL STATE STORE
 *
 * Manages all level-related state including level data, undo/redo functionality,
 * and level manipulation operations.
 *
 * RESPONSIBILITIES:
 * - Current level data management
 * - Undo/redo stack management with state snapshots
 * - Level manipulation actions (place/remove pieces)
 * - Level validation and serialization
 * - Level save/load operations
 *
 * USAGE:
 * import { useLevelStore } from './store/levelStore';
 *
 * const { levelData, undo, redo, placePiece } = useLevelStore();
 */

interface LevelState {
  // =================
  // LEVEL DATA STATE
  // =================

  /**
   * Current level data structure
   * Contains the actual game level with all placed pieces
   */
  levelData: LevelData;

  /**
   * Current level file path (if loaded from file)
   */
  levelFilePath: string | null;

  // =================
  // UNDO/REDO STATE
  // =================

  /**
   * Stack of previous level states for undo functionality
   * Each entry represents a complete level state snapshot
   */
  undoStack: LevelStateSnapshot[];

  /**
   * Stack of forward level states for redo functionality
   * Gets populated when undo is performed
   */
  redoStack: LevelStateSnapshot[];

  /**
   * Maximum number of undo states to keep in memory
   */
  maxUndoStates: number;

  // =================
  // ACTIONS
  // =================

  /**
   * Create a new empty level
   */
  createNewLevel: (
    width?: number,
    height?: number,
    max_tracks?: number,
    max_semaphores?: number,
    car_rot?: number
  ) => void;

  /**
   * Set the dims for the level
   */
  setDims: (dims: { y: number; x: number }) => void;

  /**
   * Set the maximum track count
   */
  setTracks: (max_tracks: number) => void;

  /**
   * Set the maximum semaphore count
   */
  setSemaphores: (max_semaphores: number) => void;

  /**
   * Load level data
   */
  loadLevel: (levelData: LevelData | jsonData, name?: string) => void;

  /**
   * Save current level state to undo stack
   * Call this before making changes that should be undoable
   */
  saveToUndoStack: (actionDescription?: string) => void;

  /**
   * Perform undo operation
   */
  undo: () => void;

  /**
   * Perform redo operation
   */
  redo: () => void;

  /**
   * Clear undo/redo stacks
   */
  clearHistory: () => void;

  /**
   * Place a piece at specific grid coordinates
   */
  placePiece: (
    x: number,
    y: number,
    cartype?: CarType | undefined,
    track?: Track | undefined,
    mod?: Mod | undefined,
    mod_num?: number | undefined,
    car_rot?: number | undefined
  ) => void;

  /**
   * Remove piece at specific grid coordinates
   */
  removePiece: (x: number, y: number) => void;

  /**
   * Remove mod/car at specific grid coordinates
   */
  removeModorCar: (x: number, y: number) => void;

  /**
   * Register the next car num for the car.
   */
  registerCar: (type: CarType) => number;

  /**
   * Unregister the given car.
   */
  unregisterCar: (car: Car) => void;

  /**
   * Check if all cars are registered for the given type.
   */
  registryFilled: (type: CarType) => boolean;

  /**
   * Get piece at specific grid coordinates
   */
  getPieceAt: (x: number, y: number) => GridCell | null;

  /**
   * Clear entire level (remove all pieces)
   */
  clearLevel: () => void;

  /**
   * Set level metadata
   */
  setLevelMetadata: (metadata: Record<string, unknown>) => void;

  /**
   * Set level name
   */
  setLevelName: (name: string) => void;

  /**
   * Mark level as dirty/clean
   */
  setDirty: (dirty: boolean) => void;

  /**
   * Reset all level state to defaults
   */
  resetLevel: () => void;
}

/**
 * Create an empty grid of specified dimensions
 */
const createEmptyGrid = (
  width: number = 12,
  height: number = 12
): GridCell[][] => {
  return Array(height)
    .fill(null)
    .map(() =>
      Array(width).fill({
        car: undefined,
        track: Track.EMPTY,
        mod: Mod.EMPTY,
        mod_num: 0,
      })
    );
};

/**
 * Create default level data
 */
const createDefaultLevel = (): LevelData => ({
  id: `level_${Date.now()}`,
  name: "New Level",
  grid: createEmptyGrid(12, 12),
  car_nums: new Map<CarType, boolean[]>([
    [CarType.NORMAL, Array(4).fill(false)],
    [CarType.DECOY, Array(144).fill(false)],
    [CarType.NUMERAL, Array(4).fill(false)],
  ]),
  next_nums: new Map<CarType, number>([
    [CarType.NORMAL, 0],
    [CarType.DECOY, 0],
    [CarType.NUMERAL, 0],
  ]),
  width: 12,
  height: 12,
  max_tracks: 0,
  max_semaphores: 0,
  metadata: {},
  createdAt: Date.now(),
  modifiedAt: Date.now(),
});

/**
 * Create the Level Zustand store with devtools support
 */
export const useLevelStore = create<LevelState>()(
  devtools(
    (set, get) => ({
      // =================
      // INITIAL STATE
      // =================

      levelData: createDefaultLevel(),
      levelFilePath: null,
      undoStack: [],
      redoStack: [],

      maxUndoStates: 50,

      // =================
      // ACTIONS
      // =================

      createNewLevel: (
        width = 12,
        height = 12,
        max_tracks?: number,
        max_semaphores?: number
      ) => {
        const newLevel: LevelData = {
          ...createDefaultLevel(),
          name: "Untitled Level",
          grid: createEmptyGrid(width, height),
          width: width,
          height: height,
          max_tracks: max_tracks ?? 0,
          max_semaphores: max_semaphores ?? 0,
        };

        set(
          {
            levelData: newLevel,
            levelFilePath: null,
            undoStack: [],
            redoStack: [],
          },
          false,
          "createNewLevel"
        );

        console.log(`📄 New level created: ${width}x${height}`);
      },

      setTracks: (max_tracks) => {
        const { levelData } = get();
        set(
          {
            levelData: {
              ...levelData,
              max_tracks: max_tracks,
              modifiedAt: Date.now(),
            },
          },
          false,
          "placePiece"
        );

        console.log(`Max tracks updated to ${max_tracks}`);
      },

      setSemaphores: (max_semaphores) => {
        const { levelData } = get();
        set(
          {
            levelData: {
              ...levelData,
              max_semaphores: max_semaphores,
              modifiedAt: Date.now(),
            },
          },
          false,
          "placePiece"
        );

        console.log(`Max semaphores updated to ${max_semaphores}`);
      },

      setDims: (dims) => {
        const { levelData } = get();
        if (!levelData || !levelData.grid) return;

        const grid = levelData.grid;

        const newGrid: GridCell[][] = [];
        for (let i = 0; i < dims.y; i++) {
          newGrid.push([]);
          for (let j = 0; j < dims.x; j++) {
            if (i < grid.length && j < grid[0].length) {
              newGrid[i].push(grid[i][j]);
            } else {
              newGrid[i].push({
                car: undefined,
                track: Track.EMPTY,
                mod: Mod.EMPTY,
                mod_num: 0,
              });
            }
          }
        }
        // Iterate over tracks that got cut off if dim was decreased to properly remove them
        for (let i = 0; i < levelData.height; i++) {
          for (let j = 0; j < levelData.width; j++) {
            if (i >= dims.y || j >= dims.x) {
              console.log(`removing ${i} ${j}`);
              get().removePiece(j, i);
            }
          }
        }

        set(
          {
            levelData: {
              ...levelData,
              grid: newGrid,
              width: dims.x,
              height: dims.y,
              modifiedAt: Date.now(),
            },
          },
          false,
          "placePiece"
        );

        console.log(`Board dims updated to (${dims.y}, ${dims.x})`);
      },

      loadLevel: (levelData, name?) => {
        let loadedData: LevelData;
        if (!("id" in levelData)) {
          // If the levelData is type jsonData it needs to be converted
          loadedData = createDefaultLevel();
          loadedData.height = levelData.board.length;
          loadedData.width = levelData.board[0].length;
          loadedData.max_tracks = levelData.tracks;
          loadedData.max_semaphores = levelData.semaphores;
          for (let i = 0; i < loadedData.height; i++) {
            for (let j = 0; j < loadedData.width; j++) {
              loadedData.grid[i][j] = {
                car: undefined,
                track: Track.get(levelData.board[i][j]),
                mod: Mod.get(levelData.mods[i][j]),
                mod_num: levelData.mod_nums[i][j],
              };
            }
          }
          for (const raw_car of levelData.cars) {
            const car = Car.from_json(raw_car);
            console.log(car);
            console.log(raw_car);
            loadedData.grid[car.pos[0]][car.pos[1]].car = car;
            for (let i = 0; i <= car.num; i++) {
              loadedData.car_nums.get(car.type)![i] = true;
            }
            loadedData.next_nums.set(car.type, car.num + 1);
          }
        } else {
          loadedData = levelData;
        }
        if (name !== undefined) {
          loadedData.name = name;
        }
        set(
          {
            levelData: { ...loadedData, modifiedAt: Date.now() },
            undoStack: [],
            redoStack: [],
          },
          false,
          "loadLevel"
        );
        get().setDims({ y: loadedData.height, x: loadedData.width });
        console.log(`📂 Level loaded: ${get().levelData.name || "Untitled"}`);
      },

      saveToUndoStack: (actionDescription) => {
        const { levelData, undoStack, maxUndoStates } = get();
        if (!levelData) return;

        const snapshot: LevelStateSnapshot = {
          levelData: JSON.parse(JSON.stringify(levelData)), // Deep clone
          timestamp: Date.now(),
          action: actionDescription,
        };

        // Limit undo stack size
        const newUndoStack = [...undoStack, snapshot];
        if (newUndoStack.length > maxUndoStates) {
          newUndoStack.shift(); // Remove oldest entry
        }

        set(
          {
            undoStack: newUndoStack,
            redoStack: [], // Clear redo stack when new action is performed
          },
          false,
          "saveToUndoStack"
        );
      },

      undo: () => {
        const { undoStack, redoStack, levelData } = get();
        if (undoStack.length === 0) {
          console.log("⚠️ Nothing to undo");
          return;
        }

        const previousState = undoStack[undoStack.length - 1];
        const newUndoStack = undoStack.slice(0, -1);

        // Save current state to redo stack
        const currentSnapshot: LevelStateSnapshot = {
          levelData: levelData ? JSON.parse(JSON.stringify(levelData)) : null,
          timestamp: Date.now(),
        };

        set(
          {
            levelData: previousState.levelData,
            undoStack: newUndoStack,
            redoStack: [...redoStack, currentSnapshot],
          },
          false,
          "undo"
        );

        console.log(`↶ Undo: ${previousState.action || "action"}`);
      },

      redo: () => {
        const { redoStack, undoStack, levelData } = get();
        if (redoStack.length === 0) {
          console.log("⚠️ Nothing to redo");
          return;
        }

        const nextState = redoStack[redoStack.length - 1];
        const newRedoStack = redoStack.slice(0, -1);

        // Save current state to undo stack
        const currentSnapshot: LevelStateSnapshot = {
          levelData: levelData ? JSON.parse(JSON.stringify(levelData)) : null,
          timestamp: Date.now(),
        };

        set(
          {
            levelData: nextState.levelData,
            undoStack: [...undoStack, currentSnapshot],
            redoStack: newRedoStack,
          },
          false,
          "redo"
        );

        console.log(`↷ Redo: ${nextState.action || "action"}`);
      },

      clearHistory: () => {
        set({ undoStack: [], redoStack: [] }, false, "clearHistory");
      },

      placePiece: (
        x,
        y,
        cartype,
        track = Track.EMPTY,
        mod = Mod.EMPTY,
        mod_num = 0,
        car_rot = 0
      ) => {
        const { levelData } = get();
        const placing_car = cartype !== undefined;
        const placing_track = track !== undefined;
        if (!levelData || !levelData.grid || (cartype === undefined && track.is_empty() && mod === Mod.EMPTY)) return;

        const grid = levelData.grid;
        let car = undefined;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;

        if (track.is_empty()) {
          track = grid[y][x].track;
        }
        // Make sure the placement is legal
        if (
          // First statement prevents any mod from being placed on anything that isn't a normal track
          // EXCEPT for tunnels since they ignore this rule.
          (((mod !== Mod.EMPTY && mod !== Mod.TUNNEL) || placing_car) &&
            !track.is_straight() &&
            !track.is_turn() &&
            !track.is_3way())
        ) {
          return;
        }
        // Save state before making changes
        get().saveToUndoStack(
          `Place ${track}/${mod}/${mod_num} at (${x}, ${y})`
        );
        if (placing_track) {
          get().removePiece(x, y);
        }
        if (placing_car && !get().registryFilled(cartype)) {
          let dir: Direction;
          if (car_rot === 0) {
            dir = Direction.RIGHT;
          } else if (car_rot === 1) {
            dir = Direction.UP;
          } else if (car_rot === 2) {
            dir = Direction.LEFT;
          } else {
            dir = Direction.DOWN;
          }
          car = new Car([y, x], dir, get().registerCar(cartype), cartype);
        }

        const newGrid = grid.map((row, rowIndex) =>
          row.map((cell, colIndex): GridCell => {
            if (rowIndex === y && colIndex === x) {
              return {
                car: car,
                track: track,
                mod: mod,
                mod_num: mod_num,
              };
            }
            return cell;
          })
        );

        set(
          {
            levelData: {
              ...levelData,
              grid: newGrid,
              modifiedAt: Date.now(),
            },
          },
          false,
          "placePiece"
        );
      },

      removePiece: (x, y) => {
        const { levelData } = get();
        if (!levelData || !levelData.grid) return;

        const grid = levelData.grid;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;

        // Save state before making changes
        get().saveToUndoStack(`Remove piece at (${x}, ${y})`);

        const car = levelData.grid[y][x].car;
        if (car !== undefined) {
          get().unregisterCar(car);
        }

        const newGrid = grid.map((row, rowIndex) =>
          row.map((cell, colIndex): GridCell => {
            if (rowIndex === y && colIndex === x) {
              return {
                car: undefined,
                track: Track.EMPTY,
                mod: Mod.EMPTY,
                mod_num: 0,
              };
            }
            return cell;
          })
        );

        set(
          {
            levelData: {
              ...levelData,
              grid: newGrid,
              modifiedAt: Date.now(),
            },
          },
          false,
          "removePiece"
        );
      },

      removeModorCar: (x, y) => {
        const { levelData } = get();
        if (!levelData || !levelData.grid) return;

        const grid = levelData.grid;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;

        // Remove the entire tile instead if it's a tunnel
        if (grid[y][x].mod === Mod.TUNNEL) {
          get().removePiece(x, y)
          return
        }

        // Save state before making changes
        get().saveToUndoStack(`Remove mod at (${x}, ${y})`);

        const car = levelData.grid[y][x].car;
        if (car !== undefined) {
          get().unregisterCar(car);
        }

        const newGrid = grid.map((row, rowIndex) =>
          row.map((cell, colIndex): GridCell => {
            if (rowIndex === y && colIndex === x) {
              return {
                car: undefined,
                track: cell.track,
                mod: Mod.EMPTY,
                mod_num: 0,
              };
            }
            return cell;
          })
        );

        set(
          {
            levelData: {
              ...levelData,
              grid: newGrid,
              modifiedAt: Date.now(),
            },
          },
          false,
          "removeModorCar"
        );
      },

      registerCar: (type) => {
        const { levelData } = get();
        const car_nums = levelData.car_nums.get(type)!;
        // Register the next car by getting its index with next_nums
        const next_available = levelData.next_nums.get(type)!;
        levelData.car_nums.get(type)![next_available] = true;

        // Set the next_num (next car.num to be registered)
        let found_next_flag: boolean = false;
        for (let i = 0; i < car_nums.length; i++) {
          if (!car_nums[i]) {
            levelData.next_nums.set(type, i);
            found_next_flag = true;
            break;
          }
        }
        if (!found_next_flag) {
          levelData.next_nums.set(type, car_nums.length);
        }
        set(
          {
            levelData: {
              ...levelData,
            },
          },
          false,
          "registerCar"
        );
        return next_available;
      },

      unregisterCar: (car) => {
        const { levelData } = get();
        levelData.car_nums.get(car.type)![car.num] = false;
        if (levelData.next_nums.get(car.type)! > car.num) {
          levelData.next_nums.set(car.type, car.num);
        }
        set(
          {
            levelData: {
              ...levelData,
            },
          },
          false,
          "unregisterCar"
        );
      },

      registryFilled: (type) => {
        const { levelData } = get();
        return (
          levelData.next_nums.get(type)! >= levelData.car_nums.get(type)!.length
        );
      },

      getPieceAt: (x, y) => {
        const { levelData } = get();
        if (!levelData || !levelData.grid) return null;

        const grid = levelData.grid;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length)
          return null;

        return grid[y][x];
      },

      clearLevel: () => {
        // Save state before making changes
        get().saveToUndoStack("Clear level");
        set(
          {
            levelData: createDefaultLevel(),
            levelFilePath: null,
            undoStack: [],
            redoStack: [],
          },
          false,
          "clearLevel"
        );
      },

      setLevelMetadata: (metadata) => {
        const { levelData } = get();
        if (!levelData) return;

        set(
          {
            levelData: {
              ...levelData,
              metadata,
              modifiedAt: Date.now(),
            },
          },
          false,
          "setLevelMetadata"
        );
      },

      setLevelName: (name) => {
        const { levelData } = get();
        if (!levelData) return;

        set(
          {
            levelData: {
              ...levelData,
              name,
              modifiedAt: Date.now(),
            },
          },
          false,
          "setLevelName"
        );
      },

      resetLevel: () => {
        set(
          {
            levelData: createDefaultLevel(),
            levelFilePath: null,
            undoStack: [],
            redoStack: [],
          },
          false,
          "resetLevel"
        );
      },
    }),
    {
      name: "level-store", // Name for  DevTools
    }
  )
);
