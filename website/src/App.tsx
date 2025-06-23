import React, { useEffect } from "react";
import { BottomSelectionPanel, GameCanvas, RightToolPanel } from "./components";
import { useGuiStore } from "./store";

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
const MouseTracker: React.FC = () => {
  const { mousePosition, setMousePosition } = useGuiStore();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [setMousePosition]);

  return (
    <div>
      {/* {selectedTrack.icon} */}
      <div className="fixed top-2 left-2 text-sm bg-white/80 p-1 rounded shadow">
        x: {mousePosition.x}, y: {mousePosition.y}
      </div>
    </div>
  );
};

export default function App() {
  // =================
  // RENDER COMPONENT
  // =================

  return (
    <div className="h-screen bg-slate-700 relative overflow-hidden">
      {/* 
        GAME CANVAS
        Main area where level editing happens
        Now fully integrated with Zustand stores for zoom, pan, and level data
        Includes integrated undo/redo buttons with MouseTracker-like styling
      */}
      <GameCanvas>
        {/* TODO: Add overlay UI elements here if needed */}
        <MouseTracker />
      </GameCanvas>

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
