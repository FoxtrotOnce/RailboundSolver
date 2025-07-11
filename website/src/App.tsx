import {
  // BottomSelectionPanel,
  // GameCanvas,
  // RightPanel,
  // TopPanel,
  // ParamDisplay,
  LeftDisplay,
  // Sidebar,
  // SolveLevelDisplay,
  // ChangeModNum,
} from "./components";
import { useGuiStore, useLevelStore } from "./store";

import { useEffect, useState, useRef } from "react";

/**
 * RAILBOUND LEVEL EDITOR - MAIN APPLICATION
 *
 * This is the main application component that orchestrates the entire level editor interface.
 * Uses two separate Zustand stores for optimal separation of concerns and performance.
 *
 * COMPONENT STRUCTURE:
 * - TopPanel: Top control panel with grid settings, constraints, and undo/redo functionality
 * - GameCanvas: Main blue background editing area where level construction happens
 * - RightPanel: Right sidebar containing editing tools and controls help information
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
  const { colors, rotateCW, rotateCCW, showLeftDisplay, showPalette, togglePalette } =
    useGuiStore();
  const { clearLevel } = useLevelStore();
  const currMousePos = useRef({ x: 0, y: 0 });
  // lastMousePos is used to show the location of the palette
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current !== null) {
        const rect = canvasRef.current.getBoundingClientRect();
        currMousePos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        rotateCCW();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        rotateCW();
      } else if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        // Update the lastMousePos (where the palette should be) only if it's being shown,
        // so it doesn't teleport to the player's mouse when they try to close it.
        if (!showPalette) {
          setLastMousePos(currMousePos.current);
        }
        togglePalette();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        clearLevel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [rotateCW, rotateCCW, togglePalette, showPalette, clearLevel]);

  return (
    // <div className="flex h-screen bg-slate-800 relative overflow-hidden">
    //   <div
    //     className={`w-100 relative transition-all duration-300 ${
    //       showLeftDisplay ? "left-0" : "-left-100"
    //     }`}
    //   >
    //     <LeftDisplay />
    //   </div>
    //   <div
    //     className={`relative flex flex-1 flex-col transition-all duration-300 ${
    //       showLeftDisplay ? "ml-0" : "-ml-100"
    //     }`}
    //   >
    //     {/* TOP PANEL - Grid controls and undo/redo */}
    //     {/* <div className="re lative h-16">
    //       <TopPanel />
    //     </div> */}
    //     <div
    //       ref={canvasRef}
    //       className="relative flex items-center m-3 justify-center overflow-hidden flex-1 rounded-lg border-2 border-gray-600"
    //     >
    //       <div
    //         className={`absolute flex items-center justify-center z-80 transition-transform duration-300 ${
    //           showPalette ? "scale-100" : "scale-1"
    //         }`}
    //         style={{
    //           left: lastMousePos.x,
    //           top: lastMousePos.y,
    //         }}
    //       >
    //         <ChangeModNum />
    //       </div>
    //       <Sidebar />
    //       <BottomSelectionPanel />
    //       <RightPanel />
    //       <SolveLevelDisplay />
    //       <ParamDisplay />
    //       <GameCanvas />
    //       {/* TODO: Add selection indicators */}
    //     </div>
    //   </div>
    // </div>
    <div className={`relative flex flex-row w-screen h-screen ${colors.background} p-4 font-[Ubuntu] leading-[1.25rem]`}>
      <LeftDisplay />
    </div>
  );
}
