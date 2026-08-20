import React from "react"
import { GridTile } from "./GridTile"
import { useGuiStore, useLevelStore } from "../store"

const Icons = {
  close:
    <svg className={`h-7 w-7.25`} viewBox="0 0 28 29">
      <path fill="currentColor" d="M4.414 22.086 12 14.5 4.414 6.914a1.414 1.414 0 0 1 2-2L14 12.5l7.586-7.586a1.414 1.414 0 1 1 2 2L16 14.5l7.586 7.586a1.414 1.414 0 0 1-2 2L14 16.5l-7.586 7.586a1.414 1.414 0 0 1-2-2Z"/>
    </svg>,
}

type SolverStats = {
  time?: number
  iterations?: number
}

const formatDuration = (value: string | number): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return String(value)
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor(value / 60) % 60
  const seconds = Math.floor(value) % 60
  const milliseconds = Math.round((value % 1) * 1000).toString().padStart(3, "0")
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${milliseconds}`
}

const formatCount = (value: number | undefined): string => {
  if (value === undefined || value < 0) return "—"
  return value.toLocaleString()
}

const StatRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className={`flex items-center justify-between gap-4 border-b border-white/10 py-2 last:border-0`}>
    <span className={`text-sm opacity-70`}>{label}</span>
    <span className={`text-right font-semibold`}>{value}</span>
  </div>
)

const SolverResultCard: React.FC<{
  label: string
  badge: string
  stats: SolverStats
  accent: string
  isWinner: boolean
}> = ({ label, badge, stats, accent, isWinner }) => (
  <div className={`rounded-[0.75rem] border p-3 ${isWinner ? "border-green-400/80 bg-green-500/10" : "border-white/10 bg-black/20"}`}>
    <div className={`mb-3 flex items-center justify-between gap-2`}>
      <div className={`flex min-w-0 items-center gap-2`}>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${accent}`} />
        <span className={`truncate font-bold`}>{label}</span>
        <span className={`rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[0.65rem]`}>{badge}</span>
      </div>
      {isWinner && <span className={`shrink-0 text-xs font-bold text-green-300`}>Fastest</span>}
    </div>
    <div className={`grid grid-cols-2 gap-2`}>
      <div className={`rounded bg-black/20 p-2`}>
        <div className={`text-[0.65rem] uppercase tracking-wide opacity-60`}>Runtime</div>
        <div className={`mt-1 font-mono font-bold`}>{typeof stats.time === "number" ? `${stats.time.toFixed(3)}s` : "—"}</div>
      </div>
      <div className={`rounded bg-black/20 p-2`}>
        <div className={`text-[0.65rem] uppercase tracking-wide opacity-60`}>Iterations</div>
        <div className={`mt-1 font-mono font-bold`}>{formatCount(stats.iterations)}</div>
      </div>
    </div>
  </div>
)

export const SolvedPopup: React.FC = () => {
  const { styles, displaySolvedPopup, foundSolution, selectedSolver, solverStats } = useGuiStore()
  const { permLevelData, renderedLevelData, activeSolverId } = useLevelStore()
  const { iterations, tracks_left, semaphores_left } = permLevelData.solution
  const timeElapsed = formatDuration(permLevelData.solution.time_elapsed)
  const hasComparison = solverStats.wasm !== undefined && solverStats.typescript !== undefined
  const solverUsed = activeSolverId ?? selectedSolver
  const isWasm = solverUsed === "wasm"
  const tsTime = solverStats.typescript?.time
  const wasmTime = solverStats.wasm?.time
  const fastest = hasComparison && typeof tsTime === "number" && typeof wasmTime === "number"
    ? tsTime <= wasmTime ? "typescript" : "wasm"
    : undefined
  const speedup = typeof tsTime === "number" && typeof wasmTime === "number" && tsTime > 0 && wasmTime > 0
    ? Math.max(tsTime, wasmTime) / Math.min(tsTime, wasmTime)
    : undefined
  const performanceLabel = speedup !== undefined && fastest !== undefined
    ? `${fastest === "wasm" ? "WASM" : "TypeScript"} ${speedup.toFixed(1)}× faster`
    : undefined
  const gridHeight = renderedLevelData.length
  const gridWidth = renderedLevelData[0]?.length ?? 0

  return (
    <div className={`flex max-h-[calc(100vh-2rem)] w-[min(54rem,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto rounded-[1rem] border-b-1 p-4 text-[1rem] ${styles.base.bg} ${styles.border.border} ${styles.text.text}`}>
      <div className={`relative flex items-start justify-between gap-4 border-b border-white/10 pb-3`}>
        <div className={`min-w-0`}>
          <div className={`flex flex-wrap items-center gap-2`}>
            <h2 className={`text-[1.5rem] font-bold`}>
              {hasComparison ? "Solver comparison" : foundSolution ? "Level solved!" : "No solution found"}
            </h2>
            <span className={`rounded-full border px-2 py-0.5 font-mono text-xs ${hasComparison ? "border-blue-400 bg-blue-600 text-white" : isWasm ? "border-purple-400 bg-purple-600 text-white" : "border-yellow-400 bg-yellow-500 text-gray-900"}`}>
              {hasComparison ? "TS vs WASM" : isWasm ? "WASM" : "TS"}
            </span>
          </div>
          <div className={`mt-1 truncate text-sm opacity-70`} title={permLevelData.name}>{permLevelData.name}</div>
        </div>
        <button
          aria-label="Close result"
          className={`shrink-0 cursor-pointer ${styles.border.text} hover:brightness-85 active:brightness-70`}
          onClick={() => displaySolvedPopup(false)}
        >
          {Icons.close}
        </button>
      </div>

      <div className={`grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]`}>
        <div className={`relative flex min-h-[18rem] items-center justify-center overflow-auto rounded-[0.75rem] bg-black/20 p-3`}>
          <div
            className={`pointer-events-none absolute inset-0 opacity-5`}
            style={{
              backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
              backgroundSize: `30px 30px`,
              backgroundPosition: `${12 + gridWidth * 30 / 2}px ${12 + gridHeight * 30 / 2}px`,
            }}
          />
          <div
            className={`relative grid shrink-0 border-l-1 border-t-1 ${styles.highlight.border}`}
            style={{
              gridTemplateColumns: `repeat(${gridWidth}, 30px)`,
              gridTemplateRows: `repeat(${gridHeight}, 30px)`,
            }}
          >
            {renderedLevelData.map((row, rowIndex) =>
              row.map((_, columnIndex) => (
                <div
                  key={`${rowIndex}-${columnIndex}`}
                  className={`relative border-b-1 border-r-1 ${styles.highlight.border}`}
                >
                  <GridTile
                    is_rendered_grid={true}
                    pos={{ y: rowIndex, x: columnIndex }}
                    disabled={true}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`rounded-[0.75rem] bg-black/20 p-3`}>
          <div className={`mb-1 text-xs font-bold uppercase tracking-[0.12em] opacity-60`}>Solution summary</div>
          <StatRow label="Tracks saved" value={formatCount(tracks_left)} />
          <StatRow label="Semaphores saved" value={formatCount(semaphores_left)} />
          <StatRow label="Iterations" value={formatCount(iterations)} />
          <StatRow label="Time" value={<span className={`font-mono text-sm`}>{timeElapsed}</span>} />
          <div className={`mt-3 text-xs leading-relaxed opacity-60`}>
            {hasComparison
              ? "Both engines solved the same level with the same settings."
              : isWasm
                ? "C++ WebAssembly engine"
                : "TypeScript worker with visualization"}
          </div>
        </div>
      </div>

      {hasComparison && solverStats.typescript && solverStats.wasm && (
        <section className={`rounded-[0.75rem] border border-blue-400/30 bg-blue-500/5 p-3`}>
          <div className={`mb-3 flex flex-wrap items-baseline justify-between gap-2`}>
            <div>
              <h3 className={`font-bold`}>Performance comparison</h3>
              <p className={`text-xs opacity-60`}>Lower runtime is better; iterations show the search work performed.</p>
            </div>
            {performanceLabel !== undefined && (
              <span className={`rounded-full bg-green-500/20 px-2 py-1 text-xs font-bold text-green-300`}>
                {performanceLabel}
              </span>
            )}
          </div>
          <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2`}>
            <SolverResultCard
              label="TypeScript"
              badge="TS"
              stats={solverStats.typescript}
              accent="bg-yellow-400"
              isWinner={fastest === "typescript"}
            />
            <SolverResultCard
              label="C++ WebAssembly"
              badge="WASM"
              stats={solverStats.wasm}
              accent="bg-purple-400"
              isWinner={fastest === "wasm"}
            />
          </div>
        </section>
      )}
    </div>
  )
}
