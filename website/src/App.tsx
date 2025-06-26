import {
  BottomSelectionPanel,
  GameCanvas,
  RightControlDisplay,
  RightToolPanel,
  TopPanel,
  LeftDisplay,
  Sidebar,
} from "./components";
import { useGuiStore } from "./store";

import { useEffect } from "react";

/**
 * RAILBOUND LEVEL EDITOR - MAIN APPLICATION
 *
 * This is the main application component that orchestrates the entire level editor interface.
 * Uses two separate Zustand stores for optimal separation of concerns and performance.
 *
 * COMPONENT STRUCTURE:
 * - TopPanel: Top control panel with grid settings, constraints, and undo/redo functionality
 * - GameCanvas: Main blue background editing area where level construction happens
 * - RightToolPanel: Right sidebar containing editing tools and utilities
 * - BottomSelectionPanel: Bottom panel with track pieces, special items, and tool selection
 * - InputHandler: Handles mouse tracking and keyboard input for piece rotation (Q/E keys)
 *
 * STATE MANAGEMENT:
 * - useGuiStore: Manages UI state (selected tools, pieces, canvas interactions, panel states)
 * - useLevelStore: Manages level data, grid state, and undo/redo functionality (used in TopPanel)
 * - Separated concerns enable better maintainability, performance optimization, and debugging
 *
 * INPUT HANDLING:
 * - Mouse tracking for piece preview positioning
 * - Keyboard rotation controls (Q: rotate left, E: rotate right)
 * - Visual feedback through cursor-following piece preview
 *
 * LAYOUT:
 * - Flexbox-based responsive layout with fixed panels
 * - Overflow handling for canvas area
 * - Rounded corners and consistent spacing using Tailwind CSS
 *
 * HOW TO EXTEND:
 * 1. Add new GUI actions and state to guiStore.ts
 * 2. Add new level data operations to levelStore.ts
 * 3. Extend InputHandler for additional keyboard shortcuts
 * 4. Use selective Zustand subscriptions for optimal performance
 * 5. Leverage separate devtools for debugging each store independently
 */

export default function App() {
  const { rotateCW, rotateCCW, showLeftDisplay } = useGuiStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "q" || e.key === "Q") {
        rotateCCW();
      } else if (e.key === "e" || e.key === "E") {
        rotateCW();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rotateCW, rotateCCW]);

  return (
    <div className="flex h-screen bg-slate-800 relative overflow-hidden">
      <div className={`w-100 relative ${
        showLeftDisplay ? "left-0" : "-left-100"
      }`}>
        <LeftDisplay />
      </div>
      <div className={`relative flex flex-1 flex-col ${
        showLeftDisplay ? "ml-0" : "-ml-100"
      }`}>
        {/* TOP PANEL - Grid controls and undo/redo */}
        <div className="relative h-16">
          <TopPanel />
        </div>
        <div className="relative ml-3 mr-3 overflow-hidden flex-1 rounded-lg border-2 border-gray-600">
          <Sidebar />
          <RightToolPanel />
          <RightControlDisplay />
          <GameCanvas />
            {/* TODO: Add selection indicators */}
        </div>
        <div className="relative h-25 ml-3 mr-3 mt-3 -mb-1">
          <BottomSelectionPanel />
        </div>
      </div>
    </div>
  );
}
