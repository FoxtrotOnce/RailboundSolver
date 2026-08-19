#pragma once
#include "types.h"
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <functional>
#include <deque>
#include <optional>

namespace railbound {

// ---------------------------------------------------------------------------
// Parameters & Results (mirrors GUI hyperboles + solve_level return)
// ---------------------------------------------------------------------------
struct SolveParams {
    int heatmap_limit_limit = 9;
    int decoy_heatmap_limit = 15;
    enum class GenType { DFS, BFS } gen_type = GenType::DFS;
    int visualize_rate_ms = 100; // 0 = no intermediate callbacks
};

struct SolveResult {
    bool solved = false;
    std::vector<std::vector<Track>> board; // empty if not solved
    std::vector<std::vector<Mod>> mods;
    int tracks_left = 0;
    int semaphores_left = 0;
    double time_elapsed_s = 0.0;
    uint64_t iterations = 0;
};

// Callback for visualization: called at most every visualize_rate_ms
// If returns false, solver should pause / cancel (used for stepping)
using VisualizeCallback = std::function<bool(const std::vector<std::vector<Track>>& board,
                                            const std::vector<std::vector<Mod>>& mods,
                                            const std::vector<Car>& cars,
                                            uint64_t iterations,
                                            double elapsed_s)>;

// Input representation – matches levels.json or website GridCell[][].
struct LevelInput {
    std::vector<std::vector<Track>> board;
    std::vector<std::vector<Mod>> mods;
    std::vector<std::vector<int>> mod_nums;
    std::vector<Car> cars; // all cars: NORMAL + DECOY + NUMERAL
    int max_tracks = 0;
    int max_semaphores = 0;
};

// Helpers
LevelInput make_level_input(int H, int W);
void init_solver_globals(const LevelInput& lvl, const SolveParams& params);

// Main entry – synchronous; calls visualize_cb periodically.
// Suitable for both native and WASM (WASM will drive via bindings.cpp async layer)
SolveResult solve_level(const LevelInput& input, const SolveParams& params,
                        VisualizeCallback visualize_cb = nullptr,
                        std::function<bool()> should_cancel = nullptr);

// Convenience: solve from flat arrays (used by JS bindings where TypedArray is easier)
SolveResult solve_flat(const std::vector<int>& board_flat,
                       const std::vector<int>& mods_flat,
                       const std::vector<int>& mod_nums_flat,
                       const std::vector<Car>& cars,
                       int H, int W,
                       int max_tracks, int max_semaphores,
                       const SolveParams& params,
                       VisualizeCallback cb = nullptr,
                       std::function<bool()> should_cancel = nullptr);

// Product helper (cartesian product) – exposed for testing
template<typename T>
std::vector<std::vector<T>> product(const std::vector<std::vector<T>>& input);

} // namespace railbound
