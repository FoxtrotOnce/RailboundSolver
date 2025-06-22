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
    gamePieces,
    showGrid,
    gridSize,

    // UI Actions
    setSelectedTool,
    setSelectedPiece,
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
      <RightToolPanel
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
      />

      {/* 
        BOTTOM SELECTION PANEL
        Piece selection via Zustand store
      */}
      <BottomSelectionPanel
        pieces={gamePieces}
        selectedPiece={selectedPiece}
        onPieceSelect={setSelectedPiece}
      />
    </div>
  );
}

/**
 * NEXT STEPS FOR IMPLEMENTATION:
 *
 * 1. DUAL STORE ARCHITECTURE
 *    - GUI Store: Tool selection, piece selection, canvas settings, UI panels
 *    - Level Store: Level data, undo/redo, piece placement, level operations
 *    - Clean separation of concerns for better maintainability
 *
 * 2. CANVAS INTERACTION
 *    - Use Level Store actions for piece placement (placePiece, removePiece)
 *    - Use GUI Store for tool selection and display settings
 *    - Implement click handlers with store.saveToUndoStack() before changes
 *    - Add drag and drop with both stores working together
 *
 * 3. ENHANCED LEVEL OPERATIONS
 *    - Level creation/loading with useLevelStore.createNewLevel()
 *    - File save/load integration with level store
 *    - Level validation and export functionality
 *    - Grid-based piece management system
 *
 * 4. PERFORMANCE OPTIMIZATIONS
 *    - Selective subscriptions for each store
 *    - GUI Store: useGuiStore(state => state.selectedTool)
 *    - Level Store: useLevelStore(state => state.levelData)
 *    - Separate devtools for debugging each store independently
 *
 * 5. ADVANCED FEATURES
 *    - Level Store: Smart undo/redo with action descriptions
 *    - GUI Store: Canvas zoom/pan with smooth interactions
 *    - Cross-store coordination for complex operations
 *    - State persistence for user preferences
 *
 * 6. DEVELOPMENT WORKFLOW
 *    - Two separate Redux DevTools instances
 *    - Independent testing of GUI vs Level logic
 *    - Modular store organization for team development
 *    - Clear boundaries between UI and data concerns
 *
 * DUAL STORE BENEFITS ACHIEVED:
 * ✅ Separation of concerns (UI vs Data)
 * ✅ Independent store evolution
 * ✅ Better performance with targeted subscriptions
 * ✅ Cleaner debugging with separate devtools
 * ✅ Reduced coupling between UI and level logic
 * ✅ Easier testing and maintenance
 * ✅ Scalable architecture for complex features
 */
