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
import path from 'path'

const ucrtBin = 'C:\\msys64\\ucrt64\\bin'
const env = {
    ...process.env,
    PATH: `${ucrtBin}${path.delimiter}${process.env.PATH || ''}`,
    Path: `${ucrtBin}${path.delimiter}${process.env.Path || process.env.PATH || ''}`,
}
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

// CLI: --timeout <sec> (default 60), --all (default), --sample (first 4 per world)
const args = process.argv.slice(2)
let timeoutSec = 60
let runAll = true
let runSample = false
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--timeout' && i + 1 < args.length) {
        timeoutSec = parseFloat(args[++i])
    } else if (args[i] === '--all') {
        runAll = true
        runSample = false
    } else if (args[i] === '--sample') {
        runSample = true
        runAll = false
    } else if (args[i] === '--help' || args[i] === '-h') {
        origLog(`Usage: npx tsx benchmark.ts [options]`)
        origLog(`  --all            Run all levels (default, 240 levels, 60s timeout per level)`)
        origLog(`  --sample         Run first 4 levels of worlds 1-12 (48 levels)`)
        origLog(`  --timeout <sec>  Timeout per level for C++ solver (default 60)`)
        origLog(`  --file <path>    Levels file (default levels.json)`)
        process.exit(0)
    }
}
if (!args.includes('--all') && !args.includes('--sample')) {
    runAll = true
}

let levelNames: string[] = []
if (runSample) {
    const worlds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    for (const w of worlds) {
        for (const lvlNum of [1, 2, 3, 4]) {
            const lvlName = `${w}-${lvlNum}`
            if ((lvls as any)[lvlName]) levelNames.push(lvlName)
        }
    }
} else {
    levelNames = Object.keys(lvls as any).sort((a, b) => {
        const pa = a.split('-')
        const pb = b.split('-')
        const wa = parseInt(pa[0].replace('#', '999'), 10)
        const wb = parseInt(pb[0].replace('#', '999'), 10)
        if (wa !== wb) return wa - wb
        const na = pa[1] || ''
        const nb = pb[1] || ''
        const ma = na.match(/^(\d+)/)
        const mb = nb.match(/^(\d+)/)
        const ia = ma ? parseInt(ma[1], 10) : 0
        const ib = mb ? parseInt(mb[1], 10) : 0
        if (ia !== ib) return ia - ib
        return na.localeCompare(nb)
    })
}

async function main() {
    const results: BenchmarkRow[] = []

    origLog(`\n### Solve Time Comparison: ${runSample ? 'First 4 Levels of Worlds 1–12' : 'All Levels'} (${levelNames.length} levels, ${timeoutSec}s timeout per level)\n`)
    origLog("| World | Level | TS / JS Time | C++ Time | Speedup | Iterations | Status |")
    origLog("|:---:|:---:|:---:|:---:|:---:|:---:|:---:|")

    let totalTs = 0
    let totalCpp = 0
    let solvedBoth = 0

    for (const lvlName of levelNames) {
        const lvlData = (lvls as any)[lvlName]
        if (!lvlData) continue
        const world = lvlName.split('-')[0]

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

        // Measure C++ solver with 60s (or custom) timeout per level
        let cppMs = 0
        let cppSolved = false
        let cppIterations = iterations
        try {
            const exePath = `${process.cwd().replace(/\\/g, '/')}/cpp/build/railbound_solver.exe`
            const cppOut = execSync(
                `"${exePath}" --file levels.json --level ${lvlName} --timeout ${timeoutSec}`,
                { env, timeout: (timeoutSec + 5) * 1000, stdio: 'pipe' }
            ).toString()

            const timeMatch = cppOut.match(/Time elapsed: ([0-9.]+)s/)
            const iterMatch = cppOut.match(/Iterations: (\d+)/)

            if (timeMatch) cppMs = parseFloat(timeMatch[1]) * 1000.0
            if (iterMatch) cppIterations = parseInt(iterMatch[1])
            else cppIterations = iterations
            cppSolved = cppOut.includes("SOLVED!")
            if (cppOut.includes("TIMED OUT")) {
                if (cppMs === 0) cppMs = timeoutSec * 1000
            }
        } catch (e: any) {
            const out = (e.stdout?.toString() || e.stderr?.toString() || "") as string
            const timeMatch = out.match(/Time elapsed: ([0-9.]+)s/)
            const iterMatch = out.match(/Iterations: (\d+)/)
            if (timeMatch) cppMs = parseFloat(timeMatch[1]) * 1000.0
            else cppMs = timeoutSec * 1000
            if (iterMatch) cppIterations = parseInt(iterMatch[1])
            cppSolved = out.includes("SOLVED!")
        }

        if (cppIterations !== undefined) iterations = cppIterations

        const speedup = cppMs > 0 ? (tsMs / cppMs) : 0
        totalTs += tsMs
        totalCpp += cppMs
        if (tsSolved && cppSolved) solvedBoth++

        const tsStr = tsMs < 1.0 ? `${(tsMs * 1000).toFixed(0)} µs` : (tsMs >= 1000 ? `${(tsMs / 1000).toFixed(2)} s` : `${tsMs.toFixed(2)} ms`)
        const cppStr = cppMs < 1.0 ? `${(cppMs * 1000).toFixed(0)} µs` : (cppMs >= 1000 ? `${(cppMs / 1000).toFixed(2)} s` : `${cppMs.toFixed(2)} ms`)
        const speedupStr = speedup >= 1.0 ? `**${speedup.toFixed(1)}x**` : `${speedup.toFixed(1)}x`
        const statusStr = (tsSolved && cppSolved) ? "SOLVED" : (cppSolved || tsSolved ? "PARTIAL" : "FAIL/TIMEOUT")

        origLog(`| World ${world.padStart(2, ' ')} | **${lvlName}** | ${tsStr} | ${cppStr} | ${speedupStr} | ${iterations.toLocaleString()} | ${statusStr} |`)
    }

    const totalSpeedup = totalCpp > 0 ? (totalTs / totalCpp) : 0
    origLog(`| **Total** | **All Levels (${levelNames.length})** | **${(totalTs / 1000).toFixed(2)} s** | **${(totalCpp / 1000).toFixed(2)} s** | **${totalSpeedup.toFixed(1)}x** | - | ${solvedBoth}/${levelNames.length} SOLVED |`)
    origLog(`\n# Timeout per level: ${timeoutSec}s | Mode: ${runSample ? 'sample (48)' : 'all (240)'}`)
    origLog(`# Run: npx tsx benchmark.ts --all --timeout 60  |  npx tsx benchmark.ts --sample --timeout 60`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
