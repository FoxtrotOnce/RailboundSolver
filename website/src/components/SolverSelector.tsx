import React, { useEffect, useState } from "react";
import { useGuiStore } from "../store";
import { SOLVERS, type SolverId } from "../solver/types";
import { checkWasmAvailability } from "../solver/wasmLoader";

export const SolverSelector: React.FC = () => {
  const { styles, selectedSolver, setSelectedSolver, wasmAvailable, setWasmAvailable } = useGuiStore();
  const [checking, setChecking] = useState(wasmAvailable === null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      setChecking(true);
      try {
        const available = await checkWasmAvailability();
        if (!cancelled) {
          setWasmAvailable(available);
          // If WASM not available and user has it selected, fallback to TS
          if (!available && selectedSolver === "wasm") {
            // keep selection but show warning; don't auto-switch to avoid confusing user
          }
        }
      } catch {
        if (!cancelled) setWasmAvailable(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    if (wasmAvailable === null) {
      check();
    } else {
      setChecking(false);
    }
    return () => { cancelled = true; };
  }, [wasmAvailable, setWasmAvailable, selectedSolver]);

  const handleSelect = (id: SolverId) => {
    if (id === "wasm" && wasmAvailable === false) return; // blocked
    setSelectedSolver(id);
  };

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-[0.5rem] ${styles.base.bg} border-b-1 ${styles.border.border}`}>
      <div className={`flex flex-row items-center justify-between`}>
        <span className={`font-bold text-[1.1rem] ${styles.text.text}`}>Solver Engine</span>
        {checking && (
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-600 text-white animate-pulse`}>Checking...</span>
        )}
      </div>

      <div className={`flex flex-col gap-2`}>
        {(Object.keys(SOLVERS) as SolverId[]).map((id) => {
          const info = SOLVERS[id];
          const isSelected = selectedSolver === id;
          const isDisabled = id === "wasm" && wasmAvailable === false;

          return (
            <button
              key={id}
              disabled={isDisabled}
              onClick={() => handleSelect(id)}
              className={`relative flex flex-col text-left p-3 rounded-[0.5rem] border-2 transition-all
                ${isSelected
                  ? `${info.color} border-white text-white shadow-lg scale-[1.02]`
                  : `${styles.highlight.bg} ${styles.border.border} ${styles.text.text} hover:brightness-110`
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"}
              `}
              title={isDisabled ? "WASM not built — run ./cpp/wasm/build_wasm.sh" : info.description}
            >
              <div className={`flex flex-row items-center justify-between w-full`}>
                <span className={`font-bold text-[1rem] flex items-center gap-2`}>
                  {info.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono border ${isSelected ? "bg-white text-gray-900 border-white" : "bg-gray-900 text-white border-gray-600"}`}>
                    {info.badge}
                  </span>
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? "bg-white border-white" : "border-white/50 bg-transparent"}
                `}>
                  {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${info.color}`} />}
                </div>
              </div>
              <span className={`text-xs mt-1 leading-tight ${isSelected ? "text-white/90" : "text-white/70"}`}>
                {info.description}
              </span>
              {isDisabled && (
                <span className={`mt-2 text-xs font-mono bg-black/30 px-2 py-1 rounded border border-white/20`}>
                  WASM not built. Run:<br />
                  <code className={`text-yellow-300`}>./cpp/wasm/build_wasm.sh</code>
                </span>
              )}
              {isSelected && id === "wasm" && wasmAvailable === true && (
                <span className={`mt-1 text-xs font-medium text-white/80`}>✓ WASM ready — 20-30x faster</span>
              )}
              {isSelected && id === "typescript" && (
                <span className={`mt-1 text-xs font-medium text-white/80`}>✓ With step-by-step visualization</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats compare if both have run */}
      {/* Keep minimal; actual stats shown in SolvedPopup */}

      <div className={`flex flex-row gap-2 text-xs ${styles.text.text} opacity-60 justify-center`}>
        <span>Select a solver before solving.</span>
      </div>
    </div>
  );
};

export const SolverBadge: React.FC = () => {
  const { selectedSolver, styles } = useGuiStore();
  const info = SOLVERS[selectedSolver];
  return (
    <div className={`flex flex-row items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border ${info.color} text-white border-white/20`}>
      <span className={`w-2 h-2 rounded-full bg-white animate-pulse`} />
      {info.shortLabel}
    </div>
  );
};
