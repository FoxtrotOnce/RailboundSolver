import React from "react";
import { useGuiStore } from "../store";
import { piecesById } from "./BottomPanel";

const ColorIcon: React.FC<{ idx: number; isButton?: boolean }> = ({ idx, isButton = true }) => {
  const { styles, togglePalette, setSelectedModNum, selectedPiece, carRelatedModIcons } = useGuiStore();

  return (
    <button
      className={`flex w-12.5 h-12.5 items-center justify-center p-1 border-b-1 ${styles.border.border} rounded-[0.25rem] ${styles.base.bg} ${
        isButton && "cursor-pointer"
      }`}
      onClick={() => {
        if (isButton) {
          togglePalette()
          setSelectedModNum(idx)
        }
      }}
      tabIndex={isButton ? 0 : -1}
    >
      <div
        className={`flex items-center justify-center w-full h-full rounded-[0.25rem] ${
          (selectedPiece && carRelatedModIcons.has(selectedPiece))
          ? (idx < 4 ? "bg-[#D6592C]" : "bg-[#2C59D6]")
          : styles.mods[idx].bg
        } ${
          styles.mods[idx].text
        }`}
      >
        {selectedPiece && 
        <div className="w-full h-full">
          {carRelatedModIcons.has(selectedPiece)
          ? carRelatedModIcons.get(selectedPiece)![idx]
          : piecesById.get(selectedPiece)!.icon
          }
        </div>}
      </div>
    </button>
  )
}

export const ChangeModNum: React.FC = () => {
  const { styles, showPalette, selectedModNum } = useGuiStore()
  const counterRotation = `rotate(${(Number(showPalette) * 90).toString()}deg)`

  return (
    <div className="transition-all duration-300 absolute flex items-center justify-center" style={{transform: `rotate(${(Number(showPalette) * -90).toString()}deg)`}} >
      {styles.mods.map((_, idx) => (
        <div
          className="transition-all duration-300 absolute"
          style={{
            left: Math.cos((idx * 2 * Math.PI) / styles.mods.length) * Number(showPalette) * 100 - 25,
            top: Math.sin((idx * 2 * Math.PI) / styles.mods.length) * Number(showPalette) * 100 - 25,
            transform: counterRotation,
          }}
        >
          <ColorIcon idx={idx} isButton={true} />
        </div>
      ))}
      <div className={`transition-all duration-300 absolute`} style={{transform: counterRotation}} >
        <ColorIcon idx={selectedModNum} isButton={false} />
      </div>
    </div>
  )
}
