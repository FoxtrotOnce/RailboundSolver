import React, { useRef, useCallback, useEffect } from "react";
import { useLevelStore } from "../store/levelStore";
import { useGuiStore } from "../store/guiStore";

interface GameCanvasProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
  gridSize?: number;
  children?: React.ReactNode;
}

/**
 * GameCanvas Component
 *
 * Enhanced game canvas that integrates with Zustand stores and provides:
 * - Level rendering from levelStore
 * - Zoom and pan functionality from guiStore
 * - Interactive piece placement and editing
 * - Grid overlay with dynamic scaling
 *
 * Props:
 * - width: Canvas width in pixels (optional, defaults to full screen)
 * - height: Canvas height in pixels (optional, defaults to full screen)
 * - showGrid: Whether to show the grid overlay (overridden by store)
 * - gridSize: Size of grid squares in pixels (overridden by store)
 * - children: Any child components to render over the canvas
 *
 * Features:
 * - Blue gradient background matching the game theme
 * - Zoom with mouse wheel (0.1x to 5.0x)
 * - Pan with middle mouse button or drag
 * - Grid overlay that scales with zoom
 * - Level piece rendering from levelStore
 * - Click handling for piece placement/editing
 *
 * Usage:
 * <GameCanvas>
 *   <div>Overlay content</div>
 * </GameCanvas>
 */

export const GameCanvas: React.FC<GameCanvasProps> = ({
  width,
  height,
  children,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // =================
  // STORE INTEGRATION
  // =================

  // GUI Store - Canvas display settings and interaction state
  const {
    zoomLevel,
    panOffset,
    showGrid,
    gridSize,
    selectedTool,
    selectedPiece,
    canvasInteraction,
    setZoomLevel,
    setPanOffset,
    setCanvasInteraction,
  } = useGuiStore();

  // Level Store - Level data and actions
  const {
    levelData,
    placePiece,
    removePiece,
    rotatePiece,
    getPieceAt,
    createNewLevel,
    resizeLevel,
    undo,
    redo,
    undoStack,
    redoStack,
  } = useLevelStore();

  // =================
  // CANVAS DIMENSIONS
  // =================

  const canvasStyle = {
    width: width ? `${width}px` : "100%",
    height: height ? `${height}px` : "100%",
  };

  // =================
  // GRID STYLING
  // =================

  const scaledGridSize = gridSize * zoomLevel;
  const gridStyle = showGrid
    ? {
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
        `,
        backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }
    : {};

  // =================
  // EVENT HANDLERS
  // =================

  /**
   * Handle mouse wheel for zooming
   */
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Calculate zoom change
      const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(5.0, zoomLevel + zoomDelta));

      if (newZoom === zoomLevel) return;

      // Calculate new pan offset to zoom towards mouse position
      const zoomRatio = newZoom / zoomLevel;
      const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
      const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;

      setZoomLevel(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    },
    [zoomLevel, panOffset, setZoomLevel, setPanOffset]
  );

  /**
   * Handle mouse down for panning and resize
   */
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if clicking on a resize handle
      if (target.classList.contains("resize-handle")) {
        event.preventDefault();
        setCanvasInteraction({
          isResizing: true,
          resizeHandle: target.dataset.handle || "",
          lastMousePos: { x: event.clientX, y: event.clientY },
        });
        document.body.style.cursor = "grabbing";
        return;
      }

      // Middle mouse button or right mouse button for panning
      if (event.button === 1 || event.button === 2) {
        event.preventDefault();
        setCanvasInteraction({
          isDragging: true,
          lastMousePos: { x: event.clientX, y: event.clientY },
        });
        document.body.style.cursor = "grabbing";
      }
    },
    [setCanvasInteraction]
  );

  /**
   * Handle mouse move for panning and resize
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (canvasInteraction.isResizing && levelData?.grid) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Get current mouse position relative to canvas
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Convert to world coordinates (accounting for pan and zoom)
        const worldX = (mouseX - panOffset.x) / zoomLevel;
        const worldY = (mouseY - panOffset.y) / zoomLevel;

        // Convert to grid coordinates
        const gridX = Math.max(0, Math.round(worldX / gridSize));
        const gridY = Math.max(0, Math.round(worldY / gridSize));

        const currentWidth = levelData.grid[0].length;
        const currentHeight = levelData.grid.length;

        let newWidth = currentWidth;
        let newHeight = currentHeight;

        switch (canvasInteraction.resizeHandle) {
          case "se": // Southeast corner - simple case, just set to mouse position
            newWidth = Math.max(5, gridX + 1); // +1 because we want the grid to include the cell under the mouse
            newHeight = Math.max(5, gridY + 1);
            break;
          // Other corners disabled for now to avoid coordinate confusion
          default:
            return;
        }

        if (newWidth !== currentWidth || newHeight !== currentHeight) {
          resizeLevel(newWidth, newHeight);
        }
        return;
      }

      if (!canvasInteraction.isDragging) return;

      const deltaX = event.clientX - canvasInteraction.lastMousePos.x;
      const deltaY = event.clientY - canvasInteraction.lastMousePos.y;

      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY,
      });

      setCanvasInteraction({
        lastMousePos: { x: event.clientX, y: event.clientY },
      });
    },
    [
      panOffset,
      setPanOffset,
      levelData,
      gridSize,
      zoomLevel,
      resizeLevel,
      canvasInteraction,
      setCanvasInteraction,
    ]
  );

  /**
   * Handle mouse up to stop panning and resize
   */
  const handleMouseUp = useCallback(() => {
    setCanvasInteraction({
      isDragging: false,
      isResizing: false,
      resizeHandle: "",
    });
    document.body.style.cursor = "default";
  }, [setCanvasInteraction]);

  /**
   * Handle canvas click for piece placement
   */
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      // Only handle left mouse button
      if (event.button !== 0) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate grid coordinates
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Transform mouse coordinates to grid coordinates
      const worldX = (mouseX - panOffset.x) / zoomLevel;
      const worldY = (mouseY - panOffset.y) / zoomLevel;

      const gridX = Math.floor(worldX / gridSize);
      const gridY = Math.floor(worldY / gridSize);

      // Handle different tools
      switch (selectedTool) {
        case "tool1": // Place tool
          if (selectedPiece) {
            placePiece(gridX, gridY, selectedPiece);
          }
          break;
        case "tool2": // Erase tool
          removePiece(gridX, gridY);
          break;
        case "tool3": {
          // Select/Rotate tool
          const existingPiece = getPieceAt(gridX, gridY);
          if (existingPiece && existingPiece.type !== "empty") {
            rotatePiece(gridX, gridY);
          }
          break;
        }
      }
    },
    [
      selectedTool,
      selectedPiece,
      panOffset,
      zoomLevel,
      gridSize,
      placePiece,
      removePiece,
      rotatePiece,
      getPieceAt,
    ]
  );

  /**
   * Handle right-click context menu prevention
   */
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  // =================
  // EFFECTS
  // =================

  // Set up global mouse event listeners for panning
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Create initial level if none exists
  useEffect(() => {
    if (!levelData) {
      createNewLevel(20, 15); // Create a 20x15 grid
    }
  }, [levelData, createNewLevel]);

  // =================
  // PIECE RENDERING
  // =================

  const renderLevelPieces = () => {
    if (!levelData?.grid) return null;

    return levelData.grid.map((row, y) =>
      row.map((cell, x) => {
        if (cell.type === "empty") return null;

        const worldX = x * gridSize + panOffset.x;
        const worldY = y * gridSize + panOffset.y;

        return (
          <div
            key={`${x}-${y}`}
            className="absolute border border-white/30 bg-blue-600/50 flex items-center justify-center text-white text-xs font-bold"
            style={{
              left: worldX,
              top: worldY,
              width: gridSize * zoomLevel,
              height: gridSize * zoomLevel,
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top left",
            }}
          >
            {cell.type}
            {cell.rotation && (
              <span className="absolute top-0 right-0 text-xs">
                {cell.rotation}°
              </span>
            )}
          </div>
        );
      })
    );
  };

  // =================
  // LEVEL BOUNDARY RENDERING
  // =================

  const renderLevelBoundary = () => {
    if (!levelData?.grid) return null;

    const levelWidth = levelData.grid[0].length;
    const levelHeight = levelData.grid.length;

    const boundaryX = panOffset.x;
    const boundaryY = panOffset.y;
    const boundaryWidth = levelWidth * gridSize * zoomLevel;
    const boundaryHeight = levelHeight * gridSize * zoomLevel;

    return (
      <>
        {/* Level boundary rectangle */}
        <div
          className="absolute border-2 border-white/60 bg-blue-500/10 pointer-events-none"
          style={{
            left: boundaryX,
            top: boundaryY,
            width: boundaryWidth,
            height: boundaryHeight,
          }}
        />

        {/* Dark overlay outside level bounds */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top dark area */}
          <div
            className="absolute bg-black/50"
            style={{
              left: 0,
              top: 0,
              width: "100%",
              height: Math.max(0, boundaryY),
            }}
          />

          {/* Bottom dark area */}
          <div
            className="absolute bg-black/50"
            style={{
              left: 0,
              top: boundaryY + boundaryHeight,
              width: "100%",
              height: `calc(100% - ${boundaryY + boundaryHeight}px)`,
            }}
          />

          {/* Left dark area */}
          <div
            className="absolute bg-black/50"
            style={{
              left: 0,
              top: boundaryY,
              width: Math.max(0, boundaryX),
              height: boundaryHeight,
            }}
          />

          {/* Right dark area */}
          <div
            className="absolute bg-black/50"
            style={{
              left: boundaryX + boundaryWidth,
              top: boundaryY,
              width: `calc(100% - ${boundaryX + boundaryWidth}px)`,
              height: boundaryHeight,
            }}
          />
        </div>

        {/* Resize handles at corners - only southeast for now */}
        <div
          className="resize-handle absolute w-4 h-4 bg-white border-2 border-blue-500 cursor-se-resize hover:bg-blue-100"
          data-handle="se"
          style={{
            left: boundaryX + boundaryWidth - 8,
            top: boundaryY + boundaryHeight - 8,
          }}
        />

        {/* Visual indicators for other corners (non-interactive for now) */}
        <div
          className="absolute w-2 h-2 bg-white/50 border border-blue-400"
          style={{
            left: boundaryX - 4,
            top: boundaryY - 4,
          }}
        />
        <div
          className="absolute w-2 h-2 bg-white/50 border border-blue-400"
          style={{
            left: boundaryX + boundaryWidth - 4,
            top: boundaryY - 4,
          }}
        />
        <div
          className="absolute w-2 h-2 bg-white/50 border border-blue-400"
          style={{
            left: boundaryX - 4,
            top: boundaryY + boundaryHeight - 4,
          }}
        />
      </>
    );
  };

  // =================
  // RENDER
  // =================

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Grid pattern overlay */}
      {showGrid && (
        <div className="absolute inset-0 opacity-30" style={gridStyle} />
      )}

      {/* Interactive canvas area */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={canvasStyle}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
      >
        {/* Level pieces */}
        {renderLevelPieces()}

        {/* Level boundary */}
        {renderLevelBoundary()}

        {/* Overlay children */}
        {children}
      </div>

      {/* Canvas info overlay */}
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs p-2 rounded pointer-events-none">
        Zoom: {(zoomLevel * 100).toFixed(0)}% | Pan: {panOffset.x.toFixed(0)},{" "}
        {panOffset.y.toFixed(0)}
        <br />
        Level: {levelData?.grid?.[0]?.length || 0}×
        {levelData?.grid?.length || 0} | Tool: {selectedTool} | Piece:{" "}
        {selectedPiece || "None"}
      </div>

      {/* Undo/Redo buttons with MouseTracker-like styling */}
      <div className="fixed top-2 right-2 bg-white/80 p-1 rounded shadow flex gap-1">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors"
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
      </div>
    </div>
  );
};
