import React, { useState } from "react";
import { Track, Mod, Car, Direction, CarType } from "../../../algo/classes";

import StraightTrack from "../assets/Perm 1.svg";
import EndingTrack from "../assets/Ending Track.svg";
import Fence from "../assets/4 Fence.svg";
import CurvedTrack from "../assets/Perm 5.svg";
import ForkTrack from "../assets/Perm 9.svg";
import ForkTrack2 from "../assets/Perm 11.svg";
import Tunnel from "../assets/Tunnel.svg";
import Switch from "../assets/Switch.svg";
import OpenGate from "../assets/Open Gate.svg";
import ClosedGate from "../assets/Closed Gate.svg";
import SwappingTrack from "../assets/Swapping Track.svg";
import Station from "../assets/Station.svg";
import SwitchRail from "../assets/Switch Rail.svg";
// TODO: add post office
import Car1 from "../assets/Car 1.svg";
import Car2 from "../assets/Car 2.svg";
import Car3 from "../assets/Car 3.svg";
import Car4 from "../assets/Car 4.svg";
import Numeral1 from "../assets/Car I.svg";
import Numeral2 from "../assets/Car II.svg";
import Numeral3 from "../assets/Car III.svg";
import Numeral4 from "../assets/Car IIII.svg";
import Decoy from "../assets/Decoy.svg";
import { useGuiStore, useLevelStore } from "../store";

const fork_2_tracks = new Set<Track>([
  Track.BOTTOM_RIGHT_TOP_3WAY,
  Track.BOTTOM_LEFT_RIGHT_3WAY,
  Track.TOP_RIGHT_LEFT_3WAY,
  Track.TOP_LEFT_BOTTOM_3WAY
])
// NOTE: Tailwind rotations are clockwise, rotation from useGuiStore() is counterclockwise as it increases.
const TrackIcons = new Map<Track, React.ReactNode>([
  [Track.EMPTY, <img/>],
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
  [Track.BOTTOM_LEFT_RIGHT_3WAY, <img src={ForkTrack2} />],
  [Track.BOTTOM_LEFT_TOP_3WAY, <img src={ForkTrack} className="rotate-90" />],
  [Track.TOP_RIGHT_LEFT_3WAY, <img src={ForkTrack2} className="rotate-180" />],
  [Track.TOP_RIGHT_BOTTOM_3WAY, <img src={ForkTrack} className="rotate-270" />],
  [Track.TOP_LEFT_RIGHT_3WAY, <img src={ForkTrack} className="rotate-180" />],
  [Track.TOP_LEFT_BOTTOM_3WAY, <img src={ForkTrack2} className="rotate-90" />]
]);
const ModIcons = new Map<Mod, React.ReactNode>([
  [Mod.EMPTY, <img/>],
  [Mod.TUNNEL, <img src={Tunnel} />],
  [Mod.SWITCH, <img src={Switch} />],
  [Mod.OPEN_GATE, <img src={OpenGate} />],
  [Mod.CLOSED_GATE, <img src={ClosedGate} />],
  [Mod.SWAPPING_TRACK, <img src={SwappingTrack} />],
  [Mod.STATION, <img src={Station} />],
  [Mod.SWITCH_RAIL, <img src={SwitchRail} />]
]);
const CarIcons = new Map<CarType, React.ReactNode[]>([
  [CarType.NORMAL, [
    <img src={Car1}/>,
    <img src={Car2}/>,
    <img src={Car3}/>,
    <img src={Car4}/>
  ]],
  [CarType.NUMERAL, [
    <img src={Numeral1}/>,
    <img src={Numeral2}/>,
    <img src={Numeral3}/>,
    <img src={Numeral4}/>
  ]],
  [CarType.DECOY, Array(144).fill(<img src={Decoy}/>)]
])

interface return_types {
  track: Track | undefined,
  mod: Mod | undefined,
  cartype: CarType | undefined,
}

function getTypeFromInfo(toolId: string | undefined, pieceId: string | undefined, rotation: number): return_types {
  let to_return: return_types = {
    track: undefined,
    mod: undefined,
    cartype: undefined
  }
  if (toolId === "STRAIGHT") {
    if (rotation === 0 || rotation === 2) {
      to_return.track = Track.HORIZONTAL_TRACK;
    } else {
      to_return.track = Track.VERTICAL_TRACK;
    }
  } if (toolId === "CURVED"){
    if (rotation === 0) {
      to_return.track = Track.BOTTOM_RIGHT_TURN;
    } else if (rotation === 1) {
      to_return.track = Track.TOP_RIGHT_TURN;
    } else if (rotation === 2) {
      to_return.track = Track.TOP_LEFT_TURN;
    } else {
      to_return.track = Track.BOTTOM_LEFT_TURN;
    }
  } if (toolId === "FORK") {
    if (rotation === 0) {
      to_return.track = Track.BOTTOM_RIGHT_LEFT_3WAY;
    } else if (rotation === 1) {
      to_return.track = Track.TOP_RIGHT_BOTTOM_3WAY;
    } else if (rotation === 2) {
      to_return.track = Track.TOP_LEFT_RIGHT_3WAY;
    } else {
      to_return.track = Track.BOTTOM_LEFT_TOP_3WAY;
    }
  } if (toolId === "FORK_2") {
    if (rotation === 0) {
      to_return.track = Track.BOTTOM_LEFT_RIGHT_3WAY;
    } else if (rotation === 1) {
      to_return.track = Track.BOTTOM_RIGHT_TOP_3WAY;
    } else if (rotation === 2) {
      to_return.track = Track.TOP_RIGHT_LEFT_3WAY;
    } else {
      to_return.track = Track.TOP_LEFT_BOTTOM_3WAY;
    }
  } if (pieceId === "END_TRACK") {
    if (rotation === 0) {
      to_return.track = Track.CAR_ENDING_TRACK_RIGHT;
    } else if (rotation === 1) {
      to_return.track = Track.CAR_ENDING_TRACK_UP;
    } else if (rotation === 2) {
      to_return.track = Track.CAR_ENDING_TRACK_LEFT;
    } else {
      to_return.track = Track.CAR_ENDING_TRACK_DOWN;
    }
  } if (pieceId === "ROADBLOCK") {
    to_return.track = Track.ROADBLOCK
  } if (pieceId === "STATION") {
    to_return.mod = Mod.STATION
  } if (pieceId === "SWITCH") {
    to_return.mod = Mod.SWITCH
  } if (pieceId === "OPEN_GATE") {
    to_return.mod = Mod.OPEN_GATE
  } if (pieceId === "CLOSED_GATE") {
    to_return.mod = Mod.CLOSED_GATE
  } if (pieceId === "SWITCH_FORK_TRACK") {
    to_return.mod = Mod.SWAPPING_TRACK
  } if (pieceId === "TUNNEL") {
    to_return.mod = Mod.TUNNEL
  } if (pieceId === "SWITCH_RAIL") {
    to_return.mod = Mod.SWITCH_RAIL
  } if (pieceId === "NORMAL") {
    to_return.cartype = CarType.NORMAL
  } if (pieceId === "DECOY") {
    to_return.cartype = CarType.DECOY
  }
  return to_return
}

export const GridTile: React.FC<{
  pos: { y: number, x: number }
  car?: Car;
  track?: Track;
  mod?: Mod;
  mod_num?: number;
  mod_rot?: number;
}> = ({
  pos,
  car = undefined,
  track = Track.EMPTY,
  mod = Mod.EMPTY,
  mod_num = 0,
  mod_rot = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { selectedTool, selectedPiece, rotation } = useGuiStore();
  const { placePiece, removePiece, removeModorCar, registryFilled, levelData } = useLevelStore()

  const {
    track: selected_track,
    mod: selected_mod,
    cartype: selected_cartype
  } = getTypeFromInfo(selectedTool, selectedPiece, rotation)

  function onClick() {
    placePiece(
      pos.x,
      pos.y,
      selected_cartype,
      selected_track,
      selected_mod,
      undefined,
      360 - rotation * 90
  )}
  function onRightClick(e: React.MouseEvent) {
    e.preventDefault()
    if (track !== Track.EMPTY && (mod !== Mod.EMPTY || car !== undefined)) {
      removeModorCar(pos.x, pos.y)
    } else {
      removePiece(pos.x, pos.y)
    }
  }
  return (
    <div
      className={`select-none size-full ${isHovered ? "bg-gray-700/50" : ""}`}
      onContextMenu={onRightClick}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0">{TrackIcons.get(track)}</div>
      <div className={`absolute inset-0 rotate-${mod_rot} scale-x-[${
        (mod === Mod.SWAPPING_TRACK && fork_2_tracks.has(track)) ? -1 : 1
      }]`}>{ModIcons.get(mod)}</div>
      <div className={`absolute inset-0 rotate-${mod_rot}`}>
        {car && CarIcons.get(car.type)![car.num]}
      </div>

      <div className="absolute inset-0 opacity-60">{selected_track && isHovered && TrackIcons.get(selected_track)}</div>
      <div className={`absolute inset-0 opacity-60 rotate-${360 - rotation * 90} scale-x-[${
        (selectedPiece === "SWITCH_FORK_TRACK" && selectedTool === "FORK_2") ? -1 : 1
      }]`}>
        {selected_mod && isHovered && ModIcons.get(selected_mod)}
      </div>
      <div className={`absolute inset-0 opacity-60 rotate-${360 - rotation * 90}`}>
        {selected_cartype
        && isHovered
        && !registryFilled(selected_cartype)
        && CarIcons.get(selected_cartype)![levelData.next_nums.get(selected_cartype)!]}
      </div>
    </div>
  );
};
