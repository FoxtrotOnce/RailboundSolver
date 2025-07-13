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
    const keydown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT") return;

      if (e.key === piece.hotkey) {
        onClick();
      }
    };

    window.addEventListener("keydown", keydown)
    return () => {
      window.removeEventListener("keydown", keydown)
    }
  }, [onClick]);

  return (
    <div className={`transition-all relative flex items-center justify-center p-1 rounded-[0.25rem] ${
      selected && styles.highlight.bg
    }`}>
      {piece.hotkey && (
        <div className={`absolute flex items-center justify-center w-3.5 h-3.5 -bottom-0.75 -right-0.75 rounded-[0.125rem] ${styles.highlight.bg} font-bold ${styles.text.text} text-[0.6875rem]`}>
          {piece.hotkey}
        </div>
      )}
      <button
        className={`w-10 h-10 cursor-pointer ${
          styles.mods[selectedModNum].text
        }`}
        onClick={onClick}
        title={piece.description}
      >
        {piece.icon}
      </button>
    </div>
  );
};
