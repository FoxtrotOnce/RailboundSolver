import React from "react";
import { useGuiStore } from "../store";
import { piecesById } from "./BottomSelectionPanel";

export const modColors = [
    { currentColor: "text-red-500", style: "bg-red-500 border-red-600" },
    { currentColor: "text-yellow-400", style: "bg-yellow-400 border-yellow-500" },
    { currentColor: "text-green-500", style: "bg-green-500 border-green-600" },
    { currentColor: "text-blue-500", style: "bg-blue-500 border-blue-600" },
    { currentColor: "text-violet-500", style: "bg-violet-500 border-violet-600" },
    { currentColor: "text-pink-400", style: "bg-pink-400 border-pink-500" },
    { currentColor: "text-gray-200", style: "bg-gray-200 border-gray-300" },
    { currentColor: "text-slate-500", style: "bg-slate-500 border-slate-600" },
]

const ColorIcon: React.FC<{ idx: number; isButton?: boolean }> = ({ idx, isButton = true }) => {
    const { togglePalette, setSelectedModNum, selectedPiece } = useGuiStore();
    return (
        <div className={`transition-all p-1 border-2 rounded-lg bg-gray-800 border-gray-600 ${
            isButton && "hover:bg-gray-700 hover:border-gray-400"
        }`}>
            <button
                className={`relative inset-0 w-10 h-10 border-2 rounded ${
                    isButton && "cursor-pointer"
                } ${
                    modColors[idx].currentColor
                } ${
                    modColors[idx].style
                }`}
                onClick={() => {
                    if (isButton) {
                        togglePalette()
                        setSelectedModNum(idx)
                    }
                }}
                tabIndex={0}
            >
                {selectedPiece &&
                <div className="absolute inset-0">
                    {piecesById.get(selectedPiece)!.icon}
                </div>}
            </button>
        </div>
    )
}

export const ChangeModNum: React.FC = () => {
    const { showPalette, selectedModNum } = useGuiStore()    

    return (
        <div className="absolute z-40 transition-all duration-300">
            <div className="relative z-50">
                <ColorIcon idx={selectedModNum} isButton={false} />
            </div>
            <div className="absolute inset-0 transition-all duration-300" style={{transform: `rotate(${(Number(showPalette) * -90).toString()}deg)`}}>
                {modColors.map((_, idx) => (
                    <div
                        className="absolute transition-all duration-300"
                        style={{
                            left: Math.cos((idx * 2 * Math.PI) / modColors.length) * Number(showPalette) * 100,
                            top: Math.sin((idx * 2 * Math.PI) / modColors.length) * Number(showPalette) * 100,
                            transform: `rotate(${(Number(showPalette) * 90).toString()}deg)`,
                        }}
                    >
                        <ColorIcon idx={idx} isButton={true} />
                    </div>
                ))}
            </div>
        </div>
    )
}
