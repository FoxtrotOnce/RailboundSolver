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
import {
  Roadblock,
  Perm_Fork,
  Car_1,
  Ending_Track,
  Tunnel,
  Station,
  Switch,
  Swapping_Track,
  Open_Gate,
  Closed_Gate,
  Switch_Rail,
  Decoy
} from "../assets/svgs";

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
      icon: Ending_Track
    },
    {
      id: "NORMAL",
      name: "Place Car",
      description: "Place Car",
      icon: Car_1
    },
    {
      id: "STATION",
      name: "Place Station",
      description: "Place Station",
      icon: Station
    }
  ],
  [
    {
      id: "SWITCH",
      name: "Place Switch",
      description: "Place Switch",
      icon: Switch
    },
    {
      id: "OPEN_GATE",
      name: "Place Open Gate",
      description: "Place Open Gate",
      icon: <div className="rotate-270">{Open_Gate}</div>
    },
        {
      id: "CLOSED_GATE",
      name: "Place Closed Gate",
      description: "Place Closed Gate",
      icon: <div className="rotate-270">{Closed_Gate}</div>
    },
    {
      id: "SWITCH_FORK_TRACK",
      name: "Place Fork Track",
      description: "Place Fork Track",
      icon: Swapping_Track
    },
  ],
  [
    {
      id: "TUNNEL",
      name: "Place Tunnel",
      description: "Place Tunnel",
      icon: Tunnel
    },
    {
      id: "SWITCH_RAIL",
      name: "Place Switch Rail",
      description: "Place Switch Rail",
      icon: Switch_Rail
    },
    {
      id: "DECOY",
      name: "Place Decoy",
      description: "Place Decoy",
      icon: Decoy
    },
    {
      id: "ROADBLOCK",
      name: "Place Fence",
      description: "Place Fence",
      icon: Roadblock
    }
  ],
];

export let piecesById: Map<string, GamePiece> = new Map()

GAME_PIECES.forEach((group) => (
  group.forEach((piece) => (
    piecesById.set(piece.id, piece)
  ))
))

/**
 * BottomSelectionPanel Component (Zustand version)
 * Uses Zustand store for selectedPiece and setSelectedPiece.
 * Game pieces are now hardcoded in the component.
 */
export const BottomSelectionPanel: React.FC = () => {
  const { styles, selectedPiece, setSelectedPiece, selectedModNum } = useGuiStore();
  const pieces = GAME_PIECES;
  return (
    <div className={`flex flex-row gap-3`}>
      {pieces.map((group, idx) => (
        <div
          key={idx}
          className={`flex flex-row gap-1.5 p-2 rounded-[0.25rem] border-b-1 ${styles.base.as_bg()} ${styles.border.as_border()}`}
        >
          {group.map((piece, jdx) => (
            <GamePieceIcon
              key={jdx}
              piece={piece}
              onClick={() => 
                selectedPiece === piece.id
                ? setSelectedPiece(undefined)
                : setSelectedPiece(piece.id)
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
};
