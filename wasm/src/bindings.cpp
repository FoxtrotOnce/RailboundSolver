#include "../include/solver.h"
#include "../include/types.h"
#include <vector>
#include <string>
#include <iostream>
#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>
#endif

#ifndef EMSCRIPTEN_KEEPALIVE
#define EMSCRIPTEN_KEEPALIVE __attribute__((visibility("default")))
#endif
#ifndef EM_JS
#define EM_JS(ret, name, args, ...)
#endif

using namespace railbound;

// ---------------------------------------------------------------------------
// Plain C API – works with both emcc and clang wasm (wasm32-unknown-unknown)
// Exposed via EMSCRIPTEN_KEEPALIVE so JS can call via ccall/cwrap or wasm imports.
// ---------------------------------------------------------------------------
extern "C" {

// Global params for simple C API (mirrors JS object)
static SolveParams g_params;

EMSCRIPTEN_KEEPALIVE
void wasm_set_params(int heatmap_limit, int decoy_limit, int gen_type_int, int visualize_rate){
    g_params.heatmap_limit_limit = heatmap_limit;
    g_params.decoy_heatmap_limit = decoy_limit;
    g_params.gen_type = (gen_type_int==0 ? SolveParams::GenType::DFS : SolveParams::GenType::BFS);
    g_params.visualize_rate_ms = visualize_rate;
}

// Result buffers – keep last solve result in static memory for JS to read via getters.
// We store board/mods as flat int arrays.
static SolveResult g_last_result;
static int g_H=0, g_W=0;

EMSCRIPTEN_KEEPALIVE
int wasm_solve_flat(const int* board_flat, const int* mods_flat, const int* mod_nums_flat,
                    int H, int W,
                    int max_tracks, int max_semaphores,
                    // cars as flat arrays: pos_y, pos_x, dir, num, type per car, count = num_cars
                    const int* car_pos_y, const int* car_pos_x, const int* car_dir, const int* car_num, const int* car_type,
                    int num_cars) {
    std::vector<int> board_v(board_flat, board_flat + H*W);
    std::vector<int> mods_v(mods_flat, mods_flat + H*W);
    std::vector<int> mod_nums_v(mod_nums_flat, mod_nums_flat + H*W);
    std::vector<Car> cars;
    cars.reserve(num_cars);
    for(int i=0;i<num_cars;++i){
        Vec2 p{car_pos_y[i], car_pos_x[i]};
        Dir d = (Dir)car_dir[i];
        CarType t = (CarType)car_type[i];
        cars.emplace_back(p,d,car_num[i],t);
    }
    g_H=H; g_W=W;
    auto res = solve_flat(board_v, mods_v, mod_nums_v, cars, H,W, max_tracks, max_semaphores, g_params, nullptr, nullptr);
    g_last_result = std::move(res);
    return g_last_result.solved ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE
int wasm_get_H(){ return g_H; }
EMSCRIPTEN_KEEPALIVE
int wasm_get_W(){ return g_W; }
EMSCRIPTEN_KEEPALIVE
int wasm_get_tracks_left(){ return g_last_result.tracks_left; }
EMSCRIPTEN_KEEPALIVE
int wasm_get_semaphores_left(){ return g_last_result.semaphores_left; }
EMSCRIPTEN_KEEPALIVE
int wasm_get_iterations_low(){ return (int)(g_last_result.iterations & 0xFFFFFFFF); }
EMSCRIPTEN_KEEPALIVE
int wasm_get_iterations_high(){ return (int)(g_last_result.iterations >> 32); }
EMSCRIPTEN_KEEPALIVE
double wasm_get_time(){ return g_last_result.time_elapsed_s; }
EMSCRIPTEN_KEEPALIVE
int wasm_is_solved(){ return g_last_result.solved ? 1 : 0; }

EMSCRIPTEN_KEEPALIVE
int wasm_get_board_at(int y,int x){
    if(!g_last_result.solved) return 0;
    return (int)g_last_result.board[y][x];
}
EMSCRIPTEN_KEEPALIVE
int wasm_get_mods_at(int y,int x){
    if(!g_last_result.solved) return 0;
    return (int)g_last_result.mods[y][x];
}

// Async + visualize support via callback into JS (Emscripten only)
#ifdef __EMSCRIPTEN__
// Provide JS implementations so wasm-ld doesn't see undefined symbols.
// They are weak no-ops; JS can override via Module['js_visualize_callback'] if needed,
// but the solver also works without a JS hook (returns 0 / does nothing).
EM_JS(void, js_visualize_callback, (int H, int W, int iterLow, int iterHigh, double elapsed), {
  // optional hook: if (typeof Module !== 'undefined' && Module.onWasmVisualize) Module.onWasmVisualize(H,W,iterLow,iterHigh,elapsed);
})
EM_JS(int, js_should_cancel, (), {
  return 0;
})

EMSCRIPTEN_KEEPALIVE
int wasm_solve_with_callback(const int* board_flat, const int* mods_flat, const int* mod_nums_flat,
                             int H,int W,int max_tracks,int max_semaphores,
                             const int* car_pos_y,const int* car_pos_x,const int* car_dir,const int* car_num,const int* car_type,
                             int num_cars) {
    std::vector<int> board_v(board_flat, board_flat+H*W);
    std::vector<int> mods_v(mods_flat, mods_flat+H*W);
    std::vector<int> mod_nums_v(mod_nums_flat, mod_nums_flat+H*W);
    std::vector<Car> cars;
    for(int i=0;i<num_cars;++i) cars.emplace_back(Vec2{car_pos_y[i],car_pos_x[i]}, (Dir)car_dir[i], car_num[i], (CarType)car_type[i]);
    g_H=H; g_W=W;

    auto visualize = [&](const std::vector<std::vector<Track>>& board,
                         const std::vector<std::vector<Mod>>& mods,
                         const std::vector<Car>& cc,
                         uint64_t iter, double elapsed)->bool {
        js_visualize_callback(H,W, (int)(iter & 0xFFFFFFFF), (int)(iter>>32), elapsed);
        if(js_should_cancel()) return false;
        return true;
    };
    auto should_cancel = []()->bool{ return js_should_cancel()!=0; };

    auto res = solve_flat(board_v, mods_v, mod_nums_v, cars, H,W, max_tracks, max_semaphores, g_params, visualize, should_cancel);
    g_last_result = std::move(res);
    return g_last_result.solved ? 1 : 0;
}
#else
// Native / plain wasm without JS imports – no-op callback version
EMSCRIPTEN_KEEPALIVE
int wasm_solve_with_callback(const int* board_flat, const int* mods_flat, const int* mod_nums_flat,
                             int H,int W,int max_tracks,int max_semaphores,
                             const int* car_pos_y,const int* car_pos_x,const int* car_dir,const int* car_num,const int* car_type,
                             int num_cars) {
    return wasm_solve_flat(board_flat, mods_flat, mod_nums_flat, H,W, max_tracks, max_semaphores,
                           car_pos_y, car_pos_x, car_dir, car_num, car_type, num_cars);
}
#endif

} // extern "C"

// ---------------------------------------------------------------------------
// Embind – nicer high-level API when built with --bind
// This is compiled only when EMSCRIPTEN + BIND is enabled.
// Provides JS classes: Solver, Level, etc. for direct use from TypeScript.
// ---------------------------------------------------------------------------
#ifdef __EMSCRIPTEN__
#include <emscripten/val.h>

using namespace emscripten;

SolveResult embind_solve(val board_js, val mods_js, val mod_nums_js,
                         val cars_js, int H,int W,int max_tracks,int max_semaphores,
                         int heatmap_limit,int decoy_limit,std::string gen_type,int visualize_rate) {
    // board_js, mods_js, mod_nums_js are expected to be JS arrays of ints (flat)
    // cars_js is array of objects {pos:[y,x], dir:int, num:int, type:int}
    std::vector<int> board_v(H*W), mods_v(H*W), mod_nums_v(H*W);
    for(int i=0;i<H*W;++i){ board_v[i]=board_js[i].as<int>(); mods_v[i]=mods_js[i].as<int>(); mod_nums_v[i]=mod_nums_js[i].as<int>(); }
    int num_cars = cars_js["length"].as<int>();
    std::vector<Car> cars;
    for(int i=0;i<num_cars;++i){
        val c = cars_js[i];
        val pos = c["pos"];
        int y = pos[0].as<int>(), x=pos[1].as<int>();
        int dir = c["dir"].as<int>();
        int num = c["num"].as<int>();
        int type = c["type"].as<int>();
        cars.emplace_back(Vec2{y,x}, (Dir)dir, num, (CarType)type);
    }
    SolveParams p;
    p.heatmap_limit_limit = heatmap_limit;
    p.decoy_heatmap_limit = decoy_limit;
    p.gen_type = (gen_type=="BFS" ? SolveParams::GenType::BFS : SolveParams::GenType::DFS);
    p.visualize_rate_ms = visualize_rate;
    return solve_flat(board_v, mods_v, mod_nums_v, cars, H,W, max_tracks, max_semaphores, p);
}

EMSCRIPTEN_BINDINGS(railbound_solver) {
    enum_<Track>("Track")
        .value("EMPTY", Track::EMPTY)
        .value("HORIZONTAL_TRACK", Track::HORIZONTAL_TRACK)
        // ... expose minimal for debugging
        ;
    enum_<Mod>("Mod")
        .value("EMPTY", Mod::EMPTY)
        .value("SWITCH", Mod::SWITCH)
        ;
    enum_<Dir>("Dir")
        .value("CRASH", Dir::CRASH)
        .value("LEFT", Dir::LEFT)
        .value("RIGHT", Dir::RIGHT)
        .value("DOWN", Dir::DOWN)
        .value("UP", Dir::UP)
        ;
    enum_<CarType>("CarType")
        .value("CRASHED", CarType::CRASHED)
        .value("NORMAL", CarType::NORMAL)
        .value("DECOY", CarType::DECOY)
        .value("NUMERAL", CarType::NUMERAL)
        ;

    value_object<SolveResult>("SolveResult")
        .field("solved", &SolveResult::solved)
        .field("tracks_left", &SolveResult::tracks_left)
        .field("semaphores_left", &SolveResult::semaphores_left)
        .field("time_elapsed_s", &SolveResult::time_elapsed_s)
        .field("iterations", &SolveResult::iterations)
        ;

    function("solve", &embind_solve);
    function("wasm_set_params", &wasm_set_params, allow_raw_pointers());
}
#endif
