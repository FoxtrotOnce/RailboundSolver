import React from "react";
import {Track, Mod} from "../../../algo/classes";

import Empty from "../assets/0 Empty Tile.svg";
import StraightTrack from "../assets/1 Horizontal Track.svg";
import EndingTrack from "../assets/Ending Track.svg"
import Fence from "../assets/4 Fence.svg";
import CurvedTrack from "../assets/5 Bottom-Right Turn.svg";
import ForkTrack from "../assets/9 Bottom-Right & Left 3-Way.svg"
import ForkTrack2 from "../assets/11 Bottom-Left & Right 3-Way.svg"

const Icons = new Map<Track, React.ReactNode>([
    [Track.EMPTY, <img src={Empty}/>],
    [Track.HORIZONTAL_TRACK, <img src={StraightTrack}/>],
    [Track.VERTICAL_TRACK, <img src={StraightTrack} className="rotate-270"/>],
    [Track.CAR_ENDING_TRACK_LEFT, <img src={EndingTrack} className="rotate-180"/>],
    [Track.CAR_ENDING_TRACK_RIGHT, <img src={EndingTrack}/>],
    [Track.CAR_ENDING_TRACK_DOWN, <img src={EndingTrack} className="rotate-90"/>],
    [Track.CAR_ENDING_TRACK_UP, <img src={EndingTrack} className="rotate-270"/>],
    [Track.ROADBLOCK, <img src={Fence}/>],
    [Track.BOTTOM_RIGHT_TURN, <img src={CurvedTrack}/>],
    [Track.BOTTOM_LEFT_TURN, <img src={CurvedTrack} className="rotate-90"/>],
    [Track.TOP_RIGHT_TURN, <img src={CurvedTrack} className="rotate-270"/>],
    [Track.TOP_LEFT_TURN, <img src={CurvedTrack} className="rotate-180"/>],
    [Track.BOTTOM_RIGHT_LEFT_3WAY, <img src={ForkTrack}/>],
    [Track.BOTTOM_RIGHT_TOP_3WAY, <img src={ForkTrack2} className="rotate-270"/>],
])

export const GridTile: React.FC<{
    track?: Track;
    mod?: Mod;
    mod_num?: number;
    onClick?: () => void;
}> = ({track = Track.EMPTY, mod = Mod.EMPTY, mod_num = 0, onClick}) => {
    return (
        <div
            className="hover:bg-gray-400"
            onClick={onClick}
        >
            {Icons.get(track)}
        </div>
    )
}
