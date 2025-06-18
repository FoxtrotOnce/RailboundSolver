"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deque = exports.directions = exports.semaphore_pass = exports.Car = exports.CarType = exports.Direction = exports.Mod = exports.Track = void 0;
exports.product = product;
exports.copy_arr = copy_arr;
exports.zeros = zeros;
/** List names for each track index for better readability. */
class Track {
    constructor(value) {
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
        });
        Track.TRACKS.set(value, this);
    }
    /** Return the Track corresponding to the value. */
    static get(value) {
        return this.TRACKS.get(value);
    }
    /** Print the values of each Track in the array. */
    static print_values(board) {
        for (let i = 0; i < board.length; i++) {
            console.log(JSON.stringify(board[i].map(track => track.value)));
        }
    }
    /** Convert an array of numbers to an array of tracks. */
    static convert_to_tracks(board) {
        let converted_board = [];
        for (let i = 0; i < board.length; i++) {
            converted_board.push([]);
            for (let j = 0; j < board[0].length; j++) {
                converted_board[i].push(Track.get(board[i][j]));
            }
        }
        return converted_board;
    }
    /** Return if the track is an EMPTY track. */
    is_empty() {
        return this === Track.EMPTY;
    }
    /** Return if the track is straight. */
    is_straight() {
        return this === Track.HORIZONTAL_TRACK || this === Track.VERTICAL_TRACK;
    }
    /** Return if the track is an ending track for normal cars. */
    is_car_ending_track() {
        return car_endings.has(this);
    }
    /** Return if the track is a single-turn track. */
    is_turn() {
        return single_turns.has(this);
    }
    /** Return if the track is a 3-way track. */
    is_3way() {
        return three_ways.has(this);
    }
    /** Return if the track is a tunnel. */
    is_tunnel() {
        return tunnels.has(this);
    }
    /** Return the swapped version of a swapping/switch track. */
    swap_track() {
        return swapped_tracks.get(this);
    }
    /** Return if the track is an ending track for numeral cars. */
    is_ncar_ending_track() {
        return ncar_endings.has(this);
    }
    /** Return if there is a placeholder semaphore on the tile. */
    is_placeholder_semaphore() {
        return normal_tracks.has(this);
    }
    /** Return the placeholder semaphore version of a tile. */
    add_placeholder_semaphore() {
        return semaphore_tracks.get(this);
    }
    /** Return the normal version of a semaphore'd tile. */
    remove_placeholder_semaphore() {
        return normal_tracks.get(this);
    }
}
exports.Track = Track;
Object.defineProperty(Track, "TRACKS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(Track, "EMPTY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(0)
});
Object.defineProperty(Track, "HORIZONTAL_TRACK", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(1)
});
Object.defineProperty(Track, "VERTICAL_TRACK", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(2)
});
Object.defineProperty(Track, "CAR_ENDING_TRACK_RIGHT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(3)
});
Object.defineProperty(Track, "ROADBLOCK", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(4)
}); // This tile applies to: fences, rocks, stations, post offices, or any other roadblock.
Object.defineProperty(Track, "BOTTOM_RIGHT_TURN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(5)
});
Object.defineProperty(Track, "BOTTOM_LEFT_TURN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(6)
});
Object.defineProperty(Track, "TOP_RIGHT_TURN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(7)
});
Object.defineProperty(Track, "TOP_LEFT_TURN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(8)
});
Object.defineProperty(Track, "BOTTOM_RIGHT_LEFT_3WAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(9)
}); // For 3-ways, the first two directions are the turn on top, and the last is the straight track underneath.
Object.defineProperty(Track, "BOTTOM_RIGHT_TOP_3WAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(10)
});
Object.defineProperty(Track, "BOTTOM_LEFT_RIGHT_3WAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(11)
});
Object.defineProperty(Track, "BOTTOM_LEFT_TOP_3WAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(12)
});
Object.defineProperty(Track, "TOP_RIGHT_LEFT_3WAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(13)
});
Object.defineProperty(Track, "TOP_RIGHT_BOTTOM_3WAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(14)
});
Object.defineProperty(Track, "TOP_LEFT_RIGHT_3WAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(15)
});
Object.defineProperty(Track, "TOP_LEFT_BOTTOM_3WAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(16)
});
Object.defineProperty(Track, "LEFT_FACING_TUNNEL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(17)
});
Object.defineProperty(Track, "RIGHT_FACING_TUNNEL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(18)
});
Object.defineProperty(Track, "DOWN_FACING_TUNNEL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(19)
});
Object.defineProperty(Track, "UP_FACING_TUNNEL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(20)
});
Object.defineProperty(Track, "NCAR_ENDING_TRACK_RIGHT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(21)
}); // The ending track is on the right side; it's only accessible from the left side of the track.
Object.defineProperty(Track, "NCAR_ENDING_TRACK_LEFT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(22)
});
// DO NOT USE THE TRACKS BELOW.
// They are placeholders indicating that a track will have a semaphore placed on it for generation.
Object.defineProperty(Track, "SEM_HORIZONTAL_TRACK", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(23)
});
Object.defineProperty(Track, "SEM_VERTICAL_TRACK", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(24)
});
Object.defineProperty(Track, "SEM_BOTTOM_RIGHT_TURN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(25)
});
Object.defineProperty(Track, "SEM_BOTTOM_LEFT_TURN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(26)
});
Object.defineProperty(Track, "SEM_TOP_RIGHT_TURN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(27)
});
Object.defineProperty(Track, "SEM_TOP_LEFT_TURN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(28)
});
// You can use these ones c:
Object.defineProperty(Track, "CAR_ENDING_TRACK_LEFT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(29)
});
Object.defineProperty(Track, "CAR_ENDING_TRACK_DOWN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(30)
});
Object.defineProperty(Track, "CAR_ENDING_TRACK_UP", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(31)
});
Object.defineProperty(Track, "NCAR_ENDING_TRACK_DOWN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(32)
});
Object.defineProperty(Track, "NCAR_ENDING_TRACK_UP", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Track(33)
});
const single_turns = new Set([Track.BOTTOM_RIGHT_TURN, Track.BOTTOM_LEFT_TURN, Track.TOP_RIGHT_TURN, Track.TOP_LEFT_TURN]);
const three_ways = new Set([
    Track.BOTTOM_RIGHT_LEFT_3WAY, Track.BOTTOM_RIGHT_TOP_3WAY, Track.BOTTOM_LEFT_RIGHT_3WAY,
    Track.BOTTOM_LEFT_TOP_3WAY, Track.TOP_RIGHT_LEFT_3WAY, Track.TOP_RIGHT_BOTTOM_3WAY,
    Track.TOP_LEFT_RIGHT_3WAY, Track.TOP_LEFT_BOTTOM_3WAY
]);
const tunnels = new Set([Track.LEFT_FACING_TUNNEL, Track.RIGHT_FACING_TUNNEL, Track.DOWN_FACING_TUNNEL, Track.UP_FACING_TUNNEL]);
const car_endings = new Set([Track.CAR_ENDING_TRACK_LEFT, Track.CAR_ENDING_TRACK_RIGHT, Track.CAR_ENDING_TRACK_DOWN, Track.CAR_ENDING_TRACK_UP]);
const ncar_endings = new Set([Track.NCAR_ENDING_TRACK_LEFT, Track.NCAR_ENDING_TRACK_RIGHT, Track.NCAR_ENDING_TRACK_DOWN, Track.NCAR_ENDING_TRACK_UP]);
const semaphore_tracks = new Map([
    [Track.HORIZONTAL_TRACK, Track.SEM_HORIZONTAL_TRACK],
    [Track.VERTICAL_TRACK, Track.SEM_VERTICAL_TRACK],
    [Track.BOTTOM_RIGHT_TURN, Track.SEM_BOTTOM_RIGHT_TURN],
    [Track.BOTTOM_LEFT_TURN, Track.SEM_BOTTOM_LEFT_TURN],
    [Track.TOP_RIGHT_TURN, Track.SEM_TOP_RIGHT_TURN],
    [Track.TOP_LEFT_TURN, Track.SEM_TOP_LEFT_TURN]
]);
const normal_tracks = new Map([
    [Track.SEM_HORIZONTAL_TRACK, Track.HORIZONTAL_TRACK],
    [Track.SEM_VERTICAL_TRACK, Track.VERTICAL_TRACK],
    [Track.SEM_BOTTOM_RIGHT_TURN, Track.BOTTOM_RIGHT_TURN],
    [Track.SEM_BOTTOM_LEFT_TURN, Track.BOTTOM_LEFT_TURN],
    [Track.SEM_TOP_RIGHT_TURN, Track.TOP_RIGHT_TURN],
    [Track.SEM_TOP_LEFT_TURN, Track.TOP_LEFT_TURN]
]);
const swapped_tracks = new Map([
    [Track.BOTTOM_RIGHT_LEFT_3WAY, Track.BOTTOM_LEFT_RIGHT_3WAY],
    [Track.BOTTOM_RIGHT_TOP_3WAY, Track.TOP_RIGHT_BOTTOM_3WAY],
    [Track.BOTTOM_LEFT_RIGHT_3WAY, Track.BOTTOM_RIGHT_LEFT_3WAY],
    [Track.BOTTOM_LEFT_TOP_3WAY, Track.TOP_LEFT_BOTTOM_3WAY],
    [Track.TOP_RIGHT_LEFT_3WAY, Track.TOP_LEFT_RIGHT_3WAY],
    [Track.TOP_RIGHT_BOTTOM_3WAY, Track.BOTTOM_RIGHT_TOP_3WAY],
    [Track.TOP_LEFT_RIGHT_3WAY, Track.TOP_RIGHT_LEFT_3WAY],
    [Track.TOP_LEFT_BOTTOM_3WAY, Track.BOTTOM_LEFT_TOP_3WAY]
]);
/** List names for each mod index for better readability. */
class Mod {
    constructor(value) {
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
        });
        Mod.MODS.set(value, this);
    }
    /** Return the Mod corresponding to the value. */
    static get(value) {
        return this.MODS.get(value);
    }
    /** Print the values of each Mod in the array. */
    static print_values(mods) {
        for (let i = 0; i < mods.length; i++) {
            console.log(JSON.stringify(mods[i].map(mod => mod.value)));
        }
    }
    /** Convert an array of numbers to an array of mods. */
    static convert_to_mods(mods) {
        let converted_mods = [];
        for (let i = 0; i < mods.length; i++) {
            converted_mods.push([]);
            for (let j = 0; j < mods[0].length; j++) {
                converted_mods[i].push(Mod.get(mods[i][j]));
            }
        }
        return converted_mods;
    }
    /**
     * Return if the mod is a CLOSED_GATE or SEMAPHORE.
     *
     * The purpose is to check if the mod is capable of stalling a car.
     */
    is_gate_or_sem() {
        return this === Mod.CLOSED_GATE || this === Mod.SEMAPHORE;
    }
}
exports.Mod = Mod;
Object.defineProperty(Mod, "MODS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(Mod, "EMPTY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(0)
});
Object.defineProperty(Mod, "SWITCH", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(1)
});
Object.defineProperty(Mod, "TUNNEL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(2)
});
Object.defineProperty(Mod, "CLOSED_GATE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(3)
});
Object.defineProperty(Mod, "OPEN_GATE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(4)
});
Object.defineProperty(Mod, "SWAPPING_TRACK", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(5)
});
Object.defineProperty(Mod, "STATION", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(6)
});
Object.defineProperty(Mod, "SWITCH_RAIL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(7)
});
Object.defineProperty(Mod, "SEMAPHORE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(8)
});
Object.defineProperty(Mod, "DEACTIVATED_MOD", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(9)
});
Object.defineProperty(Mod, "STARTING_CAR_TILE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(10)
});
Object.defineProperty(Mod, "POST_OFFICE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Mod(11)
});
/**
 * List names for each direction for better readability.
 *
 * CRASH indicates that a crash will occur.
 * UNKNOWN indicates that the direction is not determined, but it won't crash.
 */
class Direction {
    constructor(value) {
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
        });
    }
    static from_vector(vector) {
        /** Return the direction matching the given vector. */
        if (vector[0] === 0 && vector[1] === -1) {
            return this.LEFT;
        }
        if (vector[0] === 0 && vector[1] === 1) {
            return this.RIGHT;
        }
        if (vector[0] === 1 && vector[1] === 0) {
            return this.DOWN;
        }
        if (vector[0] === -1 && vector[1] === 0) {
            return this.UP;
        }
        throw new Error(`The given vector did not match any direction. Vector: ${vector}`);
    }
    to_vector() {
        /** Return the vector matching the given direction. */
        if (this === Direction.LEFT) {
            return [0, -1];
        }
        if (this === Direction.RIGHT) {
            return [0, 1];
        }
        if (this === Direction.DOWN) {
            return [1, 0];
        }
        if (this === Direction.UP) {
            return [-1, 0];
        }
        throw new TypeError(`The given Direction does not map to a vector. Direction: ${this.value}`);
    }
    reverse() {
        /** Return the reversed version of the direction. */
        if (this === Direction.LEFT) {
            return Direction.RIGHT;
        }
        if (this === Direction.RIGHT) {
            return Direction.LEFT;
        }
        if (this === Direction.DOWN) {
            return Direction.UP;
        }
        if (this === Direction.UP) {
            return Direction.DOWN;
        }
        throw new TypeError(`The given Direction cannot be reversed. Direction: ${this}`);
    }
    add_vector(vector) {
        /** Add the Direction's vector to the given vector. */
        const dir_vector = this.to_vector();
        return [vector[0] + dir_vector[0], vector[1] + dir_vector[1]];
    }
}
exports.Direction = Direction;
Object.defineProperty(Direction, "CRASH", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Direction(-2)
});
Object.defineProperty(Direction, "UNKNOWN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Direction(-1)
});
Object.defineProperty(Direction, "LEFT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Direction(0)
});
Object.defineProperty(Direction, "RIGHT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Direction(1)
});
Object.defineProperty(Direction, "DOWN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Direction(2)
});
Object.defineProperty(Direction, "UP", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Direction(3)
});
class CarType {
    constructor(name) {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
    }
}
exports.CarType = CarType;
Object.defineProperty(CarType, "CRASHED", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new CarType("CRASHED")
});
Object.defineProperty(CarType, "NORMAL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new CarType("NORMAL")
});
Object.defineProperty(CarType, "DECOY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new CarType("DECOY")
});
Object.defineProperty(CarType, "NUMERAL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new CarType("NUMERAL")
});
/**
 * Represent a Railbound car.
 *
 * @param pos - The indexed position of the car.
 * @param direction - The direction of the car.
 * @param num - The car's number.
 * @param type - The car's type.
 */
class Car {
    constructor(pos, direction, num, type) {
        Object.defineProperty(this, "pos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: pos
        });
        Object.defineProperty(this, "direction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: direction
        });
        Object.defineProperty(this, "num", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: num
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: type
        });
        /** The car's pos + the direction vector. */
        Object.defineProperty(this, "pos_ahead", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const dir_vector = direction.to_vector();
        this.pos_ahead = direction.add_vector(pos);
    }
    /** Reformat the json representation of a car to an object. */
    static from_json(car) {
        const pos = car.pos;
        const direction = car.direction;
        const type = car.type;
        return new Car(pos, Direction[direction], car.num, CarType[type]);
    }
    /** Return each track the car can access/generate from its direction. */
    generable_tracks() {
        if (this.direction === Direction.CRASH || this.direction == Direction.UNKNOWN) {
            throw TypeError(`The direction must be cardinal. Car: ${this}`);
        }
        return generable_tracks.get(this.direction);
    }
    /** Return each 3-way the car can access/generate from its direction, and intersecting track. */
    generable_3ways(track) {
        if (this.direction === Direction.CRASH || this.direction == Direction.UNKNOWN) {
            throw TypeError(`The direction must be cardinal. Car: ${this}`);
        }
        return generable3_ways.get(this.direction).get(track);
    }
    /** Return if the car is about to crash with the border. */
    border_crash(bounds) {
        const [y, x] = this.pos_ahead;
        return !(0 <= y && y < bounds[0] && 0 <= x && x < bounds[1]);
    }
    /** Return a crashed version of the car. */
    crash() {
        if (this.type !== CarType.DECOY) {
            throw TypeError(`The crashed car is not a decoy. Car: ${this}`);
        }
        return new Car(this.pos, this.direction, this.num, CarType.CRASHED);
    }
    /** Return the car that this car crashes with.
     *
     * Return void if no crashes occur.
     */
    same_tile_crashes(other_cars) {
        for (const car of other_cars) {
            if (this.pos_ahead[0] === car.pos[0] && this.pos_ahead[1] === car.pos[1]) {
                return car;
            }
        }
        return;
    }
    /** Return if the car will get into a head-on crash with any of other_cars. */
    head_on_crashes(other_cars) {
        // head_on_crash is the (y, x, direction) that will cause the crash.
        const head_on_crash = [this.pos_ahead[0], this.pos_ahead[1], this.direction.reverse()];
        for (const car of other_cars) {
            if (head_on_crash[0] === car.pos[0] &&
                head_on_crash[1] === car.pos[1] &&
                head_on_crash[2] === car.direction) {
                return true;
            }
        }
        return false;
    }
    /** Return the station/post office corresponding to this car. */
    get_station() {
        if (this.type === CarType.NORMAL) {
            return Mod.STATION;
        }
        if (this.type === CarType.NUMERAL) {
            return Mod.POST_OFFICE;
        }
        throw TypeError(`A car must be NORMAL or NUMERAL to get the station of it. Car: ${this}`);
    }
    /** Return if the car is on its corresponding station/post office. */
    on_correct_station(mod, mod_num) {
        return mod_num === this.num && mod === this.get_station();
    }
    /** Return the index of the car in cars + decoys + ncars. */
    car_index(cars, decoys, ncars) {
        if (this.type === CarType.NORMAL) {
            return this.num;
        }
        if (this.type === CarType.DECOY) {
            return this.num + cars.length;
        }
        if (this.type === CarType.NUMERAL) {
            return this.num + cars.length + decoys.length;
        }
        throw TypeError;
    }
}
exports.Car = Car;
const generable_tracks = new Map([
    [Direction.LEFT, [Track.HORIZONTAL_TRACK, Track.BOTTOM_RIGHT_TURN, Track.TOP_RIGHT_TURN]],
    [Direction.RIGHT, [Track.HORIZONTAL_TRACK, Track.BOTTOM_LEFT_TURN, Track.TOP_LEFT_TURN]],
    [Direction.DOWN, [Track.VERTICAL_TRACK, Track.TOP_RIGHT_TURN, Track.TOP_LEFT_TURN]],
    [Direction.UP, [Track.VERTICAL_TRACK, Track.BOTTOM_RIGHT_TURN, Track.BOTTOM_LEFT_TURN]]
]);
const generable3_ways = new Map([
    [Direction.LEFT, new Map([
            [Track.HORIZONTAL_TRACK, [Track.BOTTOM_RIGHT_LEFT_3WAY, Track.TOP_RIGHT_LEFT_3WAY]],
            [Track.VERTICAL_TRACK, [Track.BOTTOM_RIGHT_TOP_3WAY, Track.TOP_RIGHT_BOTTOM_3WAY]],
            [Track.BOTTOM_LEFT_TURN, [Track.BOTTOM_LEFT_RIGHT_3WAY,]],
            [Track.TOP_LEFT_TURN, [Track.TOP_LEFT_RIGHT_3WAY,]]
        ])],
    [Direction.RIGHT, new Map([
            [Track.HORIZONTAL_TRACK, [Track.BOTTOM_LEFT_RIGHT_3WAY, Track.TOP_LEFT_RIGHT_3WAY]],
            [Track.VERTICAL_TRACK, [Track.BOTTOM_LEFT_TOP_3WAY, Track.TOP_LEFT_BOTTOM_3WAY]],
            [Track.BOTTOM_RIGHT_TURN, [Track.BOTTOM_RIGHT_LEFT_3WAY,]],
            [Track.TOP_RIGHT_TURN, [Track.TOP_RIGHT_LEFT_3WAY,]]
        ])],
    [Direction.DOWN, new Map([
            [Track.HORIZONTAL_TRACK, [Track.TOP_RIGHT_LEFT_3WAY, Track.TOP_LEFT_RIGHT_3WAY]],
            [Track.VERTICAL_TRACK, [Track.TOP_RIGHT_BOTTOM_3WAY, Track.TOP_LEFT_BOTTOM_3WAY]],
            [Track.BOTTOM_RIGHT_TURN, [Track.BOTTOM_RIGHT_TOP_3WAY,]],
            [Track.BOTTOM_LEFT_TURN, [Track.BOTTOM_LEFT_TOP_3WAY,]]
        ])],
    [Direction.UP, new Map([
            [Track.HORIZONTAL_TRACK, [Track.BOTTOM_RIGHT_LEFT_3WAY, Track.BOTTOM_LEFT_RIGHT_3WAY]],
            [Track.VERTICAL_TRACK, [Track.BOTTOM_RIGHT_TOP_3WAY, Track.BOTTOM_LEFT_TOP_3WAY]],
            [Track.TOP_RIGHT_TURN, [Track.TOP_RIGHT_BOTTOM_3WAY,]],
            [Track.TOP_LEFT_TURN, [Track.TOP_LEFT_BOTTOM_3WAY,]]
        ])]
]);
/** semaphore_pass lists the relative tiles where a car must be to trigger a semaphore.
 * For example, a car would have to be on the tile to either trigger the LEFT or RIGHT of a
 * HORIZONTAL_TRACK with a semaphore on it to trigger the semaphore.
 */
exports.semaphore_pass = new Map([
    [Track.HORIZONTAL_TRACK, [Direction.LEFT, Direction.RIGHT]],
    [Track.VERTICAL_TRACK, [Direction.DOWN, Direction.UP]],
    [Track.BOTTOM_RIGHT_TURN, [Direction.DOWN, Direction.RIGHT]],
    [Track.BOTTOM_LEFT_TURN, [Direction.DOWN, Direction.LEFT]],
    [Track.TOP_RIGHT_TURN, [Direction.UP, Direction.RIGHT]],
    [Track.TOP_LEFT_TURN, [Direction.UP, Direction.LEFT]]
]);
/**
 * directions lists instructions on where to move a car depending on what track it's on, and what direction it's facing.
 * For example, a car on a BOTTOM_RIGHT_TURN and facing UP will move to the RIGHTrack.
 * CRASH indicates that the car will crash, and UNKNOWN indicates
 * the car's movement is not yet determined, but it won't crash.
 */
exports.directions = new Map([
    [Track.EMPTY, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.HORIZONTAL_TRACK, new Map([[Direction.LEFT, Direction.LEFT], [Direction.RIGHT, Direction.RIGHT], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.VERTICAL_TRACK, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.DOWN], [Direction.UP, Direction.UP]])],
    [Track.ROADBLOCK, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.BOTTOM_RIGHT_TURN, new Map([[Direction.LEFT, Direction.DOWN], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.RIGHT]])],
    [Track.BOTTOM_LEFT_TURN, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.DOWN], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.LEFT]])],
    [Track.TOP_RIGHT_TURN, new Map([[Direction.LEFT, Direction.UP], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.RIGHT], [Direction.UP, Direction.CRASH]])],
    [Track.TOP_LEFT_TURN, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.UP], [Direction.DOWN, Direction.LEFT], [Direction.UP, Direction.CRASH]])],
    [Track.BOTTOM_RIGHT_LEFT_3WAY, new Map([[Direction.LEFT, Direction.DOWN], [Direction.RIGHT, Direction.RIGHT], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.RIGHT]])],
    [Track.BOTTOM_RIGHT_TOP_3WAY, new Map([[Direction.LEFT, Direction.DOWN], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.DOWN], [Direction.UP, Direction.RIGHT]])],
    [Track.BOTTOM_LEFT_RIGHT_3WAY, new Map([[Direction.LEFT, Direction.LEFT], [Direction.RIGHT, Direction.DOWN], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.LEFT]])],
    [Track.BOTTOM_LEFT_TOP_3WAY, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.DOWN], [Direction.DOWN, Direction.DOWN], [Direction.UP, Direction.LEFT]])],
    [Track.TOP_RIGHT_LEFT_3WAY, new Map([[Direction.LEFT, Direction.UP], [Direction.RIGHT, Direction.RIGHT], [Direction.DOWN, Direction.RIGHT], [Direction.UP, Direction.CRASH]])],
    [Track.TOP_RIGHT_BOTTOM_3WAY, new Map([[Direction.LEFT, Direction.UP], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.RIGHT], [Direction.UP, Direction.UP]])],
    [Track.TOP_LEFT_RIGHT_3WAY, new Map([[Direction.LEFT, Direction.LEFT], [Direction.RIGHT, Direction.UP], [Direction.DOWN, Direction.LEFT], [Direction.UP, Direction.CRASH]])],
    [Track.TOP_LEFT_BOTTOM_3WAY, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.UP], [Direction.DOWN, Direction.LEFT], [Direction.UP, Direction.UP]])],
    [Track.LEFT_FACING_TUNNEL, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.UNKNOWN], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.RIGHT_FACING_TUNNEL, new Map([[Direction.LEFT, Direction.UNKNOWN], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.DOWN_FACING_TUNNEL, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.UNKNOWN]])],
    [Track.UP_FACING_TUNNEL, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.UNKNOWN], [Direction.UP, Direction.CRASH]])],
    [Track.CAR_ENDING_TRACK_RIGHT, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.UNKNOWN], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.CAR_ENDING_TRACK_LEFT, new Map([[Direction.LEFT, Direction.UNKNOWN], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.CAR_ENDING_TRACK_DOWN, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.UNKNOWN], [Direction.UP, Direction.CRASH]])],
    [Track.CAR_ENDING_TRACK_UP, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.UNKNOWN]])],
    [Track.NCAR_ENDING_TRACK_RIGHT, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.UNKNOWN], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.NCAR_ENDING_TRACK_LEFT, new Map([[Direction.LEFT, Direction.UNKNOWN], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.CRASH]])],
    [Track.NCAR_ENDING_TRACK_DOWN, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.UNKNOWN], [Direction.UP, Direction.CRASH]])],
    [Track.NCAR_ENDING_TRACK_UP, new Map([[Direction.LEFT, Direction.CRASH], [Direction.RIGHT, Direction.CRASH], [Direction.DOWN, Direction.CRASH], [Direction.UP, Direction.UNKNOWN]])]
]);
/**  Return every combination of the iterables. */
function product(...iterables) {
    let result = [[]];
    for (const iterable of iterables) {
        const pending = [];
        for (const y of result) {
            for (const x of iterable) {
                pending.push(y.concat(x));
            }
        }
        result = pending;
    }
    return result;
}
/** Copy an array. */
function copy_arr(array) {
    const copied_arr = [];
    if (!Array.isArray(array[0])) {
        copied_arr.push(...array);
    }
    else {
        for (const row of array) {
            copied_arr.push(copy_arr(row));
        }
    }
    return copied_arr;
}
/** Create a 4D array of zeros with the shape. */
function zeros(shape) {
    const array = [];
    for (let i = 0; i < shape[0]; i++) {
        array.push([]);
        for (let j = 0; j < shape[1]; j++) {
            array[i].push([]);
            for (let k = 0; k < shape[2]; k++) {
                array[i][j].push([]);
                for (let l = 0; l < shape[3]; l++) {
                    array[i][j][k].push(0);
                }
            }
        }
    }
    return array;
}
class Node {
    constructor(value, prev, next) {
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
        });
        Object.defineProperty(this, "prev", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: prev
        });
        Object.defineProperty(this, "next", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: next
        });
    }
}
class deque {
    constructor(list = []) {
        Object.defineProperty(this, "back", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "front", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_length", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        for (const item of list) {
            this.append(item);
        }
    }
    get length() {
        return this._length;
    }
    append(value) {
        if (!this.back || !this.front) {
            this.front = this.back = new Node(value);
        }
        else {
            this.front = this.front.next = new Node(value, this.front);
        }
        this._length++;
    }
    appendleft(value) {
        if (!this.back) {
            this.front = this.back = new Node(value, new Node(value));
        }
        else {
            this.back = this.back.prev = new Node(value, undefined, this.back);
        }
        this._length++;
    }
    pop() {
        if (!this.back || !this.front) {
            return undefined;
        }
        let popped = this.front.value;
        if (this.back === this.front) {
            this.back = this.front = undefined;
        }
        else {
            (this.front = this.front.prev).next = undefined;
        }
        this._length--;
        return popped;
    }
    popleft() {
        if (!this.back || !this.front) {
            return undefined;
        }
        let popped = this.back.value;
        if (this.back === this.front) {
            this.back = this.front = undefined;
        }
        else {
            (this.back = this.back.next).prev = undefined;
        }
        this._length--;
        return popped;
    }
}
exports.deque = deque;
