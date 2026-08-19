import React, { useEffect, useState } from "react";
import { useGuiStore, useLevelStore } from "../store";

const formatDuration = (seconds: number | undefined): string => {
  if (seconds === undefined || !Number.isFinite(seconds)) return "—";
  const totalSeconds = Math.max(0, seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const ProgressBar: React.FC = () => {
  const { styles, selectedSolver, solverStats } = useGuiStore();
  const {
    iterations,
    permLevelData,
    solvingWorker,
    solvingAdapter,
    activeSolverId,
    isComparing,
    solveStartedAt,
  } = useLevelStore();
  const [now, setNow] = useState(() => Date.now());

  const isSolving = solvingWorker !== undefined || solvingAdapter !== undefined || isComparing;
  const solver = activeSolverId ?? selectedSolver;
  const solverResult = solverStats[solver];
  const hasResult = !isSolving && (
    solverResult !== undefined ||
    permLevelData.solution.grid !== undefined
  );

  useEffect(() => {
    if (!isSolving || solveStartedAt === null) return;

    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [isSolving, solveStartedAt]);

  const elapsed = isSolving && solveStartedAt !== null
    ? Math.max(0, (now - solveStartedAt) / 1000)
    : typeof solverResult?.time === "number"
      ? solverResult.time
      : typeof permLevelData.solution.time_elapsed === "number"
        ? permLevelData.solution.time_elapsed
        : undefined;
  const iterationsPerSecond = isSolving && elapsed && elapsed > 0
    ? iterations / elapsed
    : undefined;
  const percent = hasResult ? 100 : 0;
  const engineLabel = solver === "wasm" ? "WASM" : "TypeScript";

  let status = "Ready to solve";
  if (isComparing) {
    status = "Running TypeScript + WASM sequentially";
  } else if (isSolving) {
    status = `${engineLabel} · ${formatDuration(elapsed)} elapsed`;
    if (iterationsPerSecond !== undefined) {
      status += ` · ${Math.round(iterationsPerSecond).toLocaleString()} iters/s`;
    }
  } else if (hasResult) {
    status = `Completed in ${formatDuration(elapsed)}`;
  }

  return (
    <div className={`flex w-full max-w-[38rem] flex-col font-bold text-[1.25rem] leading-[1.625rem] ${styles.text.text}`}>
      <div className={`flex w-full flex-row items-end justify-between gap-4`}>
        <div className={`flex min-w-0 flex-col`}>
          <span>Iterations: {iterations.toLocaleString()}</span>
          <span className={`truncate text-sm font-normal opacity-70`} title={status}>
            {status}
          </span>
        </div>
        <div className={`flex shrink-0 flex-row items-end`}>
          <span className={`text-[3rem] leading-[3rem]`}>{isSolving ? "…" : percent}</span>
          <span>%</span>
        </div>
      </div>
      <div
        className={`relative mt-1 h-4 w-full overflow-hidden rounded-full border-3 border-white bg-black p-0.5`}
        role="progressbar"
        aria-label="Solver progress"
        aria-valuemin={0}
        aria-valuemax={100}
        {...(!isSolving ? { "aria-valuenow": percent } : {})}
      >
        {isSolving ? (
          <div className={`solver-progress-indeterminate h-full rounded-full bg-green-500`} />
        ) : (
          <div
            className={`h-full rounded-full bg-green-500 transition-[width] duration-500`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
};
