import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {Track, Mod} from "../../../algo/classes";

/**
 * Level data structure
 * Represents the actual game level with all placed pieces
 */
export interface LevelData {
  id?: string;
  name?: string;
  grid?: GridTile[][];
  max_tracks?: number;
  max_semaphores?: number;
  metadata?: Record<string, unknown>;
  createdAt?: number;
  modifiedAt?: number;
}

/**
 * Individual grid cell in the level
 */
export interface GridTile {
  track: Track;
  mod: Mod;
  mod_num: number;
}

/**
 * State snapshot for undo/redo functionality
 * Contains only level-related state that can be undone
 */
export interface LevelStateSnapshot {
  levelData: LevelData | null;
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
  levelData: LevelData | null;

  /**
   * Whether the level has unsaved changes
   */
  isDirty: boolean;

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
  createNewLevel: (width?: number, height?: number) => void;

  /**
   * Set the dims for the level
   */
  setDims: (dims: {y: number, x: number}) => void;

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
  loadLevel: (levelData: LevelData, filePath?: string) => void;

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
    track?: Track | undefined,
    mod?: Mod | undefined,
    mod_num?: number | undefined
  ) => void;

  /**
   * Remove piece at specific grid coordinates
   */
  removePiece: (x: number, y: number) => void;

  /**
   * Get piece at specific grid coordinates
   */
  getPieceAt: (x: number, y: number) => GridTile | null;

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
): GridTile[][] => {
  return Array(height).fill(null).map(() => Array(width).fill({
    track: Track.EMPTY,
    mod: Mod.EMPTY,
    mod_num: 0
  }))
};

/**
 * Create the Level Zustand store with devtools support
 */
export const useLevelStore = create<LevelState>()(
  devtools(
    (set, get) => ({
      // =================
      // INITIAL STATE
      // =================

      levelData: null,
      isDirty: false,
      levelFilePath: null,
      undoStack: [],
      redoStack: [],
      maxUndoStates: 50,

      // =================
      // ACTIONS
      // =================

      createNewLevel: (width = 12, height = 12, max_tracks: number, max_semaphores: number) => {
        const newLevel: LevelData = {
          id: `level_${Date.now()}`,
          name: "Untitled Level",
          grid: createEmptyGrid(width, height),
          max_tracks: max_tracks,
          max_semaphores: max_semaphores,
          metadata: {},
          createdAt: Date.now(),
          modifiedAt: Date.now(),
        };

        set(
          {
            levelData: newLevel,
            isDirty: false,
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
        const {levelData} = get()
        set(
          {
            levelData: {
              ...levelData,
              max_tracks: max_tracks,
              modifiedAt: Date.now(),
            },
            isDirty: true,
          },
          false,
          "placePiece"
        );        

        console.log(`Max tracks updated to ${max_tracks}`);
      },

      setSemaphores: (max_semaphores) => {
        const {levelData} = get()
        set(
          {
            levelData: {
              ...levelData,
              max_semaphores: max_semaphores,
              modifiedAt: Date.now(),
            },
            isDirty: true,
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
        
        let newGrid: GridTile[][] = []
        for (let i = 0; i < dims.y; i++) {
          newGrid.push([])
          for (let j = 0; j < dims.x; j++) {
            if (i < grid.length && j < grid[0].length) {
              newGrid[i].push(grid[i][j])
            } else {
              newGrid[i].push({
                track: Track.EMPTY,
                mod: Mod.EMPTY,
                mod_num: 0
              })
            }
          }
        }

        set(
          {
            levelData: {
              ...levelData,
              grid: newGrid,
              modifiedAt: Date.now(),
            },
            isDirty: true,
          },
          false,
          "placePiece"
        );        

        console.log(`Board dims updated to (${dims.y}, ${dims.x})`);
      },

      loadLevel: (levelData, filePath) => {
        set(
          {
            levelData: { ...levelData, modifiedAt: Date.now() },
            isDirty: false,
            levelFilePath: filePath || null,
            undoStack: [],
            redoStack: [],
          },
          false,
          "loadLevel"
        );

        console.log(`📂 Level loaded: ${levelData.name || "Untitled"}`);
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
            isDirty: true,
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
            isDirty: true,
          },
          false,
          "redo"
        );

        console.log(`↷ Redo: ${nextState.action || "action"}`);
      },

      clearHistory: () => {
        set({ undoStack: [], redoStack: [] }, false, "clearHistory");
      },

      placePiece: (x, y, track, mod, mod_num) => {
        const { levelData } = get();
        if (!levelData || !levelData.grid) return;

        const grid = levelData.grid;
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;

        if (track === undefined) {track = grid[y][x].track}
        if (mod === undefined) {mod = grid[y][x].mod}
        if (mod_num === undefined) {mod_num = grid[y][x].mod_num}

        // Save state before making changes
        get().saveToUndoStack(`Place ${track}/${mod}/${mod_num} at (${x}, ${y})`);

        const newGrid = grid.map((row, rowIndex) =>
          row.map((cell, colIndex): GridTile => {
            if (rowIndex === y && colIndex === x) {
              return {
                track: track,
                mod: mod,
                mod_num: mod_num
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
            isDirty: true,
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

        const newGrid = grid.map((row, rowIndex) =>
          row.map((cell, colIndex): GridTile => {
            if (rowIndex === y && colIndex === x) {
              return {
                track: Track.EMPTY,
                mod: Mod.EMPTY,
                mod_num: 0
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
            isDirty: true,
          },
          false,
          "removePiece"
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
        const { levelData } = get();
        if (!levelData) return;

        // Save state before making changes
        get().saveToUndoStack("Clear level");

        const width = levelData.grid?.[0]?.length || 20;
        const height = levelData.grid?.length || 15;

        set(
          {
            levelData: {
              ...levelData,
              grid: createEmptyGrid(width, height),
              modifiedAt: Date.now(),
            },
            isDirty: true,
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
            isDirty: true,
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
            isDirty: true,
          },
          false,
          "setLevelName"
        );
      },

      setDirty: (dirty) => {
        set({ isDirty: dirty }, false, "setDirty");
      },

      resetLevel: () => {
        set(
          {
            levelData: null,
            isDirty: false,
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
