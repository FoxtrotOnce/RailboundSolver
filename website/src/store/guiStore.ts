import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { select } from "framer-motion/client";
import { useLevelStore } from "./levelStore";
import { CarType } from "../../../algo/classes";

// NOTE: THE ROTATE NUMBER SEEM WRONG, it better if it 0:left, 1:up, 2:right, 3:down

interface GuiState {
  // Tool & piece selection
  selectedTool: string | undefined;
  selectedPiece: string | undefined;

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
  setSelectedTool: (tool: string | undefined) => void;
  setSelectedPiece: (piece: string | undefined) => void;
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
        const registryFilled = useLevelStore.getState().registryFilled;

        const piece = get().selectedPiece
        if (
          piece === "STATION" || piece === "ROADBLOCK" ||
          (piece === "NORMAL" || piece === "DECOY") && registryFilled(CarType.get(piece))
        ) {
          set({ selectedTool: undefined }, false, "setSelectedTool");
        } else if (
          piece === "SWITCH_FORK_TRACK" &&
          tool !== "FORK" && tool !== "FORK_2"
        ) {
          get().setSelectedTool("FORK")
        } else if (piece === "TUNNEL" && tool !== "STRAIGHT") {
          get().setSelectedTool("STRAIGHT")
        } else if (piece === "SWITCH_RAIL" &&
          tool !== "FORK" && tool !== "FORK_2"
        ) {
          get().setSelectedTool("FORK")
        } else {
          set({ selectedTool: tool }, false, "setSelectedTool");
        }

        console.log(`🔧 Tool selected: ${get().selectedTool}`);
      },
      setSelectedPiece: (piece) => {
        set({ selectedPiece: piece }, false, "setSelectedPiece");
        console.log(`🎯 Piece selected: ${piece}`);
        
        // Run the check in setSelectedTool to change tool if the piece is incompatible
        get().setSelectedTool(get().selectedTool);
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
