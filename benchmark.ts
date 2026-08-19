// Mock DedicatedWorkerGlobalScope for algo/main.ts CLI compatibility
globalThis.self = {
    postMessage: () => {
        setTimeout(() => {
            if ((globalThis.self as any).onmessage) {
                (globalThis.self as any).onmessage({ data: {} })
            }
        }, 0)
    }
} as any

import { solve_level } from './algo/main'
import lvls from './levels.json'
import { execSync } from 'child_process'

const env = { ...process.env, PATH: `/c/msys64/ucrt64/bin:${process.env.PATH}` }
const origLog = console.log

interface BenchmarkRow {
    world: string
    level: string
    tsMs: number
    cppMs: number
    speedup: number
    iterations: number
    status: string
}

const worlds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const results: BenchmarkRow[] = []

origLog("\n### Solve Time Comparison: First 4 Levels of Worlds 1–12\n")
origLog("| World | Level | TS / JS Time | C++ Time | Speedup | Iterations | Status |")
origLog("|:---:|:---:|:---:|:---:|:---:|:---:|:---:|")

let totalTs = 0
let totalCpp = 0

for (const w of worlds) {
    for (const lvlNum of [1, 2, 3, 4]) {
        const lvlName = `${w}-${lvlNum}`
        const lvlData = (lvls as any)[lvlName]
        if (!lvlData) continue

        // Measure TS solver
        console.log = () => {}
        let tsMs = 0
        let iterations = 0
        let tsSolved = false
        try {
            const t0 = performance.now()
            const res = await solve_level(lvlData, () => {})
            const t1 = performance.now()
            tsMs = t1 - t0
            iterations = res?.iterations ?? 0
            tsSolved = res?.board !== undefined
        } catch (e) {
            // ignore
        }
        console.log = origLog

        // Measure C++ solver
        let cppMs = 0
        let cppSolved = false
        try {
            const cppOut = execSync(
                `"${process.cwd()}\\cpp\\build\\railbound_solver.exe" --file levels.json --level ${lvlName} --timeout 5.0`,
                { env }
            ).toString()

            const timeMatch = cppOut.match(/Time elapsed: ([0-9.]+)s/)
            const iterMatch = cppOut.match(/Iterations: (\d+)/)

            if (timeMatch) cppMs = parseFloat(timeMatch[1]) * 1000.0
            if (iterMatch) iterations = parseInt(iterMatch[1])
            cppSolved = cppOut.includes("SOLVED!")
        } catch (e) {
            // ignore
        }

        const speedup = cppMs > 0 ? (tsMs / cppMs) : 0
        totalTs += tsMs
        totalCpp += cppMs

        const tsStr = tsMs < 1.0 ? `${(tsMs * 1000).toFixed(0)} µs` : (tsMs >= 1000 ? `${(tsMs / 1000).toFixed(2)} s` : `${tsMs.toFixed(2)} ms`)
        const cppStr = cppMs < 1.0 ? `${(cppMs * 1000).toFixed(0)} µs` : (cppMs >= 1000 ? `${(cppMs / 1000).toFixed(2)} s` : `${cppMs.toFixed(2)} ms`)
        const speedupStr = speedup >= 1.0 ? `**${speedup.toFixed(1)}x**` : `${speedup.toFixed(1)}x`
        const statusStr = (tsSolved && cppSolved) ? "SOLVED" : "FAIL/TIMEOUT"

        origLog(`| World ${w.padStart(2, ' ')} | **${lvlName}** | ${tsStr} | ${cppStr} | ${speedupStr} | ${iterations.toLocaleString()} | ${statusStr} |`)
    }
}

const totalSpeedup = totalCpp > 0 ? (totalTs / totalCpp) : 0
origLog(`| **Total** | **All Levels** | **${(totalTs / 1000).toFixed(2)} s** | **${(totalCpp / 1000).toFixed(2)} s** | **${totalSpeedup.toFixed(1)}x** | - | - |`)

process.exit(0)
