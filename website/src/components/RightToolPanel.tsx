import React from "react";

export type ToolType = "tool1" | "tool2" | "tool3" | "tool4";

interface RightToolPanelProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
}

interface ToolButton {
  id: ToolType;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  tooltip?: string;
}

/**
 * RightToolPanel Component
 *
 * Displays the tool selection panel on the right side of the screen.
 * Contains tool buttons with React component icons.
 *
 * Props:
 * - selectedTool: Currently selected tool type
 * - onToolSelect: Function called when a tool is selected
 *
 * Tool Types:
 * - 'tool1' to 'tool4': Tools for different functions with custom icons
 *
 * How to add custom icons:
 * 1. Create a React component that accepts className prop
 * 2. Add it to the toolButtons array with appropriate id
 * 3. The icon component will be rendered inside the button
 *
 * Example:
 * const CustomIcon = ({ className }) => (
 *   <svg className={className} viewBox="0 0 24 24">
 *     <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z"/>
 *   </svg>
 * );
 *
 * Usage:
 * <RightToolPanel
 *   selectedTool="tool1"
 *   onToolSelect={(tool) => console.log('Selected tool:', tool)}
 * />
 */
export const RightToolPanel: React.FC<RightToolPanelProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  // Example icon components - replace these with your actual tool icons
  const PencilIcon = ({ className }: { className?: string }) => (
    <svg
      className={`w-6 h-6 ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );

  const EraserIcon = ({ className }: { className?: string }) => (
    <svg
      className={`w-6 h-6 ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zm-4.95 4.95l-5.66 5.65 2.83 2.83 5.66-5.66-2.83-2.82z" />
    </svg>
  );

  const SelectIcon = ({ className }: { className?: string }) => (
    <svg
      className={`w-6 h-6 ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M2 2v6h2V4h4V2H2zm0 16v-6h2v4h4v2H2zm16 0h-4v2h6v-6h-2v4zm0-16V2h-6v2h4v4h2V2z" />
    </svg>
  );

  const toolButtons: ToolButton[] = [
    {
      id: "tool1",
      icon: SelectIcon,
      shortcut: "1",
      tooltip: "Selection Tool (1)",
    },
    {
      id: "tool2",
      icon: PencilIcon,
      shortcut: "2",
      tooltip: "Draw Tool (2)",
    },
    {
      id: "tool3",
      icon: EraserIcon,
      shortcut: "3",
      tooltip: "Eraser Tool (3)",
    },
  ];

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40">
      <div className="bg-gray-800 rounded-xl border-2 border-gray-600 p-2 flex flex-col gap-1">
        {/* Tool Buttons */}
        {toolButtons.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.id}
              className={`w-12 h-12 rounded border-2 transition-all flex items-center justify-center ${
                selectedTool === tool.id
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => onToolSelect(tool.id)}
              title={tool.tooltip || `Tool ${tool.id}`}
            >
              <IconComponent className="" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
