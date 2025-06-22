import React from "react";

export type PieceCategory = "tracks" | "turns" | "special" | "tools";
export type PieceType = string; // Can be extended with specific piece types

export interface GamePiece {
  id: string;
  name: string;
  category: PieceCategory;
  icon?: string;
  description?: string;
}

interface BottomSelectionPanelProps {
  pieces: GamePiece[];
  selectedPiece: string;
  onPieceSelect: (pieceId: string) => void;
}

/**
 * BottomSelectionPanel Component
 *
 * Displays the bottom panel with categorized game pieces for selection.
 * Pieces are grouped by category: tracks, turns, special items, and tools.
 *
 * Props:
 * - pieces: Array of GamePiece objects to display
 * - selectedPiece: ID of currently selected piece
 * - onPieceSelect: Function called when a piece is selected
 *
 * GamePiece Interface:
 * - id: Unique identifier for the piece
 * - name: Display name of the piece
 * - category: Category group ('tracks', 'turns', 'special', 'tools')
 * - icon: Optional icon/image path
 * - description: Optional tooltip description
 *
 * Usage:
 * const pieces = [
 *   { id: 'horizontal', name: 'Horizontal Track', category: 'tracks' },
 *   { id: 'car', name: 'Train Car', category: 'special' }
 * ];
 *
 * <BottomSelectionPanel
 *   pieces={pieces}
 *   selectedPiece="horizontal"
 *   onPieceSelect={(id) => console.log('Selected:', id)}
 * />
 */
export const BottomSelectionPanel: React.FC<BottomSelectionPanelProps> = ({
  pieces,
  selectedPiece,
  onPieceSelect,
}) => {
  // Group pieces by category
  const groupedPieces = pieces.reduce((acc, piece) => {
    if (!acc[piece.category]) {
      acc[piece.category] = [];
    }
    acc[piece.category].push(piece);
    return acc;
  }, {} as Record<PieceCategory, GamePiece[]>);

  // Category display configuration
  const categoryConfig = {
    tracks: { label: "TRACKS", color: "bg-yellow-600" },
    turns: { label: "TURNS", color: "bg-yellow-600" },
    special: { label: "SPECIAL", color: "bg-red-600" },
    tools: { label: "TOOLS", color: "bg-blue-600" },
  };

  /**
   * Renders a visual representation of a piece based on its category
   */
  const renderPieceIcon = (piece: GamePiece) => {
    const config = categoryConfig[piece.category];

    switch (piece.category) {
      case "tracks":
        return (
          <div
            className={`w-8 h-8 ${config.color} rounded flex items-center justify-center`}
          >
            <div className="w-6 h-1 bg-gray-800 rounded"></div>
          </div>
        );
      case "turns":
        return (
          <div
            className={`w-8 h-8 ${config.color} rounded flex items-center justify-center`}
          >
            <div className="w-4 h-4 border-2 border-gray-800 border-r-0 border-t-0 rounded-bl"></div>
          </div>
        );
      case "special":
        if (piece.id.includes("car")) {
          return (
            <div
              className={`w-8 h-8 ${config.color} rounded flex items-center justify-center`}
            >
              <div className="w-6 h-3 bg-yellow-400 rounded-sm"></div>
            </div>
          );
        } else if (piece.id === "station") {
          return (
            <div
              className={`w-8 h-8 ${config.color} rounded flex items-center justify-center`}
            >
              <div className="w-6 h-4 bg-gray-800 rounded-sm"></div>
            </div>
          );
        }
        return (
          <div
            className={`w-8 h-8 ${config.color} rounded flex items-center justify-center`}
          >
            <div className="w-4 h-4 bg-gray-800 rounded"></div>
          </div>
        );
      case "tools":
        return (
          <div
            className={`w-8 h-8 ${config.color} rounded flex items-center justify-center text-white font-bold`}
          >
            {piece.id === "percentage" ? "%" : "🔧"}
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center">
            ?
          </div>
        );
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40">
      <div className="bg-gray-800 border-t-2 border-gray-600 p-4">
        <div className="flex justify-center">
          <div className="flex gap-4">
            {/* Render each category section */}
            {Object.entries(groupedPieces).map(([category, categoryPieces]) => {
              const config = categoryConfig[category as PieceCategory];

              return (
                <div
                  key={category}
                  className="flex items-center gap-2 bg-gray-700 rounded-lg p-2 border-2 border-gray-600"
                >
                  {/* Category Label */}
                  <div className="text-white text-sm font-semibold px-2">
                    {config.label}
                  </div>

                  {/* Category Pieces */}
                  <div className="flex gap-1">
                    {categoryPieces.map((piece) => (
                      <button
                        key={piece.id}
                        className={`p-2 rounded border-2 transition-all hover:scale-105 ${
                          selectedPiece === piece.id
                            ? "bg-blue-600 border-blue-400"
                            : "bg-gray-600 border-gray-500 hover:bg-gray-500"
                        }`}
                        onClick={() => onPieceSelect(piece.id)}
                        title={piece.description || piece.name}
                      >
                        {renderPieceIcon(piece)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
