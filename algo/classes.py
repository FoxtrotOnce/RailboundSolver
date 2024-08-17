import numpy as np  # used for the board class
from enum import Enum  # used for the Tile class so track/mod identifying is easier
import levels_cars as lc  # used for testing board
from frozendict import frozendict  # used so the board is hashable


class TrackName(Enum):
    EMPTY = 0
    HORIZONTAL_TRACK = 1
    VERTICAL_TRACK = 2
    ENDING_TRACK = 3
    FENCE_OR_STATION = 4
    BOTTOM_RIGHT_TURN = 5
    BOTTOM_LEFT_TURN = 6
    TOP_RIGHT_TURN = 7
    TOP_LEFT_TURN = 8
    BOTTOM_RIGHT_LEFT_3WAY = 9
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
    NCAR_ENDING_TRACK_RIGHT = 21
    NCAR_ENDING_TRACK_LEFT = 22


class ModName(Enum):
    EMPTY = 0
    SWITCH_1 = 1
    SWITCH_2 = 2
    SWITCH_3 = 3
    SWITCH_4 = 4
    TUNNEL_1 = 5
    TUNNEL_2 = 6
    TUNNEL_3 = 7
    CLOSED_GATE_1 = 8
    OPEN_GATE_1 = 9
    CLOSED_GATE_2 = 10
    OPEN_GATE_2 = 11
    CLOSED_GATE_3 = 12
    OPEN_GATE_3 = 13
    CLOSED_GATE_4 = 14
    OPEN_GATE_4 = 15
    SWAPPING_TRACK_1 = 16
    SWAPPING_TRACK_2 = 17
    SWAPPING_TRACK_3 = 18
    SWAPPING_TRACK_4 = 19
    STATION_1 = 20
    STATION_2 = 21
    STATION_3 = 22
    STATION_4 = 23
    SWITCH_RAIL = 24
    SEMAPHORE = 25
    DEACTIVATED_MOD = 26
    STARTING_CAR_TILE = 27
    POST_OFFICE_1 = 28
    POST_OFFICE_2 = 29
    POST_OFFICE_3 = 30
    POST_OFFICE_4 = 31


class Tile:
    def __init__(self, track: TrackName, mod: ModName):
        self.track = track
        self.mod = mod
        self._hash = (track.value << 5) + mod.value

    def newtrack(self, track):
        return Tile(track, self.mod)

    def newmod(self, mod):
        return Tile(self.track, mod)

    def __hash__(self):
        return self._hash

    def __repr__(self):
        return f'Track:{self.track.value} ({self.track.name}), Mod:{self.mod.value} ({self.mod.name})'


class Board:
    def __init__(self, tracks, mods):
        self.tiles = dict()

        for pos, track in np.ndenumerate(tracks):
            mod = mods[pos]
            self.tiles[pos[::-1]] = Tile(TrackName(track), ModName(mod))
        self.tiles = frozendict(self.tiles)

    def __repr__(self):
        return str(self.tiles)


class CarType(Enum):
    NORMAL = 0
    NUMERAL = 1
    DECOY = 2


class Car:
    def __init__(self, x, y, xvelo, yvelo, num, type: CarType):
        self.x = x
        self.y = y
        self.xvelo = xvelo
        self.yvelo = yvelo
        self.num = num
        self.type = type

    def move(self, x, y, xvelo, yvelo):
        return Car(x, y, xvelo, yvelo, self.num, self.type)

    def __repr__(self):
        return f'pos:{self.x, self.y}, velo:{self.xvelo, self.yvelo}, n:{self.num}, typ:{self.type.value} ({self.type.name})'


class State:
    def __init__(self, cars: Car, board: Board, available_tracks, heatmaps, stalled,
                 switch_queue, station_stalled, crashed_decoys, mvmts_since_solved,
                 available_semaphores, heatmap_limits):
        self.cars = cars
        self.board = board
        self.available_tracks = available_tracks
        self.heatmaps = heatmaps
        self.stalled = stalled
        self.switch_queue = switch_queue
        self.station_stalled = station_stalled
        self.crashed_decoys = crashed_decoys
        self.mvmts_since_solved = mvmts_since_solved
        self.available_semaphores = available_semaphores
        self.heatmap_limits = heatmap_limits

    def return_copy(self):
        return State(self.cars, self.board, self.available_tracks, self.heatmaps,
                     self.stalled, self.switch_queue, self.station_stalled, self.crashed_decoys,
                     self.mvmts_since_solved, self.available_semaphores, self.heatmap_limits)

    def __hash__(self):
        return hash

    def __repr__(self):
        return f'{self.cars}, {self.board}'
