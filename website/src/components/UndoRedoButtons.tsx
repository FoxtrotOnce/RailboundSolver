import React from "react";

interface UndoRedoButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * UndoRedoButtons Component
 *
 * Displays undo and redo buttons in the top-right corner of the screen.
 *
 * Props:
 * - onUndo: Function to call when undo button is clicked
 * - onRedo: Function to call when redo button is clicked
 * - canUndo: Boolean to enable/disable undo button
 * - canRedo: Boolean to enable/disable redo button
 *
 * Usage:
 * <UndoRedoButtons
 *   onUndo={() => console.log('Undo action')}
 *   onRedo={() => console.log('Redo action')}
 *   canUndo={true}
 *   canRedo={false}
 * />
 */
export const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="absolute top-4 right-4 flex gap-2 z-50">
      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-3 rounded-lg border-2 transition-colors ${
          canUndo
            ? "bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
            : "bg-gray-900 text-gray-500 border-gray-700 cursor-not-allowed"
        }`}
        title="Undo (Ctrl+Z)"
      >
        <div className="w-6 h-6 flex items-center justify-center font-bold">
          ←
        </div>
      </button>

      {/* Redo Button */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-3 rounded-lg border-2 transition-colors ${
          canRedo
            ? "bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
            : "bg-gray-900 text-gray-500 border-gray-700 cursor-not-allowed"
        }`}
        title="Redo (Ctrl+Y)"
      >
        <div className="w-6 h-6 flex items-center justify-center font-bold">
          →
        </div>
      </button>
    </div>
  );
};
