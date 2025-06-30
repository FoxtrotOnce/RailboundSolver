import React from "react";
import { useGuiStore } from "../store";
import { useEffect } from "react";

export const ChangeModNum: React.FC = () => {
    const { showModNumDisplay, toggleModNumDisplay } = useGuiStore()
    const hotkey = "R"
    const modColors = [
        "bg-red-400 border-red-500",
        "bg-orange-400 border-orange-500",
        "bg-yellow-400 border-yellow-500",
        "bg-green-400 border-green-500",
        "bg-teal-400 border-teal-500",
        "bg-blue-400 border-blue-500",
        "bg-indigo-400 border-indigo-500",
        "bg-violet-400 border-violet-500",
    ]
    const hotkeys = "ASDFZXCV"

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === hotkey.toLowerCase() || e.key === hotkey.toUpperCase()) {
        e.preventDefault();
        toggleModNumDisplay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

    return (
        <div className="relative z-40 bottom-2">
            <div className="relative overflow-hidden left-0 w-50 h-32 top-2 z-20">
                <div className={`transition-all duration-300 w-full absolute grid grid-cols-4 grid-rows-2 border-2 border-gray-600 bg-gray-800 rounded-lg p-2 mb-2 w-15 gap-2 ${
                    showModNumDisplay
                    ? "top-0"
                    : "top-32"
                }`}>
                    {modColors.map((color, idx) => (
                        <button
                            type="button"
                            key={idx}
                            className={`relative rounded border-2 w-10 h-10 cursor-pointer hover:brightness-90 active:brightness-80 ${color}`}
                        >
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded ring-2 ring-gray-800 border-2 border-gray-600 bg-gray-700 flex items-center justify-center text-xs text-white font-bold select-none z-20">
                                {hotkeys[idx]}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="relative flex p-2 w-15 h-15 left-18 bg-gray-800 border-2 border-gray-600 rounded-lg items-center justify-center z-40">
                <button
                    type="button"
                    className="transition-all absolute rounded w-10 h-10 bg-[#0f0] border-2 border-[#0a0] cursor-pointer hover:brightness-90 active:brightness-80"
                    onClick={() => {
                        toggleModNumDisplay()
                    }}
                    tabIndex={0}
                >
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded ring-2 ring-gray-800 border-2 border-gray-600 bg-gray-700 flex items-center justify-center text-xs text-white font-bold select-none z-20">
                        {hotkey}
                    </div>
                </button>
            </div>
        </div>
    )
}
