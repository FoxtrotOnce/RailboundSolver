import React, { useState } from "react";
import { Track, Mod } from "../../../algo/classes";

import Empty from "../assets/0 Empty Tile.svg";
import StraightTrack from "../assets/1 Horizontal Track.svg";
import EndingTrack from "../assets/Ending Track.svg";
import Fence from "../assets/4 Fence.svg";
import CurvedTrack from "../assets/5 Bottom-Right Turn.svg";
import ForkTrack from "../assets/9 Bottom-Right & Left 3-Way.svg";
import ForkTrack2 from "../assets/11 Bottom-Left & Right 3-Way.svg";
import { useGuiStore } from "../store";

const Icons = new Map<Track, React.ReactNode>([
  [Track.EMPTY, <img src={Empty} />],
  [Track.HORIZONTAL_TRACK, <img src={StraightTrack} />],
  [Track.VERTICAL_TRACK, <img src={StraightTrack} className="rotate-270" />],
  [
    Track.CAR_ENDING_TRACK_LEFT,
    <img src={EndingTrack} className="rotate-180" />,
  ],
  [Track.CAR_ENDING_TRACK_RIGHT, <img src={EndingTrack} />],
  [
    Track.CAR_ENDING_TRACK_DOWN,
    <img src={EndingTrack} className="rotate-90" />,
  ],
  [Track.CAR_ENDING_TRACK_UP, <img src={EndingTrack} className="rotate-270" />],
  [Track.ROADBLOCK, <img src={Fence} />],
  [Track.BOTTOM_RIGHT_TURN, <img src={CurvedTrack} />],
  [Track.BOTTOM_LEFT_TURN, <img src={CurvedTrack} className="rotate-90" />],
  [Track.TOP_RIGHT_TURN, <img src={CurvedTrack} className="rotate-270" />],
  [Track.TOP_LEFT_TURN, <img src={CurvedTrack} className="rotate-180" />],
  [Track.BOTTOM_RIGHT_LEFT_3WAY, <img src={ForkTrack} />],
  [
    Track.BOTTOM_RIGHT_TOP_3WAY,
    <img src={ForkTrack2} className="rotate-270" />,
  ],
]);

function getTrackFromInfo(toolId: string, rotation: number): Track {
  switch (toolId) {
    case "STRAIGHT":
      if (rotation === 0 || rotation === 2) {
        return Track.HORIZONTAL_TRACK;
      } else {
        return Track.VERTICAL_TRACK;
      }
    // TODO: need help here, or maybe we should have a better way to handle this
    // -> selectedTool should be the correct track and we will not need this function?
    case "CURVED":
      return Track.BOTTOM_RIGHT_TURN;
    case "FORK":
      return Track.BOTTOM_RIGHT_LEFT_3WAY;
    case "FORK_2":
      return Track.BOTTOM_RIGHT_TOP_3WAY;
    default:
      return Track.EMPTY;
  }
}

export const GridTile: React.FC<{
  track?: Track;
  mod?: Mod;
  mod_num?: number;
}> = ({ track = Track.EMPTY, mod = Mod.EMPTY, mod_num = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { selectedTool, rotation } = useGuiStore();
  function onClick() {
    // TODO: Handle click event for placing track pieces
  }
  return (
    <div
      className={`size-full ${isHovered ? "bg-gray-700/50" : ""}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {Icons.get(
        track !== Track.EMPTY
          ? track
          : isHovered && selectedTool?.id
          ? getTrackFromInfo(selectedTool.id, rotation)
          : Track.EMPTY
      )}
    </div>
  );
};
