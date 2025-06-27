import React from "react";
import lvls from "../../../levels.json";
import { useLevelStore } from "../store";
import type { jsonData } from "../store/levelStore";
import { useState } from "react";

type lvl_type = (typeof lvls)[keyof typeof lvls]
const worlds = new Map<string, Map<string, lvl_type>>()
for (const key in lvls) {
    const lvl_name = key as keyof typeof lvls
    const world: string = lvl_name.slice(0, lvl_name.indexOf('-'))
    const data: lvl_type = lvls[lvl_name]
    if (!worlds.has(world)) {
        worlds.set(world, new Map())
    }
    worlds.get(world)!.set(lvl_name, data)
}

export const SolveLevelDisplay: React.FC = () => {
    const { loadLevel, levelData } = useLevelStore()
    const [ world, setWorld ] = useState('11');
    return (
        // TODO: center the solve level ui eventually
        <div className="relative flex flex-col w-fit gap-2 p-2 top-30 rounded-lg left-2 bg-gray-800 border-2 border-gray-600 z-30">
            <div className="flex justify-center font-bold text-green-400 text-lg">
                Car Simulation
            </div>
            <div className="flex justify-center text-gray-300 text-sm">
                Current Level: {levelData.name}
            </div>
            <div className="flex flex-row gap-2">
                {/* World Select */}
                <select className="bg-gray-800 border-2 p-1 w-24 rounded-md border-gray-600 text-white">
                    {[...worlds.entries()].map(([key]) => (
                        <option
                            onClick={() => setWorld(key)}
                        >
                            World {key}
                        </option>
                    ))}
                </select>
                {/* Level Select */}
                <select className="bg-gray-800 border-2 p-1 w-24 rounded-md border-gray-600 text-white">
                    {[...worlds.get(world)!.entries()].map(([key]) => (
                        <option
                            onClick={() => loadLevel(worlds.get(world)!.get(key)! as jsonData, key)}
                        >
                            {key}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
