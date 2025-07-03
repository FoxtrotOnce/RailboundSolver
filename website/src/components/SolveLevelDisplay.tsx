import React, { useCallback } from "react";
import lvls from "../../../levels.json";
import { useLevelStore } from "../store";
import type { jsonData } from "../store/levelStore";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

type LevelType = (typeof lvls)[keyof typeof lvls];

// Organize levels by world
const worlds = new Map<string, Map<string, LevelType>>();
for (const key in lvls) {
  const lvlName = key as keyof typeof lvls;
  const world: string = lvlName.slice(0, lvlName.indexOf("-"));
  const data: LevelType = lvls[lvlName];

  if (!worlds.has(world)) {
    worlds.set(world, new Map());
  }
  worlds.get(world)!.set(lvlName, data);
}

export const SolveLevelDisplay: React.FC = () => {
  const { loadLevel, levelData } = useLevelStore();
  const [selectedWorld, setSelectedWorld] = useState("11");
  const [selectedLevel, setSelectedLevel] = useState("11-8B");
  const [isRunning, setRunningState] = useState(false);
  const [isPaused, setPauseState] = useState(false);
  // In milliseconds
  const [updateRate, setUpdateRate] = useState(1);

  // Handle world change
  const handleWorldChange = useCallback((value: string) => {
    setSelectedWorld(value);
    setSelectedLevel("");
  }, []);

  // Handle level selection
  const handleLevelChange = useCallback(
    (value: string) => {
      const levelData = worlds.get(selectedWorld)!.get(value);

      setSelectedLevel(value);
      loadLevel(levelData as jsonData, value);
    },
    [selectedWorld, loadLevel]
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg">Level Simulation</CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Current Level: {levelData.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* World and Level Selection */}
        <div className="flex gap-2">
          <Select value={selectedWorld} onValueChange={handleWorldChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...worlds.entries()].map(([worldKey]) => (
                <SelectItem key={worldKey} value={worldKey}>
                  World {worldKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLevel} onValueChange={handleLevelChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              {[...worlds.get(selectedWorld)!.entries()].map(([levelKey]) => (
                <SelectItem key={levelKey} value={levelKey}>
                  {levelKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Update Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Update Rate:{" "}
            {updateRate < 1000
              ? updateRate.toString().concat("ms")
              : (updateRate / 1000).toString().concat("s")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (updateRate === 10000) {
                setUpdateRate(1);
              } else {
                setUpdateRate(updateRate * 10);
              }
            }}
          >
            Toggle
          </Button>
        </div>

        {/* Time Elapsed */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Time Elapsed:</span>
          <span className="text-sm">0.00s</span>
        </div>

        {/* Generation Control */}
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => !isRunning && setRunningState(true)}
            disabled={isRunning}
          >
            Solve Level
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setRunningState(true);
              setPauseState(true);
            }}
          >
            Step
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => isRunning && setPauseState(!isPaused)}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (isPaused) {
                setRunningState(false);
                setPauseState(false);
              }
            }}
            disabled={!isPaused}
          >
            Reset
          </Button>
        </div>

        {/* Simulation Status */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <div
            className={`w-2 h-2 rounded-full ${
              isRunning
                ? isPaused
                  ? "bg-yellow-500"
                  : "bg-green-500"
                : "bg-yellow-500"
            }`}
          />
          <span className="text-sm font-medium">
            {isRunning
              ? isPaused
                ? "Simulation Paused"
                : "Running Simulation..."
              : "Ready to Simulate"}
          </span>
        </div>

        {/* Stats */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Step: ?,???,???,???
          </div>
          <div className="text-sm text-muted-foreground">
            Iterations: ?,???,???,???
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
