import {solve_level} from './main'
import lvls from '../levels.json'

const start_time: number = Date.now()

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

// const no = new Set<string>(['7-5A'])
for (const [lvl_name, data] of worlds.get('9')!) {
    // if (no.has(lvl_name)) {continue}
    console.log(lvl_name)
    solve_level(data)
}
// const lvl_name = "12-4"
// console.log(lvl_name)
// solve_level(lvls[lvl_name])

console.log(`Total Time: ${(Date.now() - start_time) / 10e2}s`)
