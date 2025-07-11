import React from "react";
import { useGuiStore } from "../store";
import { piecesById } from "./BottomSelectionPanel";

const ColorIcon: React.FC<{ idx: number; isButton?: boolean }> = ({ idx, isButton = true }) => {
    const { colors, togglePalette, setSelectedModNum, selectedPiece } = useGuiStore();
    return (
        <div className={`transition-all p-1 border-2 rounded-lg bg-gray-800 border-gray-600 ${
            isButton && "hover:bg-gray-700 hover:border-gray-400"
        }`}>
            <button
                className={`relative inset-0 w-10 h-10 border-2 rounded ${
                    isButton && "cursor-pointer"
                } ${
                    colors.mods[idx].currentColor
                } ${
                    colors.mods[idx].style
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
    const { colors, showPalette, selectedModNum } = useGuiStore()    

    return (
        <div className="absolute z-40 transition-all duration-300">
            <div className="relative z-50">
                <ColorIcon idx={selectedModNum} isButton={false} />
            </div>
            <div className="absolute inset-0 transition-all duration-300" style={{transform: `rotate(${(Number(showPalette) * -90).toString()}deg)`}}>
                {colors.mods.map((_, idx) => (
                    <div
                        className="absolute transition-all duration-300"
                        style={{
                            left: Math.cos((idx * 2 * Math.PI) / colors.mods.length) * Number(showPalette) * 100,
                            top: Math.sin((idx * 2 * Math.PI) / colors.mods.length) * Number(showPalette) * 100,
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
