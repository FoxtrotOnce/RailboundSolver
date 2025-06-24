import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GamePiece } from "../components";

// NOTE: THE ROTATE NUMBER SEEM WRONG, it better if it 0:left, 1:up, 2:right, 3:down

interface GuiState {
  // Tool & piece selection
  selectedTool: GamePiece | undefined;
  selectedPiece: GamePiece | undefined;

  // Rotation (0: left, 1: right, 2: down, 3: up))
  rotation: number;
  setRotation: (rotation: number) => void;
  rotateCW: () => void;
  rotateCCW: () => void;

  // Canvas display
  showGrid: boolean;
  gridSize: number;

  // UI panels & modal
  showToolPanel: boolean;
  showPiecePanel: boolean;

  // Actions
  setSelectedTool: (tool: GamePiece | undefined) => void;
  setSelectedPiece: (piece: GamePiece | undefined) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleToolPanel: () => void;
  togglePiecePanel: () => void;
  resetGui: () => void;
}

export const useGuiStore = create<GuiState>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedTool: undefined,
      selectedPiece: undefined,
      rotation: 0,
      showGrid: true,
      gridSize: 40,
      showToolPanel: true,
      showPiecePanel: true,

      // Actions
      setSelectedTool: (tool) => {
        set({ selectedTool: tool }, false, "setSelectedTool");
        console.log(`🔧 Tool selected: ${tool?.id}`);
      },
      setSelectedPiece: (piece) => {
        set({ selectedPiece: piece }, false, "setSelectedPiece");
        console.log(`🎯 Piece selected: ${piece?.id}`);
        get().setSelectedTool(undefined);
        // Optionally reset rotation when selecting a new piece
        // set({ rotation: 0 }, false, "resetRotationOnPieceSelect");
      },
      setRotation: (rotation) => {
        // Ensure rotation is always 0,1,2,3
        set({ rotation: ((rotation % 4) + 4) % 4 }, false, "setRotation");
      },
      rotateCW: () => {
        set(
          (state) => {
            switch (state.rotation) {
              case 0:
                return { rotation: 3 }; // left -> up
              case 1:
                return { rotation: 0 }; // right -> left
              case 2:
                return { rotation: 1 }; // down -> right
              case 3:
                return { rotation: 2 }; // up -> down
              default:
                return { rotation: 0 };
            }
          },
          false,
          "rotateCW"
        );
      },
      rotateCCW: () => {
        set(
          (state) => {
            switch (state.rotation) {
              case 0:
                return { rotation: 1 }; // left -> right
              case 1:
                return { rotation: 2 }; // right -> down
              case 2:
                return { rotation: 3 }; // down -> up
              case 3:
                return { rotation: 0 }; // up -> left
              default:
                return { rotation: 0 };
            }
          },
          false,
          "rotateCCW"
        );
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

      resetGui: () => {
        set(
          {
            selectedTool: undefined,
            selectedPiece: undefined,
            rotation: 0,
            showGrid: true,
            gridSize: 40,
            showToolPanel: true,
            showPiecePanel: true,
          },
          false,
          "resetGui"
        );
      },
    }),
    {
      name: "gui-store",
    }
  )
);
