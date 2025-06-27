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

// Get sorted list of world keys
const sortedWorldKeys = [...worlds.keys()].sort((a, b) => {
  return parseInt(a) - parseInt(b);
});

export const SolveLevelDisplay: React.FC = () => {
  const { loadLevel, levelData } = useLevelStore();
  const [selectedWorld, setSelectedWorld] = useState(
    sortedWorldKeys[0] || "11"
  );

  // Handle world change
  const handleWorldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedWorld(e.target.value);
    },
    []
  );

  // Handle level selection
  const handleLevelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const levelKey = e.target.value;
      const levelData = worlds.get(selectedWorld)?.get(levelKey);

      if (levelData) {
        loadLevel(levelData as jsonData, levelKey);
      }
    },
    [selectedWorld, loadLevel]
  );

  // Get sorted levels for the selected world
  const levelsInWorld = worlds.get(selectedWorld) || new Map();
  const sortedLevelKeys = [...levelsInWorld.keys()].sort();

  return (
    <div className="relative flex flex-col w-fit gap-2 p-2 top-30 rounded-lg left-2 bg-gray-800 border-2 border-gray-600 z-30">
      <div className="flex justify-center font-bold text-green-400 text-lg">
        Car Simulation
      </div>
      <div className="flex justify-center text-gray-300 text-sm">
        Current Level: {levelData.name}
      </div>
      <div className="flex flex-row gap-2">
        {/* World Select */}
        <select
          className="bg-gray-800 border-2 p-1 w-24 rounded-md border-gray-600 text-white"
          value={selectedWorld}
          onChange={handleWorldChange}
        >
          {sortedWorldKeys.map((worldKey) => (
            <option key={worldKey} value={worldKey}>
              World {worldKey}
            </option>
          ))}
        </select>

        {/* Level Select */}
        <select
          className="bg-gray-800 border-2 p-1 w-24 rounded-md border-gray-600 text-white"
          onChange={handleLevelChange}
          defaultValue=""
        >
          <option value="" disabled>
            Select Level
          </option>
          {sortedLevelKeys.map((levelKey) => (
            <option key={levelKey} value={levelKey}>
              {levelKey}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
