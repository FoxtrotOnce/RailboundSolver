import React from "react";
import { GridTile } from "./GridTile";

interface GameCanvasProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
  gridDims?: { y: number, x: number}
  gridSize?: number;
  children?: React.ReactNode;
}

/**
 * GameCanvas Component
 *
 * Provides the main game area with a blue gradient background and optional grid overlay.
 * This is where the actual game/level editing takes place.
 *
 * Props:
 * - width: Canvas width in pixels (optional, defaults to full screen)
 * - height: Canvas height in pixels (optional, defaults to full screen)
 * - showGrid: Whether to show the grid overlay (default: true)
 * - gridSize: Size of grid squares in pixels (default: 40)
 * - children: Any child components to render over the canvas
 *
 * Features:
 * - Blue gradient background matching the game theme
 * - Optional semi-transparent grid overlay for precise placement
 * - Responsive design that fills available space
 * - Supports overlay content through children prop
 *
 * Usage:
 * <GameCanvas showGrid={true} gridSize={40}>
 *   <div>Game objects go here</div>
 * </GameCanvas>
 */

export const GameCanvas: React.FC<GameCanvasProps> = ({
  width,
  height,
  showGrid = true,
  gridSize = 40,
  gridDims,
  children,
}) => {
  const canvasStyle = {
    width: width ? `${width}px` : "100%",
    height: height ? `${height}px` : "100%",
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex justify-center items-center">
      {/* Grid pattern overlay */}
      <div className="grid border-t border-l border-gray-400 opacity-50"
          style={{gridTemplateColumns: `repeat(${gridDims?.x}, ${gridSize}px)`, gridTemplateRows: `repeat(${gridDims?.y}, ${gridSize}px)`}}
      >
        {[...Array(gridDims!.x * gridDims!.y)].map((_, i) => (
          <div className="border-r border-b border-gray-400">
            <GridTile/>
          </div>
        ))}
      </div>

      {/* Canvas content area */}
      <div className="absolute inset-0" style={canvasStyle}>
        {children}
      </div>
    </div>
  );
};
