#pragma once

#include "railbound/types.hpp"
#include "railbound/level.hpp"
#include <vector>
#include <string>
#include <functional>
#include <optional>
#include <chrono>

namespace railbound {

enum class SearchType {
    DFS,
    BFS
};

struct SolverOptions {
    int heatmap_limit_limit{9};
    int decoy_heatmap_limit{15};
    SearchType gen_type{SearchType::DFS};
    uint64_t max_iterations{0}; // 0 = unlimited
    double timeout_seconds{0.0}; // 0.0 = unlimited
};

struct VisualizeData {
    const std::vector<std::vector<Track>>& board;
    const std::vector<std::vector<Mod>>& mods;
    const std::vector<Car>& cars;
    uint64_t iterations{0};
    double time_elapsed_seconds{0.0};
};

using VisualizeCallback = std::function<void(const VisualizeData&)>;

struct SolveResult {
    bool solved{false};
    std::vector<std::vector<Track>> board;
    std::vector<std::vector<Mod>> mods;
    int tracks_left{-1};
    int semaphores_left{-1};
    uint64_t iterations{0};
    double time_elapsed_seconds{0.0};
    bool timed_out{false};
    bool max_iterations_reached{false};
};

class Solver {
public:
    explicit Solver(SolverOptions options = SolverOptions{});

    SolveResult solve(const Level& level, VisualizeCallback visualize = nullptr);

private:
    SolverOptions options_;
};

SolveResult solve_level(const Level& level,
                        const SolverOptions& options = SolverOptions{},
                        VisualizeCallback visualize = nullptr);

} // namespace railbound
