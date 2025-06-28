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
import SwappingTrack2 from "../assets/Swapping Track 2.svg";
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
  Track.TOP_LEFT_BOTTOM_3WAY,
]);
// NOTE: Tailwind rotations are clockwise, rotation from useGuiStore() is counterclockwise as it increases.
const TrackIcons = new Map<Track, React.ReactNode>([
  [Track.EMPTY, <img />],
  [Track.HORIZONTAL_TRACK, <img src={StraightTrack} />],
  [Track.VERTICAL_TRACK, <img src={StraightTrack} />],
  [Track.CAR_ENDING_TRACK_LEFT, <img src={EndingTrack} />],
  [Track.CAR_ENDING_TRACK_RIGHT, <img src={EndingTrack} />],
  [Track.CAR_ENDING_TRACK_DOWN, <img src={EndingTrack} />],
  [Track.CAR_ENDING_TRACK_UP, <img src={EndingTrack} />],
  [Track.ROADBLOCK, <img src={Fence} />],
  [Track.BOTTOM_RIGHT_TURN, <img src={CurvedTrack} />],
  [Track.BOTTOM_LEFT_TURN, <img src={CurvedTrack} />],
  [Track.TOP_RIGHT_TURN, <img src={CurvedTrack} />],
  [Track.TOP_LEFT_TURN, <img src={CurvedTrack} />],
  [Track.BOTTOM_RIGHT_LEFT_3WAY, <img src={ForkTrack} />],
  [Track.BOTTOM_RIGHT_TOP_3WAY, <img src={ForkTrack2} />],
  [Track.BOTTOM_LEFT_RIGHT_3WAY, <img src={ForkTrack2} />],
  [Track.BOTTOM_LEFT_TOP_3WAY, <img src={ForkTrack} />],
  [Track.TOP_RIGHT_LEFT_3WAY, <img src={ForkTrack2} />],
  [Track.TOP_RIGHT_BOTTOM_3WAY, <img src={ForkTrack} />],
  [Track.TOP_LEFT_RIGHT_3WAY, <img src={ForkTrack} />],
  [Track.TOP_LEFT_BOTTOM_3WAY, <img src={ForkTrack2} />],
  // Tunnels have straight tracks displayed underneath them to make it visually accurate.
  [Track.LEFT_FACING_TUNNEL, <img src={Tunnel} />],
  [Track.RIGHT_FACING_TUNNEL, <img src={Tunnel} />],
  [Track.DOWN_FACING_TUNNEL, <img src={Tunnel} />],
  [Track.UP_FACING_TUNNEL, <img src={Tunnel} />],
]);
const TrackRotations = new Map<Track, number>([
  [Track.EMPTY, 0],
  [Track.HORIZONTAL_TRACK, 0],
  [Track.VERTICAL_TRACK, 90],
  [Track.CAR_ENDING_TRACK_LEFT, 180],
  [Track.CAR_ENDING_TRACK_RIGHT, 0],
  [Track.CAR_ENDING_TRACK_DOWN, 90],
  [Track.CAR_ENDING_TRACK_UP, 270],
  [Track.ROADBLOCK, 0],
  [Track.BOTTOM_RIGHT_TURN, 0],
  [Track.BOTTOM_LEFT_TURN, 90],
  [Track.TOP_RIGHT_TURN, 270],
  [Track.TOP_LEFT_TURN, 180],
  [Track.BOTTOM_RIGHT_LEFT_3WAY, 0],
  [Track.BOTTOM_RIGHT_TOP_3WAY, 270],
  [Track.BOTTOM_LEFT_RIGHT_3WAY, 0],
  [Track.BOTTOM_LEFT_TOP_3WAY, 90],
  [Track.TOP_RIGHT_LEFT_3WAY, 180],
  [Track.TOP_RIGHT_BOTTOM_3WAY, 270],
  [Track.TOP_LEFT_RIGHT_3WAY, 180],
  [Track.TOP_LEFT_BOTTOM_3WAY, 90],
  // Tunnels have straight tracks displayed underneath them to make it visually accurate.
  [Track.LEFT_FACING_TUNNEL, 0],
  [Track.RIGHT_FACING_TUNNEL, 180],
  [Track.DOWN_FACING_TUNNEL, 270],
  [Track.UP_FACING_TUNNEL, 90],
]);
const ModIcons = new Map<Mod | string, React.ReactNode>([
  [Mod.EMPTY, <img />],
  [Mod.TUNNEL, <img />], // Tunnel is blank since the track has rotation value, the mod doesn't
  [Mod.SWITCH, <img src={Switch} />],
  [Mod.OPEN_GATE, <img src={OpenGate} />],
  [Mod.CLOSED_GATE, <img src={ClosedGate} />],
  [Mod.SWAPPING_TRACK, <img src={SwappingTrack} />],
  ["SWAPPING_TRACK_2", <img src={SwappingTrack2} />],
  [Mod.STATION, <img src={Station} />],
  [Mod.SWITCH_RAIL, <img src={SwitchRail} />],
]);
const CarIcons = new Map<CarType, React.ReactNode[]>([
  [
    CarType.NORMAL,
    [
      <img src={Car1} />,
      <img src={Car2} />,
      <img src={Car3} />,
      <img src={Car4} />,
    ],
  ],
  [
    CarType.NUMERAL,
    [
      <img src={Numeral1} />,
      <img src={Numeral2} />,
      <img src={Numeral3} />,
      <img src={Numeral4} />,
    ],
  ],
  [CarType.DECOY, Array(144).fill(<img src={Decoy} />)],
]);

interface return_types {
  track: Track | undefined;
  mod: Mod | undefined;
  cartype: CarType | undefined;
}

function getTypeFromInfo(
  toolId: string | undefined,
  pieceId: string | undefined,
  rotation: number
): return_types {
  const to_return: return_types = {
    track: undefined,
    mod: undefined,
    cartype: undefined,
  };
  if (toolId === "STRAIGHT") {
    if (rotation === 0 || rotation === 2) {
      to_return.track = Track.HORIZONTAL_TRACK;
    } else {
      to_return.track = Track.VERTICAL_TRACK;
    }
  }
  if (toolId === "CURVED") {
    if (rotation === 0) {
      to_return.track = Track.BOTTOM_RIGHT_TURN;
    } else if (rotation === 1) {
      to_return.track = Track.TOP_RIGHT_TURN;
    } else if (rotation === 2) {
      to_return.track = Track.TOP_LEFT_TURN;
    } else {
      to_return.track = Track.BOTTOM_LEFT_TURN;
    }
  }
  if (toolId === "FORK") {
    if (rotation === 0) {
      to_return.track = Track.BOTTOM_RIGHT_LEFT_3WAY;
    } else if (rotation === 1) {
      to_return.track = Track.TOP_RIGHT_BOTTOM_3WAY;
    } else if (rotation === 2) {
      to_return.track = Track.TOP_LEFT_RIGHT_3WAY;
    } else {
      to_return.track = Track.BOTTOM_LEFT_TOP_3WAY;
    }
  }
  if (toolId === "FORK_2") {
    if (rotation === 0) {
      to_return.track = Track.BOTTOM_LEFT_RIGHT_3WAY;
    } else if (rotation === 1) {
      to_return.track = Track.BOTTOM_RIGHT_TOP_3WAY;
    } else if (rotation === 2) {
      to_return.track = Track.TOP_RIGHT_LEFT_3WAY;
    } else {
      to_return.track = Track.TOP_LEFT_BOTTOM_3WAY;
    }
  }
  if (pieceId === "END_TRACK") {
    if (rotation === 0) {
      to_return.track = Track.CAR_ENDING_TRACK_RIGHT;
    } else if (rotation === 1) {
      to_return.track = Track.CAR_ENDING_TRACK_UP;
    } else if (rotation === 2) {
      to_return.track = Track.CAR_ENDING_TRACK_LEFT;
    } else {
      to_return.track = Track.CAR_ENDING_TRACK_DOWN;
    }
  }
  if (pieceId === "ROADBLOCK") {
    to_return.track = Track.ROADBLOCK;
  }
  if (pieceId === "STATION") {
    to_return.mod = Mod.STATION;
  }
  if (pieceId === "SWITCH") {
    to_return.mod = Mod.SWITCH;
  }
  if (pieceId === "OPEN_GATE") {
    to_return.mod = Mod.OPEN_GATE;
  }
  if (pieceId === "CLOSED_GATE") {
    to_return.mod = Mod.CLOSED_GATE;
  }
  if (pieceId === "SWITCH_FORK_TRACK") {
    to_return.mod = Mod.SWAPPING_TRACK;
  }
  if (pieceId === "TUNNEL") {
    if (rotation === 0) {
      to_return.track = Track.RIGHT_FACING_TUNNEL
    } else if (rotation === 1) {
      to_return.track = Track.UP_FACING_TUNNEL
    } else if (rotation === 2) {
      to_return.track = Track.LEFT_FACING_TUNNEL
    } else  {
      to_return.track = Track.DOWN_FACING_TUNNEL
    }
    to_return.mod = Mod.TUNNEL;
  }
  if (pieceId === "SWITCH_RAIL") {
    to_return.mod = Mod.SWITCH_RAIL;
  }
  if (pieceId === "NORMAL") {
    to_return.cartype = CarType.NORMAL;
  }
  if (pieceId === "DECOY") {
    to_return.cartype = CarType.DECOY;
  }
  return to_return;
}
function getRotationClass(degrees: number): string {
  switch (degrees) {
    case 0:
      return "rotate-0";
    case 90:
      return "rotate-90";
    case 180:
      return "rotate-180";
    case 270:
      return "rotate-270";
    default:
      return "rotate-0";
  }
}

function carDirToDeg(dir: Direction): string {
  if (dir === Direction.LEFT) {
    return "rotate-180";
  } else if (dir === Direction.RIGHT) {
    return "rotate-0";
  } else if (dir === Direction.DOWN) {
    return "rotate-90";
  } else if (dir === Direction.UP) {
    return "rotate-270";
  } else {
    console.log(`strange direction trying to be shown. Direction: ${dir}`);
    return "rotate-0";
  }
}

export const GridTile: React.FC<{
  pos: { y: number; x: number };
  car?: Car;
  track?: Track;
  mod?: Mod;
  mod_num?: number;
}> = ({ pos, car = undefined, track = Track.EMPTY, mod = Mod.EMPTY }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { selectedTool, selectedPiece, rotation } = useGuiStore();
  const { placePiece, removePiece, removeModorCar, registryFilled, levelData } =
    useLevelStore();

  const {
    track: selected_track,
    mod: selected_mod,
    cartype: selected_cartype,
  } = getTypeFromInfo(selectedTool, selectedPiece, rotation);

  function onClick() {
    placePiece(
      pos.x,
      pos.y,
      selected_cartype,
      selected_track,
      selected_mod,
      undefined,
      rotation
    );
  }
  function onRightClick(e: React.MouseEvent) {
    e.preventDefault();
    if (track !== Track.EMPTY && (mod !== Mod.EMPTY || car !== undefined)) {
      removeModorCar(pos.x, pos.y);
    } else {
      removePiece(pos.x, pos.y);
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
      <div
        className={`absolute inset-0 ${getRotationClass(
          TrackRotations.get(track)!
        )}`}
      >
        {TrackIcons.get(track)}
      </div>
      <div
        className={`absolute inset-0 ${getRotationClass(
          TrackRotations.get(track)!
        )}`}
      >
        {mod === Mod.SWAPPING_TRACK && fork_2_tracks.has(track)
          ? ModIcons.get("SWAPPING_TRACK_2")
          : ModIcons.get(mod)}
      </div>
      {car && (
        <div className={`absolute inset-0 ${carDirToDeg(car.direction)}`}>
          {CarIcons.get(car.type)![car.num]}
        </div>
      )}

      <div
        className={`absolute inset-0 opacity-60 ${
          selected_track
            ? getRotationClass(TrackRotations.get(selected_track)!)
            : "rotate-0"
        }`}
      >
        {selected_track && isHovered && TrackIcons.get(selected_track)}
      </div>
      <div
        className={`absolute inset-0 opacity-60 ${
          selected_track
            ? getRotationClass(TrackRotations.get(selected_track)!)
            : "rotate-0"
        }`}
      >
        {selected_mod &&
          isHovered &&
          (selectedPiece === "SWITCH_FORK_TRACK" && selectedTool === "FORK_2"
            ? ModIcons.get("SWAPPING_TRACK_2")
            : ModIcons.get(selected_mod))}
      </div>
      <div
        className={`absolute inset-0 opacity-60 ${(() => {
          switch (rotation) {
            case 0:
              return "rotate-0"; // left (0 degrees)
            case 1:
              return "rotate-270"; // right (270 degrees)
            case 2:
              return "rotate-180"; // down (180 degrees)
            case 3:
              return "rotate-90"; // up (90 degrees)
            default:
              return "rotate-0";
          }
        })()}`}
      >
        {selected_cartype &&
          isHovered &&
          !registryFilled(selected_cartype) &&
          CarIcons.get(selected_cartype)![
            levelData.next_nums.get(selected_cartype)!
          ]}
      </div>
    </div>
  );
};
