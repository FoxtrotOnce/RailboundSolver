import {solve_level} from './main'
import lvls from '../levels.json'
import {Track, Mod, Car} from './classes'

type lvl_type = (typeof lvls)[keyof typeof lvls]
const worlds = new Map<string, Map<string, lvl_type>>()
for (const key in lvls) {
    const lvl_name = key as keyof typeof lvls
    const world: string = lvl_name.slice(0, lvl_name.indexOf('-'))
    const data: lvl_type = lvls[lvl_name]
    if (!worlds.has(world)) {
        worlds.set(world, new Map())
    }
    worlds.get(world)!.set(lvl_name, data)
}

function visualize(input: {
    board: Track[][],
    mods: Mod[][],
    cars: Car[]
}): void {
    Track.print_values(input.board)
    Mod.print_values(input.mods)
    console.log(input.cars)
}

async function run() {
    const lvl_name = "12-7A"
    console.log(lvl_name)
    const solved_data = await solve_level((lvls as any)[lvl_name], visualize)
    console.log(`Finished in: ${solved_data!.time_elapsed}s, iterations: ${solved_data!.iterations}, tracks left: ${solved_data!.tracks_left}`)
}

run();
