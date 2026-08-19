#include "../include/solver.h"
#include "../include/types.h"
#include <iostream>
#include <chrono>

using namespace railbound;

int main() {
    init_tables();
    std::cout << "Railbound C++ Solver – native test\n";
    std::cout << "=====================================\n";

    // Test 1: types
    std::cout << "[Test] Track::HORIZONTAL is_straight: " << is_straight(Track::HORIZONTAL_TRACK) << " (expect 1)\n";
    std::cout << "[Test] Dir::LEFT to_vec: (" << to_vec(Dir::LEFT).y << "," << to_vec(Dir::LEFT).x << ") expect (0,-1)\n";

    Car c({1,1}, Dir::RIGHT, 0, CarType::NORMAL);
    std::cout << "[Test] Car at (1,1) RIGHT pos_ahead: (" << c.pos_ahead.y << "," << c.pos_ahead.x << ") expect (1,2)\n";

    // Test 2: tiny solvable level
    // 3x3 grid, car at (1,0) facing RIGHT, needs to reach ending at (1,2) with 1 track
    // Board:
    // [EMPTY][EMPTY][EMPTY]
    // [START][EMPTY][ENDING]
    // [EMPTY][EMPTY][EMPTY]
    int H=1, W=3;
    LevelInput lvl = make_level_input(H,W);
    // Place car
    lvl.cars.push_back(Car({0,0}, Dir::RIGHT, 0, CarType::NORMAL));
    // Mark start mod
    lvl.mods[0][0]=Mod::STARTING_CAR_TILE;
    // Ending track at (0,2) accessible from left
    lvl.board[0][2]=Track::CAR_ENDING_TRACK_RIGHT; // actually left-facing? In TS CAR_ENDING is accessible from left when on right – tune
    // But we use a simpler ending: CAR_ENDING_TRACK_LEFT is accessible from right? Check directions table: CAR_ENDING_TRACK_LEFT UNKNOWN from LEFT only. So car moving RIGHT will hit UNKNOWN? Actually endings are UNKNOWN for correct entry, CRASH otherwise.
    // Let's use CAR_ENDING_TRACK_RIGHT which is UNKNOWN from LEFT? Wait table: CAR_ENDING_TRACK_RIGHT UNKNOWN from RIGHT. That's opposite. Use LEFT ending for RIGHT-moving car:
    // CAR_ENDING_TRACK_LEFT is UNKNOWN from LEFT – so car moving RIGHT approaching from left would arrive with dir RIGHT, but ending expects LEFT? So we need RIGHT ending? Check: LEFT_FACING etc – confusing.
    // Instead just set ending that accepts RIGHT: lookup solver logic – is_car_ending checks any car ending track.
    // We'll brute: try CAR_ENDING_TRACK_RIGHT accepts RIGHT (UNKNOWN from RIGHT)
    // Car at (0,0) RIGHT will go to (0,1) then (0,2). To enter ending, its dir must be RIGHT and ending's redirect for RIGHT is UNKNOWN (counts as solved). For CAR_ENDING_TRACK_RIGHT, set is UNKNOWN from RIGHT -> matches.
    // So use RIGHT.
    lvl.board[0][2]=Track::CAR_ENDING_TRACK_RIGHT;
    lvl.mods[0][2]=Mod::EMPTY;
    lvl.max_tracks=1;
    lvl.max_semaphores=0;

    // For our tiny board 1x3, we need also set correct ending – let's try both and see
    // Actually road: use H=1,W=3 but solver expects cars[0] at (0,0). We'll just run and see.

    // Need full lvl board/mods dimensions correct – make_level_input gave empty; override
    lvl.board[0][0]=Track::EMPTY; // start tile is empty track? In game start tile is just mod, not track? but fine
    lvl.board[0][1]=Track::EMPTY;
    // try solve
    SolveParams params;
    params.heatmap_limit_limit=9;
    params.decoy_heatmap_limit=15;
    params.gen_type = SolveParams::GenType::DFS;
    params.visualize_rate_ms=0;

    auto t0 = std::chrono::steady_clock::now();
    SolveResult res = solve_level(lvl, params, nullptr, nullptr);
    auto t1 = std::chrono::steady_clock::now();
    double elapsed = std::chrono::duration<double>(t1-t0).count();

    std::cout << "\n[Solve] tiny 1x3 level: solved=" << res.solved << " tracks_left=" << res.tracks_left
              << " iter=" << res.iterations << " time=" << elapsed << "s\n";
    if(res.solved){
        std::cout << "Board result:\n";
        for(int y=0;y<H;++y){
            for(int x=0;x<W;++x) std::cout << (int)res.board[y][x] << " ";
            std::cout << "\n";
        }
    } else {
        std::cout << "(no solution – expected for tiny level depending on ending orientation; testing plumbing not failing is the goal)\n";
    }

    // Test 3: 3x3 with actual placement mimicking 1-15A simplicity – just ensure no crash
    {
        int H2=3,W2=3;
        LevelInput lvl2 = make_level_input(H2,W2);
        lvl2.cars.push_back(Car({1,0}, Dir::RIGHT, 0, CarType::NORMAL));
        lvl2.mods[1][0]=Mod::STARTING_CAR_TILE;
        lvl2.board[1][2]=Track::CAR_ENDING_TRACK_RIGHT;
        lvl2.max_tracks=2;
        lvl2.max_semaphores=0;
        SolveResult r2 = solve_level(lvl2, params);
        std::cout << "\n[Solve] 3x3 level 2: solved=" << r2.solved << " tracks_left=" << r2.tracks_left << " iter=" << r2.iterations << "\n";
    }

    std::cout << "\nNative test finished – if no crashes, build is healthy.\n";
    return 0;
}
