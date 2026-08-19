#include "railbound/solver.hpp"
#include "railbound/level.hpp"
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <filesystem>
#include <chrono>

namespace fs = std::filesystem;

static void print_usage(const char* prog) {
    std::cout << "Railbound Solver (C++ Port)\n"
              << "Usage:\n"
              << "  " << prog << " [level_name] [options]\n"
              << "  " << prog << " --all [options]\n"
              << "  " << prog << " --test [options]\n\n"
              << "Options:\n"
              << "  --file <path>       Path to levels.json (default: ../levels.json or levels.json)\n"
              << "  --level <name>      Specific level name (e.g. 1-1, 1-15A, 2-1)\n"
              << "  --bfs               Use BFS generation instead of default DFS\n"
              << "  --timeout <sec>     Timeout in seconds per level (default: 60s for --all/--test/--benchmark, none for single)\n"
              << "  --max-iter <num>    Max iterations limit\n"
              << "  --verbose, -v       Print board and details\n"
              << "  --help, -h          Show this help message\n";
}

int main(int argc, char* argv[]) {
    std::string levels_file = "levels.json";
    if (!fs::exists(levels_file) && fs::exists("../levels.json")) {
        levels_file = "../levels.json";
    } else if (!fs::exists(levels_file) && fs::exists("../../levels.json")) {
        levels_file = "../../levels.json";
    }

    std::string level_name;
    bool run_all = false;
    bool run_test = false;
    bool run_benchmark = false;
    bool verbose = false;
    railbound::SolverOptions options;
    double timeout = -1.0;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--help" || arg == "-h") {
            print_usage(argv[0]);
            return 0;
        } else if (arg == "--file" && i + 1 < argc) {
            levels_file = argv[++i];
        } else if (arg == "--level" && i + 1 < argc) {
            level_name = argv[++i];
        } else if (arg == "--all") {
            run_all = true;
        } else if (arg == "--test") {
            run_test = true;
        } else if (arg == "--benchmark") {
            run_benchmark = true;
        } else if (arg == "--bfs") {
            options.gen_type = railbound::SearchType::BFS;
        } else if (arg == "--dfs") {
            options.gen_type = railbound::SearchType::DFS;
        } else if (arg == "--timeout" && i + 1 < argc) {
            timeout = std::stod(argv[++i]);
        } else if (arg == "--max-iter" && i + 1 < argc) {
            options.max_iterations = std::stoull(argv[++i]);
        } else if (arg == "--verbose" || arg == "-v") {
            verbose = true;
        } else if (arg[0] != '-' && level_name.empty()) {
            level_name = arg;
        }
    }

    if (!fs::exists(levels_file)) {
        std::cerr << "Error: levels file not found: " << levels_file << "\n";
        return 1;
    }

    if (run_benchmark) {
        if (timeout > 0.0) {
            options.timeout_seconds = timeout;
        } else {
            options.timeout_seconds = 60.0;
        }
        auto levels = railbound::load_levels_from_file(levels_file);

        std::vector<std::string> bench_levels = {
            "1-11B", "1-13A", "1-15A",
            "2-3B", "2-7B",
            "3-2", "3-4", "3-9", "3-10C",
            "4-3B", "4-5", "4-6B",
            "5-3", "5-4",
            "6-3", "7-2", "7-4",
            "8-1", "8-3", "8-4",
            "10-3", "10-4", "12-3"
        };

        // Warmup
        for (const auto& name : bench_levels) {
            if (levels.count(name)) {
                railbound::solve_level(levels.at(name), options);
            }
        }

        // 3 runs, take median for high stability
        std::vector<double> run_times_µs;
        uint64_t total_iters = 0;

        for (int r = 0; r < 3; ++r) {
            uint64_t iters_this_run = 0;
            auto t0 = std::chrono::high_resolution_clock::now();
            for (const auto& name : bench_levels) {
                if (levels.count(name)) {
                    auto res = railbound::solve_level(levels.at(name), options);
                    iters_this_run += res.iterations;
                    if (!res.solved) {
                        std::cerr << "Benchmark failure on level " << name << "\n";
                        return 1;
                    }
                }
            }
            auto t1 = std::chrono::high_resolution_clock::now();
            double µs = std::chrono::duration<double, std::micro>(t1 - t0).count();
            run_times_µs.push_back(µs);
            total_iters = iters_this_run;
        }

        std::sort(run_times_µs.begin(), run_times_µs.end());
        double median_µs = run_times_µs[1];

        std::cout << "METRIC total_µs=" << std::fixed << std::setprecision(0) << median_µs << "\n";
        std::cout << "METRIC total_iterations=" << total_iters << "\n";
        std::cout << "METRIC solve_time_ms=" << std::setprecision(2) << (median_µs / 1000.0) << "\n";
        return 0;
    }

    if (run_test || run_all) {
        if (timeout < 0.0) {
            timeout = 60.0; // 60 seconds default for full-level runs
        }
        options.timeout_seconds = timeout;

        std::cout << "Loading levels from " << levels_file << "...\n";
        auto levels = railbound::load_levels_from_file(levels_file);
        std::cout << "Loaded " << levels.size() << " levels.\n";

        // Representative suite of levels across different worlds (avoiding extremely long combinatorial levels)
        std::vector<std::string> test_levels = {
            "1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "1-7", "1-8", "1-9", "1-10",
            "1-11", "1-12", "1-13", "1-14", "1-15", "1-15A",
            "2-1", "2-2", "2-3", "2-4", "2-5", "2-6", "2-7", "2-8",
            "3-1", "3-2", "3-3", "3-4", "3-5",
            "4-1", "4-2", "4-3",
            "5-1", "5-2", "5-3"
        };

        const auto& to_run = (run_all ? [&]() {
            std::vector<std::string> all_keys;
            for (const auto& [k, v] : levels) all_keys.push_back(k);
            return all_keys;
        }() : test_levels);

        int solved_count = 0;
        int timeout_count = 0;
        int failed_count = 0;
        double total_time = 0.0;
        uint64_t total_iterations = 0;

        std::cout << std::string(70, '-') << "\n";
        std::cout << std::left << std::setw(12) << "Level"
                  << std::setw(10) << "Status"
                  << std::setw(12) << "Tracks Left"
                  << std::setw(16) << "Iterations"
                  << std::setw(14) << "Time (s)"
                  << "\n";
        std::cout << std::string(70, '-') << "\n";

        for (const auto& name : to_run) {
            auto it = levels.find(name);
            if (it == levels.end()) {
                std::cout << std::left << std::setw(12) << name << "NOT FOUND\n";
                continue;
            }

            auto res = railbound::solve_level(it->second, options);
            total_time += res.time_elapsed_seconds;
            total_iterations += res.iterations;

            std::string status;
            if (res.solved) {
                status = "SOLVED";
                solved_count++;
            } else if (res.timed_out) {
                status = "TIMEOUT";
                timeout_count++;
            } else {
                status = "UNSOLVED";
                failed_count++;
            }

            std::cout << std::left << std::setw(12) << name
                      << std::setw(10) << status
                      << std::setw(12) << (res.solved ? std::to_string(res.tracks_left) : "-")
                      << std::setw(16) << res.iterations
                      << std::fixed << std::setprecision(6) << std::setw(14) << res.time_elapsed_seconds
                      << "\n";

            if (verbose && res.solved) {
                std::cout << "Solution board:\n";
                railbound::print_board_values(res.board);
                std::cout << "\n";
            }
        }

        std::cout << std::string(70, '-') << "\n";
        std::cout << "Summary: " << solved_count << " solved, "
                  << timeout_count << " timed out, "
                  << failed_count << " unsolved in "
                  << std::fixed << std::setprecision(3) << total_time << "s ("
                  << total_iterations << " total iterations)\n";

        return 0;
    }

    if (level_name.empty()) {
        level_name = "1-15A"; // Default test level
    }

    if (timeout > 0.0) {
        options.timeout_seconds = timeout;
    }

    std::cout << "Loading level " << level_name << " from " << levels_file << "...\n";
    railbound::Level level;
    try {
        level = railbound::load_single_level(levels_file, level_name);
    } catch (const std::exception& e) {
        std::cerr << "Error loading level: " << e.what() << "\n";
        return 1;
    }

    std::cout << "\nInitial Board (" << level.height() << "x" << level.width()
              << "), Max Tracks: " << level.max_tracks
              << ", Max Semaphores: " << level.max_semaphores
              << ", Cars: " << level.cars.size() << "\n";
    railbound::print_board_values(level.board);
    std::cout << "\nInitial Mods:\n";
    railbound::print_mod_values(level.mods);

    std::cout << "\nSolving...\n";
    auto result = railbound::solve_level(level, options);

    std::cout << "\n" << std::string(40, '-') << "\n";
    if (result.solved) {
        std::cout << "SOLVED!\n";
        std::cout << "Time elapsed: " << std::fixed << std::setprecision(4) << result.time_elapsed_seconds << "s\n";
        std::cout << "Iterations: " << result.iterations << "\n";
        std::cout << "Tracks left: " << result.tracks_left << "\n";
        std::cout << "Semaphores left: " << result.semaphores_left << "\n\n";
        std::cout << "Solution Board:\n";
        railbound::print_board_values(result.board);
        std::cout << "\nSolution Mods:\n";
        railbound::print_mod_values(result.mods);
    } else if (result.timed_out) {
        std::cout << "TIMED OUT after " << result.time_elapsed_seconds << "s (" << result.iterations << " iterations)\n";
    } else {
        std::cout << "FAILED to solve after " << result.time_elapsed_seconds << "s (" << result.iterations << " iterations)\n";
    }
    std::cout << std::string(40, '-') << "\n";

    return result.solved ? 0 : 1;
}
