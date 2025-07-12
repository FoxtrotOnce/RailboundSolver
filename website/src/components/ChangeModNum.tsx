import React from "react";
import { useGuiStore } from "../store";
import { piecesById } from "./BottomSelectionPanel";

const ColorIcon: React.FC<{ idx: number; isButton?: boolean }> = ({ idx, isButton = true }) => {
  const { styles, togglePalette, setSelectedModNum, selectedPiece } = useGuiStore();
  return (
    <button
      className={`transition-all w-12.5 h-12.5 items-center justify-center p-1 border-b-1 ${styles.border.as_border()} rounded-[0.25rem] ${styles.base.as_bg()} ${
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
          styles.mods[idx].as_bg()
        } ${
          styles.mods[idx].as_text()
        }`}
      >
        {selectedPiece &&
        <div className="w-full h-full">
          {piecesById.get(selectedPiece)!.icon}
        </div>}
      </div>
    </button>
  )
}

export const ChangeModNum: React.FC = () => {
  const { styles, showPalette, selectedModNum } = useGuiStore()    

  return (
    <div className="transition-all duration-300 absolute flex items-center justify-center w-full h-full">
      <ColorIcon idx={selectedModNum} isButton={false} />
      <div className="transition-all duration-300 w-full h-full" style={{transform: `rotate(${(Number(showPalette) * -90).toString()}deg)`}}>
        {styles.mods.map((_, idx) => (
          <div
            className="transition-all duration-300 absolute"
            style={{
              left: Math.cos((idx * 2 * Math.PI) / styles.mods.length) * Number(showPalette) * 100,
              top: Math.sin((idx * 2 * Math.PI) / styles.mods.length) * Number(showPalette) * 100,
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
