import React, {useEffect} from "react";

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
  piece: GamePiece;
  onClick?: () => void;
  selected?: boolean;
  buttonClassName?: string;
  title?: string;
}> = ({ piece, onClick, selected = false, buttonClassName = "", title }) => {
  const baseButtonClass =
    buttonClassName ||
    `w-12 h-12 rounded border-2 transition-all flex items-center justify-center ${
      selected
        ? "bg-blue-600 border-blue-400 text-white"
        : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
    }`;
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === piece.hotkey) {
        onClick ? (onClick()) : (null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClick])

  return (
    <button
      type="button"
      className={baseButtonClass}
      onClick={onClick}
      title={title || piece.description || piece.name}
      tabIndex={0}
    >
      {piece.icon ? (
        typeof piece.icon === "string" ? (
          <img
            src={piece.icon}
            alt={piece.name}
            className="w-10 h-10 object-contain drop-shadow"
          />
        ) : (
          <span className="w-10 h-10 flex items-center justify-center">
            {piece.icon}
          </span>
        )
      ) : (
        <span className="w-10 h-10 bg-gray-500 rounded flex items-center justify-center text-xl font-bold text-white shadow-inner">
          ?
        </span>
      )}
    </button>
  );
};
