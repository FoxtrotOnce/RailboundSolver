import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { select } from "framer-motion/client";

// NOTE: THE ROTATE NUMBER SEEM WRONG, it better if it 0:left, 1:up, 2:right, 3:down

// Generation parameters
interface Hyperparameters {
  heatmap_limit_limit: number;
  decoy_heatmap_limit: number;
  gen_type: "DFS" | "BFS";
  visualize_rate: number;
}

interface GuiState {
  // Tool & piece selection
  selectedTool: string | undefined;
  selectedPiece: string | undefined;

  // Rotation (0: left, 1: right, 2: down, 3: up))
  rotation: number;
  setRotation: (rotation: number) => void;
  rotateCW: () => void;
  rotateCCW: () => void;

  hyperparameters: Hyperparameters;

  // Canvas display
  showGrid: boolean;
  gridSize: number;

  // UI panels & modal
  showToolPanel: boolean;
  showPiecePanel: boolean;
  showLeftDisplay: boolean;

  // Actions
  setSelectedTool: (tool: string | undefined) => void;
  setSelectedPiece: (piece: string | undefined) => void;
  setHyperparams: (heatmap_limit_limit?: number, decoy_heatmap_limit?: number, gen_type?: "DFS" | "BFS", visualize_rate?: number) => void;
  defaultHyperparams: () => Hyperparameters;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleToolPanel: () => void;
  togglePiecePanel: () => void;
  toggleLeftDisplay: () => void;
  resetGui: () => void;
}

const createHyperparams = (): Hyperparameters => ({
  heatmap_limit_limit: 9,
  decoy_heatmap_limit: 15,
  gen_type: "DFS",
  visualize_rate: 10000
})

export const useGuiStore = create<GuiState>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedTool: undefined,
      selectedPiece: undefined,
      hyperparameters: createHyperparams(),
      rotation: 0,
      showGrid: true,
      gridSize: 40,
      showToolPanel: true,
      showPiecePanel: true,
      showLeftDisplay: true,
      
      // Actions
      setSelectedTool: (tool) => {
        const piece = get().selectedPiece
        if (
          piece === "STATION" || piece === "ROADBLOCK"
        ) {
          set({ selectedTool: undefined }, false, "setSelectedTool");
        } else if (
          piece === "SWITCH_FORK_TRACK" &&
          tool !== "FORK" && tool !== "FORK_2"
        ) {
          set({ selectedTool: "FORK" }, false, "setSelectedTool");
        } else if ((piece === "TUNNEL" && tool !== "STRAIGHT") || piece === "END_TRACK") {
          set({ selectedTool: "STRAIGHT" }, false, "setSelectedTool");
        } else if (piece === "SWITCH_RAIL" &&
          tool !== "FORK" && tool !== "FORK_2"
        ) {
          set({ selectedTool: "FORK" }, false, "setSelectedTool");
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
      setHyperparams: (heatmap_limit_limit, decoy_heatmap_limit, gen_type, visualize_rate) => {
        const { hyperparameters } = get()
        if (heatmap_limit_limit !== undefined) {
          hyperparameters.heatmap_limit_limit = heatmap_limit_limit
        }
        if (decoy_heatmap_limit !== undefined) {
          hyperparameters.decoy_heatmap_limit = decoy_heatmap_limit
        }
        if (gen_type !== undefined) {
          hyperparameters.gen_type = gen_type
        }
        if (visualize_rate !== undefined) {
          hyperparameters.visualize_rate = visualize_rate
        }
        set({ hyperparameters: hyperparameters}, false, "setHyperparams");
      },
      defaultHyperparams: () => {
        return createHyperparams()
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
      toggleLeftDisplay: () => {
        set((state) => ({ showLeftDisplay: !state.showLeftDisplay }),
        false,
        "toggleLeftDisplay")
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
