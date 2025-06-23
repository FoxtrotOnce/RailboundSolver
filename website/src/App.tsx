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
const MouseTracker: React.FC<{
  // selectedTrack: GamePiece;
}> = ({}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div>
      {/* {selectedTrack.icon} */}
      <div className="fixed top-2 left-2 text-sm bg-white/80 p-1 rounded shadow">
        x: {mousePos.x}, y: {mousePos.y}
      </div>
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
  } = useLevelStore();

  // =================
  // RENDER COMPONENT
  // =================

  return (
    <div className="h-screen bg-slate-700 relative overflow-hidden">
      {/* 
        GAME CANVAS
        Main area where level editing happens
        Now uses Zustand store for grid configuration
      */}
      <GameCanvas showGrid={showGrid} gridSize={gridSize}>
        {/* TODO: Add level editing functionality here */}
        {/* TODO: Render placed track pieces */}
        {/* TODO: Add click handlers for piece placement */}
        {/* TODO: Implement drag and drop */}
        {/* TODO: Add selection indicators */}
        {/* <MouseTracker selectedTrack={selectedTool}/> */}
        <MouseTracker/>
      </GameCanvas>

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

      {/* 
        BOTTOM SELECTION PANEL
        Piece selection via Zustand store
      */}
      <BottomSelectionPanel />
    </div>
  );
}
