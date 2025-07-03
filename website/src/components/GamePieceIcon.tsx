import { cn } from "@/lib/utils";
import React, { useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * GamePiece Interface
 *
 * Represents a game piece or tool for the UI selection panels.
 *
 * Properties:
 * - id: Unique identifier for the piece
 * - name: Display name of the piece
 * - icon: Optional icon, can be a string (image path) or a React node (SVG/component)
 * - description: Optional tooltip or description for accessibility or tooltips
 */
export interface GamePiece {
  id: string;
  name: string;
  icon?: string | React.ReactNode;
  description?: string;
  hotkey?: string;
}

/**
 * GamePieceIcon Component
 *
 * Renders a visual representation of a game piece based on its icon property.
 *
 * Rendering logic:
 * - If `icon` is a string, renders an <img> with the given path (for image assets).
 * - If `icon` is a React node, renders it directly (for SVGs or custom components).
 * - If no icon is provided, renders a fallback placeholder with a question mark.
 *
 * Props:
 * - piece: GamePiece object to render.
 * - onClick: Optional click handler for the button.
 * - selected: Optional boolean to indicate if the piece is selected (affects styling).
 * - buttonClassName: Optional additional class names for the button container.
 * - title: Optional tooltip text (defaults to piece.description or piece.name).
 *
 * Used in both BottomSelectionPanel and RightToolPanel for consistent icon rendering.
 */
export const GamePieceIcon: React.FC<{
  piece: GamePiece;
  icon: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  buttonClassName?: string;
  title?: string;
}> = ({
  piece,
  icon,
  onClick,
  selected = false,
  buttonClassName = "",
  title,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === piece.hotkey) {
        if (onClick) onClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClick, piece.hotkey]);

  const tooltipText = title || piece.description || piece.name;

  return (
    <div className="relative">
      {/* Hotkey badge in corner */}
      {piece.hotkey && (
        <Badge
          variant="secondary"
          className="absolute -bottom-1 -right-1 z-10 h-4 w-4 p-0 text-[10px] font-bold"
        >
          {piece.hotkey}
        </Badge>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={selected ? "default" : "outline"}
            className={cn(
              "aspect-square transition-all w-auto h-auto p-1",
              selected && "ring-2 ring-primary ring-offset-2",
              buttonClassName
            )}
            onClick={onClick}
          >
            <div className="size-9">{icon}</div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
