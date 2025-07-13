import React from "react";
import { GamePieceIcon } from "./GamePieceIcon";
import type { GamePiece } from "./GamePieceIcon";
import {
  Normal_StraightTrack,
  Normal_Turn,
  Normal_Fork,
  Normal_Fork2,
} from "../assets/svgs";
import { useGuiStore } from "../store";

/**
 * RightPanel Component
 *
 * - Displays a vertical panel of selectable tool buttons
 *
 * Uses Zustand store for selectedTool and setSelectedTool.
 */
export const RightPanel: React.FC = () => {
  const { styles, selectedTool, setSelectedTool } = useGuiStore();

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
    <div className={`flex flex-col gap-1.5 p-2 rounded-[0.25rem] border-b-1 ${styles.base.bg} ${styles.border.border}`}>
      {toolButtons.map((tool, idx) => (
        <GamePieceIcon
          key={idx}
          piece={tool}
          onClick={() => 
            selectedTool === tool.id
            ? setSelectedTool(undefined)
            : setSelectedTool(tool.id)
          }
        >

        </GamePieceIcon>
      ))}
    </div>
  );
};
