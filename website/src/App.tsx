import React from "react";
import {
  UndoRedoButtons,
  RightToolPanel,
  BottomSelectionPanel,
  GameCanvas,
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

        {/* Placeholder content - remove when implementing game logic */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 text-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              🚂 Railbound Level Editor
            </h2>
            <p className="mb-4">Now powered by dual Zustand stores!</p>

            {/* GUI Store State */}
            <div className="mb-4 p-3 bg-gray-800 rounded">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                GUI Store
              </h3>
              <p className="text-sm text-gray-300">
                Selected Tool:{" "}
                <span className="text-blue-400">{selectedTool}</span>
              </p>
              <p className="text-sm text-gray-300">
                Selected Piece:{" "}
                <span className="text-green-400">
                  {selectedPiece || "None"}
                </span>
              </p>
              <p className="text-xs text-gray-400">
                Grid: {showGrid ? "Visible" : "Hidden"} ({gridSize}px)
              </p>
            </div>

            {/* Level Store State */}
            <div className="p-3 bg-gray-800 rounded">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">
                Level Store
              </h3>
              <p className="text-sm text-gray-300">
                Level:{" "}
                <span className="text-yellow-400">
                  {levelData?.name || "No level loaded"}
                </span>
              </p>
              <p className="text-sm text-gray-300">
                Status:{" "}
                <span className={isDirty ? "text-red-400" : "text-green-400"}>
                  {isDirty ? "Unsaved changes" : "Saved"}
                </span>
              </p>
              <p className="text-xs text-gray-400">
                Undo: {undoStack.length} | Redo: {redoStack.length}
              </p>
              {!levelData && (
                <button
                  onClick={() => createNewLevel()}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                >
                  Create New Level
                </button>
              )}
            </div>
          </div>
        </div>
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
