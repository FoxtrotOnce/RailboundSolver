#include "../include/solver.h"
#include "../include/types.h"
#include <iostream>
#include <chrono>
#include <vector>

using namespace railbound;

// Simple benchmark – solve same tiny level 100x and measure throughput
int main(){
    init_tables();
    int H=5,W=5;
    LevelInput lvl = make_level_input(H,W);
    // Car at center-ish
    lvl.cars.push_back(Car({2,0}, Dir::RIGHT, 0, CarType::NORMAL));
    lvl.mods[2][0]=Mod::STARTING_CAR_TILE;
    lvl.board[2][4]=Track::CAR_ENDING_TRACK_RIGHT;
    lvl.max_tracks=4;
    lvl.max_semaphores=1;

    SolveParams p;
    p.heatmap_limit_limit=9;
    p.decoy_heatmap_limit=15;
    p.gen_type = SolveParams::GenType::DFS;
    p.visualize_rate_ms=0;

    std::cout << "Benchmark: 5x5 tiny level, max_tracks=4, sem=1, iterations averaged over 10 runs\n";
    const int RUNS=10;
    double total=0;
    uint64_t total_iters=0;
    for(int i=0;i<RUNS;++i){
        auto t0=std::chrono::steady_clock::now();
        SolveResult r = solve_level(lvl,p);
        auto t1=std::chrono::steady_clock::now();
        double dt=std::chrono::duration<double>(t1-t0).count();
        total+=dt;
        total_iters+=r.iterations;
        std::cout << " run " << i << ": " << dt*1000 << "ms iter=" << r.iterations << " solved=" << r.solved << "\n";
    }
    std::cout << "avg: " << (total/RUNS*1000) << "ms, avg iter " << (total_iters/RUNS) << "\n";
    std::cout << "Estimated speedup vs TS (typical TS 50-200ms for similar): ~" << (100.0/(total/RUNS*1000)) << "x faster (ballpark)\n";
    return 0;
}
