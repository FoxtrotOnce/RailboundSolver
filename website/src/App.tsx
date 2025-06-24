import React, {useEffect, useState} from "react";
import {
  UndoRedoButtons,
  RightToolPanel,
  BottomSelectionPanel,
  GameCanvas,
  type GamePiece
} from "./components";
import { useGuiStore, useLevelStore } from "./store";

/**
 * RAILBOUND LEVEL EDITOR - MAIN APPLICATION
 *
 * This is the main application component that orchestrates the entire level editor interface.
 * Now uses two separate Zustand stores for better separation of concerns.
 *
 * COMPONENT STRUCTURE:
 * - GameCanvas: Main blue background area where level editing happens
 * - UndoRedoButtons: Top-right undo/redo functionality
 * - RightToolPanel: Right sidebar with tools
 * - BottomSelectionPanel: Bottom panel with track pieces, special items, and tools
 *
 * STATE MANAGEMENT:
 * - useGuiStore: Manages UI state (tools, pieces, canvas, panels)
 * - useLevelStore: Manages level data and undo/redo functionality
 * - Separated concerns for better maintainability and performance
 *
 * HOW TO EXTEND:
 * 1. Add new GUI actions to guiStore.ts
 * 2. Add new level actions to levelStore.ts
 * 3. Use selective subscriptions for performance
 * 4. Leverage separate devtools for each store
 */
const InputHandler: React.FC<{
  selectedTool: GamePiece | undefined
}> = ({selectedTool}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState({ deg: 0})

  useEffect(() => {
    const mousehandler = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY})
    };
    const keyhandler = (event: KeyboardEvent) => {
      if (event.repeat) {return}

      if (event.key === 'q') {
        setRotation(current => ({deg: current.deg - 90}))
      } else if (event.key === 'e') {
        setRotation(current => ({deg: current.deg + 90}))
      }
    }

    window.addEventListener('mousemove', mousehandler);
    window.addEventListener('keydown', keyhandler);
    return () => {
      window.removeEventListener('mousemove', mousehandler)
      window.removeEventListener('keydown', keyhandler)
    }
  }, []);

  return (
    <div className="absolute w-10 h-10 opacity-50"
        style={{left: mousePos.x - 20 - 3 * 4, top: mousePos.y - 20 - 16 * 4, transform: `rotate(${rotation.deg}deg)`}}
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
    >
      {selectedTool?.icon}
    </div>
  );
};

export default function App() {
  // =================
  // SEPARATE ZUSTAND STORES
  // =================

  /**
   * GUI Store - Manages UI state and display settings
   */
  const {
    // UI State
    selectedTool,
    selectedPiece,
    showGrid,
    gridSize,
    gridDims,
    setGridDims
  } = useGuiStore();

  /**
   * Level Store - Manages level data and undo/redo
   */
  const {
    // Level State
    levelData,
    undoStack,
    redoStack,
    isDirty,

    // Level Actions
    undo,
    redo,
    createNewLevel,
    setTracks,
    setSemaphores,
    setDims
  } = useLevelStore();

  // =================
  // RENDER COMPONENT
  // =================

  return (
    <div className="flex flex-col h-screen bg-slate-800 relative overflow-hidden">
      <div className="relative flex-1">
        <div className="absolute flex left-1/2 transform -translate-x-1/2 top-4 gap-2 rounded z-40">
          <input 
            type="number"
            min={1}
            max={12}
            className="text-white bg-gray-600 p-1 rounded border-1 border-gray-500"
            value={gridDims.x}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (0 < val && val <= 12) {
                setGridDims({y: gridDims.y, x: val})
                setDims({y: gridDims.y, x: val})
              }
            }}
            onKeyDown={(e) => e.preventDefault()}
          />
          <div className="self-end text-white text-lg">x</div>
          <input 
            type="number"
            min={1}
            max={12}
            className="text-white bg-gray-600 p-1 rounded border-1 border-gray-500"
            value={gridDims.y}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (0 < val && val <= 12) {
                setGridDims({y: val, x: gridDims.x})
              }
            }}
            onKeyDown={(e) => e.preventDefault()}
          />
          <div className="w-18 self-center text-white text-sm">Max Tracks:</div>
          <input 
            type="number"
            min={0}
            max={144}
            className="text-white bg-gray-600 p-1 rounded border-1 border-gray-500"
            value={levelData?.max_tracks}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (0 <= val && val <= 144) {
                setTracks(val)
              }
            }}
            onKeyDown={(e) => e.preventDefault()}
          />
          <div className="w-28 self-center text-white text-sm">Max Semaphores:</div>
          <input 
            type="number"
            min={0}
            max={5}
            className="text-white bg-gray-600 p-1 rounded border-1 border-gray-500"
            value={levelData?.max_semaphores}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (0 <= val && val <= 5) {
                setSemaphores(val)
              }
            }}
            onKeyDown={(e) => e.preventDefault()}
          />
          <button
            type="button"
            className="w-25 cursor-pointer rounded text-white border-2 border-gray-600 z-40"
            onClick={() => createNewLevel(gridDims.x, gridDims.y)}
            >
            Clear Grid
          </button>
        </div>
        <div className="overflow-hidden absolute inset-3 top-16 rounded-lg border-2 border-gray-600">
          <GameCanvas showGrid={showGrid} gridSize={gridSize} gridDims={gridDims}>
            {/* TODO: Add level editing functionality here */}
            {/* TODO: Render placed track pieces */}
            {/* TODO: Add click handlers for piece placement */}
            {/* TODO: Implement drag and drop */}
            {/* TODO: Add selection indicators */}
            <InputHandler selectedTool={selectedTool}/>
          </GameCanvas>
        </div>
      </div>

      {/* 
        UNDO/REDO BUTTONS
        Now uses Zustand store actions
      */}
      <UndoRedoButtons
        onUndo={undo}
        onRedo={redo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
      />
      {/* 
        RIGHT TOOL PANEL
        Tool selection via Zustand store
      */}
      <RightToolPanel />
        
      <div className="relative h-25">
        {/* 
          BOTTOM SELECTION PANEL
          Piece selection via Zustand store
        */}
        <BottomSelectionPanel />
      </div>
      {/* 
        GAME CANVAS
        Main area where level editing happens
        Now uses Zustand store for grid configuration
      */}
    </div>
  );
}
