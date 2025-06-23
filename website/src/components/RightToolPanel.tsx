import React from "react";

import { GamePieceIcon } from "./GamePieceIcon";
import type { GamePiece } from "./GamePieceIcon";
import StraightTrack from "../assets/2 Vertical Track.svg";
import TurnTrack from "../assets/5 Bottom-Right Turn.svg"
import ForkTrack from "../assets/9 Bottom-Right & Left 3-Way.svg";
import ForkTrack2 from "../assets/11 Bottom-Left & Right 3-Way.svg";

// ToolButton is now just GamePiece

/**
 * RightToolPanel Component
 *
 * Displays a vertical panel of selectable tool buttons on the right side of the screen.
 * Uses Zustand store for selectedTool and setSelectedTool.
 *
 * - Each tool is a GamePiece object: { id, name, icon, description }.
 * - To add a tool, add a GamePiece object to the toolButtons array.
 * - Selecting a tool updates the selectedTool in the store.
 */
import { useGuiStore } from "../store";

/**
 * RightToolPanel Component (Zustand version)
 * Uses Zustand store for selectedTool and setSelectedTool.
 */
export const RightToolPanel: React.FC = () => {
  const { selectedTool, setSelectedTool } = useGuiStore();
  const toolButtons: GamePiece[] = [
    {
      id: "Straight Track",
      name: "Straight Track",
      icon: <img src={StraightTrack}/>,
      description: "Straight Track (1)",
      hotkey: '1'
    },
    {
      id: "Curved Track",
      name: "Curved Track",
      icon: <img src={TurnTrack}/>,
      description: "Curved Track (2)",
      hotkey: '2'
    },
    {
      id: "Fork Track",
      name: "Fork Track",
      icon: <img src={ForkTrack}/>,
      description: "Fork Track (3)",
      hotkey: '3'
    },
    {
      id: "Fork Track 2",
      name: "Fork Track 2",
      icon: <img src={ForkTrack2}/>,
      description: "Fork Track 2 (4)",
      hotkey: '4'
    },
  ];

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40">
      <div className="bg-gray-800 rounded-xl border-2 border-gray-600 p-2 flex flex-col gap-1">
        {/* Tool Buttons */}
        {toolButtons.map((tool) => (
          <GamePieceIcon
            key={tool.id}
            piece={tool}
            onClick={() => setSelectedTool(tool.id)}
            selected={selectedTool === tool.id}
            title={tool.description || `Tool ${tool.id}`}
          />
        ))}
      </div>
    </div>
  );
};
