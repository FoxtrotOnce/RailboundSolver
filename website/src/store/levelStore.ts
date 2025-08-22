import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Track, Mod, Car, CarType, Direction } from "../../../algo/classes";
import Worker from "../../../algo/main.ts?worker"
import { useGuiStore } from "./guiStore";

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
   * The original level data before solving; the base level's data.
   */
  permLevelData: LevelData;

  /**
   * The level data getting rendered on the editing grid.
   * It is usually identical to permLevelData.grid, unless the grid is being solved,
   * in which case it holds the currently rendered frame/step of solving.
   */
  renderedLevelData: GridCell[][];

  /**
   * The level data getting rendered in level settings.
   */
  settingsLevelData: GridCell[][];

  /**
   * List of the user's saved levels by id.
   * Shown under "Custom" in Level Settings.
   */
  savedLevels: Record<number, LevelData>;

  /**
   * The worker currently being used for level solving (if solving).
   */
  solvingWorker: undefined | Worker;

  /**
   * Current total iterations elapsed (obtained via main.ts, updated according to the visualization rate)
   */
  iterations: number;

  /**
   * Current total time elapsed (obtained via main.ts, updated according to the visualization rate)
   */
  time_elapsed: number;

  // =================
  // UNDO/REDO STATE
  // =================

  /**
   * Stack of level snapshots for each edit made to revert to when undoing edits.
   */
  undoStack: LevelData[];

  /**
   * Stack of level snapshots for each edit undone to revert to when redoing edits.
   */
  redoStack: LevelData[];

  /**
   * Maximum length of undoStack.
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
   * Load level data to permLevelData and renderedLevelData
   */
  loadLevel: (levelData: LevelData) => void;

  /**
   * Load level data to settingsLevelData
   */
  renderSettingsLevel: (levelData: LevelData) => void;

  /**
   * Save level data (Only applicable to custom levels)
   */
  saveLevel: () => void;

  /**
   * Terminate the current solvingWorker if possible.
   */
  terminateWorker: () => void;

  /**
   * Solve the level (permLevelData) and return solution, render steps to renderedLevelData.
   */
  solveLevel: (step?: boolean) => void;

  /**
   * Pause/resume level generation.
   */
  pauseLevel: (pause: boolean) => void;

  /**
   * Perform 1 step of level generation.
   */
  stepLevel: () => void;

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
    car_rot?: number | undefined,
    save?: boolean | undefined
  ) => void;

  /**
   * Remove piece at specific grid coordinates
   */
  removePiece: (x: number, y: number, save?: boolean, removeStation?: boolean) => void;

  /**
   * Remove mod/car at specific grid coordinates
   */
  removeModorCar: (x: number, y: number, save?: boolean) => void;

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
const createDefaultLevel = (width = 12, height = 12): LevelData => ({
  id: Math.random(),
  name: "Unnamed Level",
  grid: createEmptyGrid(width, height),
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

      permLevelData: defaultLevel,
      renderedLevelData: defaultLevel.grid,
      settingsLevelData: defaultLevel.grid,
      levelData: defaultLevel,
      savedLevels: {[defaultLevel.id]: defaultLevel} as Record<number, LevelData>,
      solvingWorker: undefined,
      iterations: 0,
      time_elapsed: 0,
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
        const { permLevelData } = get()
        const copied_car_nums = new Map<CarType, boolean[]>()
        for (const [type, list_in_use] of permLevelData.car_nums.entries()) {
          copied_car_nums.set(type, [...list_in_use])
        }
        const copied_level: LevelData = {
          ...permLevelData,
          grid: permLevelData.grid.map((row) => row.map((cell) => ({...cell}))),
          car_nums: copied_car_nums,
          next_nums: new Map(permLevelData.next_nums)
        }
        return copied_level
      },

      setTracks: (max_tracks) => {
        const { permLevelData, saveLevel, saveToUndoStack, terminateWorker } = get();
        saveToUndoStack()
        terminateWorker()
        set(
          {
            permLevelData: {
              ...permLevelData,
              max_tracks: max_tracks,
              modifiedAt: Date.now(),
            },
          },
          false,
          "placePiece"
        );

        saveLevel()
      },

      setSemaphores: (max_semaphores) => {
        const { permLevelData, saveLevel, saveToUndoStack, terminateWorker } = get();
        saveToUndoStack()
        terminateWorker()
        set(
          {
            permLevelData: {
              ...permLevelData,
              max_semaphores: max_semaphores,
              modifiedAt: Date.now(),
            },
          },
          false,
          "placePiece"
        );
        saveLevel()
      },

      setDims: (dims) => {
        const { permLevelData, removePiece } = get();

        let grid = permLevelData.grid;

        // Iterate over tracks that got cut off if dim was decreased to properly remove them
        for (let i = 0; i < grid.length; i++) {
          for (let j = 0; j < grid[0].length; j++) {
            if (i >= dims.y || j >= dims.x) {
              // Don't save since then each savedLevel needs to be copied. Saving is performed in GameCanvas.tsx.
              removePiece(j, i, false, false);
            }
          }
        }

        grid = get().permLevelData.grid;

        const newGrid: GridCell[][] = [];
        for (let i = 0; i < dims.y; i++) {
          newGrid.push([]);
          for (let j = 0; j < dims.x; j++) {
            if (i < grid.length && j < grid[0].length) {
              newGrid[i].push(grid[i][j]);
            } else {
              // If there's an OOB station on this tile (a mod station is adjacent and no other stations are adjacent to the mod),
              // place a station where the OOB one is.
              // for placeDefaultTile:
              //    0 = Didn't process anything, PLACE DEFAULT
              //    1 = Found station, PLACE DEFAULT
              //    2 = Didn't find station, DON'T PLACE DEFAULT
              let placeDefaultTile = 0
              const adjPoses = [{ x: -1, y: 0 }, { x: 1, y: 0}, { x: 0, y: 1 }, { x: 0, y: -1 }]
              const stations = [Track.STATION_LEFT, Track.STATION_RIGHT, Track.STATION_DOWN, Track.STATION_UP]
              
              // Search each adjacent tile for a station mod tile (could just check adjPoses[0/3] but I might change resizing so all 4 are used)
              for (let posIdx = 0; posIdx < adjPoses.length; posIdx++) {
                let adjPos = adjPoses[posIdx]
                adjPos = { x: j + adjPos.x, y: i + adjPos.y }
                const modTile: GridCell | undefined = grid[adjPos.y]?.[adjPos.x]
                // If a station mod tile is found, search around it for a station.
                if (modTile?.mod.is_station()) {
                  // If there are 2 OOB tiles adjacent to the station mod (it's in a corner), only place the OOB station if dims are being extended vertically.
                  let OOBTiles = 0
                  for (const adjPos2 of adjPoses) {
                    const stationPos = { x: adjPos.x + adjPos2.x, y: adjPos.y + adjPos2.y }
                    const station: Track | undefined = grid[stationPos.y]?.[stationPos.x]?.track
                    OOBTiles += station === undefined ? 1 : 0
                    if (station?.is_station()) {
                      // Station found, cancel loop and don't place anything.
                      placeDefaultTile = 1
                      break
                    }
                  }
                  // The second condition makes an OOB station only place if the grid is extended vertically when the station mod is in a corner,
                  // to visually match where OOB stations render in corners in GridTile.tsx (vertical OOB takes priority over horizontal)
                  if (placeDefaultTile === 0 && (OOBTiles !== 2 || i >= grid.length)) {
                    // Station wasn't found, place an OOB station.
                    newGrid[i].push({
                      car: undefined,
                      track: stations[posIdx],
                      mod: Mod.EMPTY,
                      mod_num: modTile.mod_num
                    })
                    placeDefaultTile = 2
                  }
                  break
                }
              }
              if (placeDefaultTile !== 2) {
                newGrid[i].push({
                  car: undefined,
                  track: Track.EMPTY,
                  mod: Mod.EMPTY,
                  mod_num: 0,
                });
              }
            }
          }
        }

        set(
          {
            permLevelData: {
              ...permLevelData,
              grid: newGrid,
              modifiedAt: Date.now(),
            },
            renderedLevelData: newGrid
          },
          false,
          "placePiece"
        );
        // Setting dims doesn't immediately save the level, since it's handled manually.
        // * The level is only saved after the user finishes dragging the resize grabbers in GameCanvas.tsx.
      },

      loadLevel: (levelData) => {
        get().terminateWorker()
        set(
          {
            permLevelData: { ...levelData, modifiedAt: Date.now() },
            renderedLevelData: levelData.grid,
            settingsLevelData: levelData.grid,
            undoStack: [],
            redoStack: [],
          },
          false,
          "loadLevel"
        );
      },

      renderSettingsLevel: (levelData) => {
        set({settingsLevelData: levelData.grid}, false, "renderSettingsLevel")
      },

      saveLevel: () => {
        const { permLevelData, savedLevels } = get()
        if (permLevelData.id.toString() in savedLevels) {
          set((state) => ({ savedLevels: {
            ...state.savedLevels,
            [state.permLevelData.id]: state.permLevelData
          } }))
        } else {
          console.log("Level is not custom and therefore cannot be saved")
        }
      },

      terminateWorker: () => {
        const { solvingWorker } = get()

        if (solvingWorker !== undefined) {
          solvingWorker.terminate()
        }
        set({solvingWorker: undefined}, false, "terminateWorker")
      },

      solveLevel: (step: false) => {
        // board, mods, and cars are reserialized inside here since postMessage strips them of their methods.
        function reloadGrid(input: {board: Track[][], mods: Mod[][], cars: Car[]}): void {
          const reloadedGrid: GridCell[][] = []
          for (let i = 0; i < permLevelData.grid.length; i++) {
            reloadedGrid.push([])
            for (let j = 0; j < permLevelData.grid[0].length; j++) {
              const tile = permLevelData.grid[i][j]
              reloadedGrid[i].push({
                car: undefined,
                track: Track.get(input.board[i][j].value),
                mod: Mod.get(input.mods[i][j].value),
                mod_num: tile.mod_num
              })
            }
          }
          for (const car of input.cars) {
            reloadedGrid[car.pos[0]][car.pos[1]].car = new Car(
              [car.pos[0], car.pos[1]],
              Direction.get(car.direction.value),
              car.num,
              CarType.get(car.type.name)
            )
          }
          set(
            {
              renderedLevelData: reloadedGrid
            },
            false,
            "reload"
          )
        }

        set({solvingWorker: new Worker()}, false, "solveLevel")
        const { permLevelData, solvingWorker } = get()

        solvingWorker!.postMessage({
          level: permLevelData,
          parameters: useGuiStore.getState().hyperparameters,
          step: step
        })
        // board, mods, and cars aren't technically Track/Car/Mod: they share the same properties, but postMessage converts them to Objects,
        // and they lose their methods, so they are reserialized before being dealt with.
        type msgType = {
          done: boolean
          visualize_data?: {
            board: Track[][],
            mods: Mod[][],
            cars: Car[],
            iterations: number,
            time_elapsed: number
          }
          solution?: {
            board: Track[][],
            mods: Mod[][],
            tracks_left: number,
            semaphores_left: number,
            time_elapsed: number,
            iterations: number
          }
        }
        solvingWorker!.onmessage = (e: MessageEvent<msgType>) => {
          if (e.data.done) {
            const solution = e.data.solution!
            // Reserialize the solution to GridCell[][]
            const grid: GridCell[][] = []
            for (let i = 0; i < solution.board.length; i++) {
              grid.push([])
              for (let j = 0; j < solution.board[0].length; j++) {
                const car = permLevelData.grid[i][j].car
                grid[i].push({
                  car: car && new Car(
                    [car.pos[0], car.pos[1]],
                    Direction.get(car.direction.value),
                    car.num,
                    CarType.get(car.type.name)
                  ),
                  track: Track.get(solution.board[i][j].value),
                  mod: Mod.get(solution.mods[i][j].value),
                  mod_num: permLevelData.grid[i][j].mod_num
                })
              }
            }
            // Note: Don't terminate the worker yet, since the grid still needs to be uneditable.
            //       It is terminated when the level is changed at all (setTracks, setSemaphores, clearLevel, loadLevel)
            set({
              iterations: e.data.solution!.iterations,
              time_elapsed: e.data.solution!.time_elapsed,
              renderedLevelData: grid
            }, false, "solveLevel")
            console.log(solution)
          } else {
            reloadGrid(e.data.visualize_data!)
            set({
              iterations: e.data.visualize_data!.iterations,
              time_elapsed: e.data.visualize_data!.time_elapsed
            }, false, "solveLevel")
          }
        }
      },

      pauseLevel: (pause) => {
        console.log('a')
        get().solvingWorker!.postMessage({pause: pause})
      },

      stepLevel: () => {
        const { solvingWorker, solveLevel } = get()
        if (solvingWorker !== undefined) {
          solvingWorker.postMessage({step: true})
        } else {
          solveLevel(true)
        }
      },

      convertJsonLevel: (levelData, name="Unnamed Level") => {
        const loadedData = createDefaultLevel(levelData.board[0].length, levelData.board.length);
        loadedData.max_tracks = levelData.tracks;
        loadedData.max_semaphores = levelData.semaphores;
        for (let i = 0; i < levelData.board.length; i++) {
          for (let j = 0; j < levelData.board[0].length; j++) {
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
        const { undoStack, maxUndoStates, copyLevel } = get();

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
            permLevelData: newData,
            renderedLevelData: newData.grid,
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
            permLevelData: newData,
            renderedLevelData: newData.grid,
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
        car_rot = 0,
        save = true
      ) => {
        const { permLevelData, saveLevel, saveToUndoStack, removePiece, registryFilled, registerCar, removeModorCar } = get();
        const placing_car = cartype !== undefined;
        const placing_track = track !== Track.EMPTY;
        if (cartype === undefined && track.is_empty() && mod === Mod.EMPTY) return;

        let grid = permLevelData.grid;
        let car = undefined;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;

        if (!placing_track) {
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
        if (save) {
          saveToUndoStack()
        }
        if (placing_track) {
          removePiece(x, y, false);
        } else if (mod !== Mod.EMPTY) {
          removeModorCar(x, y, false)
        }
        // Update grid in case removePiece or removeModorCar was called
        grid = get().permLevelData.grid

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

        const newGrid = grid.map((row, idx) =>
          row.map((cell, jdx): GridCell => {
            if (idx === y && jdx === x) {
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
            permLevelData: {
              ...permLevelData,
              grid: newGrid,
              modifiedAt: Date.now(),
            },
            renderedLevelData: newGrid,
          },
          false,
          "placePiece"
        );
        if (save) {
          saveLevel()
        }
      },

      removePiece: (x, y, save=true, removeStation=true) => {
        const { permLevelData, saveLevel, saveToUndoStack, unregisterCar } = get();
        const grid = permLevelData.grid;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;

        if (save) {
          saveToUndoStack()
        }

        const {track, mod, car} = grid[y][x];
        let [station_y, station_x] = [y, x]
        // If there's a car, unregister it before removing it.
        if (car !== undefined) {
          unregisterCar(car);
        }
        // If there's a station and it can be removed (the mod isn't at the edge),
        // remove the station mod on the tile this station is facing.
        if (track.is_station() && removeStation) {
          if (track === Track.STATION_LEFT) {
            station_x--
          } else if (track === Track.STATION_RIGHT) {
            station_x++
          } else if (track === Track.STATION_DOWN) {
            station_y++
          } else if (track === Track.STATION_UP) {
            station_y--
          } else {
            throw Error(`Unable to remove piece; there's no station mod where the station at y${y} x${x} is facing.`)
          }
        }
        // If there's a station mod, remove the adjacent station that is facing this tile.
        if (mod.is_station()) {
          if (grid[y + 1]?.[x].track === Track.STATION_UP) {
            station_y++
          } else if (grid[y - 1]?.[x].track === Track.STATION_DOWN) {
            station_y--
          } else if (grid[y][x + 1]?.track === Track.STATION_LEFT) {
            station_x++
          } else if (grid[y][x - 1]?.track === Track.STATION_RIGHT) {
            station_x--
          } else {
            // There is likely an OOB station for this tile, don't remove anything.
          }
        }

        const newGrid = grid.map((row, idx) =>
          row.map((cell, jdx): GridCell => {
            if (idx === y && jdx === x) {
              return {
                car: undefined,
                track: Track.EMPTY,
                mod: Mod.EMPTY,
                mod_num: 0,
              };
            } else if (idx === station_y && jdx === station_x) {
              return {
                car: undefined,
                track: mod.is_station() ? Track.EMPTY : cell.track,
                mod: Mod.EMPTY,
                mod_num: 0
              }
            }
            return cell;
          })
        );

        set(
          {
            permLevelData: {
              ...permLevelData,
              grid: newGrid,
              modifiedAt: Date.now(),
            },
            renderedLevelData: newGrid,
          },
          false,
          "removePiece"
        );
        if (save) {
          saveLevel()
        }
      },

      removeModorCar: (x, y, save=true) => {
        const { permLevelData, saveLevel, saveToUndoStack, removePiece, unregisterCar } = get();
        const grid = permLevelData.grid;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;
        if (save) {
          saveToUndoStack()
        }

        const {mod, car} = grid[y][x]
        let [station_y, station_x] = [y, x]

        if (car !== undefined) {
          unregisterCar(car);
        }

        // Remove the entire tile instead if it's a tunnel
        if (mod === Mod.TUNNEL) {
          removePiece(x, y, false)
          if (save) {
            saveLevel()
          }
          return
        }
        
        // If there's a station mod, remove the adjacent station that is facing this tile.
        if (mod.is_station()) {
          if (grid[y + 1]?.[x].track === Track.STATION_UP) {
            station_y++
          } else if (grid[y - 1]?.[x].track === Track.STATION_DOWN) {
            station_y--
          } else if (grid[y][x + 1]?.track === Track.STATION_LEFT) {
            station_x++
          } else if (grid[y][x - 1]?.track === Track.STATION_RIGHT) {
            station_x--
          } else {
            // There is likely an OOB station for this tile, don't remove anything.
          }
        }

        const newGrid = grid.map((row, idx) =>
          row.map((cell, jdx): GridCell => {
            if (idx === y && jdx === x) {
              return {
                car: undefined,
                track: cell.track,
                mod: Mod.EMPTY,
                mod_num: 0,
              };
            } else if (idx === station_y && jdx === station_x) {
              return {
                car: undefined,
                track: Track.EMPTY,
                mod: Mod.EMPTY,
                mod_num: 0
              }
            }
            return cell;
          })
        );

        set(
          {
            permLevelData: {
              ...permLevelData,
              grid: newGrid,
              modifiedAt: Date.now(),
            },
            renderedLevelData: newGrid,
          },
          false,
          "removeModorCar"
        );
        if (save) {
          saveLevel()
        }
      },

      registerCar: (type) => {
        const { permLevelData } = get();
        const car_nums = permLevelData.car_nums.get(type)!;
        // Register the next car by getting its index with next_nums
        const next_available = permLevelData.next_nums.get(type)!;
        permLevelData.car_nums.get(type)![next_available] = true;

        // Set the next_num (next car.num to be registered)
        let found_next_flag: boolean = false;
        for (let i = 0; i < car_nums.length; i++) {
          if (!car_nums[i]) {
            permLevelData.next_nums.set(type, i);
            found_next_flag = true;
            break;
          }
        }
        if (!found_next_flag) {
          permLevelData.next_nums.set(type, car_nums.length);
        }
        return next_available;
      },

      unregisterCar: (car) => {
        const { permLevelData } = get();
        permLevelData.car_nums.get(car.type)![car.num] = false;
        if (permLevelData.next_nums.get(car.type)! > car.num) {
          permLevelData.next_nums.set(car.type, car.num);
        }
      },

      registryFilled: (type) => {
        const { permLevelData } = get();
        return (
          permLevelData.next_nums.get(type)! >= permLevelData.car_nums.get(type)!.length
        );
      },

      clearLevel: () => {
        const { saveToUndoStack, saveLevel, permLevelData, terminateWorker } = get()
        saveToUndoStack()
        const defaultParams = createDefaultLevel()
        permLevelData.car_nums = defaultParams.car_nums
        permLevelData.next_nums = defaultParams.next_nums
        permLevelData.grid = createEmptyGrid(permLevelData.grid[0].length, permLevelData.grid.length)
        terminateWorker()
        
        set(
          {
            permLevelData: {
              ...permLevelData,
              modifiedAt: Date.now()
            },
            renderedLevelData: permLevelData.grid,
            iterations: 0,
            time_elapsed: 0
          },
          false,
          "clearLevel"
        )
        saveLevel()
      },

      setLevelName: (name) => {
        const { permLevelData, saveLevel } = get();

        if (name === '') {
          name = "Unnamed Level"
        }

        set(
          {
            permLevelData: {
              ...permLevelData,
              name: name,
              modifiedAt: Date.now(),
            },
          },
          false,
          "setLevelName"
        );
        saveLevel()
      },
    }),
    {
      name: "level-store", // Name for DevTools
    }
  )
);
