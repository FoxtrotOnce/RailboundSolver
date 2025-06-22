import React from "react";
import type { GamePiece } from "./GamePieceIcon";
import { GamePieceIcon } from "./GamePieceIcon";

/**
 * BottomSelectionPanel Component
 *
 * Displays a horizontal panel at the bottom of the screen with grouped game piece buttons for selection.
 * Uses Zustand store for gamePieces, selectedPiece, and setSelectedPiece.
 *
 * - Each group is an array of GamePiece objects: { id, name, icon, description }.
 * - Supports both grouped and flat arrays of game pieces.
 * - Selecting a piece updates the selectedPiece in the store.
 */
import { useGuiStore } from "../store";
import StraightTrack from "./sprite/StraightTrack";
import EndingTrack from "./sprite/EndingTrack";
import Car from "./sprite/Car";

/**
 * Hardcoded game pieces configuration
 */
const GAME_PIECES: GamePiece[][] = [
  // Basic Track Pieces
  [
    {
      id: "track",
      name: "Place Track",
      description: "Place Track",
      icon: <StraightTrack rotate={90} variant="fixed" />,
    },
  ],
  [
    {
      id: "end_track",
      name: "End Track",
      description: "End Track",
      icon: <EndingTrack />,
    },
    {
      id: "car",
      name: "Place Car",
      description: "Place Car",
      icon: <Car />,
    },
  ],
];

/**
 * BottomSelectionPanel Component (Zustand version)
 * Uses Zustand store for selectedPiece and setSelectedPiece.
 * Game pieces are now hardcoded in the component.
 */
export const BottomSelectionPanel: React.FC = () => {
  const { selectedPiece, setSelectedPiece } = useGuiStore();
  const pieces = GAME_PIECES;
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40">
      <div className="bg-gray-800 border-t-2 border-gray-600 p-4">
        <div className="flex justify-center">
          <div className="flex gap-4">
            {/* Render each group of pieces */}
            {pieces.map((group, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 bg-gray-700 rounded-lg p-2 border-2 border-gray-600"
              >
                {group.map((piece) => (
                  <GamePieceIcon
                    key={piece.id}
                    piece={piece}
                    onClick={() => setSelectedPiece(piece.id)}
                    selected={selectedPiece === piece.id}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
