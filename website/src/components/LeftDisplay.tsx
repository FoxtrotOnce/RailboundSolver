import React from "react";
import { useGuiStore } from "../store";

export const LeftDisplay: React.FC = () => {
  const { setHyperparams, defaultHyperparams, hyperparameters } = useGuiStore();
  return (
    <div className="absolute flex flex-col inset-3 right-0 text-white gap-2 overflow-auto">
      <div className="flex flex-col h-fit p-3 bg-gray-800 border-2 rounded-lg border-gray-600 gap-2">
        <div className="flex justify-center font-bold text-xl">
          RailboundSolver
        </div>
        <div className="text-md">
          RailboundSolver is a logic-based solving algorithm designed to find
          the "best" solution that{" "}
          <span className="font-semibold text-yellow-300">
            uses the least tracks
          </span>{" "}
          for any level configuration from the game{" "}
          <a
            href="https://store.steampowered.com/app/1967510/Railbound/"
            className="text-blue-400 hover:underline"
            target="_blank"
          >
            Railbound
          </a>
          .
        </div>
      </div>
      {/* TODO: make this a popup when the page is loaded instead */}
      {/* <div className="flex flex-col h-fit p-3 bg-gray-800 border-2 rounded-lg border-gray-600 gap-2">
                <div className="flex justify-center font-bold text-xl">
                    How To Use
                </div>
                <div className="text-md">
                    Set the board dimensions and track count above the level editor,
                    and design the level you would like to solve.
                </div>
                <div className="text-md">
                    Once you're finished, solve the level by pressing the <span className="font-semibold text-green-400">"Start Simulation"</span> button.
                    The solution for the level will be displayed once the solver is finished!
                </div>
            </div> */}
            <div className="flex flex-col h-fit p-3 bg-gray-800 border-2 rounded-lg border-gray-600 gap-2">
                <div className="flex justify-center font-bold text-xl">
                    Hyperparameters
                </div>
                <div className="text-sm">
                    These settings affect the solving algorithm. The defaults are ideal for nearly any level, so
                    <span className="font-semibold text-red-400"> only change them if you know what you are doing and it is absolutely necessary!</span>
                </div>
                {/* HEATMAP_LIMIT_LIMIT */}
                <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
                    <div className="font-mono text-lg">
                        HEATMAP_LIMIT_LIMIT = {hyperparameters.heatmap_limit_limit}
                    </div>
                    <button
                        className="transition-all absolute cursor-pointer right-0 border-2 rounded border-violet-400 text-violet-400 font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60"
                        onClick={() => setHyperparams(defaultHyperparams().heatmap_limit_limit)}
                    >
                        Reset
                    </button>
                    <div>
                        How many times a car can <i>reasonably</i> loop before the generated branch is cut.
                        {" "}<span className="font-semibold text-red-400">Only increase if you know a car must loop more than {defaultHyperparams().heatmap_limit_limit} times.</span>
                    </div>
                    <input
                        className="accent-violet-400"
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={hyperparameters.heatmap_limit_limit}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setHyperparams(val)
                        }}
                    />
                </div>
                {/* DECOY_HEATMAP_LIMIT */}
                <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
                    <div className="font-mono text-lg">
                        DECOY_HEATMAP_LIMIT = {hyperparameters.decoy_heatmap_limit}
                    </div>
                    <button
                        className="transition-all absolute cursor-pointer right-0 border-2 rounded border-violet-400 text-violet-400 font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60"
                        onClick={() => setHyperparams(undefined, defaultHyperparams().decoy_heatmap_limit)}
                    >
                        Reset
                    </button>
                    <div>
                        How many times a decoy can loop before the generated branch is cut.
                        {" "}<span className="font-semibold text-red-400">Only increase if you know a decoy must loop more than {defaultHyperparams().decoy_heatmap_limit} times.</span>
                    </div>
                    <input
                        className="accent-violet-400"
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={hyperparameters.decoy_heatmap_limit}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setHyperparams(undefined, val)
                        }}
                    />
                </div>
                {/* GEN_TYPE */}
                <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
                    <div className="font-mono text-lg">
                        GEN_TYPE = {hyperparameters.gen_type}
                    </div>
                    <button
                        className="transition-all absolute cursor-pointer right-0 border-2 rounded border-violet-400 text-violet-400 font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60"
                        onClick={() => setHyperparams(undefined, undefined, defaultHyperparams().gen_type)}
                    >
                        Reset
                    </button>
                    <div>
                        The tree traversal technique the algorithm uses.
                    </div>
                    <div className="flex flex-row items-center">
                        <button
                            className="flex cursor-pointer border-2 rounded w-fit h-fit px-2 border-green-300 text-green-300 font-semibold hover:brightness-80 active:brightness-60"
                            onClick={() => setHyperparams(undefined, undefined, "DFS")}
                        >
                            DFS
                        </button>
                        <div className="ml-2 text-sm">
                            <span className="text-green-300 font-semibold">Depth-First Search;</span> the algorithm tries configurations with more tracks first, often finding a solution before BFS because not <b>all</b> low-track configurations are tried.
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <button
                            className="flex cursor-pointer border-2 rounded w-fit h-fit px-2 border-blue-300 text-blue-300 font-semibold hover:brightness-80 active:brightness-60"
                            onClick={() => setHyperparams(undefined, undefined, "BFS")}
                        >
                            BFS
                        </button>
                        <div className="ml-2 text-sm">
                            <span className="text-blue-300 font-semibold">Breadth-First Search;</span> the algorithm tries configurations with the least tracks until a solution is found.
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="text-sm">
          These settings affect the solving algorithm. The defaults are ideal
          for nearly any level, so
          <span className="font-semibold text-red-400">
            {" "}
            only change them if you know what you are doing and it is absolutely
            necessary!
          </span>
        </div>
        {/* HEATMAP_LIMIT_LIMIT */}
        <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
          <div className="font-mono text-lg">
            HEATMAP_LIMIT_LIMIT = {hyperparameters.heatmap_limit_limit}
          </div>
          <button
            className="transition-all absolute cursor-pointer right-0 border-2 rounded border-violet-400 text-violet-400 font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60"
            onClick={() =>
              setHyperparams(defaultHyperparams().heatmap_limit_limit)
            }
          >
            Reset
          </button>
          <div>
            How many times a car can{" "}
            <span className="italic font-semibold text-violet-400">
              reasonably
            </span>{" "}
            loop before the generated branch is cut.
          </div>
          <input
            className="accent-violet-400"
            type="range"
            min="0"
            max="30"
            step="1"
            value={hyperparameters.heatmap_limit_limit}
            onChange={(e) => {
              const val = Number(e.target.value);
              setHyperparams(val);
            }}
          />
        </div>
        {/* DECOY_HEATMAP_LIMIT */}
        <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
          <div className="font-mono text-lg">
            DECOY_HEATMAP_LIMIT = {hyperparameters.decoy_heatmap_limit}
          </div>
          <button
            className="transition-all absolute cursor-pointer right-0 border-2 rounded border-violet-400 text-violet-400 font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60"
            onClick={() =>
              setHyperparams(
                undefined,
                defaultHyperparams().decoy_heatmap_limit
              )
            }
          >
            Reset
          </button>
          <div>
            How many times a decoy can loop before the generated branch is cut.
          </div>
          <input
            className="accent-violet-400"
            type="range"
            min="0"
            max="30"
            step="1"
            value={hyperparameters.decoy_heatmap_limit}
            onChange={(e) => {
              const val = Number(e.target.value);
              setHyperparams(undefined, val);
            }}
          />
        </div>
        {/* GEN_TYPE */}
        <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
          <div className="font-mono text-lg">
            GEN_TYPE = {hyperparameters.gen_type}
          </div>
          <button
            className="transition-all absolute cursor-pointer right-0 border-2 rounded border-violet-400 text-violet-400 font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60"
            onClick={() =>
              setHyperparams(
                undefined,
                undefined,
                defaultHyperparams().gen_type
              )
            }
          >
            Reset
          </button>
          <div>The tree traversal technique the algorithm uses.</div>
          <div className="flex flex-row items-center">
            <button
              className="flex cursor-pointer border-2 rounded w-fit h-fit px-2 border-green-300 text-green-300 font-semibold hover:brightness-80 active:brightness-60"
              onClick={() => setHyperparams(undefined, undefined, "DFS")}
            >
              DFS
            </button>
            <div className="ml-2 text-sm">
              <span className="text-green-300 font-semibold">
                Depth-First Search;
              </span>{" "}
              the algorithm tries configurations with more tracks first, often
              finding a solution before BFS because not <b>all</b> low-track
              configurations are tried.
            </div>
          </div>
          <div className="flex flex-row items-center">
            <button
              className="flex cursor-pointer border-2 rounded w-fit h-fit px-2 border-blue-300 text-blue-300 font-semibold hover:brightness-80 active:brightness-60"
              onClick={() => setHyperparams(undefined, undefined, "BFS")}
            >
              BFS
            </button>
            <div className="ml-2 text-sm">
              <span className="text-blue-300 font-semibold">
                Breadth-First Search;
              </span>{" "}
              the algorithm tries configurations with the least tracks until a
              solution is found.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
