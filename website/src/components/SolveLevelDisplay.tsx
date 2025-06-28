import React, { useCallback } from "react";
import lvls from "../../../levels.json";
import { useLevelStore } from "../store";
import type { jsonData } from "../store/levelStore";
import { useState } from "react";

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
  const [selectedWorld, setSelectedWorld] = useState('11');
  const [selectedLevel, setSelectedLevel] = useState('11-8B');
  const [isRunning, setRunningState] = useState(false);
  const [isPaused, setPauseState] = useState(false);
  // In milliseconds
  const [updateRate, setUpdateRate] = useState(1);

  // Handle world change
  const handleWorldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedWorld(e.target.value);
      setSelectedLevel('')
    },
    []
  );

  // Handle level selection
  const handleLevelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const levelKey = e.target.value;
      const levelData = worlds.get(selectedWorld)!.get(levelKey);

      setSelectedLevel(levelKey)
      loadLevel(levelData as jsonData, levelKey);
    },
    [selectedWorld, loadLevel]
  );

  return (
    <div className="relative flex flex-col w-58 gap-2 py-2 px-4 top-30 rounded-lg left-2 bg-gray-800 border-2 border-gray-600 overflow-hidden z-30">
      <div className="flex justify-center font-bold text-green-400 text-lg">
        Level Simulation
      </div>
      <div className="flex justify-center text-gray-300 text-sm">
        Current Level: {levelData.name}
      </div>
      <div className="flex justify-center flex-row gap-2 pb-2 border-b-2 border-dashed border-gray-600">
        {/* World Select */}
        <select
          className="bg-gray-800 border-2 p-1 w-24 rounded-md border-gray-600 text-white"
          value={selectedWorld}
          onChange={handleWorldChange}
        >
          {[...worlds.entries()].map(([worldKey]) => (
            <option key={worldKey} value={worldKey}>
              World {worldKey}
            </option>
          ))}
        </select>

        {/* Level Select */}
        <select
          className="bg-gray-800 border-2 p-1 w-24 rounded-md border-gray-600 text-white"
          onChange={handleLevelChange}
          value={selectedLevel}
          defaultValue=""
        >
          <option value="" disabled>
            Select Level
          </option>
          {[...worlds.get(selectedWorld)!.entries()].map(([levelKey]) => (
            <option key={levelKey} value={levelKey}>
              {levelKey}
            </option>
          ))}
        </select>
      </div>
      {/* Update Rate */}
      <div className="relative flex items-center my-1">
        <div className="text-gray-300 text-sm">
          Update Rate: {
            updateRate < 1000
            ? updateRate.toString().concat("ms")
            : (updateRate / 1000).toString().concat("s")
          }
        </div>
        <button
          className="absolute right-0 cursor-pointer border-2 rounded-md border-gray-600 px-2 py-0.5 text-white hover:brightness-85 active:brightness-70"
          onClick={() => {
            updateRate === 10000
            ? setUpdateRate(1)
            : setUpdateRate(updateRate * 10)
          }}
        >
          Toggle
        </button>
      </div>
      {/* Time Elapsed */}
      <div className={`relative flex ${
        isRunning
        ? isPaused ? "text-yellow-300" : "text-gray-300"
        : "text-gray-300"
      }`}>
        <div>
          Time Elapsed:
        </div>
        <div className="absolute right-0">
          0.00s
        </div>
      </div>
      {/* Generation Control */}  
      {/* Start Generation */}
      <button
        className={`transition-all duration-300 relative w-fit mx-auto whitespace-nowrap cursor-pointer px-5 py-1 rounded-md border-2 border-green-400 text-green-400 font-semibold hover:brightness-85 active:brightness-70 ${
          isRunning
          ? "-left-54"
          : "left-0"
        }`}
        onClick={() => !isRunning && setRunningState(true)}
      >
        Solve Level
      </button>
      <div className={`transition-all duration-300 relative -mt-11 flex flex-row gap-2 justify-center ${
        isRunning
        ? "left-0"
        : "left-54"
      }`}>
        {/* Pause/Resume Generation */}
        <button
          className={`transition-all cursor-pointer w-fit px-5 py-1 font-semibold rounded-md border-2 hover:brightness-85 active:brightness-70 ${
            isPaused
            ? "border-gray-400 text-gray-400"
            : "border-yellow-400 text-yellow-400"
          }`}
          onClick={() => isRunning && setPauseState(!isPaused)}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
        {/* Stop Generation */}
        <button
          className={`transition-all w-fit px-5 py-1 font-semibold rounded-md border-2 ${
            isPaused
            ? "border-red-400 text-red-400 cursor-pointer hover:brightness-85 active:brightness-70 "
            : "border-red-300 text-red-300 brightness-80"
          }`}
          onClick={() => {
            if (isPaused) {
              setRunningState(false)
              setPauseState(false)
            }}}
        >
          Reset
        </button>
      </div>
      {/* Simulation Status */}
      <div className="relative flex top-1 items-center gap-3 border-t-2 pt-2 pb-1 border-dashed border-gray-600">
        {/* TODO: animate this so it pulses; animate-pulse isn't good enough. */}
        <div className={`relative w-4 h-4 rounded-md ${
          isRunning
          ? isPaused ? "bg-yellow-400" : "bg-green-400"
          : "bg-yellow-400"
        }`}>
          <div className={`absolute w-4 h-4 rounded-md blur-xs ${
          isRunning
          ? isPaused ? "bg-yellow-400" : "bg-green-400"
          : "bg-yellow-400"
        }`} />
        </div>
        <div className={`relative font-semibold ${
          isRunning
          ? isPaused ? "text-yellow-400" : "text-green-400"
          : "text-yellow-400"
        }`}>
          {/* TODO: animate ellipses */}
          {
            isRunning
            ? isPaused ? "Simulation Paused" : "Running Simulation..."
            : "Ready to Simulate"
          }
        </div>
      </div>
      {/* Stats */}
      <div>
        <div className="text-gray-300 text-sm">
          Step: ?,???,???,???
        </div>
        <div className="text-gray-300 text-sm">
          another stat?
        </div>
      </div>
    </div>
  );
};
