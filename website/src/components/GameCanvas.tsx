import React, { useEffect, useRef, useState } from "react";
import { GridTile } from "./GridTile";
import { useGuiStore, useLevelStore } from "../store";
// import CarImg from "../assets/Car 1.svg";
// import { motion } from "motion/react";
import { Track } from "../../../algo/classes";

/**
 * Renders connector segments for a fence (ROADBLOCK) tile based on its neighboring tiles.
 *
 * This component checks the adjacent tiles (top, bottom, left, right) in the level grid.
 * If a neighboring tile is also a ROADBLOCK, it renders a connector segment in that direction.
 * The connectors are styled divs positioned absolutely within the parent tile.
 *
 * @param pos - The position of the current tile in the grid, with `x` and `y` coordinates.
 * @returns A set of connector divs if the current tile is a ROADBLOCK; otherwise, returns null.
 */
function FenceConnector({ pos }: { pos: { x: number; y: number } }) {
  const { levelData } = useLevelStore();
  const isConnectTop =
    levelData.grid[pos.y - 1]?.[pos.x]?.track === Track.ROADBLOCK;
  const isConnectBottom =
    levelData.grid[pos.y + 1]?.[pos.x]?.track === Track.ROADBLOCK;
  const isConnectLeft =
    levelData.grid[pos.y]?.[pos.x - 1]?.track === Track.ROADBLOCK;
  const isConnectRight =
    levelData.grid[pos.y]?.[pos.x + 1]?.track === Track.ROADBLOCK;

  // if current title is not ROADBLOCK
  if (levelData.grid[pos.y]?.[pos.x]?.track !== Track.ROADBLOCK) return null;

  return (
    <div>
      {isConnectTop && (
        <div className="w-2 h-1/2 bg-[#CB8263] top-0 left-1/2 absolute -translate-x-1/2 border-l-[0.5px] border-r-[0.5px]"></div>
      )}
      {isConnectBottom && (
        <div className="w-2 h-1/2 bg-[#CB8263] bottom-0 left-1/2 absolute -translate-x-1/2 border-l-[0.5px] border-r-[0.5px]"></div>
      )}
      {isConnectLeft && (
        <div className="w-1/2 h-2 bg-[#CB8263] left-0 absolute -translate-y-1/2 top-1/2 border-t-[0.5px] border-b-[0.5px]"></div>
      )}
      {isConnectRight && (
        <div className="w-1/2 h-2 bg-[#CB8263] right-0 absolute -translate-y-1/2 top-1/2 border-t-[0.5px] border-b-[0.5px]"></div>
      )}
    </div>
  );
}

export const GameCanvas: React.FC<{ children?: React.ReactNode }> = () => {
  const { styles, showGrid, gridSize } = useGuiStore();
  const { levelData, setDims, saveLevel, saveToUndoStack } = useLevelStore();
  const [ resizerGrabbed, setResizerGrabbed ] = useState(-1)
  const [ resizeStartPos, setResizeStartPos ] = useState({x: 0, y: 0})
  const [animationFlag, setFlag] = useState(false);
  const [tileHovering, setTileHovering] = useState({y: -1, x: -1});
  const gridRef = useRef<HTMLDivElement | null>(null)
  const { width, height } = levelData;
  const [ savedDims, setSavedDims ] = useState({width: 0, height: 0})
  // grid_x and grid_y are the relative position of the editing grid compared to its parent, so the grabbers can be situated around it.
  const grid_x = (12 - width) * gridSize / 2 + 4 * 4
  const grid_y = (12 - height) * gridSize / 2 + 4 * 4

  const resizerParams: Record<number, {cursor: string, hover_cursor: string, xMult: number, yMult: number}> = {
    0: {cursor: 'nw-resize', hover_cursor: 'cursor-nw-resize', xMult: -1, yMult: -1},
    1: {cursor: 'n-resize', hover_cursor: 'cursor-n-resize', xMult: 0, yMult: -1},
    2: {cursor: 'ne-resize', hover_cursor: 'cursor-ne-resize', xMult: 1, yMult: -1},
    3: {cursor: 'w-resize', hover_cursor: 'cursor-w-resize', xMult: -1, yMult: 0},
    5: {cursor: 'e-resize', hover_cursor: 'cursor-e-resize', xMult: 1, yMult: 0},
    6: {cursor: 'sw-resize', hover_cursor: 'cursor-sw-resize', xMult: -1, yMult: 1},
    7: {cursor: 's-resize', hover_cursor: 'cursor-s-resize', xMult: 0, yMult: 1},
    8: {cursor: 'se-resize', hover_cursor: 'cursor-se-resize', xMult: 1, yMult: 1}
  }

  useEffect(() => {
    const mouseup = () => {
      document.body.style.cursor = 'auto'
      setResizerGrabbed(-1)
      // If the dims were actually changed, save the level
      if (savedDims.width !== width || savedDims.height !== height) {
        saveLevel()
      }
    }
    const mousemove = (e: MouseEvent) => {
      if (resizerGrabbed !== -1) {
        const params = resizerParams[resizerGrabbed]
        const newX = Math.max(1, Math.min(12, savedDims.width + Math.round(params.xMult * (e.clientX - resizeStartPos.x) / gridSize * 2)))
        const newY = Math.max(1, Math.min(12, savedDims.height + Math.round(params.yMult * (e.clientY - resizeStartPos.y) / gridSize * 2)))
        // Only call setDims if the dimensions are actually being changed.
        if (newX !== width || newY !== height) {
          setDims({x: newX, y: newY})
          // Tile hovering (for the square cursor) has to be reset since sometimes onMouseLeave doesn't trigger on the divs deleted by setDims.
          setTileHovering({y: -1, x: -1})
        }
      }
    }

    window.addEventListener("mouseup", mouseup);
    window.addEventListener("mousemove", mousemove);
    return () => {
      window.removeEventListener("mouseup", mouseup);
      window.removeEventListener("mousemove", mousemove);
    };
  }, [resizeStartPos, resizerGrabbed, width, height])

    // NOTE: Animation is delayed when hovering over tiles because the animation doesn't trigger on the cursor until 800ms after it's loaded.
    useEffect(() => {
      setTimeout(() => setFlag(!animationFlag), 800)
    }, [animationFlag])

  const ResizeGrabber: React.FC<{
    idx: number;
    d: string;
  }> = ({ idx, d }) => {
    const [ isHovered, setHover ] = useState(false)

    return (
      <path
        className={`pointer-events-auto ${resizerParams[idx].hover_cursor} ${
          resizerGrabbed === idx
          ? 'text-blue-400'
          : isHovered ? 'text-blue-300' : styles.text.text
        }`}
        onMouseDown={(e) => {
          document.body.style.cursor = resizerParams[idx].cursor
          setResizerGrabbed(idx)
          setResizeStartPos({x: e.clientX, y: e.clientY})
          setSavedDims({width: width, height: height})
          saveToUndoStack()
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
        d={d}
      />
    )
  }
  
  return (
    <div className={`relative flex justify-center items-center p-4 overflow-`} style={{ width: gridSize * 12 + 4 * 8, height: gridSize * 12 + 4 * 8}}>
      {/* Extended grid overlay */}
      <div
        className={`absolute flex w-full h-full pointer-events-none mask-x-from-90% mask-x-to-97% mask-y-from-90% mask-y-to-97% opacity-5`}
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${16 + width * gridSize / 2}px ${16 + height * gridSize / 2}px`
        }}
      />
      {/* Grid */}
      <div
        ref={gridRef}
        className={`relative grid ${
          showGrid && `border-t-1 border-l-1 w-fit h-fit ${styles.text.border}`
        }`}
        style={{
          gridTemplateColumns: `repeat(${width}, ${gridSize}px)`,
          gridTemplateRows: `repeat(${height}, ${gridSize}px)`,
        }}
      >
        {/* Square Hover Cursor */}
        <svg
          className={`absolute text-yellow-200 pointer-events-none z-1 ${(tileHovering.x === -1 || resizerGrabbed !== -1) ? `opacity-0` : `opacity-100`}`}
          style={{
            width: `${gridSize + 16}px`,
            height: `${gridSize + 16}px`,
            left: `${-8 + tileHovering.x * gridSize}px`,
            top: `${-8 + tileHovering.y * gridSize}px`
          }}
          viewBox={`0 0 48 48`}
        >
          {/* Outlines */}
          <path
            className='transition-all duration-1400'
            fill='none'
            stroke='#000'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='3'
            d={animationFlag ? 'm5 10l0 -5l5 0' : 'm8 13l0 -5l5 0'}
          />
          <path
            className='transition-all duration-1400'
            fill='none'
            stroke='#000'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='3'
            d={animationFlag ? 'm38 5l5 0l0 5' : 'm35 8l5 0l0 5'}
          />
          <path
            className='transition-all duration-1400'
            fill='none'
            stroke='#000'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='3'
            d={animationFlag ? 'm5 38l0 5l5 0' : 'm8 35l0 5l5 0'}
          />
          <path
            className='transition-all duration-1400'
            fill='none'
            stroke='#000'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='3'
            d={animationFlag ? 'm38 43l5 0l0 -5' : 'm35 40l5 0l0 -5'}
          />
          {/* Brackets */}
          <path
            className='transition-all duration-1400'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d={animationFlag ? 'm5 10l0 -5l5 0' : 'm8 13l0 -5l5 0'}
          />
          <path
            className='transition-all duration-1400'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d={animationFlag ? 'm38 5l5 0l0 5' : 'm35 8l5 0l0 5'}
          />
          <path
            className='transition-all duration-1400'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d={animationFlag ? 'm5 38l0 5l5 0' : 'm8 35l0 5l5 0'}
          />
          <path
            className='transition-all duration-1400'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d={animationFlag ? 'm38 43l5 0l0 -5' : 'm35 40l5 0l0 -5'}
          />
        </svg>
        {levelData.grid.map((row, idx) =>
          row.map((tile, jdx) => (
            <div
              key={`${idx}-${jdx}`}
              className={`relative border-b-1 border-r-1 ${styles.text.border}`}
              onMouseEnter={() => setTileHovering({y: idx, x: jdx})}
              onMouseLeave={() => setTileHovering({y: -1, x: -1})}
            >
              <GridTile
                pos={{ y: idx, x: jdx }}
                car={tile.car}
                track={tile.track}
                mod={tile.mod}
                mod_num={tile.mod_num}
                disabled={false}
              />
              <FenceConnector pos={{ y: idx, x: jdx }} />
            </div>
          ))
        )}
      </div>
      {/* Grid Resizing Grabbers */}
      {/* NOTE - Grabbers are located on the top-most div, and are moved to the position of the grid in their d's. */}
      <svg
        className={`absolute inset-0 pointer-events-none`}
        viewBox={`-${grid_x} -${grid_y} ${gridSize * 12 + 4 * 8} ${gridSize * 12 + 4 * 8}`}
      >
        {/* Top-Left */}
        <ResizeGrabber
          idx={0}
          d={`m-8 16l0 -24l24 0`}
        />
        {/* Top */}
        <ResizeGrabber
          idx={1}
          d={`m${gridSize * width / 2 - 14} -8l28 0`}
        />
        {/* Top-Right */}
        <ResizeGrabber
          idx={2}
          d={`m${gridSize * width - 16} -8l24 0l0 24`}
        />
        {/* Left */}
        <ResizeGrabber
          idx={3}
          d={`m-8 ${gridSize * height / 2 - 14}l0 28`}
        />
        {/* Right */}
        <ResizeGrabber
          idx={5}
          d={`m${gridSize * width + 8} ${gridSize * height / 2 - 14}l0 28`}
        />
        {/* Bottom-Left */}
        <ResizeGrabber
          idx={6}
          d={`m-8 ${gridSize * height - 16}l0 24l24 0`}
        />
        {/* Bottom */}
        <ResizeGrabber
          idx={7}
          d={`m${gridSize * width / 2 - 14} ${gridSize * height + 8}l28 0`}
        />
        {/* Bottom-Right */}
        <ResizeGrabber
          idx={8}
          d={`m${gridSize * width - 16} ${gridSize * height + 8}l24 0l0 -24`}
        />
      </svg>
    </div>
  );
};
