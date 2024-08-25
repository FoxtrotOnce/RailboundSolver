import numpy as np  # used for the board class
from enum import Enum  # used for the Tile class so track/mod identifying is easier
import levels_cars as lc  # used for testing board
from frozendict import frozendict  # used so the board is hashable
from timeit import timeit  # used for testing lines


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

    @classmethod
    def is_straight(cls, track):
        return 1 <= track.value <= 2

    @classmethod
    def is_end(cls, track):
        return track.value == 3

    @classmethod
    def is_turn(cls, track):
        return 5 <= track.value <= 8

    @classmethod
    def is_3way(cls, track):
        return 9 <= track.value <= 16

    @classmethod
    def is_tunnel(cls, track):
        return 17 <= track.value <= 20

    @classmethod
    def is_ncar_end(cls, track):
        return 21 <= track.value <= 22


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

    @classmethod
    def is_swapping(cls, mod):
        return 16 <= mod.value <= 19

    @classmethod
    def is_switch(cls, mod):
        return mod.value == 24


class Tile:
    def __init__(self, track: TrackName, mod: ModName):
        if not (isinstance(track, TrackName) and isinstance(mod, ModName)):
            print('ERROR: Given track/mod is not type TrackName/ModName')
            raise TypeError
        self.track = track
        self.mod = mod
        self._hash = (track.value << 5) + mod.value

    def changetrack(self, track: TrackName):
        return Tile(track, self.mod)

    def changemod(self, mod: ModName):
        return Tile(self.track, mod)

    def __eq__(self, other):
        return hash(self._hash) == hash(other)

    def __hash__(self):
        return self._hash

    def __repr__(self):
        return f'Track:{self.track.value} ({self.track.name}), Mod:{self.mod.value} ({self.mod.name})'


class Board:
    def __init__(self, shape, tiles):
        self.shape = shape
        self._tiles = tiles
        self._queue = {}

    @classmethod
    def from_numpy(cls, tracks, mods):
        shape = np.shape(tracks)
        tiles = frozendict({pos[::-1]: Tile(TrackName(track), ModName(mods[pos]))
                            for pos, track in np.ndenumerate(tracks)})
        return cls(shape, tiles)

    def changetile(self, x, y, track=None, mod=None):
        changed_tiles = None
        if track is None:
            changed_tiles = self._tiles | {(x, y): self._tiles[(x, y)].changemod(mod)}
        elif mod is None:
            changed_tiles = self._tiles | {(x, y): self._tiles[(x, y)].changetrack(track)}

        return Board(self.shape, changed_tiles)

    def closegate(self, pos):
        gate = self._tiles[pos]
        if ModName.OPEN_GATE_1.value <= gate.mod.value <= ModName.OPEN_GATE_4.value and\
                gate.mod.value % 2 == 1:
            return self.changetile(pos[0], pos[1], mod=ModName(gate.mod.value - 1))
        else:
            print('ERROR: Given tile is not an open gate.')
            print(pos, gate.mod)
            raise IndexError

    def opengate(self, pos):
        gate = self._tiles[pos]
        if ModName.CLOSED_GATE_1.value <= gate.mod.value <= ModName.CLOSED_GATE_4.value and\
                gate.mod.value % 2 == 0:
            return self.changetile(pos[0], pos[1], mod=ModName(gate.mod.value + 1))
        else:
            print('ERROR: Given tile is not a closed gate.')
            print(pos, gate.mod)
            raise IndexError

    def swap_track(self, pos):
        track = self._tiles[pos].track.value
        return self.changetile(pos[0], pos[1], track=TrackName([11, 14, 9, 16, 15, 10, 13, 12][track - 9]))

    def getitems(self):
        return (self._tiles.item(i) for i in range(len(self._tiles)))

    def queue_changes(self, pos, track):
        self._queue[pos] = self._tiles[pos].changetrack(track)

    def do_changes(self):
        changed = self._tiles | self._queue
        self._queue = {}
        return Board(self.shape, changed)

    def __copy__(self):
        return Board(self.shape, self._tiles)

    def __getitem__(self, item):
        return self._tiles[item]

    def __len__(self):
        return len(self._tiles)

    def __hash__(self):
        return hash(self._tiles)

    def __repr__(self):
        to_return = np.zeros(self.shape, dtype=int)
        for key in self._tiles:
            to_return[key[::-1]] = self._tiles[key].track.value
        return str(to_return)


# TODO: change numeral to 1 and decoy to 2
class CarType(Enum):
    CRASHED = -1
    NORMAL = 0
    DECOY = 1
    NUMERAL = 2

    def __hash__(self):
        return self.value


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

    def getdir(self, xvelo=None, yvelo=None):
        if xvelo is None:
            xvelo, yvelo = self.xvelo, self.yvelo
        return ((4, 2, 3), (1, 4, 4), (0, 4, 4))[xvelo][yvelo]

    def __getitem__(self, item):
        return (self.x, self.y, self.xvelo, self.yvelo, self.num, self.type)[item]

    def __hash__(self):
        return hash((self.x, self.y, self.xvelo, self.yvelo, self.num, self.type))

    def __repr__(self):
        return f'{self.x, self.y, self.xvelo, self.yvelo, self.num, self.type.value} ({self.type.name} {self.num})'


class State:
    def __init__(self, cars, board, available_tracks=None, heatmaps=None, stalled=None,
                 switch_queue=None, station_stalled=None, crashed_decoys=None, mvmts_since_solved=None,
                 available_semaphores=None, heatmap_limits=None):
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

    # def return_copy(self):
    #     return State(self.cars, self.board, self.available_tracks, self.heatmaps,
    #                  self.stalled, self.switch_queue, self.station_stalled, self.crashed_decoys,
    #                  self.mvmts_since_solved, self.available_semaphores, self.heatmap_limits)
    def params(self):
        return self.cars, self.board, self.available_tracks, self.heatmaps, self.stalled, self.switch_queue,\
            self.station_stalled, self.crashed_decoys, self.mvmts_since_solved, self.available_semaphores, self.heatmap_limits

    def __hash__(self):
        return hash((self.cars, self.board))

    def __repr__(self):
        return f'{self.board}, {self.cars}'
