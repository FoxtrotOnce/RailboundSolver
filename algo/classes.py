import numpy as np  # used for the board class
from enum import Enum  # used for the Tile class so track/mod identifying is easier
from timeit import timeit  # used for testing lines
from typing import Iterable, Union
import warnings


warnings.warn(
    "This module is deprecated and will be removed in a future release." \
    "Please use classes.ts instead.",
    DeprecationWarning,
    2
)


class Track(Enum):
    """List names for each track index for better readability."""
    EMPTY = 0
    HORIZONTAL_TRACK = 1
    VERTICAL_TRACK = 2
    CAR_ENDING_TRACK_RIGHT = 3
    ROADBLOCK = 4  # This tile applies to: fences, rocks, stations, post offices, or any other roadblock.
    BOTTOM_RIGHT_TURN = 5
    BOTTOM_LEFT_TURN = 6
    TOP_RIGHT_TURN = 7
    TOP_LEFT_TURN = 8
    BOTTOM_RIGHT_LEFT_3WAY = 9  # For 3-ways, the first two directions are the turn on top, and the last is the straight track underneath.
    BOTTOM_RIGHT_TOP_3WAY = 10
    BOTTOM_LEFT_RIGHT_3WAY = 11
    BOTTOM_LEFT_TOP_3WAY = 12
    TOP_RIGHT_LEFT_3WAY = 13
    TOP_RIGHT_BOTTOM_3WAY = 14
    TOP_LEFT_RIGHT_3WAY = 15
    TOP_LEFT_BOTTOM_3WAY = 16
    LEFT_FACING_TUNNEL = 17
    RIGHT_FACING_TUNNEL = 18
    DOWN_FACING_TUNNEL = 19
    UP_FACING_TUNNEL = 20
    NCAR_ENDING_TRACK_RIGHT = 21  # The ending track is on the right side; it's only accessible from the left side of the track.
    NCAR_ENDING_TRACK_LEFT = 22
    # DO NOT USE THE TRACKS BELOW.
    # They are placeholders indicating that a track will have a semaphore placed on it for generation.
    SEM_HORIZONTAL_TRACK = 23
    SEM_VERTICAL_TRACK = 24
    SEM_BOTTOM_RIGHT_TURN = 25
    SEM_BOTTOM_LEFT_TURN = 26
    SEM_TOP_RIGHT_TURN = 27
    SEM_TOP_LEFT_TURN = 28
    # You can use these ones c:
    CAR_ENDING_TRACK_LEFT = 29
    CAR_ENDING_TRACK_DOWN = 30
    CAR_ENDING_TRACK_UP = 31
    NCAR_ENDING_TRACK_DOWN = 32
    NCAR_ENDING_TRACK_UP = 33

    @classmethod
    def convert_to_numpy(cls, tracks: np.ndarray) -> np.ndarray:
        """Convert a list of track values to a numpy array of track objects."""
        return np.vectorize(cls)(np.asarray(tracks))

    @classmethod
    def print_values(cls, board: np.ndarray) -> None:
        """Print the values of each track object in a numpy array."""
        print(np.vectorize(lambda item: item.value)(board))

    def is_empty(self) -> bool:
        """Return if the track is an EMPTY track."""
        return self is self.EMPTY

    def is_straight(self) -> bool:
        """Return if the track is straight."""
        return self is self.HORIZONTAL_TRACK or self is self.VERTICAL_TRACK

    def is_car_ending_track(self) -> bool:
        """Return if the track is an ending track for normal cars."""
        return self in {self.CAR_ENDING_TRACK_RIGHT, self.CAR_ENDING_TRACK_LEFT,
                        self.CAR_ENDING_TRACK_DOWN, self.CAR_ENDING_TRACK_UP}

    def is_turn(self) -> bool:
        """Return if the track is a single-turn track."""
        return self in {self.BOTTOM_RIGHT_TURN, self.BOTTOM_LEFT_TURN, self.TOP_RIGHT_TURN, self.TOP_LEFT_TURN}

    def is_3way(self) -> bool:
        """Return if the track is a 3-way track."""
        return self in {self.BOTTOM_RIGHT_LEFT_3WAY, self.BOTTOM_RIGHT_TOP_3WAY, self.BOTTOM_LEFT_RIGHT_3WAY,
                        self.BOTTOM_LEFT_TOP_3WAY, self.TOP_RIGHT_LEFT_3WAY, self.TOP_RIGHT_BOTTOM_3WAY,
                        self.TOP_LEFT_RIGHT_3WAY, self.TOP_LEFT_BOTTOM_3WAY}

    def is_tunnel(self) -> bool:
        """Return if the track is a tunnel."""
        return self in {self.LEFT_FACING_TUNNEL, self.RIGHT_FACING_TUNNEL,self.DOWN_FACING_TUNNEL,
                        self.UP_FACING_TUNNEL}

    def swap_track(self) -> "Track":
        """Return the swapped version of a swapping/switch track."""
        swapped_tracks = {
            self.BOTTOM_RIGHT_LEFT_3WAY: self.BOTTOM_LEFT_RIGHT_3WAY,
            self.BOTTOM_RIGHT_TOP_3WAY: self.TOP_RIGHT_BOTTOM_3WAY,
            self.BOTTOM_LEFT_RIGHT_3WAY: self.BOTTOM_RIGHT_LEFT_3WAY,
            self.BOTTOM_LEFT_TOP_3WAY: self.TOP_LEFT_BOTTOM_3WAY,
            self.TOP_RIGHT_LEFT_3WAY: self.TOP_LEFT_RIGHT_3WAY,
            self.TOP_RIGHT_BOTTOM_3WAY: self.BOTTOM_RIGHT_TOP_3WAY,
            self.TOP_LEFT_RIGHT_3WAY: self.TOP_RIGHT_LEFT_3WAY,
            self.TOP_LEFT_BOTTOM_3WAY: self.BOTTOM_LEFT_TOP_3WAY
        }
        return swapped_tracks[self]

    def is_ncar_ending_track(self) -> bool:
        """Return if the track is an ending track for numeral cars."""
        return self in {self.NCAR_ENDING_TRACK_RIGHT, self.NCAR_ENDING_TRACK_LEFT,
                        self.NCAR_ENDING_TRACK_DOWN, self.NCAR_ENDING_TRACK_UP}

    def is_placeholder_semaphore(self) -> bool:
        """Return if there is a placeholder semaphore on the tile."""
        return self in {self.SEM_HORIZONTAL_TRACK, self.SEM_VERTICAL_TRACK, self.SEM_BOTTOM_RIGHT_TURN,
                        self.SEM_BOTTOM_LEFT_TURN, self.SEM_TOP_RIGHT_TURN, self.SEM_TOP_LEFT_TURN}

    def add_placeholder_semaphore(self) -> "Track":
        """Return the placeholder semaphore version of a tile."""
        semaphore_tracks = {
            self.HORIZONTAL_TRACK: self.SEM_HORIZONTAL_TRACK,
            self.VERTICAL_TRACK: self.SEM_VERTICAL_TRACK,
            self.BOTTOM_RIGHT_TURN: self.SEM_BOTTOM_RIGHT_TURN,
            self.BOTTOM_LEFT_TURN: self.SEM_BOTTOM_LEFT_TURN,
            self.TOP_RIGHT_TURN: self.SEM_TOP_RIGHT_TURN,
            self.TOP_LEFT_TURN: self.SEM_TOP_LEFT_TURN
        }
        return semaphore_tracks[self]

    def remove_placeholder_semaphore(self) -> "Track":
        """Return the normal version of a semaphore'd tile."""
        normal_tracks = {
            self.SEM_HORIZONTAL_TRACK: self.HORIZONTAL_TRACK,
            self.SEM_VERTICAL_TRACK: self.VERTICAL_TRACK,
            self.SEM_BOTTOM_RIGHT_TURN: self.BOTTOM_RIGHT_TURN,
            self.SEM_BOTTOM_LEFT_TURN: self.BOTTOM_LEFT_TURN,
            self.SEM_TOP_RIGHT_TURN: self.TOP_RIGHT_TURN,
            self.SEM_TOP_LEFT_TURN: self.TOP_LEFT_TURN
        }
        return normal_tracks[self]

    def __hash__(self):
        return self.value


class Mod(Enum):
    """List names for each mod index for better readability."""
    EMPTY = 0
    SWITCH = 1
    TUNNEL = 2
    CLOSED_GATE = 3
    OPEN_GATE = 4
    SWAPPING_TRACK = 5
    STATION = 6
    SWITCH_RAIL = 7
    SEMAPHORE = 8
    DEACTIVATED_MOD = 9
    STARTING_CAR_TILE = 10
    POST_OFFICE = 11

    @classmethod
    def convert_to_numpy(cls, mods: np.ndarray) -> np.ndarray:
        """Convert a list of mod values to a numpy array of mod objects."""
        return np.vectorize(cls)(np.asarray(mods))

    @classmethod
    def produce_nums(cls, mods: np.ndarray) -> np.ndarray:
        """Return a numpy of the num of each mod type.

        The given mods must be using the old version (31 objects),
        otherwise mod nums cannot be extracted.
        """
        mod_nums = np.zeros(mods.shape, dtype=int)
        for k, v in np.ndenumerate(mods):
            if v in {1, 5, 8, 9, 16, 21, 29}:
                mod_nums[k] = 1
            elif v in {2, 6, 10, 11, 17, 22, 30}:
                mod_nums[k] = 2
            elif v in {3, 7, 12, 13, 18, 23, 31}:
                mod_nums[k] = 3
            elif v in {4, 14, 15, 19}:
                mod_nums[k] = 4
            else:
                mod_nums[k] = 0
        return mod_nums

    @classmethod
    def print_values(cls, board: np.ndarray) -> None:
        """Print the values of each mod object in a numpy array."""
        print(np.vectorize(lambda item: item.value)(board))

    @classmethod
    def from_old_type(cls, mod: int):
        """Reformat the old mod int types to the new mod types."""
        if mod == 0:
            return Mod.EMPTY
        if 1 <= mod <= 4:
            return Mod.SWITCH
        if 5 <= mod <= 7:
            return Mod.TUNNEL
        if 8 <= mod <= 15:
            if mod % 2 == 0:
                return Mod.CLOSED_GATE
            return Mod.OPEN_GATE
        if 16 <= mod <= 19:
            return Mod.SWAPPING_TRACK
        if 20 <= mod <= 23:
            return Mod.STATION
        if mod == 24:
            return Mod.SWITCH_RAIL
        if mod == 25:
            return Mod.SEMAPHORE
        if mod == 26:
            return Mod.DEACTIVATED_MOD
        if mod == 27:
            return Mod.STARTING_CAR_TILE
        if 28 <= mod <= 31:
            return Mod.POST_OFFICE
        raise ValueError(f"The mod value must be between 0-31. Mod: {mod}")

    def is_gate_or_sem(self) -> bool:
        """Return if the mod is a CLOSED_GATE or SEMAPHORE.

        The purpose is to check if the mod is capable of stalling a car.
        """
        return self is self.CLOSED_GATE or self is self.SEMAPHORE

    def __hash__(self):
        return self.value


class Direction(Enum):
    """List names for each direction index for better readability.

    CRASH indicates that a crash will occur.
    UNKNOWN indicates that the direction is not determined, but it won't crash.
    """
    CRASH = -2
    UNKNOWN = -1
    LEFT = 0
    RIGHT = 1
    DOWN = 2
    UP = 3

    @classmethod
    def from_vector(cls, vector: tuple[int, int]) -> "Direction":
        """Return the direction matching the given vector."""
        if vector == (0, -1):
            return cls.LEFT
        if vector == (0, 1):
            return cls.RIGHT
        if vector == (1, 0):
            return cls.DOWN
        if vector == (-1, 0):
            return cls.UP

    def to_vector(self) -> tuple[int, int]:
        """Return the vector matching the given direction."""
        if self is self.LEFT:
            return (0, -1)
        if self is self.RIGHT:
            return (0, 1)
        if self is self.DOWN:
            return (1, 0)
        if self is self.UP:
            return (-1, 0)

    def reverse(self) -> "Direction":
        """Return the reversed version of the direction."""
        if self is self.LEFT:
            return self.RIGHT
        if self is self.RIGHT:
            return self.LEFT
        if self is self.DOWN:
            return self.UP
        if self is self.UP:
            return self.DOWN

    def add_vector(self, vector: tuple[int, int]) -> tuple[int, int]:
        """Add the direction's vector to the given vector."""
        dir_vector = self.to_vector()
        return (vector[0] + dir_vector[0], vector[1] + dir_vector[1])

    def __hash__(self):
        return self.value + 2


class CarType(Enum):
    CRASHED = -1
    NORMAL = 0
    DECOY = 1
    NUMERAL = 2

    def __hash__(self):
        return self.value + 1

    def __repr__(self):
        return self.name


class Car:
    """Represent a Railbound car.

    Attributes:
        pos (tuple[int, int]): The indexed position of the car.
        pos_ahead (tuple[int, int]): The car's pos + the direction vector.
        direction (Direction): The direction of the car.
        num (int): The car's number.
        type (CarType): The car's type.
    """

    def __init__(self, pos: tuple[int, int], direction: "Direction", num: int, type: "CarType"):
        self.pos = pos
        dir_vector = direction.to_vector()
        self.pos_ahead = direction.add_vector(pos)
        self.direction = direction
        self.num = num
        self.type = type

    @classmethod
    def from_json(cls, car: dict[str, list[int] | str | int]) -> "Car":
        """Reformat the json representation of a car to an object."""
        return Car(tuple(car['pos']), Direction[car['direction']], car['num'], CarType[car['type']])

    def border_crash(self, bounds: tuple[int, int]) -> bool:
        """Return if the car is about to crash with the border."""
        # if self.type is not CarType.DECOY:
        #     raise TypeError
        return not (0 <= self.pos_ahead[0] < bounds[0] and 0 <= self.pos_ahead[1] < bounds[1])

    def crash(self) -> "Car":
        """Return a crashed version of the car."""
        if self.type is not CarType.DECOY:
            raise TypeError(f"The crashed car is not a decoy. Car: {self}")
        return Car(self.pos, self.direction, self.num, CarType.CRASHED)

    def same_tile_crashes(self, other_cars: Iterable["Car"]) -> Union["Car", None]:
        """Return the car that this car crashes with.

        Return None if no crashes occur.
        """
        for car in other_cars:
            if self.pos_ahead == car.pos:
                return car
        return None

    def head_on_crashes(self, other_cars: Iterable["Car"]) -> bool:
        """Return if the car will get into a head-on crash with any of other_cars."""
        # head_on_crash is the (y, x, direction) that will cause the crash.
        head_on_crash = (self.pos_ahead[0], self.pos_ahead[1], self.direction.reverse())
        for car in other_cars:
            if head_on_crash == (car.pos[0], car.pos[1], car.direction):
                return True
        return False

    def get_station(self) -> "Mod":
        """Return the station/post office corresponding to this car."""
        if self.type is CarType.NORMAL:
            return Mod.STATION
        elif self.type is CarType.NUMERAL:
            return Mod.POST_OFFICE
        else:
            raise TypeError(f"A car must be NORMAL or NUMERAL to get the station of it. CarType: {self.type}")

    def on_correct_station(self, mod: "Mod", mod_num: int) -> bool:
        """Return if the car is on its corresponding station/post office."""
        return mod_num == self.num and mod is self.get_station()

    def car_index(self, cars: list["Car"], decoys: list["Car"], ncars: list["Car"]) -> int:
        """Return the index of the car in cars + decoys + ncars."""
        if self.type is CarType.NORMAL:
            return self.num
        if self.type is CarType.DECOY:
            return self.num + len(cars)
        if self.type is CarType.NUMERAL:
            return self.num + len(cars) + len(decoys)
        raise TypeError

    def __hash__(self):
        return hash((self.pos, self.direction, self.num, self.type))

    def __repr__(self):
        return f"Car({self.type.name} {self.num} {self.pos} {self.direction.name})"


class State:
    """Use to convert a state to a hash for finding duplicate boards."""
    def __init__(self, cars_to_use: list["Car"], board_to_use: dict[tuple[int, int], "Track"],
                 mods_to_use: dict[tuple[int, int], "Mod"], available_tracks: int, heatmaps: np.ndarray,
                 solved: list[list[int], list[int]], stalled: list[bool], switch_queue: list[tuple[int, int]],
                 station_stalled: list[bool], crashed_decoys: list["Car"], mvmts_since_solved: int,
                 available_semaphores: int, heatmap_limits: np.ndarray):
        self.cars = tuple(cars_to_use)
        self.board = frozenset(board_to_use.items())
        self.mods = frozenset(mods_to_use.items())
        self.tracks = available_tracks
        self.heatmaps = heatmaps.data.tobytes()  #
        # self.solved = tuple(tuple(s) for s in solved)
        # self.stalled = tuple(stalled)
        # self.switch_queue = tuple(switch_queue)
        # self.station_stalled = tuple(station_stalled)
        # self.crashed_decoys = tuple(crashed_decoys)
        # self.frames_solved = mvmts_since_solved
        self.semaphores = available_semaphores
        # self.heatmap_limits = str(heatmap_limits)  #

    def __hash__(self):
        return hash(tuple(map(hash, [getattr(self, v) for v in dir(self) if v[0] != '_'])))
