import React, { useEffect, useState, useRef } from "react";
import { GridTile } from "./GridTile";
import { useGuiStore, useLevelStore } from "../store";
// import CarImg from "../assets/Car 1.svg";
// import { motion } from "motion/react";
import { Track } from "../../../algo/classes";

// THIS IS EXAMPLE OR HOW WE MOVE THE CAR
// const carPos = [
//   { x: 0, y: 0, rotate: 0 },
//   { x: 1, y: 0, rotate: 90 },
//   { x: 1, y: 1, rotate: 180 },
//   { x: 0, y: 1, rotate: 270 },
// ];
// function Car({ carId, rotate = 0 }: { carId: string; rotate?: number }) {
//   return (
//     <motion.div
//       layoutId={`car-${carId}`}
//       className="absolute inset-0 select-none"
//       style={{ pointerEvents: "none" }}
//       animate={{ rotate }}
//     >
//       <img src={CarImg} alt="Car" />
//     </motion.div>
//   );
// }

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
  const { showGrid, gridSize } = useGuiStore();
  const { setDims, levelData } = useLevelStore();
  const resizerGrabbed = useRef(-1)
  const { width, height } = levelData;

  // const [currentCarPos, setCurrentCarPos] = useState(carPos[0]);
  // useEffect(() => {
  //   // Simulate car movement
  //   const interval = setInterval(() => {
  //     setCurrentCarPos((prev) => {
  //       const nextIndex = (carPos.indexOf(prev) + 1) % carPos.length;
  //       return carPos[nextIndex];
  //     });
  //   }, 500);
  //   return () => clearInterval(interval);
  // }, []);
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      resizerGrabbed.current = -1
    }
    const handleMouseMove = (e: MouseEvent) => {
      
    }
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove)
    };
  }, [])

  const ResizeGrabber: React.FC<{
    idx: number;
    className: string;
    d: string;
  }> = ({ idx, className, d }) => {    
    const changeDims = () => {
      if (resizerGrabbed.current === idx) {
        console.log(d)
      }
    }

    return (
      <path
        className={className}
        onMouseDown={() => resizerGrabbed.current = idx}
        onMouseMove={() => changeDims()}
        // Don't need to specify onMouseUp because it's handled globally
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
        d={d}
      />
    )
  }

  return (
    <div className="absolute inset-0 flex flex-row items-center justify-center bg-gray-900">
      {/* Grid Resizing Grabbers */}
      <svg
        className="absolute text-gray-200 w-126 h-126"
        viewBox="0 0 100 100"
      >
        {/* Top-Left */}
        <ResizeGrabber
          idx={0}
          className="cursor-nw-resize"
          d="m1.2 6.2l0 -5l5 0"
        />
        {/* Top */}
        <ResizeGrabber
          idx={1}
          className="cursor-n-resize"
          d="m46 1.2l8 0"
        />
        {/* Top-Right */}
        <ResizeGrabber
          idx={2}
          className="cursor-ne-resize"
          d="m93.8 1.2l5 0l0 5"
        />
        {/* Left */}
        <ResizeGrabber
          idx={3}
          className="cursor-w-resize"
          d="m1.2 46l0 8"
        />
        {/* Right */}
        <ResizeGrabber
          idx={4}
          className="cursor-e-resize"
          d="m98.8 46l0 8"
        />
        {/* Bottom-Left */}
        <ResizeGrabber
          idx={5}
          className="cursor-sw-resize"
          d="m1.2 93.8l0 5l5 0"
        />
        {/* Bottom */}
        <ResizeGrabber
          idx={6}
          className="cursor-s-resize"
          d="m46 98.8l8 0"
        />
        {/* Bottom-Right */}
        <ResizeGrabber
          idx={7}
          className="cursor-se-resize"
          d="m93.8 98.8l5 0l0 -5"
        />
      </svg>
      {/* Grid pattern overlay */}
      <div className="relative">
        <div
          className={`grid z-10 ${
            showGrid ? "border-t border-l border-gray-400" : ""
          }`}
          style={{
            gridTemplateColumns: `repeat(${width}, ${gridSize}px)`,
            gridTemplateRows: `repeat(${height}, ${gridSize}px)`,
          }}
        >
          {levelData.grid.map((row, idx) =>
            row.map((tile, jdx) => (
              <div
                key={`${idx}-${jdx}`}
                className="relative border-b border-r border-gray-400"
              >
                <GridTile
                  pos={{ y: idx, x: jdx }}
                  car={tile.car}
                  track={tile.track}
                  mod={tile.mod}
                  mod_num={tile.mod_num}
                />
                <FenceConnector pos={{ y: idx, x: jdx }} />
                {/* {idx === currentCarPos.y && jdx === currentCarPos.x ? (
                  <Car rotate={currentCarPos.rotate} carId="1" />
                ) : null} */}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
