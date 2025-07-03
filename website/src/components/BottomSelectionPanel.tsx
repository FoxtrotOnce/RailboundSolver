import React from "react";
import { modColors } from "./ChangeModNum";
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
import {
  Car_1,
  Closed_Gate,
  Decoy,
  Ending_Track,
  Open_Gate,
  Roadblock,
  Station,
  Swapping_Track,
  Switch,
  Switch_Rail,
  Tunnel,
} from "../assets/svgs";
import { useGuiStore } from "../store";
import { Card, CardContent } from "./ui/card";

/**
 * Hardcoded game pieces configuration
 */
const GAME_PIECES: GamePiece[][] = [
  // Basic Track Pieces
  [
    {
      id: "END_TRACK",
      name: "End Track",
      description: "End Track",
      icon: Ending_Track,
    },
    {
      id: "NORMAL",
      name: "Place Car",
      description: "Place Car",
      icon: Car_1,
    },
    {
      id: "STATION",
      name: "Place Station",
      description: "Place Station",
      icon: Station,
    },
  ],
  [
    {
      id: "SWITCH",
      name: "Place Switch",
      description: "Place Switch",
      icon: Switch,
    },
    {
      id: "OPEN_GATE",
      name: "Place Open Gate",
      description: "Place Open Gate",
      icon: Open_Gate,
    },
    {
      id: "CLOSED_GATE",
      name: "Place Closed Gate",
      description: "Place Closed Gate",
      icon: Closed_Gate,
    },
    {
      id: "SWITCH_FORK_TRACK",
      name: "Place Fork Track",
      description: "Place Fork Track",
      icon: Swapping_Track,
    },
  ],
  [
    {
      id: "TUNNEL",
      name: "Place Tunnel",
      description: "Place Tunnel",
      icon: Tunnel,
    },
    {
      id: "SWITCH_RAIL",
      name: "Place Switch Rail",
      description: "Place Switch Rail",
      icon: Switch_Rail,
    },
    {
      id: "DECOY",
      name: "Place Decoy",
      description: "Place Decoy",
      icon: Decoy,
    },
    {
      id: "ROADBLOCK",
      name: "Place Fence",
      description: "Place Fence",
      icon: Roadblock,
    },
  ],
];

export const piecesById: Map<string, GamePiece> = new Map();

GAME_PIECES.forEach((group) =>
  group.forEach((piece) => piecesById.set(piece.id, piece))
);

/**
 * BottomSelectionPanel Component (Zustand version)
 * Uses Zustand store for selectedPiece and setSelectedPiece.
 * Game pieces are now hardcoded in the component.
 */
export const BottomSelectionPanel: React.FC = () => {
  const { selectedPiece, setSelectedPiece, selectedModNum } = useGuiStore();
  const pieces = GAME_PIECES;
  return (
    <div className="absolute flex justify-center bottom-2 z-40">
      <div className="flex gap-4">
        {/* Render each group of pieces */}
        {pieces.map((group, idx) => (
          <Card key={idx} className="p-1">
            <CardContent className="flex gap-2 p-1">
              {group.map((piece) => (
                <GamePieceIcon
                  key={piece.id}
                  icon={
                    <div className={modColors[selectedModNum].currentColor}>
                      {piece.icon}
                    </div>
                  }
                  piece={piece}
                  onClick={() =>
                    selectedPiece === piece.id
                      ? setSelectedPiece(undefined)
                      : setSelectedPiece(piece.id)
                  }
                  selected={selectedPiece === piece.id}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
