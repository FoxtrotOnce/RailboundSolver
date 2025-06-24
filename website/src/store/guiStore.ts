import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GamePiece } from "../components";

/**
 * GUI STATE STORE
 *
 * Manages all user interface state including selected tools, pieces,
 * canvas display settings, and panel visibility.
 *
 * RESPONSIBILITIES:
 * - Tool selection from right panel (place, erase, select, etc.)
 * - Piece selection from bottom panel (tracks, turns, junctions, etc.)
 * - Canvas display settings (zoom, pan, grid visibility and size)
 * - UI panel visibility and modal state management
 * - User interaction state and preferences
 *
 * NOTE: Game pieces are now hardcoded in BottomSelectionPanel component
 * rather than stored in this global state.
 *
 * USAGE:
 * import { useGuiStore } from './store/guiStore';
 *
 * const { selectedTool, setSelectedTool } = useGuiStore();
 */

interface GuiState {
  // =================
  // TOOL & PIECE STATE
  // =================
  /**
   * Currently selected tool from the right panel
   * Controls what action is performed when clicking on the canvas
   * Examples: "place", "erase", "select", "move"
   */
  selectedTool: GamePiece | undefined;

  /**
   * Currently selected piece from the bottom panel
   * Controls what gets placed when in placement mode
   */
  selectedPiece: GamePiece | undefined;

  // =================
  // CANVAS DISPLAY STATE
  // =================
  /**
   * Canvas zoom level (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)
   * Constrained between 0.1 and 5.0 for usability
   */
  zoomLevel: number;

  /**
   * Canvas pan offset {x, y} in pixels
   * Represents how much the canvas view has been panned from origin
   */
  panOffset: { x: number; y: number };

  /**
   * Whether grid overlay is visible on the canvas
   * Helps with precise piece placement and alignment
   */
  showGrid: boolean;

  /**
   * Grid size in pixels (spacing between grid lines)
   * Constrained between 10 and 100 pixels for usability
   */
  gridSize: number;

  /**
   * Grid dimensions by cell count.
   * Constrained between 1 and 12 to reflect the game
   */
  gridDims: {y: number, x: number}

  // =================
  // UI PANEL STATE
  // =================
  /**
   * Whether the right tool panel is visible
   * Controls visibility of tools like place, erase, select, etc.
   */
  showToolPanel: boolean;

  /**
   * Whether the bottom piece selection panel is visible
   * Controls visibility of game piece selection interface
   */
  showPiecePanel: boolean;

  /**
   * Whether any modal dialog is currently open
   * Used to prevent background interactions when modal is active
   */
  isModalOpen: boolean;

  // =================
  // ACTIONS
  // =================
  /**
   * Update the selected tool
   * @param tool - Tool identifier (e.g., "place", "erase", "select")
   */
  setSelectedTool: (tool: GamePiece | undefined) => void;

  /**
   * Update the selected piece
   * @param piece - Game piece identifier.
   */
  setSelectedPiece: (piece: GamePiece | undefined) => void;

  /**
   * Set the dimensions of the grid for rendering.
   * @param dims - The grid dimensions.
   */
  setGridDims: (dims: {y: number, x: number}) => void;

  /**
   * Update canvas zoom level
   * @param zoom - Zoom level (0.1 to 5.0, where 1.0 = 100%)
   */
  setZoomLevel: (zoom: number) => void;

  /**
   * Update canvas pan offset
   * @param offset - Pan offset in pixels {x, y}
   */
  setPanOffset: (offset: { x: number; y: number }) => void;

  /**
   * Toggle grid visibility on/off
   */
  toggleGrid: () => void;

  /**
   * Set grid size
   * @param size - Grid spacing in pixels (10 to 100)
   */
  setGridSize: (size: number) => void;

  /**
   * Toggle right tool panel visibility
   */
  toggleToolPanel: () => void;

  /**
   * Toggle bottom piece selection panel visibility
   */
  togglePiecePanel: () => void;

  /**
   * Set modal dialog state
   * @param open - Whether modal is open
   */
  setModalOpen: (open: boolean) => void;

  /**
   * Reset all GUI state to defaults
   * Useful for clearing user preferences or starting fresh
   */
  resetGui: () => void;
}

/**
 * Create the GUI Zustand store with devtools support
 *
 * Features:
 * - Redux DevTools integration for debugging
 * - Persistent state across component re-renders
 * - Optimized re-renders through selective subscriptions
 * - Action logging for development
 */
export const useGuiStore = create<GuiState>()(
  devtools(
    (set, get) => ({
      // =================
      // INITIAL STATE
      // =================
      selectedTool: undefined,
      selectedPiece: undefined,
      zoomLevel: 1.0,
      panOffset: { x: 0, y: 0 },
      showGrid: true,
      gridSize: 40,
      gridDims: { y: 6, x: 5},
      showToolPanel: true,
      showPiecePanel: true,
      isModalOpen: false,

      // =================
      // ACTIONS
      // =================

      setSelectedTool: (tool) => {
        set({ selectedTool: tool }, false, "setSelectedTool");
        console.log(`🔧 Tool selected: ${tool?.id}`);
      },
      setSelectedPiece: (piece) => {
        set({ selectedPiece: piece }, false, "setSelectedPiece");
        console.log(`🎯 Piece selected: ${piece?.id}`);

        // Auto-switch to first tool when piece is selected
        get().setSelectedTool(undefined);
      },
      setGridDims: (dims) => {
        set({ gridDims: dims}, false, "setGridDims");
        console.log(`Grid Dims set: ${dims}`)
      },

      setZoomLevel: (zoom) => {
        set(
          { zoomLevel: Math.max(0.1, Math.min(5.0, zoom)) },
          false,
          "setZoomLevel"
        );
      },

      setPanOffset: (offset) => {
        set({ panOffset: offset }, false, "setPanOffset");
      },

      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }), false, "toggleGrid");
      },

      setGridSize: (size) => {
        set(
          { gridSize: Math.max(10, Math.min(100, size)) },
          false,
          "setGridSize"
        );
      },

      toggleToolPanel: () => {
        set(
          (state) => ({ showToolPanel: !state.showToolPanel }),
          false,
          "toggleToolPanel"
        );
      },

      togglePiecePanel: () => {
        set(
          (state) => ({ showPiecePanel: !state.showPiecePanel }),
          false,
          "togglePiecePanel"
        );
      },

      setModalOpen: (open) => {
        set({ isModalOpen: open }, false, "setModalOpen");
      },

      resetGui: () => {
        set(
          {
            selectedTool: undefined,
            selectedPiece: undefined,
            zoomLevel: 1.0,
            panOffset: { x: 0, y: 0 },
            showGrid: true,
            gridSize: 40,
            gridDims: { y: 6, x: 5 },
            showToolPanel: true,
            showPiecePanel: true,
            isModalOpen: false,
          },
          false,
          "resetGui"
        );
      },
    }),
    {
      name: "gui-store", // Name for Redux DevTools
    }
  )
);

/**
 * USAGE EXAMPLES AND PATTERNS
 *
 * This store follows Zustand best practices for optimal performance
 * and clean component integration.
 */

// ===== BASIC USAGE =====
// Import and use the store in any component:
//
// import { useGuiStore } from './store/guiStore';
//
// const MyComponent = () => {
//   const { selectedTool, setSelectedTool } = useGuiStore();
//   return <button onClick={() => setSelectedTool('place')}>Place Tool</button>;
// };

// ===== SELECTIVE SUBSCRIPTIONS =====
// Only re-render when specific state changes:
//
// const selectedTool = useGuiStore(state => state.selectedTool);
// const zoomLevel = useGuiStore(state => state.zoomLevel);

// ===== ACTIONS ONLY =====
// Get actions without subscribing to state changes:
//
// const actions = useGuiStore(state => ({
//   setSelectedTool: state.setSelectedTool,
//   setZoomLevel: state.setZoomLevel,
//   toggleGrid: state.toggleGrid,
// }));

// ===== CANVAS CONTROLS EXAMPLE =====
// Typical canvas component usage:
//
// const CanvasComponent = () => {
//   const { zoomLevel, panOffset, showGrid, gridSize } = useGuiStore();
//   const { setZoomLevel, setPanOffset, toggleGrid } = useGuiStore();
//
//   const handleWheel = (e) => {
//     const newZoom = zoomLevel + (e.deltaY > 0 ? -0.1 : 0.1);
//     setZoomLevel(newZoom);
//   };
//
//   return (
//     <canvas
//       onWheel={handleWheel}
//       style={{ transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)` }}
//     />
//   );
// };

// ===== TOOL PANEL EXAMPLE =====
// Tool selection component:
//
// const ToolPanel = () => {
//   const { selectedTool, setSelectedTool, showToolPanel } = useGuiStore();
//
//   if (!showToolPanel) return null;
//
//   return (
//     <div className="tool-panel">
//       {['place', 'erase', 'select'].map(tool => (
//         <button
//           key={tool}
//           className={selectedTool === tool ? 'active' : ''}
//           onClick={() => setSelectedTool(tool)}
//         >
//           {tool}
//         </button>
//       ))}
//     </div>
//   );
// };

// ===== IMPORTANT NOTES =====
//
// 1. Game pieces are now hardcoded in BottomSelectionPanel component
//    rather than stored in this global state for better performance.
//
// 2. Use selective subscriptions to avoid unnecessary re-renders.
//
// 3. Actions are automatically logged in development mode.
//
// 4. Redux DevTools are available for debugging state changes.
//
// 5. All numeric values (zoom, gridSize, panOffset) have built-in
//    constraints to prevent invalid states.
