import { useLevelStore } from "../store";

/**
 * TOP PANEL COMPONENT
 *
 * Contains the top control panel with:
 * - Grid dimension controls (width x height)
 * - Max tracks input
 * - Max semaphores input
 * - Clear grid button
 * - Undo/Redo buttons
 */
export function TopPanel() {
  // GUI Store - UI state

  // Level Store - level data and actions
  const {
    levelData,
    undoStack,
    redoStack,
    undo,
    redo,
    clearLevel,
    setTracks,
    setSemaphores,
    setDims,
  } = useLevelStore();

  const width = levelData?.width || 12;
  const height = levelData?.height || 12;

  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 top-4 z-40 flex items-center gap-4">
      {/* Grid dimension controls */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min={1}
          max={12}
          className="text-white bg-gray-600 p-1 rounded border-1 border-gray-500"
          value={width}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (0 < val && val <= 12) {
              setDims({ y: height, x: val });
            }
          }}
        />
        <div className="text-white text-lg">x</div>
        <input
          type="number"
          min={1}
          max={12}
          className="text-white bg-gray-600 p-1 rounded border-1 border-gray-500"
          value={height}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (0 < val && val <= 12) {
              setDims({ y: val, x: width });
            }
          }}
        />
      </div>

      {/* Level constraints */}
      <div className="flex gap-2 items-center">
        <div className="text-white text-sm">Max Tracks:</div>
        <input
          type="number"
          min={0}
          max={144}
          className="text-white bg-gray-600 p-1 rounded border-1 border-gray-500"
          value={levelData?.max_tracks}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (0 <= val && val <= 144) {
              setTracks(val);
            }
          }}
        />
      </div>

      <div className="flex gap-2 items-center">
        <div className="text-white text-sm">Max Semaphores:</div>
        <input
          type="number"
          min={0}
          max={5}
          className="text-white bg-gray-600 p-1 rounded border-1 border-gray-500"
          value={levelData?.max_semaphores}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (0 <= val && val <= 5) {
              setSemaphores(val);
            }
          }}
          onKeyDown={(e) => e.preventDefault()}
        />
      </div>

      {/* Clear grid button */}
      <button
        type="button"
        className="cursor-pointer rounded text-white border-2 border-gray-600 px-3 py-1"
        onClick={() => clearLevel()}
      >
        Clear Grid
      </button>

      {/* Undo/Redo buttons */}
      <div className="flex gap-2 items-center">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className={`px-3 py-1 rounded border-2 transition-colors ${
            undoStack.length > 0
              ? "bg-gray-600 hover:bg-gray-500 text-white border-gray-500"
              : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
          }`}
          title="Undo (Ctrl+Z)"
        >
          ←
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className={`px-3 py-1 rounded border-2 transition-colors ${
            redoStack.length > 0
              ? "bg-gray-600 hover:bg-gray-500 text-white border-gray-500"
              : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
          }`}
          title="Redo (Ctrl+Y)"
        >
          →
        </button>
      </div>
    </div>
  );
}
