import React from "react";
import { GamePieceIcon } from "./GamePieceIcon";
import type { GamePiece } from "./GamePieceIcon";
import {
  Normal_StraightTrack,
  Normal_Turn,
  Normal_Fork,
  Normal_Fork2,
  LeftClick,
  RightClick,
} from "../assets/svgs";
import { useGuiStore } from "../store";

/**
 * RightPanel Component
 *
 * Combines the functionality of both RightToolPanel and RightControlDisplay:
 * - Displays a vertical panel of selectable tool buttons
 * - Shows control information (mouse clicks, keyboard shortcuts)
 *
 * Uses Zustand store for selectedTool and setSelectedTool.
 */
export const RightPanel: React.FC = () => {
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
    <div className="absolute right-2 bottom-2 z-40 flex flex-col gap-3">
      {/* Tool Buttons Section */}
      <div className="w-40 bg-gray-800 rounded-xl border-2 border-gray-600 p-2 flex flex-col gap-2 shadow-lg items-center">
        {toolButtons.map((tool) => (
          <GamePieceIcon
            key={tool.id}
            icon={tool.icon}
            piece={tool}
            onClick={() =>
              selectedTool === tool.id
                ? setSelectedTool(undefined)
                : setSelectedTool(tool.id)
            }
            selected={selectedTool === tool.id}
            title={tool.description || `Tool ${tool.id}`}
          />
        ))}
      </div>

      {/* Controls Help Section */}
      <div className="w-40 p-3 rounded-xl bg-gray-800 border-2 border-gray-600 shadow-lg select-none">
        <h3 className="text-white text-sm font-semibold mb-2 text-center">
          Controls
        </h3>

        {/* Mouse Controls */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex justify-center items-center">
            <div className="w-6">{LeftClick}</div>
          </div>
          <div className="flex items-center text-white text-sm">Place</div>

          <div className="flex justify-center items-center">
            <div className="w-6">{RightClick}</div>
          </div>
          <div className="flex items-center text-white text-sm">Delete</div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex gap-1 items-center justify-center">
            <div className="flex w-6 h-6 rounded border-2 border-gray-500 bg-gray-600 items-center justify-center text-xs text-white font-bold">
              Q
            </div>
            <span className="text-white">/</span>
            <div className="flex w-6 h-6 rounded border-2 border-gray-500 bg-gray-600 items-center justify-center text-xs text-white font-bold">
              E
            </div>
          </div>
          <div className="flex items-center text-white text-sm">Rotate</div>

          <div className="flex justify-center items-center">
            <div className="flex w-6 h-6 rounded border-2 border-gray-500 bg-gray-600 items-center justify-center text-xs text-white font-bold">
              W
            </div>
          </div>
          <div className="flex items-center text-white text-sm">
            Change Color
          </div>

          <div className="flex justify-center items-center">
            <div className="flex w-6 h-6 rounded border-2 border-gray-500 bg-gray-600 items-center justify-center text-xs text-white font-bold">
              R
            </div>
          </div>
          <div className="flex items-center text-white text-sm">Clear Grid</div>
        </div>
      </div>
    </div>
  );
};
