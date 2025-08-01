import React, { useState } from "react";
import { Track, Mod, Car, Direction, CarType } from "../../../algo/classes";

import {
  Ending_Track,
  Perm_StraightTrack,
  Perm_Turn,
  Perm_Fork,
  Perm_Fork2,
  Roadblock,
  Tunnel,
  Switch,
  Open_Gate,
  Closed_Gate,
  Swapping_Track,
  Swapping_Track2,
  Station,
  Switch_Rail,
  Car_1,
  Car_2,
  Car_3,
  Car_4,
  Car_I,
  Car_II,
  Car_III,
  Car_IIII,
  Decoy
} from "../assets/svgs"
// TODO: add post office
import { useGuiStore, useLevelStore } from "../store";
import type { GridCell } from "../store/levelStore";

const fork_2_tracks = new Set<Track>([
  Track.BOTTOM_RIGHT_TOP_3WAY,
  Track.BOTTOM_LEFT_RIGHT_3WAY,
  Track.TOP_RIGHT_LEFT_3WAY,
  Track.TOP_LEFT_BOTTOM_3WAY,
]);
// NOTE: Tailwind rotations are clockwise, rotation from useGuiStore() is counterclockwise as it increases.
const TrackIcons = new Map<Track, React.ReactNode>([
  [Track.EMPTY, <></>],
  [Track.HORIZONTAL_TRACK, Perm_StraightTrack],
  [Track.VERTICAL_TRACK, Perm_StraightTrack],
  [Track.CAR_ENDING_TRACK_LEFT, Ending_Track],
  [Track.CAR_ENDING_TRACK_RIGHT, Ending_Track],
  [Track.CAR_ENDING_TRACK_DOWN, Ending_Track],
  [Track.CAR_ENDING_TRACK_UP, Ending_Track],
  [Track.ROADBLOCK, Roadblock],
  [Track.BOTTOM_RIGHT_TURN, Perm_Turn],
  [Track.BOTTOM_LEFT_TURN, Perm_Turn],
  [Track.TOP_RIGHT_TURN, Perm_Turn],
  [Track.TOP_LEFT_TURN, Perm_Turn],
  [Track.BOTTOM_RIGHT_LEFT_3WAY, Perm_Fork],
  [Track.BOTTOM_RIGHT_TOP_3WAY, Perm_Fork2],
  [Track.BOTTOM_LEFT_RIGHT_3WAY, Perm_Fork2],
  [Track.BOTTOM_LEFT_TOP_3WAY, Perm_Fork],
  [Track.TOP_RIGHT_LEFT_3WAY, Perm_Fork2],
  [Track.TOP_RIGHT_BOTTOM_3WAY, Perm_Fork],
  [Track.TOP_LEFT_RIGHT_3WAY, Perm_Fork],
  [Track.TOP_LEFT_BOTTOM_3WAY, Perm_Fork2],
  // Tunnels have straight tracks displayed underneath them to make it visually accurate.
  [Track.LEFT_FACING_TUNNEL, Tunnel],
  [Track.RIGHT_FACING_TUNNEL, Tunnel],
  [Track.DOWN_FACING_TUNNEL, Tunnel],
  [Track.UP_FACING_TUNNEL, Tunnel],
  [Track.NCAR_ENDING_TRACK_LEFT, Ending_Track],
  [Track.NCAR_ENDING_TRACK_RIGHT, Ending_Track],
  [Track.NCAR_ENDING_TRACK_DOWN, Ending_Track],
  [Track.NCAR_ENDING_TRACK_UP, Ending_Track],
  // Station's icons depends on the grid and can be either a station or a post office, so it is obtained via function instead.
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
  [Track.LEFT_FACING_TUNNEL, 0],
  [Track.RIGHT_FACING_TUNNEL, 180],
  [Track.DOWN_FACING_TUNNEL, 270],
  [Track.UP_FACING_TUNNEL, 90],
  [Track.NCAR_ENDING_TRACK_LEFT, 180],
  [Track.NCAR_ENDING_TRACK_RIGHT, 0],
  [Track.NCAR_ENDING_TRACK_DOWN, 90],
  [Track.NCAR_ENDING_TRACK_UP, 270],
  [Track.STATION_LEFT, 90],
  [Track.STATION_RIGHT, 270],
  [Track.STATION_DOWN, 0],
  [Track.STATION_UP, 180]
]);
const ModIcons = new Map<Mod | string, React.ReactNode>([
  [Mod.EMPTY, <></>],
  [Mod.TUNNEL, <></>], // Tunnel is blank since the track has rotation value, the mod doesn't
  [Mod.SWITCH, Switch],
  [Mod.OPEN_GATE, Open_Gate],
  [Mod.CLOSED_GATE, Closed_Gate],
  [Mod.SWAPPING_TRACK, Swapping_Track],
  ["SWAPPING_TRACK_2", Swapping_Track2],
  [Mod.STATION, <></>],  // The actual mod for a station doesn't have an icon, but the station around it does.
  [Mod.SWITCH_RAIL, Switch_Rail],
  [Mod.POST_OFFICE, <></>]
]);
const CarIcons = new Map<CarType, React.ReactNode[]>([
  [
    CarType.NORMAL,
    [
      Car_1,
      Car_2,
      Car_3,
      Car_4,
    ],
  ],
  [
    CarType.NUMERAL,
    [
      Car_I,
      Car_II,
      Car_III,
      Car_IIII,
    ],
  ],
  [CarType.DECOY, Array(144).fill(Decoy)],
]);
const StationStyles = new Map<number, string>([
  [270, "absolute -left-full rotate-270 size-full"],
  [90, "absolute -right-full rotate-90 size-full"],
  [0, "absolute -bottom-full rotate-180 size-full"],
  [180, "absolute -top-full rotate-0 size-full"]
])

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
  disabled?: boolean
}> = ({ pos, car = undefined, track = Track.EMPTY, mod = Mod.EMPTY, mod_num = 0, disabled = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { styles, selectedTool, selectedPiece, rotation, selectedModNum } = useGuiStore();
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
      selectedModNum,
      rotation
    );
  }
  function onRightClick(e: React.MouseEvent) {
    e.preventDefault();
    if (track !== Track.EMPTY && (mod !== Mod.EMPTY || car !== undefined)) {
      removeModorCar(pos.x, pos.y);
    } else if (track !== Track.EMPTY) {
      removePiece(pos.x, pos.y);
    }
  }
  function getStationIcon(track: Track, pos: { x: number, y: number }) {
    const grid = levelData.grid
    let modTile: GridCell
    if (track === Track.STATION_LEFT) {
      modTile = grid[pos.y][pos.x - 1]
    } else if (track === Track.STATION_RIGHT) {
      modTile = grid[pos.y][pos.x + 1]
    } else if (track === Track.STATION_DOWN) {
      modTile = grid[pos.y + 1][pos.x]
    } else {
      modTile = grid[pos.y - 1][pos.x]
    }
    if (modTile.mod === Mod.STATION) {
      return Station
    } else {
      // return Post_Office
    }
  }
  function tryDisplayOOBstation(mod: Mod, pos: { x: number, y: number }) {
    let stationPos: { x: number, y: number } | undefined
    const grid = levelData.grid
    // TODO: add post office here
    const stationIcon = mod === Mod.STATION && Station
    const adjPoses = [{ x: -1, y: 0 }, { x: 1, y: 0}, { x: 0, y: 1 }, { x: 0, y: -1 }]

    for (const offsetPos of adjPoses) {
      const adjPos = { x: pos.x + offsetPos.x, y: pos.y + offsetPos.y }
      if (adjPos.x < 0 || adjPos.y < 0 || adjPos.x >= grid[0].length || adjPos.y >= grid.length) {
        stationPos = offsetPos
      } else if (grid[adjPos.y][adjPos.x].track.is_station()) {
        stationPos = undefined
        break
      }
    }
    if (stationPos !== undefined) {
      // Render station outside of the border
      if (stationPos.x === -1) {
        return <div className={StationStyles.get(270)}>{stationIcon}</div>
      } else if (stationPos.x === 1) {
        return <div className={StationStyles.get(90)}>{stationIcon}</div>
      } else if (stationPos.y === 1) {
        return <div className={StationStyles.get(0)}>{stationIcon}</div>
      } else {
        return <div className={StationStyles.get(180)}>{stationIcon}</div>
      }
    } else {
      // No OOBstation found, don't render anything.
      return <></>
    }
  }

  return (
    <div
      className={`select-none size-full ${isHovered ? "bg-gray-700/50" : ""}`}
      onContextMenu={(e) => {if (!disabled) {onRightClick(e)}}}
      onClick={() => {if (!disabled) {onClick()}}}
      onMouseEnter={() => {if (!disabled) {setIsHovered(true)}}}
      onMouseLeave={() => {if (!disabled) {setIsHovered(false)}}}
    >
      {/* Track */}
      <div
        className={`absolute inset-0 ${getRotationClass(
          TrackRotations.get(track)!
        )} ${
          styles.mods[mod_num].text
        }`}
      >
        {track.is_station()
        ? getStationIcon(track, pos)
        : TrackIcons.get(track)
        }
      </div>
      {/* Mod */}
      <div
        className={`absolute inset-0 ${
          mod !== Mod.STATION && mod !== Mod.POST_OFFICE &&
          getRotationClass(TrackRotations.get(track)!)
        } ${
          styles.mods[mod_num].text
        }`}
      >
        {mod === Mod.SWAPPING_TRACK && fork_2_tracks.has(track)
        ? ModIcons.get("SWAPPING_TRACK_2")
        : ((mod === Mod.STATION || mod === Mod.POST_OFFICE)
          ? tryDisplayOOBstation(mod, pos)
          : ModIcons.get(mod)
        )
        }
      </div>
      {/* Car */}
      {car && (
        <div className={`absolute inset-0 ${carDirToDeg(car.direction)}`}>
          {CarIcons.get(car.type)![car.num]}
        </div>
      )}
      {/* Hover Track */}
      <div
        className={`absolute inset-0 opacity-60 pointer-events:none ${
          selected_track
            ? getRotationClass(TrackRotations.get(selected_track)!)
            : "rotate-0"
        } ${
          styles.mods[selectedModNum].text
        }`}
      >
        {selected_track && isHovered && TrackIcons.get(selected_track)}
      </div>
      {/* Hover Mod */}
      <div
        className={`absolute inset-0 opacity-60 pointer-events:none ${
          selected_track
          ? getRotationClass(TrackRotations.get(selected_track)!)
          : "rotate-0"
        } ${
          styles.mods[selectedModNum].text
        }`}
      >
        {selected_mod && isHovered && (
          selectedPiece === "SWITCH_FORK_TRACK" && selectedTool === "FORK_2"
          ? ModIcons.get("SWAPPING_TRACK_2")
          : ModIcons.get(selected_mod)
        )}
      </div>
      {/* Hover Car */}
      <div
        className={`absolute inset-0 opacity-60 pointer-events:none ${(() => {
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
