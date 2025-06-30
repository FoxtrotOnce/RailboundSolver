import React from "react";

import { GamePieceIcon } from "./GamePieceIcon";
import type { GamePiece } from "./GamePieceIcon";
import {
  Normal_StraightTrack,
  Normal_Turn,
  Normal_Fork,
  Normal_Fork2
} from "../assets/svgs"

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
      id: "STRAIGHT",
      name: "Straight Track",
      icon: <div className="rotate-90">{Normal_StraightTrack}</div>,
      description: "Straight Track (1)",
      hotkey: "1",
    },
    {
      id: "CURVED",
      name: "Curved Track",
      icon: Normal_Turn,
      description: "Curved Track (2)",
      hotkey: "2",
    },
    {
      id: "FORK",
      name: "Fork Track",
      icon: Normal_Fork,
      description: "Fork Track (3)",
      hotkey: "3",
    },
    {
      id: "FORK_2",
      name: "Fork Track 2",
      icon: Normal_Fork2,
      description: "Fork Track 2 (4)",
      hotkey: "4",
    },
  ];

  return (
    <div className="absolute right-2 bottom-56.5 z-40 items-center">
      <div className="bg-gray-800 rounded-xl border-2 border-gray-600 p-2 flex flex-col gap-2">
        {/* Tool Buttons */}
        {toolButtons.map((tool) => (
          <GamePieceIcon
            key={tool.id}
            icon={tool.icon}
            piece={tool}
            onClick={() =>
              selectedTool === tool.id ?
              setSelectedTool(undefined) :
              setSelectedTool(tool.id)
            }
            selected={selectedTool === tool.id}
            title={tool.description || `Tool ${tool.id}`}
          />
        ))}
      </div>
    </div>
  );
};
