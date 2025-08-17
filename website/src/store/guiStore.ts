import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  Normal_Ending,
  Numeral_Ending,
  Car_1,
  Car_I,
  Station_1,
  Station_2,
  Station_3,
  Station_4,
  Post_Office_1,
  Post_Office_2,
  Post_Office_3,
  Post_Office_4,
} from "../assets/svgs"

// NOTE: THE ROTATE NUMBER SEEM WRONG, it better if it 0:left, 1:up, 2:right, 3:down

// Generation parameters
// visualize_rate is how many milliseconds before the next visualization callback.
export interface Hyperparameters {
  heatmap_limit_limit: number;
  decoy_heatmap_limit: number;
  gen_type: "DFS" | "BFS";
  visualize_rate: number;
}
// Website palette. Colors are provided as properties, and are obtained via Styles.[property].as_[bg/text/border]().
class Styles {
  static readonly background = new Styles("bg-gray-900", "text-gray-900", "border-gray-900")
  static readonly base = new Styles("bg-gray-800", "text-gray-800", "border-gray-800")
  static readonly highlight = new Styles("bg-gray-600", "text-gray-600", "border-gray-600")
  static readonly border = new Styles("bg-gray-500", "text-gray-500", "border-gray-500")
  static readonly text = new Styles("bg-white", "text-white", "border-white")
  static readonly text_hover = new Styles("bg-neutral-300", "text-neutral-300", "border-neutral-300")
  static readonly text_active = new Styles("bg-neutral-400", "text-neutral-400", "border-neutral-400")
  static readonly caution = new Styles("bg-yellow-400", "text-yellow-400", "border-yellow-400")
  static readonly warning = new Styles("bg-red-500", "text-red-400", "border-red-500")
  static readonly link = new Styles("", "cursor-pointer text-blue-400 hover:underline", "")
  static readonly mods = [
    new Styles("bg-red-500", "text-red-500", "border-red-500"),
    new Styles("bg-yellow-400", "text-yellow-400", "border-yellow-400"),
    new Styles("bg-green-500", "text-green-500", "border-green-500"),
    new Styles("bg-blue-500", "text-blue-500", "border-blue-500"),
    new Styles("bg-violet-500", "text-violet-500", "border-violet-500"),
    new Styles("bg-pink-400", "text-pink-400", "border-pink-400"),
    new Styles("bg-gray-200", "text-gray-200", "border-gray-200"),
    new Styles("bg-slate-500", "text-slate-500", "border-slate-500"),
  ]

  private constructor(public bg: string, public text: string, public border: string) {}
}

interface GuiState {
  // Color Design
  styles: typeof Styles;

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
  showLevelSettings: boolean;
  carRelatedModIcons: Map<string, React.ReactNode[]>

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
  displayLevelSettings: (displaySettings: boolean) => void;
  resetGui: () => void;
}

const createHyperparams = (): Hyperparameters => ({
  heatmap_limit_limit: 9,
  decoy_heatmap_limit: 15,
  gen_type: "DFS",
  visualize_rate: 100,
});

export const useGuiStore = create<GuiState>()(
  devtools(
    (set, get) => ({
      // Initial state
      styles: Styles,
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
      carRelatedModIcons: new Map<string, React.ReactNode[]>([
          ["END_TRACK", [Normal_Ending, Normal_Ending, Normal_Ending, Normal_Ending, Numeral_Ending, Numeral_Ending, Numeral_Ending, Numeral_Ending]],
          ["NORMAL", [Car_1, Car_1, Car_1, Car_1, Car_I, Car_I, Car_I, Car_I]],  // Cars are placed via registry, not by piece, so displaying each car num is misleading.
          ["STATION", [Station_1, Station_2, Station_3, Station_4, Post_Office_1, Post_Office_2, Post_Office_3, Post_Office_4]]
      ]),

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
      displayLevelSettings: (shouldDisplay) =>  {
        set(
          (state) => ({ showLevelSettings: shouldDisplay }),
          false,
          "displayLevelSettings"
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
