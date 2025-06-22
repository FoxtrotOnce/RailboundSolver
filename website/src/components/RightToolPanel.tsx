import React from "react";

import { GamePieceIcon } from "./GamePieceIcon";
import type { GamePiece } from "./GamePieceIcon";
import StraightTrack from "./sprite/StraightTrack";
import CurvesTrack from "./sprite/CurvesTrack";
import ForkTrack from "./sprite/ForkTrack";
import ForkTrack2 from "./sprite/ForkTrack2";

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
      id: "tool1",
      name: "Straight Track",
      icon: <StraightTrack rotate={90} />,
      description: "Straight Track (1)",
    },
    {
      id: "tool2",
      name: "Curves Track",
      icon: <CurvesTrack />,
      description: "Curves Track (2)",
    },
    {
      id: "tool3",
      name: "Fork Track",
      icon: <ForkTrack />,
      description: "Fork Track (3)",
    },
    {
      id: "tool4",
      name: "Fork Track 2",
      icon: <ForkTrack2 />,
      description: "Fork Track 2 (4)",
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
