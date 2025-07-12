import React, { useEffect } from "react";
import { useGuiStore } from "../store";

/**
 * GamePiece Interface
 *
 * Represents a game piece or tool for the UI selection panels.
 *
 * Properties:
 * - id: Unique identifier for the piece
 * - name: Display name of the piece
 * - icon: Optional icon, can be a string (image path) or a React node (SVG/component)
 * - description: Optional tooltip or description for accessibility or tooltips
 */
export interface GamePiece {
  id: string;
  name: string;
  icon?: string | React.ReactNode;
  description?: string;
  hotkey?: string;
}

/**
 * GamePieceIcon Component
 *
 * Renders a visual representation of a game piece based on its icon property.
 *
 * Rendering logic:
 * - If `icon` is a string, renders an <img> with the given path (for image assets).
 * - If `icon` is a React node, renders it directly (for SVGs or custom components).
 * - If no icon is provided, renders a fallback placeholder with a question mark.
 *
 * Props:
 * - piece: GamePiece object to render.
 * - onClick: Optional click handler for the button.
 * - selected: Optional boolean to indicate if the piece is selected (affects styling).
 * - buttonClassName: Optional additional class names for the button container.
 * - title: Optional tooltip text (defaults to piece.description or piece.name).
 *
 * Used in both BottomSelectionPanel and RightToolPanel for consistent icon rendering.
 */
export const GamePieceIcon: React.FC<{
  piece: GamePiece
  onClick: () => void
}> = ({piece, onClick}) => {
  const { styles, selectedModNum, selectedPiece, selectedTool } = useGuiStore()
  const selected = selectedPiece === piece.id || selectedTool === piece.id

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === piece.hotkey) {
        onClick();
      }
    };

    window.addEventListener("keydown", keydown)
    return () => {
      window.removeEventListener("keydown", keydown)
    }
  });

  return (
    <div className={`transition-all flex items-center justify-center p-1 rounded-[0.25rem] ${
      selected && styles.highlight.as_bg()
    }`}>
      <button
        className={`w-10 h-10 cursor-pointer ${
          styles.mods[selectedModNum].as_text()
        }`}
        onClick={onClick}
      >
        {piece.icon}
      </button>
    </div>
    // <div className="relative">
    //   {/* Hotkey icon in corner */}
    //   {piece.hotkey && (
    //     <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded border-2 border-gray-500 bg-gray-600 flex items-center justify-center  text-xs text-white font-bold select-none">
    //       {piece.hotkey}
    //     </div>
    //   )}
    //   <button
    //     type="button"
    //     className={baseButtonClass}
    //     onClick={onClick}
    //     title={title || piece.description || piece.name}
    //     tabIndex={0}
    //   >
    //     <span className="w-10 h-10 flex items-center justify-center">
    //       {icon}
    //     </span>
    //   </button>
    // </div>
  );
};
