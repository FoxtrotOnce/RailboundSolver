import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Track, Mod, Car, CarType, Direction } from "../../../algo/classes";

/**
 * Level data structure
 * Represents the actual game level with all placed pieces
 */
export interface LevelData {
  id: number;
  name: string;
  grid: GridCell[][];
  car_nums: Map<CarType, boolean[]>;
  next_nums: Map<CarType, number>;
  width: number;
  height: number;
  max_tracks: number;
  max_semaphores: number;
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
   * List of the user's saved levels by id.
   * Shown under "Custom" in Level Settings.
   */
  savedLevels: Record<number, LevelData>;

  // =================
  // UNDO/REDO STATE
  // =================

  /**
   * Stack of previous level states for undo functionality
   * Each entry represents a complete level state snapshot
   */
  undoStack: LevelData[];

  /**
   * Stack of forward level states for redo functionality
   * Gets populated when undo is performed
   */
  redoStack: LevelData[];

  /**
   * Maximum number of undo states to keep in memory
   */
  maxUndoStates: number;

  // =================
  // ACTIONS
  // =================

  /**
   * Creates a new default level.
   */
  createDefaultLevel: () => LevelData

  /**
   * Returns a copied version of levelData.
   */
  copyLevel: () => LevelData

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
  loadLevel: (levelData: LevelData) => void;

  /**
   * Save level data (Only applicable to custom levels)
   */
  saveLevel: () => void;

  /**
   * Converts JSON level data to LevelData and returns it.
   */
  convertJsonLevel: (levelData: jsonData, name?: string) => LevelData;

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
  removePiece: (x: number, y: number, save?: boolean) => void;

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
   * Clear entire level (remove all pieces)
   */
  clearLevel: () => void;

  /**
   * Set level name
   */
  setLevelName: (name: string) => void;

  /**
   * Mark level as dirty/clean
   */
  setDirty: (dirty: boolean) => void;
}

/**
 * Create an empty grid of specified dimensions
 */
const createEmptyGrid = (
  width: number = 12,
  height: number = 12
): GridCell[][] => {
  return Array.from({length: height})
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
  id: Math.random(),
  name: "Unnamed Level",
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
  createdAt: Date.now(),
  modifiedAt: Date.now(),
});

const defaultLevel = createDefaultLevel()

/**
 * Create the Level Zustand store with devtools support
 */
export const useLevelStore = create<LevelState>()(
  devtools(
    (set, get) => ({
      // =================
      // INITIAL STATE
      // =================

      levelData: defaultLevel,
      savedLevels: {[defaultLevel.id]: defaultLevel} as Record<number, LevelData>,
      undoStack: [],
      redoStack: [],

      maxUndoStates: 200,

      // =================
      // ACTIONS
      // =================

      createDefaultLevel: () => {
        return createDefaultLevel()
      },

      copyLevel: () => {
        const { levelData } = get()
        const copied_car_nums = new Map<CarType, boolean[]>()
        for (const [type, list_in_use] of levelData.car_nums.entries()) {
          copied_car_nums.set(type, [...list_in_use])
        }
        const copied_level: LevelData = {
          ...levelData,
          car_nums: copied_car_nums,
          next_nums: new Map(levelData.next_nums)
        }
        return copied_level
      },

      setTracks: (max_tracks) => {
        const { levelData, saveLevel, saveToUndoStack } = get();
        saveToUndoStack()
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
        saveLevel()
      },

      setSemaphores: (max_semaphores) => {
        const { levelData, saveLevel, saveToUndoStack } = get();
        saveToUndoStack()
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
        saveLevel()
      },

      setDims: (dims) => {
        const { levelData, removePiece } = get();
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
              // Don't save since then each savedLevel needs to be copied. Saving is performed in GameCanvas.tsx.
              removePiece(j, i, false);
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
        // Setting dims doesn't immediately save the level, since it's handled manually.
        // * The level is only saved after the user finishes dragging the resize grabbers in GameCanvas.tsx.
      },

      loadLevel: (loadData) => {
        set(
          {
            levelData: { ...loadData, modifiedAt: Date.now() },
            undoStack: [],
            redoStack: [],
          },
          false,
          "loadLevel"
        );
        get().setDims({ y: loadData.height, x: loadData.width });
        console.log(`📂 Level loaded: ${get().levelData.name}`);
      },

      saveLevel: () => {
        const { levelData, savedLevels } = get()
        if (levelData.id.toString() in savedLevels) {
          set((state) => ({ savedLevels: {
            ...state.savedLevels,
            [state.levelData.id]: state.levelData
          } }))
        } else {
          console.log("Level is not custom and therefore cannot be saved")
        }
      },

      convertJsonLevel: (levelData, name="Unnamed Level") => {
        const loadedData = createDefaultLevel();
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
          loadedData.grid[car.pos[0]][car.pos[1]].car = car;
          for (let i = 0; i <= car.num; i++) {
            loadedData.car_nums.get(car.type)![i] = true;
          }
          loadedData.next_nums.set(car.type, car.num + 1);
        }
        loadedData.name = name
        return loadedData
      },

      saveToUndoStack: () => {
        const { levelData, undoStack, maxUndoStates, copyLevel } = get();
        if (!levelData) return;

        undoStack.push(copyLevel())
        if (undoStack.length > maxUndoStates) {
          undoStack.shift()
        }

        // Don't have to use set for undoStack since it isn't used for rendering, but redoStack needs to be set to an empty array.
        set(
          {
            redoStack: []
          },
          false,
          "saveToUndoStack"
        )
      },

      undo: () => {
        const { undoStack, redoStack, saveLevel, copyLevel } = get();
        if (undoStack.length === 0) {
          return
        }

        const newData = undoStack.pop()!
        redoStack.push(copyLevel())

        set(
          {
            levelData: newData,
          },
          false,
          "undo"
        );

        saveLevel()
      },

      redo: () => {
        const { redoStack, undoStack, saveLevel, copyLevel } = get();
        if (redoStack.length === 0) {
          return
        }

        const newData = redoStack.pop()!
        undoStack.push(copyLevel())

        set(
          {
            levelData: newData,
          },
          false,
          "redo"
        );

        saveLevel()
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
        const { levelData, saveLevel, saveToUndoStack, removePiece, registryFilled, registerCar } = get();
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
          // EXCEPT for tunnels and stations since they ignore this rule.
          (((mod !== Mod.EMPTY && mod !== Mod.TUNNEL && mod !== Mod.STATION && mod !== Mod.POST_OFFICE) || placing_car) &&
            !track.is_straight() &&
            !track.is_turn() &&
            !track.is_3way())
        ) {
          return;
        }
        saveToUndoStack()
        if (placing_track) {
          removePiece(x, y, false);
        }
        if (placing_car && !registryFilled(cartype)) {
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
          car = new Car([y, x], dir, registerCar(cartype), cartype);
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
        saveLevel()
      },

      removePiece: (x, y, save=true) => {
        const { levelData, saveLevel, saveToUndoStack } = get();
        if (!levelData || !levelData.grid) return;

        const grid = levelData.grid;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;

        if (save) {
          saveToUndoStack()
        }

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
        if (save) {
          saveLevel()
        }
      },

      removeModorCar: (x, y) => {
        const { levelData, saveLevel, saveToUndoStack } = get();
        if (!levelData || !levelData.grid) return;

        const grid = levelData.grid;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;
        saveToUndoStack()

        // Remove the entire tile instead if it's a tunnel
        if (grid[y][x].mod === Mod.TUNNEL) {
          get().removePiece(x, y, false)
          saveLevel()
          return
        }

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
        saveLevel()
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

      clearLevel: () => {
        const { saveToUndoStack, saveLevel, levelData } = get()
        saveToUndoStack()
        const defaultParams = createDefaultLevel()
        levelData.car_nums = defaultParams.car_nums
        levelData.next_nums = defaultParams.next_nums
        levelData.grid = createEmptyGrid(levelData.width, levelData.height)
        
        set(
          {
            levelData: {
              ...levelData,
              modifiedAt: Date.now()
            }
          },
          false,
          "clearLevel"
        )
        saveLevel()
      },

      setLevelName: (name) => {
        const { levelData, saveLevel } = get();
        if (!levelData) return;

        if (name === '') {
          name = "Unnamed Level"
        }

        set(
          {
            levelData: {
              ...levelData,
              name: name,
              modifiedAt: Date.now(),
            },
          },
          false,
          "setLevelName"
        );
        console.log(`Level name updated to "${name}"`)
        saveLevel()
      },
    }),
    {
      name: "level-store", // Name for DevTools
    }
  )
);
