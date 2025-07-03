import React from "react";
import {
  LeftClick,
  Normal_Fork,
  Normal_Fork2,
  Normal_StraightTrack,
  Normal_Turn,
  RightClick,
} from "../assets/svgs";
import { useGuiStore } from "../store";
import type { GamePiece } from "./GamePieceIcon";
import { GamePieceIcon } from "./GamePieceIcon";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

interface MouseControl {
  icon: React.ReactNode;
  label: string;
  description: string;
}

interface KeyboardControl {
  keys: string[];
  label: string;
  description: string;
}

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

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(selectedTool === toolId ? undefined : toolId);
  };

  const mouseControls: MouseControl[] = [
    { icon: LeftClick, label: "Place", description: "Left click to place" },
    { icon: RightClick, label: "Delete", description: "Right click to delete" },
  ];

  const keyboardControls: KeyboardControl[] = [
    { keys: ["Q", "E"], label: "Rotate", description: "Rotate selected piece" },
    { keys: ["W"], label: "Change Color", description: "Change piece color" },
    { keys: ["R"], label: "Clear Grid", description: "Reset the grid" },
  ];

  return (
    <div className="absolute right-2 bottom-2 z-40 flex flex-col gap-3">
      {/* Tool Selection Panel */}
      <Card className="p-1">
        <CardContent className="grid grid-cols-2 gap-2 p-1">
          {toolButtons.map((tool) => (
            <GamePieceIcon
              key={tool.id}
              icon={tool.icon}
              piece={tool}
              onClick={() => handleToolSelect(tool.id)}
              selected={selectedTool === tool.id}
              buttonClassName="size-full"
            />
          ))}
        </CardContent>
      </Card>

      {/* Controls Help Panel */}
      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-sm">Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mouse Controls */}
          <div className="space-y-2">
            {mouseControls.map((control, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {control.icon}
                </div>
                <span className="text-sm text-muted-foreground">
                  {control.label}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Keyboard Controls */}
          <div className="space-y-2">
            {keyboardControls.map((control, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center gap-1 flex-shrink-0">
                  {control.keys.map((key, keyIndex) => (
                    <React.Fragment key={key}>
                      {keyIndex > 0 && (
                        <span className="text-xs text-muted-foreground">/</span>
                      )}
                      <Badge variant="outline" className="h-6 w-6 p-0 text-xs">
                        {key}
                      </Badge>
                    </React.Fragment>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {control.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
