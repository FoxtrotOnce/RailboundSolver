#include "railbound/level.hpp"
#include "railbound/solver.hpp"
#include <string>
#include <cstring>
#include <cstdlib>

#if defined(__EMSCRIPTEN__)
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <chrono>
#endif

using namespace railbound;
using json = nlohmann::json;

// ---------------------------------------------------------------------------
// Internal helper: build Level from json string + SolverOptions
// ---------------------------------------------------------------------------
static Level parse_level_json(const json& j) {
    Level lvl;
    // Level::from_json expects name + j
    std::string name = j.value("name", std::string("WASM Level"));
    lvl = Level::from_json(name, j);
    // Support alternative field names used by website (tracks/semaphores already handled)
    return lvl;
}

static SolverOptions parse_options_json(const json& j) {
    SolverOptions opts;
    if (j.contains("heatmap_limit_limit"))
        opts.heatmap_limit_limit = j["heatmap_limit_limit"].get<int>();
    if (j.contains("decoy_heatmap_limit"))
        opts.decoy_heatmap_limit = j["decoy_heatmap_limit"].get<int>();
    if (j.contains("gen_type")) {
        std::string gt = j["gen_type"].get<std::string>();
        opts.gen_type = (gt == "BFS" ? SearchType::BFS : SearchType::DFS);
    }
    if (j.contains("max_iterations"))
        opts.max_iterations = j["max_iterations"].get<uint64_t>();
    if (j.contains("timeout_seconds"))
        opts.timeout_seconds = j["timeout_seconds"].get<double>();
    return opts;
}

#if defined(__EMSCRIPTEN__)
// Global JS visualize callback (set from JS via setVisualizeCallback)
static emscripten::val g_visualizeCallback = emscripten::val::undefined();
static int g_visualizeRateMs = 100;
static std::chrono::steady_clock::time_point g_lastVisualizeTime = std::chrono::steady_clock::now();

static void callJsVisualize(const VisualizeData& data) {
    if (g_visualizeCallback.isUndefined() || g_visualizeCallback.isNull()) return;
    try {
        if (g_visualizeCallback.typeOf().as<std::string>() != "function") return;
    } catch (...) {
        return;
    }
    // Throttle by time
    auto now = std::chrono::steady_clock::now();
    auto elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(now - g_lastVisualizeTime).count();
    if (elapsedMs < g_visualizeRateMs) return;
    g_lastVisualizeTime = now;

    try {
        emscripten::val board = emscripten::val::array();
        for (size_t r = 0; r < data.board.size(); ++r) {
            emscripten::val row = emscripten::val::array();
            for (size_t c = 0; c < data.board[r].size(); ++c) {
                row.call<void>("push", static_cast<int>(data.board[r][c]));
            }
            board.call<void>("push", row);
        }
        emscripten::val mods = emscripten::val::array();
        for (size_t r = 0; r < data.mods.size(); ++r) {
            emscripten::val row = emscripten::val::array();
            for (size_t c = 0; c < data.mods[r].size(); ++c) {
                row.call<void>("push", static_cast<int>(data.mods[r][c]));
            }
            mods.call<void>("push", row);
        }
        emscripten::val cars = emscripten::val::array();
        for (const auto& car : data.cars) {
            emscripten::val c = emscripten::val::object();
            emscripten::val pos = emscripten::val::array();
            pos.call<void>("push", car.pos.y);
            pos.call<void>("push", car.pos.x);
            c.set("pos", pos);
            c.set("direction", direction_to_string(car.direction));
            c.set("num", car.num);
            c.set("type", car_type_to_string(car.type));
            // Also set pos_ahead for debugging?
            cars.call<void>("push", c);
        }
        emscripten::val payload = emscripten::val::object();
        payload.set("board", board);
        payload.set("mods", mods);
        payload.set("cars", cars);
        payload.set("iterations", static_cast<double>(data.iterations));
        payload.set("time_elapsed", data.time_elapsed_seconds);
        // Call JS callback with single object arg
        g_visualizeCallback(payload);
    } catch (...) {
        // Ignore JS callback errors — don't crash solver
    }
}
#endif

static std::string solve_level_json_impl(const std::string& input_str) {
    try {
        json input = json::parse(input_str);

        // Input may be wrapped: { board, mods, mod_nums, cars, tracks, semaphores, options }
        // or { level: {...}, options: {...} }
        json level_json;
        json options_json;

        if (input.contains("level")) {
            level_json = input["level"];
            if (input.contains("options")) options_json = input["options"];
            else if (input.contains("parameters")) options_json = input["parameters"];
        } else if (input.contains("board")) {
            level_json = input;
            if (input.contains("options")) options_json = input["options"];
            // Pull track options that are at top level
            if (level_json.contains("tracks") && !options_json.contains("tracks"))
                ; // keep as part of level
        } else {
            return json{{"error", "Invalid input: missing board/level"}}.dump();
        }

        // If options are at top-level keys like heatmap_limit_limit etc.
        if (options_json.empty()) {
            // Try to sniff options from input directly
            const char* opt_keys[] = {"heatmap_limit_limit", "decoy_heatmap_limit", "gen_type", "max_iterations", "timeout_seconds"};
            for (auto k : opt_keys) {
                if (input.contains(k)) options_json[k] = input[k];
            }
        }

        Level lvl = parse_level_json(level_json);
        SolverOptions opts = parse_options_json(options_json);
        // Check for visualize_rate in options or top-level
        int visualizeRate = 100;
        if (options_json.contains("visualize_rate")) visualizeRate = options_json["visualize_rate"].get<int>();
        else if (input.contains("visualize_rate")) visualizeRate = input["visualize_rate"].get<int>();
#if defined(__EMSCRIPTEN__)
        g_visualizeRateMs = visualizeRate;
        g_lastVisualizeTime = std::chrono::steady_clock::now();
        VisualizeCallback vizCb = nullptr;
        if (!g_visualizeCallback.isUndefined() && !g_visualizeCallback.isNull()) {
            vizCb = [](const VisualizeData& d) { callJsVisualize(d); };
        }
        SolveResult res = solve_level(lvl, opts, vizCb);
#else
        SolveResult res = solve_level(lvl, opts, nullptr);
#endif

        json out;
        out["solved"] = res.solved;
        out["iterations"] = res.iterations;
        out["time_elapsed"] = res.time_elapsed_seconds;
        out["tracks_left"] = res.tracks_left;
        out["semaphores_left"] = res.semaphores_left;
        out["timed_out"] = res.timed_out;
        out["max_iterations_reached"] = res.max_iterations_reached;

        if (res.solved) {
            json board_json = json::array();
            for (auto& row : res.board) {
                json r = json::array();
                for (auto t : row) r.push_back(static_cast<int>(t));
                board_json.push_back(r);
            }
            json mods_json = json::array();
            for (auto& row : res.mods) {
                json r = json::array();
                for (auto m : row) r.push_back(static_cast<int>(m));
                mods_json.push_back(r);
            }
            out["board"] = board_json;
            out["mods"] = mods_json;
        } else {
            out["board"] = nullptr;
            out["mods"] = nullptr;
        }

        return out.dump();
    } catch (const std::exception& e) {
        json err;
        err["error"] = e.what();
        err["solved"] = false;
        return err.dump();
    } catch (...) {
        json err;
        err["error"] = "Unknown error";
        err["solved"] = false;
        return err.dump();
    }
}

// ---------------------------------------------------------------------------
// C API (compatible with ccall/cwrap)
// ---------------------------------------------------------------------------
#if defined(__EMSCRIPTEN__)
// JS-visible helpers to set/clear visualize callback
EMSCRIPTEN_KEEPALIVE
void set_wasm_visualize_callback(emscripten::val cb) {
    g_visualizeCallback = cb;
    g_lastVisualizeTime = std::chrono::steady_clock::now();
}
EMSCRIPTEN_KEEPALIVE
void clear_wasm_visualize_callback() {
    g_visualizeCallback = emscripten::val::undefined();
}
EMSCRIPTEN_KEEPALIVE
void set_wasm_visualize_rate(int ms) {
    g_visualizeRateMs = ms;
}
#endif

extern "C" {

#if defined(__EMSCRIPTEN__)
EMSCRIPTEN_KEEPALIVE
#endif
char* solve_level_json(const char* input_cstr) {
    if (!input_cstr) return nullptr;
    std::string input(input_cstr);
    std::string output = solve_level_json_impl(input);
    char* out = (char*)malloc(output.size() + 1);
    if (!out) return nullptr;
    std::memcpy(out, output.c_str(), output.size() + 1);
    return out;
}

#if defined(__EMSCRIPTEN__)
EMSCRIPTEN_KEEPALIVE
#endif
void free_string(char* ptr) {
    if (ptr) free(ptr);
}

#if defined(__EMSCRIPTEN__)
EMSCRIPTEN_KEEPALIVE
#endif
char* solve_level_json_string(const char* input_cstr) {
    // Alias for embind wrapper
    return solve_level_json(input_cstr);
}

// Helper for JS that wants to get solver version
#if defined(__EMSCRIPTEN__)
EMSCRIPTEN_KEEPALIVE
#endif
const char* get_solver_version() {
    return "1.0.0-wasm";
}

// Quick health check
#if defined(__EMSCRIPTEN__)
EMSCRIPTEN_KEEPALIVE
#endif
int wasm_is_ready() {
    return 1;
}

} // extern "C"

#if defined(__EMSCRIPTEN__)
// ---------------------------------------------------------------------------
// Embind API (optional, for nicer JS integration)
// ---------------------------------------------------------------------------
using namespace emscripten;

static std::string getSolverVersionImpl() { return "1.0.0-wasm"; }
static bool wasmIsReadyImpl() { return true; }

EMSCRIPTEN_BINDINGS(railbound_wasm) {
    function("solveLevelJson", &solve_level_json_impl);
    function("getSolverVersion", &getSolverVersionImpl);
    function("wasmIsReady", &wasmIsReadyImpl);
    function("setVisualizeCallback", &set_wasm_visualize_callback);
    function("clearVisualizeCallback", &clear_wasm_visualize_callback);
    function("setVisualizeRate", &set_wasm_visualize_rate);
}
#endif
