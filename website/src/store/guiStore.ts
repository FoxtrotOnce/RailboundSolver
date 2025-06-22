import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ToolType, GamePiece } from "../components";

/**
 * GUI STATE STORE
 *
 * Manages all user interface state including selected tools, pieces,
 * canvas display settings, and panel visibility.
 *
 * RESPONSIBILITIES:
 * - Tool selection from right panel
 * - Piece selection from bottom panel
 * - Canvas display settings (zoom, pan, grid)
 * - UI panel visibility and modal state
 * - Available game pieces configuration
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
   */
  selectedTool: ToolType;

  /**
   * Currently selected piece from the bottom panel
   * Controls what gets placed when in placement mode
   */
  selectedPiece: string;

  /**
   * Available game pieces for the level editor
   * Loaded from configuration or API
   */
  gamePieces: GamePiece[];

  // =================
  // CANVAS DISPLAY STATE
  // =================

  /**
   * Canvas zoom level (1.0 = 100%)
   */
  zoomLevel: number;

  /**
   * Canvas pan offset {x, y}
   */
  panOffset: { x: number; y: number };

  /**
   * Whether grid is visible
   */
  showGrid: boolean;

  /**
   * Grid size in pixels
   */
  gridSize: number;

  // =================
  // UI PANEL STATE
  // =================

  /**
   * Whether the right tool panel is visible
   */
  showToolPanel: boolean;

  /**
   * Whether the bottom piece panel is visible
   */
  showPiecePanel: boolean;

  /**
   * Whether any modal is currently open
   */
  isModalOpen: boolean;

  // =================
  // ACTIONS
  // =================

  /**
   * Update the selected tool
   */
  setSelectedTool: (tool: ToolType) => void;

  /**
   * Update the selected piece
   */
  setSelectedPiece: (pieceId: string) => void;

  /**
   * Set the available game pieces
   */
  setGamePieces: (pieces: GamePiece[]) => void;

  /**
   * Update canvas zoom level
   */
  setZoomLevel: (zoom: number) => void;

  /**
   * Update canvas pan offset
   */
  setPanOffset: (offset: { x: number; y: number }) => void;

  /**
   * Toggle grid visibility
   */
  toggleGrid: () => void;

  /**
   * Set grid size
   */
  setGridSize: (size: number) => void;

  /**
   * Toggle tool panel visibility
   */
  toggleToolPanel: () => void;

  /**
   * Toggle piece panel visibility
   */
  togglePiecePanel: () => void;

  /**
   * Set modal state
   */
  setModalOpen: (open: boolean) => void;

  /**
   * Reset all GUI state to defaults
   */
  resetGui: () => void;
}

/**
 * Default game pieces configuration
 */
const defaultGamePieces: GamePiece[] = [
  // Basic Track Pieces
  {
    id: "empty",
    name: "Empty Tile",
    category: "tracks",
    description: "Empty space - no track",
  },
  {
    id: "horizontal",
    name: "Horizontal Track",
    category: "tracks",
    description: "Straight horizontal railway track",
  },
  {
    id: "vertical",
    name: "Vertical Track",
    category: "tracks",
    description: "Straight vertical railway track",
  },
  // Turn Pieces
  {
    id: "br-turn",
    name: "Bottom-Right Turn",
    category: "turns",
    description: "Curved track connecting bottom to right",
  },
  {
    id: "bl-turn",
    name: "Bottom-Left Turn",
    category: "turns",
    description: "Curved track connecting bottom to left",
  },
  {
    id: "tr-turn",
    name: "Top-Right Turn",
    category: "turns",
    description: "Curved track connecting top to right",
  },
  {
    id: "tl-turn",
    name: "Top-Left Turn",
    category: "turns",
    description: "Curved track connecting top to left",
  },
  // Special Game Elements
  {
    id: "car",
    name: "Train Car",
    category: "special",
    description: "Basic train car that follows tracks",
  },
  {
    id: "car1",
    name: "Special Car 1",
    category: "special",
    description: "Special train car with unique properties",
  },
  {
    id: "station",
    name: "Station",
    category: "special",
    description: "Train station - destination point",
  },
  {
    id: "switch",
    name: "Track Switch",
    category: "special",
    description: "Controllable track junction",
  },
  // Utility Tools
  {
    id: "percentage",
    name: "Percentage Tool",
    category: "tools",
    description: "Special utility tool",
  },
  {
    id: "wrench",
    name: "Wrench Tool",
    category: "tools",
    description: "Configuration and settings tool",
  },
];

/**
 * Create the GUI Zustand store with devtools support
 */
export const useGuiStore = create<GuiState>()(
  devtools(
    (set, get) => ({
      // =================
      // INITIAL STATE
      // =================

      selectedTool: "tool1",
      selectedPiece: "",
      gamePieces: defaultGamePieces,
      zoomLevel: 1.0,
      panOffset: { x: 0, y: 0 },
      showGrid: true,
      gridSize: 40,
      showToolPanel: true,
      showPiecePanel: true,
      isModalOpen: false,

      // =================
      // ACTIONS
      // =================

      setSelectedTool: (tool) => {
        set({ selectedTool: tool }, false, "setSelectedTool");
        console.log(`🔧 Tool selected: ${tool}`);
      },

      setSelectedPiece: (pieceId) => {
        set({ selectedPiece: pieceId }, false, "setSelectedPiece");
        console.log(`🎯 Piece selected: ${pieceId}`);

        // Auto-switch to first tool when piece is selected
        const { selectedTool } = get();
        if (selectedTool !== "tool1") {
          get().setSelectedTool("tool1");
        }
      },

      setGamePieces: (pieces) => {
        set({ gamePieces: pieces }, false, "setGamePieces");
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
            selectedTool: "tool1",
            selectedPiece: "",
            zoomLevel: 1.0,
            panOffset: { x: 0, y: 0 },
            showGrid: true,
            gridSize: 40,
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
 * USAGE EXAMPLES:
 *
 * // Basic usage in a component
 * const { selectedTool, setSelectedTool } = useGuiStore();
 *
 * // Selective subscription (only re-render when selectedTool changes)
 * const selectedTool = useGuiStore(state => state.selectedTool);
 *
 * // Canvas controls
 * const { zoomLevel, setZoomLevel, showGrid, toggleGrid } = useGuiStore();
 *
 * // Actions only (no re-render on state changes)
 * const actions = useGuiStore(state => ({
 *   setSelectedTool: state.setSelectedTool,
 *   setZoomLevel: state.setZoomLevel,
 *   toggleGrid: state.toggleGrid,
 * }));
 */
