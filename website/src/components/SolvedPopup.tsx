import React from "react"
import { GridTile } from "./GridTile"
import { useGuiStore, useLevelStore } from "../store"

const Icons = {
  close:
    <svg className={`w-7 h-7.25`} viewBox="0 0 28 29">
      <path fill="currentColor" d="M4.414 22.086 12 14.5 4.414 6.914a1.414 1.414 0 0 1 2-2L14 12.5l7.586-7.586a1.414 1.414 0 1 1 2 2L16 14.5l7.586 7.586a1.414 1.414 0 0 1-2 2L14 16.5l-7.586 7.586a1.414 1.414 0 0 1-2-2Z"/>
    </svg>,
}

export const SolvedPopup: React.FC = () => {
  const { styles, displaySolvedPopup, foundSolution } = useGuiStore()
  const { permLevelData, renderedLevelData } = useLevelStore()
  const { iterations, tracks_left, semaphores_left } = permLevelData.solution
  let time_elapsed = permLevelData.solution.time_elapsed
  if (typeof time_elapsed === 'number') {
    time_elapsed = `${Math.floor(time_elapsed / 3600)}:${String(Math.floor(time_elapsed / 60) % 60).padStart(2, '0')}:${String(Math.floor(time_elapsed) % 60).padStart(2, '0')}.${String(Math.round((time_elapsed % 1) * 1000)).padEnd(3, '0')}`
  }

  return (
    <div className={`flex flex-col gap-2 p-4 rounded-[1rem] border-b-1 items-center ${styles.base.bg} ${styles.border.border} ${styles.text.text} text-[1rem] z-1`}>
      <div className={`relative flex flex-row w-full justify-center`}>
        <span className={`font-bold text-[1.5rem]`}>{foundSolution ? "Level Solved!" : "No Solution Found..."}</span>
        <button
          className={`absolute flex right-0 cursor-pointer ${styles.border.text} hover:brightness-85 active:brightness-70`}
          onClick={() => displaySolvedPopup(false)}
        >
          {Icons.close}
        </button>
      </div>
      <span className={`w-full italic text-[0.875rem] text-center`}>{permLevelData.name}</span>
      <div className={`relative ${styles.background.bg} rounded-[0.25rem] rounded-br-[0rem] p-3 overflow-hidden`}>
        <div className={`flex items-center justify-center w-90 h-90`}>
          <div
            className={`absolute flex w-full h-full pointer-events-none mask-x-from-90% mask-x-to-97% mask-y-from-90% mask-y-to-97% opacity-5`}
            style={{
              backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
              backgroundSize: `30px 30px`,
              backgroundPosition: `${12 + renderedLevelData[0].length * 30 / 2}px ${12 + renderedLevelData.length * 30 / 2}px`
            }}
          />
          <div
            className={`grid border-t-1 border-l-1 ${styles.highlight.border}`}
            style={{
              gridTemplateColumns: `repeat(${renderedLevelData[0].length}, 30px)`,
              gridTemplateRows: `repeat(${renderedLevelData.length}, 30px)`,
            }}
          >
            {renderedLevelData.map((row, idx) =>
              row.map((_, jdx) => (
                <div
                  key={`${idx}-${jdx}`}
                  className={`relative border-b-1 border-r-1 ${styles.highlight.border}`}
                >
                  <GridTile
                    is_rendered_grid={true}
                    pos={{ y: idx, x: jdx }}
                    disabled={true}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className={`flex flex-row gap-3`}>
        <span>Tracks Saved: {tracks_left}</span>
        <span>Semaphores Saved: {semaphores_left}</span>
      </div>
      <div className={`flex flex-row gap-3`}>
        <span>Time Elapsed: {time_elapsed}</span>
        <span>Iterations: {iterations.toLocaleString()}</span>
      </div>
    </div>
  )
}
