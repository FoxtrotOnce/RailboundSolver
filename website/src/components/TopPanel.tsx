import { useLevelStore } from "../store";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

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
    <div className="absolute left-1/2 transform -translate-x-1/2 top-4 z-4 flex items-center gap-4">
      {/* Grid dimension controls */}
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          min={1}
          max={12}
          className="w-16 text-center"
          value={width}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (0 < val && val <= 12) {
              setDims({ y: height, x: val });
            }
          }}
        />
        <div className="text-white text-lg">x</div>
        <Input
          type="number"
          min={1}
          max={12}
          className="w-16 text-center"
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
      <div className="flex gap-2 items-center whitespace-nowrap">
        <div className="text-white text-sm">Max Tracks:</div>
        <Input
          type="number"
          min={0}
          max={144}
          className="w-16 text-center"
          value={levelData?.max_tracks}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (0 <= val && val <= 144) {
              setTracks(val);
            }
          }}
        />
      </div>

      <div className="flex gap-2 items-center whitespace-nowrap">
        <div className="text-white text-sm">Max Semaphores:</div>
        <Input
          type="number"
          min={0}
          max={5}
          className="w-16 text-center"
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
      <Button variant="outline" onClick={() => clearLevel()}>
        Clear Grid
      </Button>

      {/* Undo/Redo buttons */}
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (Ctrl+Z)"
        >
          ←
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Y)"
        >
          →
        </Button>
      </div>
    </div>
  );
}
