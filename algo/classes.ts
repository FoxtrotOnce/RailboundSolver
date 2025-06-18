/** List names for each track index for better readability. */
export class Track {
    private static TRACKS = new Map<number, Track>()

    static readonly EMPTY = new Track(0)
    static readonly HORIZONTAL_TRACK = new Track(1)
    static readonly VERTICAL_TRACK = new Track(2)
    static readonly CAR_ENDING_TRACK_RIGHT = new Track(3)
    static readonly ROADBLOCK = new Track(4)  // This tile applies to: fences, rocks, stations, post offices, or any other roadblock.
    static readonly BOTTOM_RIGHT_TURN = new Track(5)
    static readonly BOTTOM_LEFT_TURN = new Track(6)
    static readonly TOP_RIGHT_TURN = new Track(7)
    static readonly TOP_LEFT_TURN = new Track(8)
    static readonly BOTTOM_RIGHT_LEFT_3WAY = new Track(9)  // For 3-ways, the first two directions are the turn on top, and the last is the straight track underneath.
    static readonly BOTTOM_RIGHT_TOP_3WAY = new Track(10)
    static readonly BOTTOM_LEFT_RIGHT_3WAY = new Track(11)
    static readonly BOTTOM_LEFT_TOP_3WAY = new Track(12)
    static readonly TOP_RIGHT_LEFT_3WAY = new Track(13)
    static readonly TOP_RIGHT_BOTTOM_3WAY = new Track(14)
    static readonly TOP_LEFT_RIGHT_3WAY = new Track(15)
    static readonly TOP_LEFT_BOTTOM_3WAY = new Track(16)
    static readonly LEFT_FACING_TUNNEL = new Track(17)
    static readonly RIGHT_FACING_TUNNEL = new Track(18)
    static readonly DOWN_FACING_TUNNEL = new Track(19)
    static readonly UP_FACING_TUNNEL = new Track(20)
    static readonly NCAR_ENDING_TRACK_RIGHT = new Track(21)  // The ending track is on the right side; it's only accessible from the left side of the track.
    static readonly NCAR_ENDING_TRACK_LEFT = new Track(22)
    // DO NOT USE THE TRACKS BELOW.
    // They are placeholders indicating that a track will have a semaphore placed on it for generation.
    static readonly SEM_HORIZONTAL_TRACK = new Track(23)
    static readonly SEM_VERTICAL_TRACK = new Track(24)
    static readonly SEM_BOTTOM_RIGHT_TURN = new Track(25)
    static readonly SEM_BOTTOM_LEFT_TURN = new Track(26)
    static readonly SEM_TOP_RIGHT_TURN = new Track(27)
    static readonly SEM_TOP_LEFT_TURN = new Track(28)
    // You can use these ones c:
    static readonly CAR_ENDING_TRACK_LEFT = new Track(29)
    static readonly CAR_ENDING_TRACK_DOWN = new Track(30)
    static readonly CAR_ENDING_TRACK_UP = new Track(31)
    static readonly NCAR_ENDING_TRACK_DOWN = new Track(32)
    static readonly NCAR_ENDING_TRACK_UP = new Track(33)

    private constructor(readonly value: number) {Track.TRACKS.set(value, this)}

    /** Return the Track corresponding to the value. */
    static get(value: number): Track {
        return this.TRACKS.get(value)!
    }

    /** Print the values of each Track in the array. */
    static print_values(board: Track[][]): void {
        for (let i = 0; i < board.length; i++) {
            console.log(JSON.stringify(board[i].map(track => track.value)))
        }
    }

    /** Convert an array of numbers to an array of tracks. */
    static convert_to_tracks(board: number[][]): Track[][] {
        let converted_board: Track[][] = []
        for (let i = 0; i < board.length; i++) {
            converted_board.push([])
            for (let j = 0; j < board[0].length; j++) {
                converted_board[i].push(Track.get(board[i][j]))
            }
        }
        return converted_board
    }

    /** Return if the track is an EMPTY track. */
    is_empty(): boolean {
        return this === Track.EMPTY
    }
    /** Return if the track is straight. */
    is_straight(): boolean {
        return this === Track.HORIZONTAL_TRACK || this === Track.VERTICAL_TRACK
    }
    /** Return if the track is an ending track for normal cars. */
    is_car_ending_track(): boolean {
        return car_endings.has(this)
    }
    /** Return if the track is a single-turn track. */
    is_turn(): boolean {
        return single_turns.has(this)
    }
    /** Return if the track is a 3-way track. */
    is_3way(): boolean {
        return three_ways.has(this)
    }
    /** Return if the track is a tunnel. */
    is_tunnel(): boolean {
        return tunnels.has(this)
    }
    /** Return the swapped version of a swapping/switch track. */
    swap_track(): Track {
        return swapped_tracks.get(this)!
    }
    /** Return if the track is an ending track for numeral cars. */
    is_ncar_ending_track(): boolean {
        return ncar_endings.has(this)
    }
    /** Return if there is a placeholder semaphore on the tile. */
    is_placeholder_semaphore(): boolean {
        return normal_tracks.has(this)
    }
    /** Return the placeholder semaphore version of a tile. */
    add_placeholder_semaphore(): Track {
        return semaphore_tracks.get(this)!
    }
    /** Return the normal version of a semaphore'd tile. */
    remove_placeholder_semaphore(): Track {
        return normal_tracks.get(this)!
    }
}
const single_turns = new Set<Track>([Track.BOTTOM_RIGHT_TURN, Track.BOTTOM_LEFT_TURN, Track.TOP_RIGHT_TURN, Track.TOP_LEFT_TURN])
const three_ways = new Set<Track>([
        Track.BOTTOM_RIGHT_LEFT_3WAY, Track.BOTTOM_RIGHT_TOP_3WAY, Track.BOTTOM_LEFT_RIGHT_3WAY,
        Track.BOTTOM_LEFT_TOP_3WAY, Track.TOP_RIGHT_LEFT_3WAY, Track.TOP_RIGHT_BOTTOM_3WAY,
        Track.TOP_LEFT_RIGHT_3WAY, Track.TOP_LEFT_BOTTOM_3WAY
])
const tunnels = new Set<Track>([Track.LEFT_FACING_TUNNEL, Track.RIGHT_FACING_TUNNEL, Track.DOWN_FACING_TUNNEL, Track.UP_FACING_TUNNEL])
const car_endings = new Set<Track>([Track.CAR_ENDING_TRACK_LEFT, Track.CAR_ENDING_TRACK_RIGHT, Track.CAR_ENDING_TRACK_DOWN, Track.CAR_ENDING_TRACK_UP])
const ncar_endings = new Set<Track>([Track.NCAR_ENDING_TRACK_LEFT, Track.NCAR_ENDING_TRACK_RIGHT, Track.NCAR_ENDING_TRACK_DOWN, Track.NCAR_ENDING_TRACK_UP])
const semaphore_tracks = new Map<Track, Track>([
    [Track.HORIZONTAL_TRACK, Track.SEM_HORIZONTAL_TRACK],
    [Track.VERTICAL_TRACK, Track.SEM_VERTICAL_TRACK],
    [Track.BOTTOM_RIGHT_TURN, Track.SEM_BOTTOM_RIGHT_TURN],
    [Track.BOTTOM_LEFT_TURN, Track.SEM_BOTTOM_LEFT_TURN],
    [Track.TOP_RIGHT_TURN, Track.SEM_TOP_RIGHT_TURN],
    [Track.TOP_LEFT_TURN, Track.SEM_TOP_LEFT_TURN]
])
const normal_tracks = new Map<Track, Track>([
    [Track.SEM_HORIZONTAL_TRACK, Track.HORIZONTAL_TRACK],
    [Track.SEM_VERTICAL_TRACK, Track.VERTICAL_TRACK],
    [Track.SEM_BOTTOM_RIGHT_TURN, Track.BOTTOM_RIGHT_TURN],
    [Track.SEM_BOTTOM_LEFT_TURN, Track.BOTTOM_LEFT_TURN],
    [Track.SEM_TOP_RIGHT_TURN, Track.TOP_RIGHT_TURN],
    [Track.SEM_TOP_LEFT_TURN, Track.TOP_LEFT_TURN]
])
const swapped_tracks = new Map<Track, Track>([
    [Track.BOTTOM_RIGHT_LEFT_3WAY, Track.BOTTOM_LEFT_RIGHT_3WAY],
    [Track.BOTTOM_RIGHT_TOP_3WAY, Track.TOP_RIGHT_BOTTOM_3WAY],
    [Track.BOTTOM_LEFT_RIGHT_3WAY, Track.BOTTOM_RIGHT_LEFT_3WAY],
    [Track.BOTTOM_LEFT_TOP_3WAY, Track.TOP_LEFT_BOTTOM_3WAY],
    [Track.TOP_RIGHT_LEFT_3WAY, Track.TOP_LEFT_RIGHT_3WAY],
    [Track.TOP_RIGHT_BOTTOM_3WAY, Track.BOTTOM_RIGHT_TOP_3WAY],
    [Track.TOP_LEFT_RIGHT_3WAY, Track.TOP_RIGHT_LEFT_3WAY],
    [Track.TOP_LEFT_BOTTOM_3WAY, Track.BOTTOM_LEFT_TOP_3WAY]
])

/** List names for each mod index for better readability. */
export class Mod {
    private static MODS = new Map<number, Mod>()
    
    static readonly EMPTY = new Mod(0)
    static readonly SWITCH = new Mod(1)
    static readonly TUNNEL = new Mod(2)
    static readonly CLOSED_GATE = new Mod(3)
    static readonly OPEN_GATE = new Mod(4)
    static readonly SWAPPING_TRACK = new Mod(5)
    static readonly STATION = new Mod(6)
    static readonly SWITCH_RAIL = new Mod(7)
    static readonly SEMAPHORE = new Mod(8)
    static readonly DEACTIVATED_MOD = new Mod(9)
    static readonly STARTING_CAR_TILE = new Mod(10)
    static readonly POST_OFFICE = new Mod(11)

    private constructor(readonly value: number) {Mod.MODS.set(value, this)}

    /** Return the Mod corresponding to the value. */
    static get(value: number): Mod {
        return this.MODS.get(value)!
    }

    /** Print the values of each Mod in the array. */
    static print_values(mods: Mod[][]): void {
        for (let i = 0; i < mods.length; i++) {
            console.log(JSON.stringify(mods[i].map(mod => mod.value)))
        }
    }

    /** Convert an array of numbers to an array of mods. */
    static convert_to_mods(mods: number[][]): Mod[][] {
        let converted_mods: Mod[][] = []
        for (let i = 0; i < mods.length; i++) {
            converted_mods.push([])
            for (let j = 0; j < mods[0].length; j++) {
                converted_mods[i].push(Mod.get(mods[i][j]))
            }
        }
        return converted_mods
    }

    /** 
     * Return if the mod is a CLOSED_GATE or SEMAPHORE.
     * 
     * The purpose is to check if the mod is capable of stalling a car.
     */
    is_gate_or_sem(): boolean {
        return this === Mod.CLOSED_GATE || this === Mod.SEMAPHORE
    }
}

/** 
 * List names for each direction for better readability.
 * 
 * CRASH indicates that a crash will occur.
 * UNKNOWN indicates that the direction is not determined, but it won't crash.
 */
export class Direction {
    static readonly CRASH = new Direction(-2)
    static readonly UNKNOWN = new Direction(-1)
    static readonly LEFT = new Direction(0)
    static readonly RIGHT = new Direction(1)
    static readonly DOWN = new Direction(2)
    static readonly UP = new Direction(3)

    private constructor(readonly value: number) {}

    static from_vector(vector: readonly [number, number]): Direction {
        /** Return the direction matching the given vector. */
        if (vector[0] === 0 && vector[1] === -1) {
            return this.LEFT
        }
        if (vector[0] === 0 && vector[1] === 1) {
            return this.RIGHT
        }
        if (vector[0] === 1 && vector[1] === 0) {
            return this.DOWN
        }
        if (vector[0] === -1 && vector[1] === 0) {
            return this.UP
        }
        throw new Error(`The given vector did not match any direction. Vector: ${vector}`)
    }
    to_vector(): readonly [number, number] {
        /** Return the vector matching the given direction. */
        if (this === Direction.LEFT) {
            return [0, -1]
        }
        if (this === Direction.RIGHT) {
            return [0, 1]
        }
        if (this === Direction.DOWN) {
            return [1, 0]
        }
        if (this === Direction.UP) {
            return [-1, 0]
        }
        throw new TypeError(`The given Direction does not map to a vector. Direction: ${this.value}`)
    }
    reverse(): Direction {
        /** Return the reversed version of the direction. */
        if (this === Direction.LEFT) {
            return Direction.RIGHT
        }
        if (this === Direction.RIGHT) {
            return Direction.LEFT
        }
        if (this === Direction.DOWN) {
            return Direction.UP
        }
        if (this === Direction.UP) {
            return Direction.DOWN
        }
        throw new TypeError(`The given Direction cannot be reversed. Direction: ${this}`)
    }
    add_vector(vector: readonly [number, number]): readonly [number, number] {
        /** Add the Direction's vector to the given vector. */
        const dir_vector = this.to_vector()
        return [vector[0] + dir_vector[0], vector[1] + dir_vector[1]]
    }
}

export class CarType {
    static readonly CRASHED = new CarType("CRASHED")
    static readonly NORMAL = new CarType("NORMAL")
    static readonly DECOY = new CarType("DECOY")
    static readonly NUMERAL = new CarType("NUMERAL")

    private constructor(readonly name: string) {}
}

/** 
 * Represent a Railbound car.
 * 
 * @param pos - The indexed position of the car.
 * @param direction - The direction of the car.
 * @param num - The car's number.
 * @param type - The car's type.
 */
export class Car {
    /** The car's pos + the direction vector. */
    pos_ahead: readonly [number, number]

    constructor(public pos: readonly [number, number], public direction: Direction, public num: number, public type: CarType) {
        this.pos_ahead = direction.add_vector(pos)
    }
    /** Reformat the json representation of a car to an object. */
    static from_json(car: {pos: number[], direction: string, num: number, type: string}): Car {
        const pos = car.pos as [number, number]
        const direction = car.direction as "LEFT" | "RIGHT" |"DOWN" | "UP"
        const type = car.type as keyof typeof CarType
        return new Car(pos, Direction[direction], car.num, CarType[type])
    }
    /** Return each track the car can access/generate from its direction. */
    generable_tracks(): Track[] {
        if (this.direction === Direction.CRASH || this.direction == Direction.UNKNOWN) {
            throw TypeError(`The direction must be cardinal. Car: ${this}`)
        }
        return generable_tracks.get(this.direction)!
    }
    /** Return each 3-way the car can access/generate from its direction, and intersecting track. */
    generable_3ways(track: Track): Track[] {
        if (this.direction === Direction.CRASH || this.direction == Direction.UNKNOWN) {
            throw TypeError(`The direction must be cardinal. Car: ${this}`)
        }
        return generable3_ways.get(this.direction)!.get(track)!
    }
    /** Return if the car is about to crash with the border. */
    border_crash(bounds: readonly [number, number]): boolean {
        const [y, x] = this.pos_ahead
        return !(0 <= y && y < bounds[0] && 0 <= x && x < bounds[1])
    }
    /** Return a crashed version of the car. */
    crash(): Car {
        if (this.type !== CarType.DECOY) {
            throw TypeError(`The crashed car is not a decoy. Car: ${this}`)
        }
        return new Car(this.pos, this.direction, this.num, CarType.CRASHED)
    }
    /** Return the car that this car crashes with.
     * 
     * Return void if no crashes occur.
     */
    same_tile_crashes(other_cars: Car[]): Car | void {
        for (const car of other_cars) {
            if (this.pos_ahead[0] === car.pos[0] && this.pos_ahead[1] === car.pos[1]) {
                return car
            }
        }
        return
    }
    /** Return if the car will get into a head-on crash with any of other_cars. */
    head_on_crashes(other_cars: Car[]): boolean {
        // head_on_crash is the (y, x, direction) that will cause the crash.
        const head_on_crash: readonly [number, number, Direction] = [this.pos_ahead[0], this.pos_ahead[1], this.direction.reverse()]
        for (const car of other_cars) {
            if (
                head_on_crash[0] === car.pos[0] &&
                head_on_crash[1] === car.pos[1] &&
                head_on_crash[2] === car.direction
            ) {
                return true
            }
        }
        return false
    }
    /** Return the station/post office corresponding to this car. */
    get_station(): Mod {
        if (this.type === CarType.NORMAL) {
            return Mod.STATION
        }
        if (this.type === CarType.NUMERAL) {
            return Mod.POST_OFFICE
        }
        throw TypeError(`A car must be NORMAL or NUMERAL to get the station of it. Car: ${this}`)
    }
    /** Return if the car is on its corresponding station/post office. */
    on_correct_station(mod: Mod, mod_num: number): boolean {
        return mod_num === this.num && mod === this.get_station()
    }
    /** Return the index of the car in cars + decoys + ncars. */
    car_index(cars: Car[], decoys: Car[], ncars: Car[]): number {
        if (this.type === CarType.NORMAL) {
            return this.num
        }
        if (this.type === CarType.DECOY) {
            return this.num + cars.length
        }
        if (this.type === CarType.NUMERAL) {
            return this.num + cars.length + decoys.length
        }
        throw TypeError
    }
}

const generable_tracks = new Map<Direction, Track[]>([
    [Direction.LEFT, [Track.HORIZONTAL_TRACK, Track.BOTTOM_RIGHT_TURN, Track.TOP_RIGHT_TURN]],
    [Direction.RIGHT, [Track.HORIZONTAL_TRACK, Track.BOTTOM_LEFT_TURN, Track.TOP_LEFT_TURN]],
    [Direction.DOWN, [Track.VERTICAL_TRACK, Track.TOP_RIGHT_TURN, Track.TOP_LEFT_TURN]],
    [Direction.UP, [Track.VERTICAL_TRACK, Track.BOTTOM_RIGHT_TURN, Track.BOTTOM_LEFT_TURN]]
])
const generable3_ways = new Map<Direction, Map<Track, Track[]>>([
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
])
/** semaphore_pass lists the relative tiles where a car must be to trigger a semaphore.
 * For example, a car would have to be on the tile to either trigger the LEFT or RIGHT of a
 * HORIZONTAL_TRACK with a semaphore on it to trigger the semaphore.
 */
export const semaphore_pass = new Map<Track, Direction[]>([
    [Track.HORIZONTAL_TRACK, [Direction.LEFT, Direction.RIGHT]],
    [Track.VERTICAL_TRACK, [Direction.DOWN, Direction.UP]],
    [Track.BOTTOM_RIGHT_TURN, [Direction.DOWN, Direction.RIGHT]],
    [Track.BOTTOM_LEFT_TURN, [Direction.DOWN, Direction.LEFT]],
    [Track.TOP_RIGHT_TURN, [Direction.UP, Direction.RIGHT]],
    [Track.TOP_LEFT_TURN, [Direction.UP, Direction.LEFT]]
])
/** 
 * directions lists instructions on where to move a car depending on what track it's on, and what direction it's facing.
 * For example, a car on a BOTTOM_RIGHT_TURN and facing UP will move to the RIGHTrack.
 * CRASH indicates that the car will crash, and UNKNOWN indicates
 * the car's movement is not yet determined, but it won't crash.
 */
export const directions = new Map<Track, Map<Direction, Direction>>([
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
])

/**  Return every combination of the iterables. */
export function product<T>(...iterables: T[][]): T[][] {
    let result: T[][] = [[]]
    for (const iterable of iterables) {
        const pending: T[][] = []
        for (const y of result) {
            for (const x of iterable) {
                pending.push(y.concat(x))
            }
        }
        result = pending
    }
    return result
}
/** Copy an array. */
export function copy_arr(array: any): any {
    const copied_arr: any = []
    if (!Array.isArray(array[0])) {
        copied_arr.push(...array)
    } else {
        for (const row of array) {
            copied_arr.push(copy_arr(row))
        }
    }
    return copied_arr
}
/** Create a 4D array of zeros with the shape. */
export function zeros(shape: [number, number, number, number]): number[][][][] {
    const array: number[][][][] = []
    for (let i = 0; i < shape[0]; i++) {
        array.push([])
    for (let j = 0; j < shape[1]; j++) {
        array[i].push([])
    for (let k = 0; k < shape[2]; k++) {
        array[i][j].push([])
    for (let l = 0; l < shape[3]; l++) {
        array[i][j][k].push(0)
    }}}}
    return array
}
class Node<T> {
    constructor(public value: T, public prev?: Node<T>, public next?: Node<T>) {}
}
export class deque<T> {
    private back: Node<T> | undefined
    private front: Node<T> | undefined
    private _length: number = 0
    constructor(list: T[] = []) {
        for (const item of list) {
            this.append(item)
        }
    }
    get length(): number {
        return this._length
    }
    append(value: T): void {
        if (!this.back || !this.front) {
            this.front = this.back = new Node(value)
        } else {
            this.front = this.front.next = new Node(value, this.front)
        }
        this._length++
    }
    appendleft(value: T): void {
        if (!this.back) {
            this.front = this.back = new Node(value, new Node(value))
        } else {
            this.back = this.back.prev = new Node(value, undefined, this.back)
        }
        this._length++
    }
    pop(): T | undefined {
        if (!this.back || !this.front) {
            return undefined
        }
        let popped: T = this.front.value
        if (this.back === this.front) {
            this.back = this.front = undefined
        } else {
            (this.front = this.front.prev)!.next = undefined
        }
        this._length--
        return popped
    }
    popleft(): T | undefined {
        if (!this.back || !this.front) {
            return undefined
        }
        let popped: T = this.back.value
        if (this.back === this.front) {
            this.back = this.front = undefined
        } else {
            (this.back = this.back.next)!.prev = undefined
        }
        this._length--
        return popped
    }
}
