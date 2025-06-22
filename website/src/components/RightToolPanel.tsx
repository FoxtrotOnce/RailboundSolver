import React from "react";
import StraightTrack from "./sprite/StraightTrack";
import CurvesTrack from "./sprite/CurvesTrack";
import ForkTrack from "./sprite/ForkTrack";
import ForkTrack2 from "./sprite/ForkTrack2";

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
  const toolButtons: ToolButton[] = [
    {
      id: "tool1",
      icon: (props) => <StraightTrack rotate={90} {...props} />,
      shortcut: "1",
      tooltip: "Straight Track (1)",
    },
    {
      id: "tool2",
      icon: (props) => <CurvesTrack rotate={0} {...props} />, // Curve
      shortcut: "2",
      tooltip: "Curves Track (2)",
    },
    {
      id: "tool3",
      icon: (props) => <ForkTrack rotate={0} {...props} />, // Fork
      shortcut: "3",
      tooltip: "Fork Track (3)",
    },
    {
      id: "tool4",
      icon: (props) => <ForkTrack2 rotate={0} {...props} />, // Fork2
      shortcut: "4",
      tooltip: "Fork Track 2 (4)",
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
