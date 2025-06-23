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
import StraightTrack from "../assets/Perm 1.svg";
import EndingTrack from "../assets/Ending Track.svg";
import Car from "../assets/Car 1.svg";
import ForkTrack from "../assets/Swapping Track.svg";
import Tunnel from "../assets/Tunnel.svg";
import Station from "../assets/Station.svg";
import Switch from "../assets/Switch.svg";
import OpenGate from "../assets/Open Gate.svg";
import ClosedGate from "../assets/Closed Gate.svg";
import SwitchRail from "../assets/Switch Rail.svg";
import Decoy from "../assets/Decoy.svg";
import Roadblock from "../assets/4 Fence.svg";

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
      icon: <img src={StraightTrack}/>
    }
  ],
  [
    {
      id: "end_track",
      name: "End Track",
      description: "End Track",
      icon: <img src={EndingTrack}/>
    },
    {
      id: "car",
      name: "Place Car",
      description: "Place Car",
      icon: <img src={Car}/>
    },
    {
      id: "station",
      name: "Place Station",
      description: "Place Station",
      icon: <img src={Station}/>
    }
  ],
  [
    {
      id: "switch",
      name: "Place Switch",
      description: "Place Switch",
      icon: <img src={Switch}/>,
    },
    {
      id: "open_gate",
      name: "Place Open Gate",
      description: "Place Open Gate",
      icon: <img src={OpenGate}/>
    },
        {
      id: "closed_gate",
      name: "Place Closed Gate",
      description: "Place Closed Gate",
      icon: <img src={ClosedGate}/>
    },
    {
      id: "switch_fork_track",
      name: "Place Fork Track",
      description: "Place Fork Track",
      icon: <img src={ForkTrack}/>,
    },
  ],
  [
    {
      id: "tunnel",
      name: "Place Tunnel",
      description: "Place Tunnel",
      icon: <img src={Tunnel}/>,
    },
    {
      id: "switch_rail",
      name: "Place Switch Rail",
      description: "Place Switch Rail",
      icon: <img src={SwitchRail}/>
    },
    {
      id: "decoy",
      name: "Place Decoy",
      description: "Place Decoy",
      icon: <img src={Decoy}/>,
    },
    {
      id: "fence",
      name: "Place Fence",
      description: "Place Fence",
      icon: <img src={Roadblock}/>
    }
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
