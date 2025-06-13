"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deque = exports.Car = exports.CarType = exports.Direction = exports.Mod = exports.Track = void 0;
exports.product = product;
exports.copy_arr = copy_arr;
exports.zeros = zeros;
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
    static get(value) {
        /** Return the Track corresponding to the value. */
        return this.TRACKS.get(value);
    }
    static print_values(board) {
        /** Print the values of each Track in the array. */
        for (let i = 0; i < board.length; i++) {
            console.log(JSON.stringify(board[i].map(track => track.value)));
        }
    }
    static convert_to_tracks(board) {
        /** Convert an array of numbers to an array of tracks. */
        let converted_board = [];
        for (let i = 0; i < board.length; i++) {
            converted_board.push([]);
            for (let j = 0; j < board[0].length; j++) {
                converted_board[i].push(Track.get(board[i][j]));
            }
        }
        return converted_board;
    }
    is_empty() {
        /** Return if the track is an EMPTY track. */
        return this === Track.EMPTY;
    }
    is_straight() {
        /** Return if the track is straight. */
        return this === Track.HORIZONTAL_TRACK || this === Track.VERTICAL_TRACK;
    }
    is_car_ending_track() {
        /** Return if the track is an ending track for normal cars. */
        return this === Track.CAR_ENDING_TRACK;
    }
    is_turn() {
        /** Return if the track is a single-turn track. */
        return single_turns.has(this);
    }
    is_3way() {
        /** Return if the track is a 3-way track. */
        return three_ways.has(this);
    }
    is_tunnel() {
        /** Return if the track is a tunnel. */
        return tunnels.has(this);
    }
    swap_track() {
        /** Return the swapped version of a swapping/switch track. */
        return swapped_tracks.get(this);
    }
    is_ncar_ending_track() {
        /** Return if the track is an ending track for numeral cars. */
        return ncar_endings.has(this);
    }
    is_placeholder_semaphore() {
        /** Return if there is a placeholder semaphore on the tile. */
        return normal_tracks.has(this);
    }
    add_placeholder_semaphore() {
        /** Return the placeholder semaphore version of a tile. */
        return semaphore_tracks.get(this);
    }
    remove_placeholder_semaphore() {
        /** Return the normal version of a semaphore'd tile. */
        return normal_tracks.get(this);
    }
}
exports.Track = Track;
/** List names for each track index for better readability. */
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
Object.defineProperty(Track, "CAR_ENDING_TRACK", {
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
const single_turns = new Set([Track.BOTTOM_RIGHT_TURN, Track.BOTTOM_LEFT_TURN, Track.TOP_RIGHT_TURN, Track.TOP_LEFT_TURN]);
const three_ways = new Set([
    Track.BOTTOM_RIGHT_LEFT_3WAY, Track.BOTTOM_RIGHT_TOP_3WAY, Track.BOTTOM_LEFT_RIGHT_3WAY,
    Track.BOTTOM_LEFT_TOP_3WAY, Track.TOP_RIGHT_LEFT_3WAY, Track.TOP_RIGHT_BOTTOM_3WAY,
    Track.TOP_LEFT_RIGHT_3WAY, Track.TOP_LEFT_BOTTOM_3WAY
]);
const tunnels = new Set([Track.LEFT_FACING_TUNNEL, Track.RIGHT_FACING_TUNNEL, Track.DOWN_FACING_TUNNEL, Track.UP_FACING_TUNNEL]);
const ncar_endings = new Set([Track.NCAR_ENDING_TRACK_LEFT, Track.NCAR_ENDING_TRACK_RIGHT]);
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
    static get(value) {
        /** Return the Mod corresponding to the value. */
        return this.MODS.get(value);
    }
    static print_values(mods) {
        /** Print the values of each Mod in the array. */
        for (let i = 0; i < mods.length; i++) {
            console.log(JSON.stringify(mods[i].map(mod => mod.value)));
        }
    }
    static convert_to_mods(mods) {
        /** Convert an array of numbers to an array of mods. */
        let converted_mods = [];
        for (let i = 0; i < mods.length; i++) {
            converted_mods.push([]);
            for (let j = 0; j < mods[0].length; j++) {
                converted_mods[i].push(Mod.get(mods[i][j]));
            }
        }
        return converted_mods;
    }
    is_gate_or_sem() {
        /**
         * Return if the mod is a CLOSED_GATE or SEMAPHORE.
         *
         * The purpose is to check if the mod is capable of stalling a car.
         */
        return this === Mod.CLOSED_GATE || this === Mod.SEMAPHORE;
    }
}
exports.Mod = Mod;
/** List names for each mod index for better readability. */
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
/**
 * List names for each direction for better readability.
 *
 * CRASH indicates that a crash will occur.
 * UNKNOWN indicates that the direction is not determined, but it won't crash.
 */
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
        /**
         * Represent a Railbound car.
         *
         * @param pos - The indexed position of the car.
         * @param direction - The direction of the car.
         * @param num - The car's number.
         * @param type - The car's type.
         */
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
    static from_json(car) {
        /** Reformat the json representation of a car to an object. */
        const pos = car.pos;
        const direction = car.direction;
        const type = car.type;
        return new Car(pos, Direction[direction], car.num, CarType[type]);
    }
    border_crash(bounds) {
        /** Return if the car is about to crash with the border. */
        const [y, x] = this.pos_ahead;
        return !(0 <= y && y < bounds[0] && 0 <= x && x < bounds[1]);
    }
    crash() {
        /** Return a crashed version of the car. */
        if (this.type !== CarType.DECOY) {
            throw TypeError(`The crashed car is not a decoy. Car: ${this}`);
        }
        return new Car(this.pos, this.direction, this.num, CarType.CRASHED);
    }
    same_tile_crashes(other_cars) {
        /** Return the car that this car crashes with.
         *
         * Return void if no crashes occur.
         */
        for (const car of other_cars) {
            if (this.pos_ahead[0] === car.pos[0] && this.pos_ahead[1] === car.pos[1]) {
                return car;
            }
        }
        return;
    }
    head_on_crashes(other_cars) {
        /** Return if the car will get into a head-on crash with any of other_cars. */
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
    get_station() {
        /** Return the station/post office corresponding to this car. */
        if (this.type === CarType.NORMAL) {
            return Mod.STATION;
        }
        if (this.type === CarType.NUMERAL) {
            return Mod.POST_OFFICE;
        }
        throw TypeError(`A car must be NORMAL or NUMERAL to get the station of it. CarType: ${this.type}`);
    }
    on_correct_station(mod, mod_num) {
        /** Return if the car is on its corresponding station/post office. */
        return mod_num === this.num && mod === this.get_station();
    }
    car_index(cars, decoys, ncars) {
        /** Return the index of the car in cars + decoys + ncars. */
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
function product(...iterables) {
    /**  Return every combination of the iterables. */
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
function copy_arr(array) {
    /** Copy an array. */
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
function zeros(shape) {
    /** Create a 4D array of zeros with the shape. */
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
