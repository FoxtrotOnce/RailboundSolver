import React, { useEffect, useState } from "react";
import { GridTile } from "./GridTile";
import { useGuiStore, useLevelStore } from "../store";
import CarImg from "../assets/Car 1.svg";
import { motion } from "motion/react";

// THIS IS EXAMPLE OR HOW WE MOVE THE CAR
const carPos = [
  { x: 0, y: 0, rotate: 0 },
  { x: 1, y: 0, rotate: 90 },
  { x: 1, y: 1, rotate: 180 },
  { x: 0, y: 1, rotate: 270 },
];
function Car({ carId, rotate = 0 }: { carId: string; rotate?: number }) {
  return (
    <motion.div
      layoutId={`car-${carId}`}
      className="absolute select-none inset-0"
      style={{ pointerEvents: "none" }}
      animate={{ rotate }}
    >
      <img src={CarImg} alt="Car" />
    </motion.div>
  );
}

export const GameCanvas: React.FC<{ children?: React.ReactNode }> = ({children}) => {
  const { showGrid, gridSize } = useGuiStore();
  const { levelData } = useLevelStore();
  const { width, height } = levelData;

  const [currentCarPos, setCurrentCarPos] = useState(carPos[0]);
  useEffect(() => {
    // Simulate car movement
    const interval = setInterval(() => {
      setCurrentCarPos((prev) => {
        const nextIndex = (carPos.indexOf(prev) + 1) % carPos.length;
        return carPos[nextIndex];
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute flex-row inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex justify-center items-center">
      {/* Grid pattern overlay */}
      <motion.div
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
              className="border-r relative border-b border-gray-400"
            >
              <GridTile
                pos={{y: idx, x: jdx}}
                car={tile.car}
                track={tile.track}
                mod={tile.mod}
                mod_num={tile.mod_num}
                mod_rot={tile.mod_rot}
              />
              {idx === currentCarPos.y && jdx === currentCarPos.x ? (
                <Car rotate={currentCarPos.rotate} carId="1" />
              ) : null}
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
};
