import React, { useState } from "react";
import { Track, Mod, Car, Direction, CarType } from "../../../algo/classes";

import {
  Normal_Ending,
  Numeral_Ending,
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
  Station_1,
  Station_2,
  Station_3,
  Station_4,
  Ticket_Overlay,
  Post_Office_1,
  Post_Office_2,
  Post_Office_3,
  Post_Office_4,
  Mail_Overlay,
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
import { useGuiStore, useLevelStore } from "../store";
import type { GridCell } from "../store/levelStore";

/**
 * Tracks that require the Perm_Fork2 svg.
 */
const fork2_tracks = new Set<Track>([
  Track.BOTTOM_RIGHT_TOP_3WAY,
  Track.BOTTOM_LEFT_RIGHT_3WAY,
  Track.TOP_RIGHT_LEFT_3WAY,
  Track.TOP_LEFT_BOTTOM_3WAY,
]);
/**
 * Gives the rotation for items based on what track is underneath them.
 */
const ItemRotations = new Map<Track, string>([
  [Track.EMPTY, `rotate-0`],
  [Track.HORIZONTAL_TRACK, `rotate-0`],
  [Track.VERTICAL_TRACK, `rotate-90`],
  [Track.CAR_ENDING_TRACK_LEFT, `rotate-180`],
  [Track.CAR_ENDING_TRACK_RIGHT, `rotate-0`],
  [Track.CAR_ENDING_TRACK_DOWN, `rotate-90`],
  [Track.CAR_ENDING_TRACK_UP, `rotate-270`],
  [Track.ROADBLOCK, `rotate-0`],
  [Track.BOTTOM_RIGHT_TURN, `rotate-0`],
  [Track.BOTTOM_LEFT_TURN, `rotate-90`],
  [Track.TOP_RIGHT_TURN, `rotate-270`],
  [Track.TOP_LEFT_TURN, `rotate-180`],
  [Track.BOTTOM_RIGHT_LEFT_3WAY, `rotate-0`],
  [Track.BOTTOM_RIGHT_TOP_3WAY, `rotate-270`],
  [Track.BOTTOM_LEFT_RIGHT_3WAY, `rotate-0`],
  [Track.BOTTOM_LEFT_TOP_3WAY, `rotate-90`],
  [Track.TOP_RIGHT_LEFT_3WAY, `rotate-180`],
  [Track.TOP_RIGHT_BOTTOM_3WAY, `rotate-270`],
  [Track.TOP_LEFT_RIGHT_3WAY, `rotate-180`],
  [Track.TOP_LEFT_BOTTOM_3WAY, `rotate-90`],
  [Track.LEFT_FACING_TUNNEL, `rotate-0`],
  [Track.RIGHT_FACING_TUNNEL, `rotate-180`],
  [Track.DOWN_FACING_TUNNEL, `rotate-270`],
  [Track.UP_FACING_TUNNEL, `rotate-90`],
  [Track.NCAR_ENDING_TRACK_LEFT, `rotate-180`],
  [Track.NCAR_ENDING_TRACK_RIGHT, `rotate-0`],
  [Track.NCAR_ENDING_TRACK_DOWN, `rotate-90`],
  [Track.NCAR_ENDING_TRACK_UP, `rotate-270`],
  [Track.STATION_LEFT, `rotate-90`],
  [Track.STATION_RIGHT, `rotate-270`],
  [Track.STATION_DOWN, `rotate-0`],
  [Track.STATION_UP, `rotate-180`]
]);
/**
 * Gives the corresponding svg for each Track (Besides Stations).
 */
const TrackIcons = new Map<Track, React.ReactNode | never>([
  [Track.EMPTY, <></>],
  [Track.HORIZONTAL_TRACK, Perm_StraightTrack],
  [Track.VERTICAL_TRACK, Perm_StraightTrack],
  [Track.CAR_ENDING_TRACK_LEFT, Normal_Ending],
  [Track.CAR_ENDING_TRACK_RIGHT, Normal_Ending],
  [Track.CAR_ENDING_TRACK_DOWN, Normal_Ending],
  [Track.CAR_ENDING_TRACK_UP, Normal_Ending],
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
  [Track.NCAR_ENDING_TRACK_LEFT, Numeral_Ending],
  [Track.NCAR_ENDING_TRACK_RIGHT, Numeral_Ending],
  [Track.NCAR_ENDING_TRACK_DOWN, Numeral_Ending],
  [Track.NCAR_ENDING_TRACK_UP, Numeral_Ending],
  // Station's icons depends on the grid and can be either a station or a post office, so it is obtained via function instead.
  [Track.STATION_LEFT, <></> as never],
  [Track.STATION_RIGHT, <></> as never],
  [Track.STATION_DOWN, <></> as never],
  [Track.STATION_UP, <></> as never]
]);
/**
 * Gives the corresponding svg for each Mod (Besides Tunnels and Stations)
 */
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
/**
 * Gives the corresponding svg for each car, based on its CarType and number.
 */
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
/**
 * Gives the Tailwind rotation for a car based on its Direction.
 */
const dirToRot = new Map<Direction, string | never>([
  [Direction.LEFT, `rotate-180`],
  [Direction.RIGHT, `rotate-0`],
  [Direction.DOWN, `rotate-90`],
  [Direction.UP, `rotate-270`],
  [Direction.UNKNOWN, `rotate-0` as never],
  [Direction.CRASH, `rotate-0` as never]
])
/**
 * Gives the Tailwind rotation for a div based on rotation (from useGuiStore())
 */
const rotToRot = new Map<number, string>([
  [0, `rotate-0`],
  [1, `rotate-270`],
  [2, `rotate-180`],
  [3, `rotate-90`]
])

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
  const { placePiece, removePiece, removeModorCar, registryFilled, permLevelData, saveToUndoStack, saveLevel } = useLevelStore();
  type items = {
    track?: Track,
    mod?: Mod,
    cartype?: CarType
  }

  /**
   * Uses selectedTool, selectedPiece, rotation, and selectedModNum to figure out what
   * Track, Mod, and CarType need to get placed on the grid.
   */
  function getItemsToPlace(): items {
    const to_return: items = {
      track: undefined,
      mod: undefined,
      cartype: undefined,
    };

    if (selectedTool === "STRAIGHT") {
      if (rotation === 0 || rotation === 2) {
        to_return.track = Track.HORIZONTAL_TRACK;
      } else {
        to_return.track = Track.VERTICAL_TRACK;
      }
    }
    if (selectedTool === "CURVED") {
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
    if (selectedTool === "FORK") {
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
    if (selectedTool === "FORK_2") {
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
    if (selectedPiece === "END_TRACK") {
      if (selectedModNum < 4) {
        if (rotation === 0) {
          to_return.track = Track.CAR_ENDING_TRACK_RIGHT;
        } else if (rotation === 1) {
          to_return.track = Track.CAR_ENDING_TRACK_UP;
        } else if (rotation === 2) {
          to_return.track = Track.CAR_ENDING_TRACK_LEFT;
        } else {
          to_return.track = Track.CAR_ENDING_TRACK_DOWN;
        }
      } else {
        if (rotation === 0) {
          to_return.track = Track.NCAR_ENDING_TRACK_RIGHT;
        } else if (rotation === 1) {
          to_return.track = Track.NCAR_ENDING_TRACK_UP;
        } else if (rotation === 2) {
          to_return.track = Track.NCAR_ENDING_TRACK_LEFT;
        } else {
          to_return.track = Track.NCAR_ENDING_TRACK_DOWN;
        }
      }
    }
    if (selectedPiece === "ROADBLOCK") {
      to_return.track = Track.ROADBLOCK;
    }
    if (selectedPiece === "STATION") {
      if (rotation === 0) {
        to_return.track = Track.STATION_RIGHT;
      } else if (rotation === 1) {
        to_return.track = Track.STATION_UP;
      } else if (rotation === 2) {
        to_return.track = Track.STATION_LEFT;
      } else {
        to_return.track = Track.STATION_DOWN;
      }
    }
    if (selectedPiece === "SWITCH") {
      to_return.mod = Mod.SWITCH;
    }
    if (selectedPiece === "OPEN_GATE") {
      to_return.mod = Mod.OPEN_GATE;
    }
    if (selectedPiece === "CLOSED_GATE") {
      to_return.mod = Mod.CLOSED_GATE;
    }
    if (selectedPiece === "SWITCH_FORK_TRACK") {
      to_return.mod = Mod.SWAPPING_TRACK;
    }
    if (selectedPiece === "TUNNEL") {
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
    if (selectedPiece === "SWITCH_RAIL") {
      to_return.mod = Mod.SWITCH_RAIL;
    }
    if (selectedPiece === "NORMAL") {
      if (selectedModNum < 4) {
        to_return.cartype = CarType.NORMAL;
      } else {
        to_return.cartype = CarType.NUMERAL
      }
    }
    if (selectedPiece === "DECOY") {
      to_return.cartype = CarType.DECOY;
    }
    return to_return;
  }

  const {
    track: selected_track,
    mod: selected_mod,
    cartype: selected_cartype,
  } = getItemsToPlace();
  
  function onClick() {
    // If selected_track is a Track.STATION_LEFT/RIGHT/DOWN/UP, place the station,
    // but also place a station mod on the tile the station is facing.
    // Since 2 placePiece calls need to be made to do this, saving is done manually here so undoing properly undoes both actions.
    const isPlacingStation = selected_track?.is_station()
    if (isPlacingStation) {
      const grid = permLevelData.grid
      const station_pos = {...pos}
      if (selected_track === Track.STATION_LEFT) {
        station_pos.x--
      } else if (selected_track === Track.STATION_RIGHT) {
        station_pos.x++
      } else if (selected_track === Track.STATION_UP) {
        station_pos.y--
      } else {
        station_pos.y++
      }
      const station_track: Track = grid[station_pos.y]?.[station_pos.x]?.track
      // Don't place anything if the station mod's location is OOB, or the mod isn't being placed on a normal track.
      if (station_track === undefined || (!station_track.is_straight() && !station_track.is_turn() && !station_track.is_3way())) {
        return
      }
      saveToUndoStack()
      placePiece(
        station_pos.x,
        station_pos.y,
        undefined,
        undefined,
        selectedModNum < 4 ? Mod.STATION : Mod.POST_OFFICE,
        selectedModNum % 4,
        undefined,
        false
      )
    }
    placePiece(
      pos.x,
      pos.y,
      selected_cartype,
      selected_track,
      selected_mod,
      selectedModNum % 4,
      rotation,
      !isPlacingStation
    );
    if (isPlacingStation) {
      saveLevel()
    }
  }
  function onRightClick() {
    if (track !== Track.EMPTY && (mod !== Mod.EMPTY || car !== undefined)) {
      removeModorCar(pos.x, pos.y);
    } else if (track !== Track.EMPTY) {
      removePiece(pos.x, pos.y);
    }
  }
  /**
   * Used if the track is a Track.STATION_LEFT/RIGHT/DOWN/UP.
   * Returns an icon based on the mod and mod_num of the tile the station is facing.
   */
  function getPlacedStationIcon(): React.ReactNode {
    const grid = permLevelData.grid
    let stationIcon: React.ReactNode
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
      if (modTile.mod_num === 0) {
        stationIcon = Station_1
      } else if (modTile.mod_num === 1) {
        stationIcon = Station_2
      } else if (modTile.mod_num === 2) {
        stationIcon = Station_3
      } else {
        stationIcon = Station_4
      }
      stationIcon = <div>{stationIcon}<div className={`absolute inset-0`}>{Ticket_Overlay}</div></div>
    } else {
      if (modTile.mod_num === 0) {
        stationIcon = Post_Office_1
      } else if (modTile.mod_num === 1) {
        stationIcon = Post_Office_2
      } else if (modTile.mod_num === 2) {
        stationIcon = Post_Office_3
      } else {
        stationIcon = Post_Office_4
      }
      stationIcon = <div>{stationIcon}<div className={`absolute inset-0`}>{Mail_Overlay}</div></div>
    }
    return stationIcon
  }
  /**
   * Used if the selected_track is a Track.STATION_LEFT/RIGHT/DOWN/UP.
   * Returns an icon based on selectedModNum.
   */
  function getHoveredStationIcon(): React.ReactNode {
    let stationIcon: React.ReactNode
    if (selectedModNum < 4) {
      if (selectedModNum === 0) {
        stationIcon = Station_1
      } else if (selectedModNum === 1) {
        stationIcon = Station_2
      } else if (selectedModNum === 2) {
        stationIcon = Station_3
      } else {
        stationIcon = Station_4
      }
      stationIcon = <div>{stationIcon}<div className={`absolute inset-0`}>{Ticket_Overlay}</div></div>
    } else {
      if (selectedModNum === 4) {
        stationIcon = Post_Office_1
      } else if (selectedModNum === 5) {
        stationIcon = Post_Office_2
      } else if (selectedModNum === 6) {
        stationIcon = Post_Office_3
      } else {
        stationIcon = Post_Office_4
      }
      stationIcon = <div>{stationIcon}<div className={`absolute inset-0`}>{Mail_Overlay}</div></div>
    }
    return stationIcon
  }
  /**
   * Try to display a station out-of-bounds based on this tile's mod and modNum if there is no station Track adjacent to it.
   */
  function tryDisplayOOBstation(): React.ReactNode {
    let stationPos: { x: number, y: number }
    const grid = permLevelData.grid
    // TODO: add post office here
    const adjPoses = [{ x: -1, y: 0 }, { x: 1, y: 0}, { x: 0, y: 1 }, { x: 0, y: -1 }]

    // Check each adjacent pos around this tile to see if there's an OOB tile.
    for (let adjPos of adjPoses) {
      adjPos = { x: pos.x + adjPos.x, y: pos.y + adjPos.y }

      if (adjPos.x < 0 || adjPos.y < 0 || adjPos.x >= permLevelData.grid[0].length || adjPos.y >= permLevelData.grid.length) {
        // Found an OOB pos adjacent to this tile, put the station OOB there if no stations are adjacent to this tile.
        stationPos = adjPos
      } else if (grid[adjPos.y][adjPos.x].track.is_station()) {
        // Found a station adjacent to this tile, do not render an OOB station.
        return <></>
      }
    }
    // Figure out what icon to display based on the mod and mod_num.
    let stationIcon: React.ReactNode
    if (mod === Mod.STATION) {
      if (mod_num === 0) {
        stationIcon = Station_1
      } else if (mod_num === 1) {
        stationIcon = Station_2
      } else if (mod_num === 2) {
        stationIcon = Station_3
      } else {
        stationIcon = Station_4
      }
      stationIcon = <div>{stationIcon}<div className={`absolute inset-0`}>{Ticket_Overlay}</div></div>
    } else {
      if (mod_num === 0) {
        stationIcon = Post_Office_1
      } else if (mod_num === 1) {
        stationIcon = Post_Office_2
      } else if (mod_num === 2) {
        stationIcon = Post_Office_3
      } else {
        stationIcon = Post_Office_4
      }
      stationIcon = <div>{stationIcon}<div className={`absolute inset-0`}>{Mail_Overlay}</div></div>
    }
    // Return the formatted station icon based on which side it's OOB on. (Left/Right/Top/Bottom)
    if (stationPos!.x < 0) {
      return <div className={"absolute -left-full w-full h-full rotate-270 pointer-events-none"}>{stationIcon}</div>
    } else if (stationPos!.x >= permLevelData.grid[0].length) {
      return <div className={"absolute -right-full w-full h-full rotate-90 pointer-events-none"}>{stationIcon}</div>
    } else if (stationPos!.y < 0) {
      return <div className={"absolute -top-full w-full h-full rotate-0 pointer-events-none"}>{stationIcon}</div>
    } else {
      return <div className={"absolute -bottom-full w-full h-full rotate-180 pointer-events-none"}>{stationIcon}</div>
    }
  }

  return (
    <div
      className={`select-none size-full`}
      onContextMenu={(e) => {if (!disabled) {e.preventDefault(); onRightClick()}}}
      onClick={() => {if (!disabled) {onClick()}}}
      onMouseEnter={() => {if (!disabled) {setIsHovered(true)}}}
      onMouseLeave={() => {if (!disabled) {setIsHovered(false)}}}
    >
      {/* Track */}
      <div className={`absolute inset-0 ${styles.mods[mod_num].text} ${ItemRotations.get(track)}`}>
        {track.is_station()
        ? getPlacedStationIcon()
        : TrackIcons.get(track)
        }
      </div>
      {/* Mod */}
      <div className={`absolute inset-0 ${styles.mods[mod_num].text} ${!mod.is_station() && ItemRotations.get(track)}`}>
        {mod === Mod.SWAPPING_TRACK && fork2_tracks.has(track)
        ? ModIcons.get("SWAPPING_TRACK_2")
        : (mod.is_station()
          ? tryDisplayOOBstation()
          : ModIcons.get(mod)
          )
        }
      </div>
      {/* Car */}
      {car && 
        <div className={`absolute inset-0 ${dirToRot.get(car.direction)}`}>
          {CarIcons.get(car.type)![car.num]}
        </div>
      }
      {/* Hover Track */}
      {selected_track && isHovered &&
      <div className={`absolute inset-0 opacity-60 pointer-events:none ${styles.mods[selectedModNum].text} ${ItemRotations.get(selected_track)}`}>
        {selected_track.is_station()
          ? getHoveredStationIcon()
          : TrackIcons.get(selected_track)
        }
      </div>}
      {/* Hover Mod */}
      {selected_mod && isHovered &&
      <div className={`absolute inset-0 opacity-60 pointer-events:none ${styles.mods[selectedModNum].text} ${
        selected_track ? ItemRotations.get(selected_track) : rotToRot.get(rotation)
      }`}>
        {selectedPiece === "SWITCH_FORK_TRACK" && selectedTool === "FORK_2"
          ? ModIcons.get("SWAPPING_TRACK_2")
          : ModIcons.get(selected_mod)
        }
      </div>}
      {/* Hover Car */}
      {selected_cartype && isHovered && !registryFilled(selected_cartype) &&
      <div className={`absolute inset-0 opacity-60 pointer-events:none ${rotToRot.get(rotation)}`}>
        {CarIcons.get(selected_cartype)![
          permLevelData.next_nums.get(selected_cartype)!
        ]}
      </div>}
    </div>
  );
};
