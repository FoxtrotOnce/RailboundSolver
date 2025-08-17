import React from "react";
import { Closed_Semaphore, Normal_StraightTrack } from "../assets/svgs";
import { useLevelStore } from "../store";

// TODO: make into a single leftpanel with solveleveldisplay like how the rightpanel is
export const ParamDisplay: React.FC = () => {
    const { setTracks, setSemaphores, permLevelData } = useLevelStore()
    const { max_tracks, max_semaphores } = permLevelData

    return (
        <div className="absolute flex flex-col bottom-2 left-2 p-3 w-54 bg-gray-800 border-2 rounded-lg border-gray-600 gap-2 z-40">
            {/* Max Semaphores */}
            <div className="relative flex flex-row gap-2">
                <div className="pr-3 border-r-2 border-gray-600">
                    <div className="w-14 h-14 rotate-130">
                        {Closed_Semaphore}
                    </div>
                </div>
                <div className="relative flex flex-col mx-auto gap-1 items-center">
                    <div className="relative flex text-white text-sm font-semibold whitespace-nowrap">
                        Max Semaphores
                    </div>
                    <div className="relative flex flex-row w-26 items-center justify-center">
                        <button
                            disabled={max_semaphores <= 0}
                            className={`absolute flex left-0 transition-all rounded-full bg-gray-700 border-2 border-gray-600 w-6 h-6 items-center justify-center text-xl text-white ${
                                max_semaphores <= 0
                                ? "brightness-80"
                                : "hover:bg-gray-600 cursor-pointer"
                            }`}
                            onClick={() => setSemaphores(max_semaphores - 1)}
                        >
                            <svg viewBox="0 0 24 24">
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m7 12l10 0"
                                />
                            </svg>
                        </button>
                        <div className="text-2xl text-white font-semibold select-none">
                            {max_semaphores}
                        </div>
                        <button
                            disabled={max_semaphores >= 5}
                            className={`absolute flex right-0 transition-all rounded-full bg-gray-700 border-2 border-gray-600 w-6 h-6 items-center justify-center text-xl text-white ${
                                max_semaphores >= 5
                                ? "brightness-80"
                                : "hover:bg-gray-600 cursor-pointer"
                            }`}
                            onClick={() => setSemaphores(max_semaphores + 1)}
                        >
                            <svg viewBox="0 0 24 24">
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m7 12l10 0"
                                />
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m12 7l0 10"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            {/* Max Tracks */}
            <div className="relative flex flex-row gap-2">
                <div className="pr-3 border-r-2 border-gray-600">
                    <div className="w-14 h-14 rotate-130">
                        {Normal_StraightTrack}
                    </div>
                </div>
                <div className="relative flex flex-col mx-auto gap-1 items-center">
                    <div className="relative flex text-white text-sm font-semibold whitespace-nowrap">
                        Max Tracks
                    </div>
                    <div className="relative flex flex-row w-26 items-center justify-center">
                        <button
                            disabled={max_tracks <= 0}
                            className={`absolute flex left-0 transition-all rounded-full bg-gray-700 border-2 border-gray-600 w-6 h-6 items-center justify-center text-xl text-white ${
                                max_tracks <= 0
                                ? "brightness-80"
                                : "hover:bg-gray-600 cursor-pointer"
                            }`}
                            onClick={() => setTracks(max_tracks - 1)}
                        >
                            <svg viewBox="0 0 24 24">
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m7 12l10 0"
                                />
                            </svg>
                        </button>
                        <div className="text-2xl text-white font-semibold select-none">
                            {max_tracks}
                        </div>
                        <button
                            disabled={max_tracks >= 144}
                            className={`absolute flex right-0 transition-all rounded-full bg-gray-700 border-2 border-gray-600 w-6 h-6 items-center justify-center text-xl text-white ${
                                max_tracks >= 144
                                ? "brightness-80"
                                : "hover:bg-gray-600 cursor-pointer"
                            }`}
                            onClick={() => setTracks(max_tracks + 1)}
                        >
                            <svg viewBox="0 0 24 24">
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m7 12l10 0"
                                />
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m12 7l0 10"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
