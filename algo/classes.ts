export class Track {
    /** List names for each track index for better readability. */
    private static TRACKS = new Map<number, Track>()

    static readonly EMPTY = new Track(0)
    static readonly HORIZONTAL_TRACK = new Track(1)
    static readonly VERTICAL_TRACK = new Track(2)
    static readonly CAR_ENDING_TRACK = new Track(3)
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

    private constructor(readonly value: number) {Track.TRACKS.set(value, this)}

    static get(value: number): Track {
        /** Return the Track corresponding to the value. */
        return this.TRACKS.get(value)!
    }

    static print_values(board: Track[][]): void {
        /** Print the values of each Track in the array. */
        for (let i = 0; i < board.length; i++) {
            console.log(JSON.stringify(board[i].map(track => track.value)))
        }
    }

    static convert_to_tracks(board: number[][]): Track[][] {
        /** Convert an array of numbers to an array of tracks. */
        let converted_board: Track[][] = []
        for (let i = 0; i < board.length; i++) {
            converted_board.push([])
            for (let j = 0; j < board[0].length; j++) {
                converted_board[i].push(Track.get(board[i][j]))
            }
        }
        return converted_board
    }

    is_empty(): boolean {
        /** Return if the track is an EMPTY track. */
        return this === Track.EMPTY
    }
    is_straight(): boolean {
        /** Return if the track is straight. */
        return this === Track.HORIZONTAL_TRACK || this === Track.VERTICAL_TRACK
    }
    is_car_ending_track(): boolean {
        /** Return if the track is an ending track for normal cars. */
        return this === Track.CAR_ENDING_TRACK
    }
    is_turn(): boolean {
        /** Return if the track is a single-turn track. */
        return single_turns.has(this)
    }
    is_3way(): boolean {
        /** Return if the track is a 3-way track. */
        return three_ways.has(this)
    }
    is_tunnel(): boolean {
        /** Return if the track is a tunnel. */
        return tunnels.has(this)
    }
    swap_track(): Track {
        /** Return the swapped version of a swapping/switch track. */
        return swapped_tracks.get(this)!
    }
    is_ncar_ending_track(): boolean {
        /** Return if the track is an ending track for numeral cars. */
        return ncar_endings.has(this)
    }
    is_placeholder_semaphore(): boolean {
        /** Return if there is a placeholder semaphore on the tile. */
        return normal_tracks.has(this)
    }
    add_placeholder_semaphore(): Track {
        /** Return the placeholder semaphore version of a tile. */
        return semaphore_tracks.get(this)!
    }
    remove_placeholder_semaphore(): Track {
        /** Return the normal version of a semaphore'd tile. */
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
const ncar_endings = new Set<Track>([Track.NCAR_ENDING_TRACK_LEFT, Track.NCAR_ENDING_TRACK_RIGHT])
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

export class Mod {
    /** List names for each mod index for better readability. */
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

    static get(value: number): Mod {
        /** Return the Mod corresponding to the value. */
        return this.MODS.get(value)!
    }

    static print_values(mods: Mod[][]): void {
        /** Print the values of each Mod in the array. */
        for (let i = 0; i < mods.length; i++) {
            console.log(JSON.stringify(mods[i].map(mod => mod.value)))
        }
    }

    static convert_to_mods(mods: number[][]): Mod[][] {
        /** Convert an array of numbers to an array of mods. */
        let converted_mods: Mod[][] = []
        for (let i = 0; i < mods.length; i++) {
            converted_mods.push([])
            for (let j = 0; j < mods[0].length; j++) {
                converted_mods[i].push(Mod.get(mods[i][j]))
            }
        }
        return converted_mods
    }

    is_gate_or_sem(): boolean {
        /** 
         * Return if the mod is a CLOSED_GATE or SEMAPHORE.
         * 
         * The purpose is to check if the mod is capable of stalling a car.
         */
        return this === Mod.CLOSED_GATE || this === Mod.SEMAPHORE
    }
}

export class Direction {
    /** 
     * List names for each direction for better readability.
     * 
     * CRASH indicates that a crash will occur.
     * UNKNOWN indicates that the direction is not determined, but it won't crash.
     */
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

export class Car {
    /** 
     * Represent a Railbound car.
     * 
     * @param pos - The indexed position of the car.
     * @param direction - The direction of the car.
     * @param num - The car's number.
     * @param type - The car's type.
     */
    /** The car's pos + the direction vector. */
    pos_ahead: readonly [number, number]

    constructor(public pos: readonly [number, number], public direction: Direction, public num: number, public type: CarType) {
        const dir_vector = direction.to_vector()
        this.pos_ahead = direction.add_vector(pos)
    }

    static from_json(car: {pos: number[], direction: string, num: number, type: string}): Car {
        /** Reformat the json representation of a car to an object. */
        const pos = car.pos as [number, number]
        const direction = car.direction as "LEFT" | "RIGHT" |"DOWN" | "UP"
        const type = car.type as keyof typeof CarType
        return new Car(pos, Direction[direction], car.num, CarType[type])
    }
    border_crash(bounds: readonly [number, number]): boolean {
        /** Return if the car is about to crash with the border. */
        const [y, x] = this.pos_ahead
        return !(0 <= y && y < bounds[0] && 0 <= x && x < bounds[1])
    }
    crash(): Car {
        /** Return a crashed version of the car. */
        if (this.type !== CarType.DECOY) {
            throw TypeError(`The crashed car is not a decoy. Car: ${this}`)
        }
        return new Car(this.pos, this.direction, this.num, CarType.CRASHED)
    }
    same_tile_crashes(other_cars: Car[]): Car | void {
        /** Return the car that this car crashes with.
         * 
         * Return void if no crashes occur.
         */
        for (const car of other_cars) {
            if (this.pos_ahead[0] === car.pos[0] && this.pos_ahead[1] === car.pos[1]) {
                return car
            }
        }
        return
    }
    head_on_crashes(other_cars: Car[]): boolean {
        /** Return if the car will get into a head-on crash with any of other_cars. */
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
    get_station(): Mod {
        /** Return the station/post office corresponding to this car. */
        if (this.type === CarType.NORMAL) {
            return Mod.STATION
        }
        if (this.type === CarType.NUMERAL) {
            return Mod.POST_OFFICE
        }
        throw TypeError(`A car must be NORMAL or NUMERAL to get the station of it. CarType: ${this.type}`)
    }
    on_correct_station(mod: Mod, mod_num: number): boolean {
        /** Return if the car is on its corresponding station/post office. */
        return mod_num === this.num && mod === this.get_station()
    }
    car_index(cars: Car[], decoys: Car[], ncars: Car[]): number {
        /** Return the index of the car in cars + decoys + ncars. */
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

export function product<T>(...iterables: T[][]): T[][] {
    /**  Return every combination of the iterables. */
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
export function copy_arr(array: any): any {
    /** Copy an array. */
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
export function zeros(shape: [number, number, number, number]): number[][][][] {
    /** Create a 4D array of zeros with the shape. */
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
