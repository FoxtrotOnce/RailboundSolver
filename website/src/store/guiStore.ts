import { create } from "zustand";
import { devtools } from "zustand/middleware";

// NOTE: THE ROTATE NUMBER SEEM WRONG, it better if it 0:left, 1:up, 2:right, 3:down

// Generation parameters
export interface Hyperparameters {
  heatmap_limit_limit: number;
  decoy_heatmap_limit: number;
  gen_type: "DFS" | "BFS";
  visualize_rate: number;
}
// Website palette
interface Colors {
  background: string;
  base: string;
  highlight: string;
  border: string;
  border_fill: string;
  button_highlight_text: string;
  text: string;
  warning: string;
  link: string;
  mods: { currentColor: string, style: string }[]
}

interface GuiState {
  // Color Design
  colors: Colors;

  // Tool & piece selection
  selectedTool: string | undefined;
  selectedPiece: string | undefined;
  selectedModNum: number;

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
  showPalette: boolean;

  // Actions
  setSelectedTool: (tool: string | undefined) => void;
  setSelectedPiece: (piece: string | undefined) => void;
  setSelectedModNum: (mod_num: number) => void;
  setHyperparams: (
    heatmap_limit_limit?: number,
    decoy_heatmap_limit?: number,
    gen_type?: "DFS" | "BFS",
    visualize_rate?: number
  ) => void;
  getDefaultHyperparams: () => Hyperparameters;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleToolPanel: () => void;
  togglePiecePanel: () => void;
  toggleLeftDisplay: () => void;
  togglePalette: () => void;
  resetGui: () => void;
}

const createHyperparams = (): Hyperparameters => ({
  heatmap_limit_limit: 9,
  decoy_heatmap_limit: 15,
  gen_type: "DFS",
  visualize_rate: 10000,
});

export const useGuiStore = create<GuiState>()(
  devtools(
    (set, get) => ({
      // Initial state
      colors: {
        background: "bg-gray-900",
        base: "bg-gray-800",
        highlight: "bg-gray-600",
        border: "border-gray-500",
        border_fill: "bg-gray-500",
        button_highlight_text: "text-gray-800",
        text: "text-white",
        warning: "text-red-400",
        link: "cursor-pointer text-blue-400 hover:underline",
        mods: [
          { currentColor: "text-red-500", style: "bg-red-500" },
          { currentColor: "text-yellow-400", style: "bg-yellow-400" },
          { currentColor: "text-green-500", style: "bg-green-500" },
          { currentColor: "text-blue-500", style: "bg-blue-500" },
          { currentColor: "text-violet-500", style: "bg-violet-500" },
          { currentColor: "text-pink-400", style: "bg-pink-400" },
          { currentColor: "text-gray-200", style: "bg-gray-200" },
          { currentColor: "text-slate-500", style: "bg-slate-500" },
        ]
      },
      selectedTool: undefined,
      selectedPiece: undefined,
      selectedModNum: 0,
      hyperparameters: createHyperparams(),
      rotation: 0,
      showGrid: true,
      gridSize: 40,
      showToolPanel: true,
      showPiecePanel: true,
      showLeftDisplay: true,
      showPalette: false,

      // Actions
      setSelectedTool: (tool) => {
        const piece = get().selectedPiece;
        if (piece === "ROADBLOCK") {
          set({ selectedTool: undefined }, false, "setSelectedTool");
        } else if (
          piece === "SWITCH_FORK_TRACK" &&
          tool !== "FORK" &&
          tool !== "FORK_2"
        ) {
          set({ selectedTool: "FORK" }, false, "setSelectedTool");
        } else if (
          (piece === "TUNNEL" && tool !== "STRAIGHT") ||
          piece === "END_TRACK"
        ) {
          set({ selectedTool: "STRAIGHT" }, false, "setSelectedTool");
        } else if (
          piece === "SWITCH_RAIL" &&
          tool !== "FORK" &&
          tool !== "FORK_2"
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
      setSelectedModNum: (mod_num) => {
        set({ selectedModNum: mod_num }, false, "setSelectedModNum")
      },
      setHyperparams: (
        heatmap_limit_limit,
        decoy_heatmap_limit,
        gen_type,
        visualize_rate
      ) => {
        const { hyperparameters } = get();
        if (heatmap_limit_limit !== undefined) {
          hyperparameters.heatmap_limit_limit = heatmap_limit_limit;
        }
        if (decoy_heatmap_limit !== undefined) {
          hyperparameters.decoy_heatmap_limit = decoy_heatmap_limit;
        }
        if (gen_type !== undefined) {
          hyperparameters.gen_type = gen_type;
        }
        if (visualize_rate !== undefined) {
          hyperparameters.visualize_rate = visualize_rate;
        }
        set({ hyperparameters: hyperparameters }, false, "setHyperparams");
      },
      getDefaultHyperparams: () => {
        return createHyperparams();
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
        set(
          (state) => ({ showLeftDisplay: !state.showLeftDisplay }),
          false,
          "toggleLeftDisplay"
        );
      },
      togglePalette: () => {
        set(
          (state) => ({ showPalette: !state.showPalette }),
          false,
          "togglePalette"
        )
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
