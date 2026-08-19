#include "../include/solver.h"
#include <chrono>
#include <algorithm>
#include <iostream>
#include <queue>
#include <cassert>
#include <cstring>

namespace railbound {

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
template<typename T>
std::vector<std::vector<T>> product(const std::vector<std::vector<T>>& input) {
    std::vector<std::vector<T>> result = {{}};
    for (auto &arr : input) {
        std::vector<std::vector<T>> next;
        next.reserve(result.size() * arr.size());
        for (auto &prefix : result) {
            for (auto &x : arr) {
                auto copy = prefix;
                copy.push_back(x);
                next.push_back(std::move(copy));
            }
        }
        result = std::move(next);
    }
    return result;
}
template std::vector<std::vector<Car>> product<Car>(const std::vector<std::vector<Car>>&);
template std::vector<std::vector<Track>> product<Track>(const std::vector<std::vector<Track>>&);

// 4D heatmap flat storage
struct Heat4D {
    int N=0, H=0, W=0;
    std::vector<int> data; // size N*4*H*W
    Heat4D(){}
    Heat4D(int n,int h,int w):N(n),H(h),W(w),data(n*4*h*w,0){}
    inline int& at(int car,int dir,int y,int x){ // dir 0..3
        return data[((car*4+dir)*H + y)*W + x];
    }
    inline int at(int car,int dir,int y,int x) const {
        return data[((car*4+dir)*H + y)*W + x];
    }
    void clear(){ std::fill(data.begin(), data.end(), 0); }
};

// Solver context per solve_level call
struct SolverContext {
    SolveParams params;
    LevelInput lvl;
    int H=0, W=0;

    // derived from lvl
    std::vector<Car> cars;    // NORMAL
    std::vector<Car> decoys;
    std::vector<Car> ncars;

    std::unordered_set<int> permanent_poses; // y*W+x
    std::unordered_map<int, std::vector<Vec2>> tunnel_poses; // mod_num -> positions
    std::unordered_map<int, std::vector<Vec2>> gate_poses;
    std::unordered_map<int, std::vector<Vec2>> swapping_poses;
    // station_poses: Mod -> mod_num -> positions
    std::unordered_map<int, std::unordered_map<int, std::vector<Vec2>>> station_poses; // key: (int)Mod

    std::unordered_map<int, Dir> tunnel_exit_velo; // encoded track value -> Dir? Actually map Track->Dir

    // best solution
    int lowest_tracks_remaining = -1;
    int semaphores_remaining = -1;
    std::vector<std::vector<Track>> best_board;
    std::vector<std::vector<Mod>> best_mods;

    uint64_t iterations = 0;
    std::chrono::steady_clock::time_point start_time;
    std::chrono::steady_clock::time_point last_visualize;
    VisualizeCallback visualize_cb;
    std::function<bool()> should_cancel;

    // For BFS/DFS branching
    int64_t board_solve_time_ms = 0;
};

// State – mirrors args_type in TS
struct State {
    std::vector<Car> cars_to_use;
    std::vector<std::vector<Track>> board_to_use;
    std::vector<std::vector<Mod>> mods_to_use;
    int available_tracks = 0;
    Heat4D heatmaps;
    Heat4D heatmap_limits;
    std::vector<int> solved_normal; // list of car nums solved
    std::vector<int> solved_numeral;
    std::vector<char> stalled;
    std::vector<Vec2> switch_queue; // per car index, (-1,-1) = none
    std::vector<char> station_stalled;
    std::vector<Car> crashed_decoys;
    int mvmts_since_solved = 0;
    int available_semaphores = 0;
};

static SolverContext *g_ctx = nullptr; // for helpers that need tunnel etc – alternatively capture lambda

static Dir get_redirect_fast(Track t, Dir d){
    extern Dir direction_table[38][4];
    if ((int)d <0) return Dir::CRASH;
    int idx = (int)d; // LEFT=0 RIGHT=1 etc
    return direction_table[(int)t][idx];
}

// Build product of cars/tracks
// Forward declare generate
static std::vector<State> generate_tracks(State &s, SolverContext &ctx);

// ---------------------------------------------------------------------------
// init_solver_globals / helpers
// ---------------------------------------------------------------------------
void init_tables(); // from types.cpp

LevelInput make_level_input(int H,int W){
    LevelInput in;
    in.board.assign(H, std::vector<Track>(W, Track::EMPTY));
    in.mods.assign(H, std::vector<Mod>(W, Mod::EMPTY));
    in.mod_nums.assign(H, std::vector<int>(W, 0));
    in.max_tracks=0;
    in.max_semaphores=0;
    return in;
}

static void build_context(SolverContext &ctx){
    ctx.H = (int)ctx.lvl.board.size();
    ctx.W = ctx.H ? (int)ctx.lvl.board[0].size() : 0;
    ctx.cars.clear(); ctx.decoys.clear(); ctx.ncars.clear();
    for(auto &c: ctx.lvl.cars){
        if(c.type==CarType::NORMAL) ctx.cars.push_back(c);
        else if(c.type==CarType::DECOY) ctx.decoys.push_back(c);
        else if(c.type==CarType::NUMERAL) ctx.ncars.push_back(c);
    }
    ctx.permanent_poses.clear();
    for(int y=0;y<ctx.H;++y) for(int x=0;x<ctx.W;++x){
        if(ctx.lvl.board[y][x]!=Track::EMPTY) ctx.permanent_poses.insert(y*ctx.W+x);
    }
    ctx.tunnel_poses.clear(); ctx.gate_poses.clear(); ctx.swapping_poses.clear(); ctx.station_poses.clear();
    for(int y=0;y<ctx.H;++y) for(int x=0;x<ctx.W;++x){
        Vec2 pos{y,x};
        Mod m = ctx.lvl.mods[y][x];
        int mn = ctx.lvl.mod_nums[y][x];
        if(m==Mod::TUNNEL) ctx.tunnel_poses[mn].push_back(pos);
        else if(m==Mod::OPEN_GATE || m==Mod::CLOSED_GATE) ctx.gate_poses[mn].push_back(pos);
        else if(m==Mod::SWAPPING_TRACK) ctx.swapping_poses[mn].push_back(pos);
        else if(m==Mod::STATION || m==Mod::POST_OFFICE){
            ctx.station_poses[(int)m][mn].push_back(pos);
        }
    }
    // tunnel exit velos – track -> Dir (mirrors tunnel_exit_velos)
    // Only need mapping for tunnel-facing tracks: value 17..20
    ctx.tunnel_exit_velo.clear();
    ctx.tunnel_exit_velo[(int)Track::LEFT_FACING_TUNNEL] = Dir::LEFT;
    ctx.tunnel_exit_velo[(int)Track::RIGHT_FACING_TUNNEL] = Dir::RIGHT;
    ctx.tunnel_exit_velo[(int)Track::DOWN_FACING_TUNNEL] = Dir::DOWN;
    ctx.tunnel_exit_velo[(int)Track::UP_FACING_TUNNEL] = Dir::UP;

    ctx.lowest_tracks_remaining = -1;
    ctx.semaphores_remaining = -1;
    ctx.best_board.clear(); ctx.best_mods.clear();
    ctx.iterations = 0;
}

// ---------------------------------------------------------------------------
// Core: generate_tracks – faithful port of TS generate_tracks generator
// ---------------------------------------------------------------------------
static std::vector<State> generate_tracks(State &arg, SolverContext &ctx){
    std::vector<State> out;
    // For readability capture refs
    auto &cars_to_use = arg.cars_to_use;
    auto &board_to_use = arg.board_to_use;
    auto &mods_to_use = arg.mods_to_use;
    int &available_tracks = arg.available_tracks;
    Heat4D &heatmaps = arg.heatmaps;
    Heat4D &heatmap_limits = arg.heatmap_limits;
    std::vector<int> &solved_normal = arg.solved_normal;
    std::vector<int> &solved_numeral = arg.solved_numeral;
    std::vector<char> &stalled = arg.stalled;
    std::vector<Vec2> &switch_queue = arg.switch_queue;
    std::vector<char> &station_stalled = arg.station_stalled;
    std::vector<Car> &crashed_decoys = arg.crashed_decoys;
    int &mvmts_since_solved = arg.mvmts_since_solved;
    int &available_semaphores = arg.available_semaphores;

    int H = ctx.H, W = ctx.W;
    int num_cars = (int)ctx.cars.size();
    int num_decoys = (int)ctx.decoys.size();

    // Remove crashed decoys
    // Find crashed indices reverse
    std::vector<int> crashed_indices;
    for(int i=(int)cars_to_use.size()-1;i>=0;--i){
        if(cars_to_use[i].type==CarType::CRASHED) crashed_indices.push_back(i);
    }
    for(int idx: crashed_indices){
        crashed_decoys.push_back(cars_to_use[idx]);
        cars_to_use.erase(cars_to_use.begin()+idx);
        stalled.erase(stalled.begin()+idx);
        // switch_queue and station_stalled are sized by original all_cars length, not cars_to_use length? In TS, these arrays are sized by all_cars.length and indexed via car_index.
        // But stalled is per cars_to_use index; others are per car_index. So we only splice stalled. Keep others as is? Actually station_stalled is per all_cars length, not per cars_to_use.
        // In TS, after splicing cars_to_use they also splice stalled only. So we mirror: don't touch switch_queue / station_stalled length here.
        // However switch_queue is per all_cars index, so no splice needed.
    }

    // stalled_cars for crashing logic
    std::vector<Car> stalled_cars;
    for(size_t i=0;i<cars_to_use.size();++i) if(stalled[i]) stalled_cars.push_back(cars_to_use[i]);

    // PRE-GENERATION SECTION
    for(size_t c=0;c<cars_to_use.size();++c){
        Car &car = cars_to_use[c];
        // Resolve queued gate
        Vec2 queued = switch_queue[car.car_index(num_cars, num_decoys)];
        // But switch_queue size is all_cars count, not cars_to_use index; need mapping via car_index
        // Actually in TS switch_queue is Array.from({length: all_cars.length}) and indexed via car.car_index(cars, decoys)
        // So we need to access via car_index, not c.
        // Let's fix: car_idx = car.car_index(num_cars,num_decoys)
        int car_idx = car.car_index(num_cars, num_decoys);
        // queued via switch_queue[car_idx]
        // If out of bounds, skip (should not happen)
        if(car_idx < (int)switch_queue.size()){
            Vec2 q = switch_queue[car_idx];
            if(q.y!=-1 && (car.pos.y!=q.y || car.pos.x!=q.x)){
                // gate closed
                mods_to_use[q.y][q.x] = Mod::CLOSED_GATE;
                switch_queue[car_idx] = {-1,-1};
            }
        }
        Mod mod = ctx.lvl.mods[car.pos.y][car.pos.x]; // Wait – should use mods_to_use or original mods? TS uses mods (original) for switch detection? Actually TS uses mods (global original) to check switch type, but gate closing uses mods_to_use.
        // In TS: const mod = mods[car.pos[0]][car.pos[1]]  // this is original mods, not mods_to_use
        // But switch/switch_rail handling modifies mods_to_use/board_to_use accordingly.
        // However for gate positions they use gate_poses which derived from original mods.
        // We'll mirror: use ctx.lvl.mods for determining switch type, but check mods_to_use for gate state.
        // But car position mods might have been overwritten? In original TS they check mods[car.pos] not mods_to_use[car.pos] for switch detection. We'll keep that.
        Mod cur_mod = ctx.lvl.mods[car.pos.y][car.pos.x];
        int cur_mod_num = ctx.lvl.mod_nums[car.pos.y][car.pos.x];

        if(!stalled[c] && cur_mod==Mod::SWITCH){
            auto it = ctx.gate_poses.find(cur_mod_num);
            if(it!=ctx.gate_poses.end()){
                for(Vec2 gate_pos: it->second){
                    Mod gate = mods_to_use[gate_pos.y][gate_pos.x];
                    if(gate==Mod::OPEN_GATE){
                        bool conflict=false;
                        for(auto &car_under: cars_to_use){
                            if(car_under.pos.y==gate_pos.y && car_under.pos.x==gate_pos.x){
                                int under_idx = car_under.car_index(num_cars,num_decoys);
                                if(under_idx < (int)switch_queue.size()) switch_queue[under_idx]=gate_pos;
                                conflict=true; break;
                            }
                        }
                        if(!conflict) mods_to_use[gate_pos.y][gate_pos.x]=Mod::CLOSED_GATE;
                    } else {
                        mods_to_use[gate_pos.y][gate_pos.x]=Mod::OPEN_GATE;
                    }
                }
            }
            auto it2 = ctx.swapping_poses.find(cur_mod_num);
            if(it2!=ctx.swapping_poses.end()){
                for(Vec2 sp: it2->second){
                    board_to_use[sp.y][sp.x] = swap_track(board_to_use[sp.y][sp.x]);
                }
            }
        } else if(!stalled[c] && cur_mod==Mod::SWITCH_RAIL){
            board_to_use[car.pos.y][car.pos.x] = swap_track(board_to_use[car.pos.y][car.pos.x]);
        }

        if(car.border_crash(H,W)) continue;

        // Heatmap & semaphore handling
        // If car not on correct station and not sem blocked, increase heat
        bool on_station = false;
        if(car.type!=CarType::DECOY){
            int idx = car.car_index(num_cars,num_decoys);
            bool stalled_flag = (idx < (int)station_stalled.size() ? station_stalled[idx] : false);
            Mod cur_m = mods_to_use[car.pos.y][car.pos.x];
            int cur_mn = ctx.lvl.mod_nums[car.pos.y][car.pos.x];
            if(car.on_correct_station(cur_m, cur_mn) || stalled_flag){
                // check if next tile is gate/sem – if not, then it's considered moving? Actually TS logic:
                // if (!(car.type !== DECOY && (on_correct_station || station_stalled) && !mods_to_use[pos_ahead].is_gate_or_sem()) ) { heat }
                // So heat is NOT added if car is on station and NOT blocked ahead.
                // We implement same.
                Mod ahead_mod = mods_to_use[car.pos_ahead.y][car.pos_ahead.x];
                if(!is_gate_or_sem(ahead_mod)){
                    on_station = true;
                }
            }
        }
        if(!on_station){
            // heatmap limit to 1 if going to new tile
            int dir_idx = (int)car.dir; // 0..3
            int cidx = car.car_index(num_cars,num_decoys);
            if(cidx < heatmap_limits.N && heatmap_limits.at(cidx, dir_idx, car.pos.y, car.pos.x)==0){
                heatmap_limits.at(cidx, dir_idx, car.pos.y, car.pos.x)++;
            }
            heatmaps.at(cidx, dir_idx, car.pos.y, car.pos.x)++;
            int heat = heatmaps.at(cidx, dir_idx, car.pos.y, car.pos.x);
            if(car.type==CarType::DECOY){
                if(heat > ctx.params.decoy_heatmap_limit) return out;
            } else {
                if(heat > heatmap_limits.at(cidx, dir_idx, car.pos.y, car.pos.x)) return out;
            }
        }

        // Semaphore processing
        Mod ahead_mod = mods_to_use[car.pos_ahead.y][car.pos_ahead.x];
        if(ahead_mod==Mod::SEMAPHORE){
            Track ahead_track = board_to_use[car.pos_ahead.y][car.pos_ahead.x];
            extern std::vector<Dir> semaphore_pass_table[38];
            auto &semDirs = semaphore_pass_table[(int)ahead_track];
            if(semDirs.size()>=2){
                Vec2 sem_pos0 = add_vec({car.pos_ahead.y, car.pos_ahead.x}, semDirs[0]);
                Vec2 sem_pos1 = add_vec({car.pos_ahead.y, car.pos_ahead.x}, semDirs[1]);
                if(available_tracks == ctx.lowest_tracks_remaining + 1){
                    if(car.pos.y==sem_pos0.y && car.pos.x==sem_pos0.x){
                        if(board_to_use[sem_pos1.y][sem_pos1.x]==Track::EMPTY) return out;
                    } else {
                        if(board_to_use[sem_pos0.y][sem_pos0.x]==Track::EMPTY) return out;
                    }
                }
                for(auto &p_car: cars_to_use){
                    if(p_car.pos.y==car.pos.y && p_car.pos.x==car.pos.x && p_car.dir==car.dir && p_car.num==car.num && p_car.type==car.type) continue;
                    bool pos0 = p_car.pos.y==sem_pos0.y && p_car.pos.x==sem_pos0.x && p_car.dir != reverse_dir(semDirs[0]);
                    bool pos1 = p_car.pos.y==sem_pos1.y && p_car.pos.x==sem_pos1.x && p_car.dir != reverse_dir(semDirs[1]);
                    if(pos0||pos1){
                        mods_to_use[car.pos_ahead.y][car.pos_ahead.x]=Mod::DEACTIVATED_MOD;
                        break;
                    }
                }
            }
        }
    }

    // POST-GENERATION: per car track generation
    int C = (int)cars_to_use.size();
    std::vector<std::vector<Car>> cars_generated(C);
    std::vector<std::vector<Track>> usable_tracks(C);
    std::vector<char> decoy_placing(ctx.decoys.size(), 0);
    std::vector<int> just_solved = {-1, -1}; // index in cars_to_use for normal/numeral solved this frame

    for(int c=0;c<C;++c){
        Car car = cars_to_use[c];
        ctx.iterations++;

        if(car.border_crash(H,W)){
            cars_generated[c].push_back(car.crash());
            usable_tracks[c].push_back(board_to_use[car.pos.y][car.pos.x]);
            continue;
        }

        // Station processing
        if(car.type!=CarType::DECOY){
            int car_idx = car.car_index(num_cars,num_decoys);
            Mod cur_m = mods_to_use[car.pos.y][car.pos.x];
            int cur_mn = ctx.lvl.mod_nums[car.pos.y][car.pos.x];
            if(car.on_correct_station(cur_m, cur_mn)){
                station_stalled[car_idx]=1;
                mods_to_use[car.pos.y][car.pos.x]=Mod::DEACTIVATED_MOD;
                cars_generated[c].push_back(car);
                usable_tracks[c].push_back(board_to_use[car.pos.y][car.pos.x]);
                continue;
            } else if(car_idx < (int)station_stalled.size() && station_stalled[car_idx]){
                station_stalled[car_idx]=0;
                cars_generated[c].push_back(car);
                usable_tracks[c].push_back(board_to_use[car.pos.y][car.pos.x]);
                continue;
            }
        }
        // Gate processing
        Mod ahead_mod = mods_to_use[car.pos_ahead.y][car.pos_ahead.x];
        if(is_gate_or_sem(ahead_mod)){
            stalled[c]=1;
            cars_generated[c].push_back(car);
            usable_tracks[c].push_back(board_to_use[car.pos.y][car.pos.x]);
            continue;
        }
        if(stalled[c]) stalled[c]=0;

        Track tile_ahead = board_to_use[car.pos_ahead.y][car.pos_ahead.x];
        Dir tile_redirect = get_redirect_fast(tile_ahead, car.dir);

        std::vector<Track> tracks_to_check;

        if(tile_ahead!=Track::EMPTY){
            if(ctx.permanent_poses.count(car.pos_ahead.y*W + car.pos_ahead.x)){
                if(tile_redirect==Dir::CRASH){
                    if(car.type==CarType::DECOY){
                        cars_generated[c].push_back(car.crash());
                        usable_tracks[c].push_back(board_to_use[car.pos.y][car.pos.x]);
                        continue;
                    } else {
                        return out;
                    }
                } else {
                    tracks_to_check.push_back(tile_ahead);
                }
            } else {
                if(tile_redirect==Dir::CRASH){
                    if(is_turn(tile_ahead) || is_straight(tile_ahead)){
                        auto gen = car.generable_3ways(tile_ahead);
                        tracks_to_check = gen;
                    } else if(car.type==CarType::DECOY){
                        cars_generated[c].push_back(car.crash());
                        usable_tracks[c].push_back(board_to_use[car.pos.y][car.pos.x]);
                        continue;
                    } else {
                        return out;
                    }
                } else if(is_straight(tile_ahead)){
                    // check heat sum to decide if 3way allowed
                    int heat_sum=0;
                    bool cannot_place=false;
                    for(int i=0;i<heatmaps.N;++i){
                        heat_sum += heatmaps.at(i, (int)car.dir, car.pos.y, car.pos.x);
                        if(heat_sum>1){ tracks_to_check.push_back(tile_ahead); cannot_place=true; break; }
                    }
                    if(!cannot_place){
                        tracks_to_check.push_back(tile_ahead);
                        auto gen = car.generable_3ways(tile_ahead);
                        tracks_to_check.insert(tracks_to_check.end(), gen.begin(), gen.end());
                    }
                } else {
                    tracks_to_check.push_back(tile_ahead);
                }
            }
        } else {
            if(car.type==CarType::DECOY){
                bool can_crash = ctx.permanent_poses.count(car.pos.y*W+car.pos.x) || !is_turn(board_to_use[car.pos.y][car.pos.x]);
                if(available_tracks -1 <= ctx.lowest_tracks_remaining){
                    if(can_crash) tracks_to_check.push_back(Track::EMPTY);
                    else return out;
                } else {
                    decoy_placing[car.num]=1;
                    if(can_crash) tracks_to_check.push_back(Track::EMPTY);
                    auto gen = car.generable_tracks();
                    tracks_to_check.insert(tracks_to_check.end(), gen.begin(), gen.end());
                    if(!can_crash && tracks_to_check.empty()) return out;
                }
            } else {
                available_tracks--;
                auto gen = car.generable_tracks();
                tracks_to_check = gen;
            }
        }

        if(!tracks_to_check.empty()){
            if((is_car_ending(tracks_to_check[0]) && car.type!=CarType::NORMAL) ||
               (is_ncar_ending(tracks_to_check[0]) && car.type!=CarType::NUMERAL)){
                return out;
            }
        }

        if(available_tracks <= ctx.lowest_tracks_remaining) return out;

        // same tile crashing
        std::vector<Car> crash_cars;
        crash_cars.reserve(cars_generated.size()+crashed_decoys.size()+stalled_cars.size());
        for(auto &v: cars_generated) if(!v.empty()) crash_cars.push_back(v[0]);
        crash_cars.insert(crash_cars.end(), crashed_decoys.begin(), crashed_decoys.end());
        crash_cars.insert(crash_cars.end(), stalled_cars.begin(), stalled_cars.end());
        if(car.same_tile_crash(crash_cars)!=-1 || car.head_on_crash(cars_to_use)){
            if(!tracks_to_check.empty() && tracks_to_check[0]==Track::EMPTY){
                tracks_to_check = {Track::EMPTY};
            } else if(car.type==CarType::DECOY){
                cars_generated[c].push_back(car.crash());
                usable_tracks[c].push_back(board_to_use[car.pos.y][car.pos.x]);
                continue;
            } else {
                return out;
            }
        }

        // track confirming loop
        for(Track possibleTrack: tracks_to_check){
            Dir possible_redirect = Dir::UNKNOWN;
            if(possibleTrack==Track::EMPTY){
                cars_generated[c].push_back(car.crash());
                usable_tracks[c].push_back(Track::EMPTY);
                continue;
            } else if(is_tunnel(possibleTrack)){
                int mn = ctx.lvl.mod_nums[car.pos_ahead.y][car.pos_ahead.x];
                auto it = ctx.tunnel_poses.find(mn);
                if(it!=ctx.tunnel_poses.end()){
                    Vec2 p0 = it->second[0];
                    Vec2 p1 = it->second.size()>1 ? it->second[1] : p0;
                    if(p0.y==car.pos_ahead.y && p0.x==car.pos_ahead.x) car.pos_ahead = p1;
                    else car.pos_ahead = p0;
                }
                // need track value at exit to get velo
                Track exit_track = ctx.lvl.board[car.pos_ahead.y][car.pos_ahead.x];
                auto it2 = ctx.tunnel_exit_velo.find((int)exit_track);
                if(it2!=ctx.tunnel_exit_velo.end()) possible_redirect = it2->second;
                else possible_redirect = Dir::UNKNOWN;
            } else {
                possible_redirect = get_redirect_fast(possibleTrack, car.dir);
            }

            if(is_car_ending(possibleTrack) || is_ncar_ending(possibleTrack)){
                int is_numeral = (car.type==CarType::NUMERAL)?1:0;
                std::vector<int> &any_solved = is_numeral ? solved_numeral : solved_normal;
                if((any_solved.empty() && car.num!=0) ||
                   (!any_solved.empty() && any_solved.back()!=car.num-1)){
                    return out;
                }
                // station collected check
                Mod station_mod = car.get_station();
                auto itS = ctx.station_poses.find((int)station_mod);
                if(itS!=ctx.station_poses.end()){
                    auto itN = itS->second.find(car.num);
                    if(itN!=itS->second.end()){
                        for(Vec2 sp: itN->second){
                            if(mods_to_use[sp.y][sp.x]!=Mod::DEACTIVATED_MOD) return out;
                        }
                    }
                }
                if(is_numeral) solved_numeral.push_back(car.num);
                else solved_normal.push_back(car.num);
                just_solved[is_numeral]=c;
                cars_generated[c].push_back(Car(car.pos_ahead, car.dir, car.num, car.type));
                usable_tracks[c].push_back(possibleTrack);
                continue;
            } else if(is_3way(possibleTrack) && !is_3way(tile_ahead)){
                bool cannot=false;
                Dir rev = reverse_dir(possible_redirect);
                for(int i=0;i<heatmaps.N;++i){
                    if(heatmaps.at(i, (int)rev, car.pos_ahead.y, car.pos_ahead.x)>0){ cannot=true; break; }
                }
                if(cannot) continue;
                if(mods_to_use[car.pos_ahead.y][car.pos_ahead.x]==Mod::SEMAPHORE ||
                   mods_to_use[car.pos_ahead.y][car.pos_ahead.x]==Mod::DEACTIVATED_MOD) continue;
            }

            Vec2 end_on = add_vec(car.pos_ahead, possible_redirect);
            if(!(0<=end_on.y && end_on.y<H && 0<=end_on.x && end_on.x<W)){
                if(car.type==CarType::DECOY){
                    cars_generated[c].push_back(Car(car.pos_ahead, possible_redirect, car.num, car.type));
                    usable_tracks[c].push_back(possibleTrack);
                }
                continue;
            }
            Track end_on_tile = board_to_use[end_on.y][end_on.x];
            Dir end_redirect = get_redirect_fast(end_on_tile, possible_redirect);
            bool possible_to_place_3way = (is_straight(end_on_tile) || is_turn(end_on_tile)) &&
                                         !ctx.permanent_poses.count(end_on.y*W+end_on.x);
            if(end_redirect==Dir::CRASH && end_on_tile!=Track::EMPTY && !possible_to_place_3way){
                if(car.type==CarType::DECOY){
                    cars_generated[c].push_back(Car(car.pos_ahead, possible_redirect, car.num, car.type));
                    usable_tracks[c].push_back(possibleTrack);
                }
                continue;
            }
            cars_generated[c].push_back(Car(car.pos_ahead, possible_redirect, car.num, car.type));
            if(is_tunnel(possibleTrack)){
                usable_tracks[c].push_back(ctx.lvl.board[car.pos_ahead.y][car.pos_ahead.x]);
            } else {
                usable_tracks[c].push_back(possibleTrack);

                // semaphore extra branch
                bool semaphore_triggered=false;
                for(int i=0;i<heatmaps.N;++i) for(int j=0;j<4;++j) if(heatmaps.at(i,j,car.pos_ahead.y,car.pos_ahead.x)){ semaphore_triggered=true; break; }
                if(!semaphore_triggered && available_semaphores>0 && (is_straight(possibleTrack) || is_turn(possibleTrack)) &&
                   mods_to_use[car.pos_ahead.y][car.pos_ahead.x]==Mod::EMPTY){
                    extern std::vector<Dir> semaphore_pass_table[38];
                    auto &semPass = semaphore_pass_table[(int)possibleTrack];
                    if(semPass.size()>=2){
                        Vec2 sem0 = add_vec(car.pos_ahead, semPass[0]);
                        Vec2 sem1 = add_vec(car.pos_ahead, semPass[1]);
                        int pos0_heat=0, pos1_heat=0;
                        for(int i=0;i<heatmaps.N;++i) for(int j=0;j<4;++j){
                            if(sem0.y>=0&&sem0.y<H&&sem0.x>=0&&sem0.x<W) pos0_heat += heatmaps.at(i,j,sem0.y,sem0.x);
                            if(sem1.y>=0&&sem1.y<H&&sem1.x>=0&&sem1.x<W) pos1_heat += heatmaps.at(i,j,sem1.y,sem1.x);
                        }
                        int pos0_start = (mods_to_use[sem0.y][sem0.x]==Mod::STARTING_CAR_TILE)?1:0;
                        int pos1_start = (mods_to_use[sem1.y][sem1.x]==Mod::STARTING_CAR_TILE)?1:0;
                        int starting_tile_heat=0;
                        if(mods_to_use[car.pos.y][car.pos.x]==Mod::STARTING_CAR_TILE){
                            Vec2 start_pos{0,0};
                            if(car.type==CarType::NORMAL) start_pos = ctx.cars[car.num].pos;
                            else if(car.type==CarType::DECOY) start_pos = ctx.decoys[car.num].pos;
                            else start_pos = ctx.ncars[car.num].pos;
                            starting_tile_heat = (car.pos.y==start_pos.y && car.pos.x==start_pos.x)?1:0;
                        }
                        if(pos0_heat+pos1_heat -pos0_start -pos1_start + starting_tile_heat==1){
                            cars_generated[c].push_back(car);
                            usable_tracks[c].push_back(add_placeholder_sem(possibleTrack));
                        }
                    }
                }
            }
        }
        if(usable_tracks[c].empty()) return out;
    }

    // kill if all stalled
    bool all_stalled=true;
    for(size_t i=0;i<stalled.size() && i<cars_to_use.size();++i) if(!stalled[i]) all_stalled=false;
    if(all_stalled && !cars_to_use.empty()) return out;

    // solved check
    if((int)solved_normal.size()==(int)ctx.cars.size() && (int)solved_numeral.size()==(int)ctx.ncars.size()){
        if(std::all_of(cars_to_use.begin(), cars_to_use.end(), [](const Car& cc){ return cc.type!=CarType::DECOY; }) || mvmts_since_solved==2){
            ctx.best_board = board_to_use;
            ctx.best_mods = mods_to_use;
            ctx.lowest_tracks_remaining = available_tracks;
            ctx.semaphores_remaining = available_semaphores;
            // count as solution – we clear out to signal caller to stop branching
            out.clear();
            // signal solved via special return? We'll handle in tail_call_gen by checking ctx.lowest...
            return out;
        } else {
            mvmts_since_solved++;
        }
    }
    // remove solved cars
    // need to handle indices after possible earlier splice
    // just_solved[0] is index in current cars_to_use
    // We need to erase in descending order to preserve indices
    std::vector<int> to_remove;
    if(just_solved[0]!=-1) to_remove.push_back(just_solved[0]);
    if(just_solved[1]!=-1){
        int adj = just_solved[1] - (just_solved[0]!=-1 && just_solved[1] > just_solved[0] ? 1 : 0);
        to_remove.push_back(adj);
    }
    std::sort(to_remove.rbegin(), to_remove.rend());
    for(int idx: to_remove){
        if(idx>=0 && idx < (int)cars_generated.size()){
            cars_generated.erase(cars_generated.begin()+idx);
            usable_tracks.erase(usable_tracks.begin()+idx);
            if(idx < (int)stalled.size()) stalled.erase(stalled.begin()+idx);
        }
    }

    if(cars_generated.empty()){
        // No cars left but not all solved? This happens when last cars just solved and removed
        // In TS, product of empty arrays gives [[]] => one combo with no cars. We'll handle after.
    }

    auto car_combos = product(cars_generated);
    auto track_combos = product(usable_tracks);

    // If both are empty (no cars left), product returns { [] } with one empty combo? Our product with empty input gives {{}} (one empty vector). That's correct.
    // But if cars_generated empty after solved removal, we still want to create a branch with no cars.
    if(car_combos.empty()) car_combos.push_back({});
    if(track_combos.empty()) track_combos.push_back({});

    for(size_t combo=0; combo<car_combos.size(); ++combo){
        auto &car_combo = car_combos[combo];
        auto &track_combo = track_combos[combo];
        int tracks_pass = available_tracks;
        int sems_pass = available_semaphores;
        auto board_pass = board_to_use;
        auto mods_pass = mods_to_use;
        auto stalled_pass = stalled;
        Heat4D limits_pass = heatmap_limits;
        bool stop_branch=false;

        for(size_t i=0;i<car_combo.size();++i){
            Car car = car_combo[i];
            for(size_t j=i+1;j<car_combo.size();++j){
                if(car.pos.y==car_combo[j].pos.y && car.pos.x==car_combo[j].pos.x){ stop_branch=true; break; }
            }
            if(stop_branch) break;
            Track tp = track_combo[i];
            if(car.type==CarType::DECOY && tp!=Track::EMPTY && (int)car.num < (int)decoy_placing.size() && decoy_placing[car.num]){
                tracks_pass--;
                if(tracks_pass <= ctx.lowest_tracks_remaining){ stop_branch=true; break; }
            }
            if(is_placeholder_sem(tp)){
                sems_pass--;
                if(sems_pass<0){ stop_branch=true; break; }
                board_pass[car.pos_ahead.y][car.pos_ahead.x]=remove_placeholder_sem(tp);
                mods_pass[car.pos_ahead.y][car.pos_ahead.x]=Mod::SEMAPHORE;
                if(i < stalled_pass.size()) stalled_pass[i]=1;
            } else if(tp!=Track::EMPTY){
                board_pass[car.pos.y][car.pos.x]=tp;
            }
            // swapping track heatmap limit bump
            if(car.type!=CarType::CRASHED && (mods_pass[car.pos.y][car.pos.x]==Mod::SWAPPING_TRACK || mods_pass[car.pos.y][car.pos.x]==Mod::SWITCH_RAIL)){
                int cidx = car.car_index(num_cars, num_decoys);
                if(cidx < limits_pass.N){
                    int cur_limit = 0;
                    // find if any >0 and check limit
                    bool has=false; int maxv=0;
                    for(int d=0;d<4;++d) for(int y=0;y<H;++y) for(int x=0;x<W;++x) if(limits_pass.at(cidx,d,y,x)>0){ has=true; maxv = std::max(maxv, limits_pass.at(cidx,d,y,x)); }
                    if(has && maxv <= ctx.params.heatmap_limit_limit){
                        if(i < stalled_pass.size() && !stalled_pass[i]){
                            for(int d=0;d<4;++d) for(int y=0;y<H;++y) for(int x=0;x<W;++x) if(limits_pass.at(cidx,d,y,x)>0) limits_pass.at(cidx,d,y,x)++;
                        }
                    } else if(has && maxv > ctx.params.heatmap_limit_limit){
                        stop_branch=true; break;
                    }
                }
            }
        }
        if(stop_branch) continue;
        State ns;
        ns.cars_to_use = car_combo;
        // reconstitute cars with proper pos_ahead (already done)
        ns.board_to_use = std::move(board_pass);
        ns.mods_to_use = std::move(mods_pass);
        ns.available_tracks = tracks_pass;
        ns.heatmaps = heatmaps; // copy
        ns.heatmap_limits = std::move(limits_pass);
        ns.solved_normal = solved_normal;
        ns.solved_numeral = solved_numeral;
        ns.stalled = std::move(stalled_pass);
        ns.switch_queue = switch_queue;
        ns.station_stalled = station_stalled;
        ns.crashed_decoys = crashed_decoys;
        ns.mvmts_since_solved = mvmts_since_solved;
        ns.available_semaphores = sems_pass;
        out.push_back(std::move(ns));
        if(ctx.lowest_tracks_remaining!=-1) return out; // early exit if solved found
    }

    return out;
}

// ---------------------------------------------------------------------------
// tail_call_gen loops
// ---------------------------------------------------------------------------
static SolveResult run_solve(SolverContext &ctx, State initial){
    using clock = std::chrono::steady_clock;
    ctx.start_time = clock::now();
    ctx.last_visualize = ctx.start_time;
    ctx.iterations = 0;

    // DFS
    if(ctx.params.gen_type==SolveParams::GenType::DFS){
        std::vector<State> stack;
        stack.push_back(std::move(initial));
        while(!stack.empty()){
            if(ctx.should_cancel && ctx.should_cancel()) break;
            State cur = std::move(stack.back());
            stack.pop_back();

            // visualization throttling
            auto now = clock::now();
            auto elapsed_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now - ctx.last_visualize).count();
            if(ctx.visualize_cb && elapsed_ms >= ctx.params.visualize_rate_ms && ctx.params.visualize_rate_ms>0){
                double elapsed_s = std::chrono::duration<double>(now - ctx.start_time).count();
                bool cont = ctx.visualize_cb(cur.board_to_use, cur.mods_to_use, cur.cars_to_use, ctx.iterations, elapsed_s);
                ctx.last_visualize = now;
                if(!cont){
                    // pause behavior: busy wait until should_cancel or continue? For native we just continue; WASM bindings will handle pause via callback returning false and waiting.
                    // We'll just continue if cont==false means pause – in JS worker they wait for resume message.
                    // For native, treat false as cancel.
                    break;
                }
            }

            auto next_states = generate_tracks(cur, ctx);
            if(ctx.lowest_tracks_remaining!=-1){
                // found best? In generate_tracks we set best and return; but we need to check if we should stop entire search.
                // For DFS, finding a solution doesn't mean it's optimal; we continue searching for better (fewer tracks).
                // However TS code returns early when lowest_tracks_remaining != -1 inside BFS loop only. DFS continues.
                // We'll continue but push next states if any.
            }
            // push in reverse to preserve order
            for(int i=(int)next_states.size()-1;i>=0;--i){
                stack.push_back(std::move(next_states[i]));
            }
            // if solved and we want minimal tracks, we don't early exit – we keep searching until stack empty or proven no better.
            // But to save time, if available_tracks == 0 we could stop.
            if(ctx.lowest_tracks_remaining==0) break;
        }
    } else { // BFS
        // BFS bucketed by available_tracks (like TS Map<number, deque>)
        // max tracks could be e.g. 20, so buckets size max_tracks+1
        int maxT = ctx.lvl.max_tracks;
        std::vector<std::deque<State>> buckets(maxT+1);
        buckets[maxT].push_back(std::move(initial));
        for(int t=maxT; t>=0; --t){
            auto &queue = buckets[t];
            while(!queue.empty()){
                if(ctx.should_cancel && ctx.should_cancel()) break;
                State cur = std::move(queue.front());
                queue.pop_front();

                auto now = clock::now();
                auto elapsed_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now - ctx.last_visualize).count();
                if(ctx.visualize_cb && elapsed_ms >= ctx.params.visualize_rate_ms && ctx.params.visualize_rate_ms>0){
                    double elapsed_s = std::chrono::duration<double>(now - ctx.start_time).count();
                    bool cont = ctx.visualize_cb(cur.board_to_use, cur.mods_to_use, cur.cars_to_use, ctx.iterations, elapsed_s);
                    ctx.last_visualize = now;
                    if(!cont) break;
                }
                auto next_states = generate_tracks(cur, ctx);
                if(ctx.lowest_tracks_remaining!=-1) return SolveResult{}; // early exit as in TS BFS? We'll handle after loop
                for(auto &ns: next_states){
                    int at = ns.available_tracks;
                    if(at>=0 && at <= maxT) buckets[at].push_back(std::move(ns));
                }
                if(ctx.lowest_tracks_remaining!=-1) break;
            }
            if(ctx.lowest_tracks_remaining!=-1) break;
        }
    }

    SolveResult res;
    auto end = clock::now();
    res.time_elapsed_s = std::chrono::duration<double>(end - ctx.start_time).count();
    res.iterations = ctx.iterations;
    if(!ctx.best_board.empty()){
        res.solved = true;
        // replace permanent tiles that may have been swapped
        for(int y=0;y<ctx.H;++y) for(int x=0;x<ctx.W;++x){
            if(ctx.permanent_poses.count(y*ctx.W+x)){
                ctx.best_board[y][x]=ctx.lvl.board[y][x];
                ctx.best_mods[y][x]=ctx.lvl.mods[y][x];
            }
        }
        res.board = ctx.best_board;
        res.mods = ctx.best_mods;
        res.tracks_left = ctx.lowest_tracks_remaining;
        res.semaphores_left = ctx.semaphores_remaining;
    } else {
        res.solved = false;
        res.tracks_left = 0;
        res.semaphores_left = 0;
    }
    return res;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
SolveResult solve_level(const LevelInput& input, const SolveParams& params,
                        VisualizeCallback visualize_cb,
                        std::function<bool()> should_cancel){
    init_tables();
    SolverContext ctx;
    ctx.params = params;
    ctx.lvl = input;
    ctx.visualize_cb = visualize_cb;
    ctx.should_cancel = should_cancel;
    build_context(ctx);

    // quick checks – mirrors TS solve_level early cancel
    bool cancel=false;
    for(auto &c: ctx.cars) if(c.border_crash(ctx.H, ctx.W)) cancel=true;
    for(auto &c: ctx.ncars) if(c.border_crash(ctx.H, ctx.W)) cancel=true;
    if(ctx.cars.empty() && ctx.ncars.empty()) cancel=true;

    if(cancel){
        SolveResult r;
        r.solved=false;
        r.time_elapsed_s=0;
        r.iterations=0;
        return r;
    }

    // build initial State
    State init;
    init.cars_to_use = input.cars;
    init.board_to_use = input.board;
    init.mods_to_use = input.mods;
    init.available_tracks = input.max_tracks;
    init.heatmaps = Heat4D((int)input.cars.size(), ctx.H, ctx.W);
    init.heatmap_limits = Heat4D((int)input.cars.size(), ctx.H, ctx.W);
    init.solved_normal.clear(); init.solved_numeral.clear();
    init.stalled.assign(input.cars.size(), 0);
    init.switch_queue.assign(input.cars.size(), Vec2{-1,-1});
    init.station_stalled.assign(input.cars.size(), 0);
    init.crashed_decoys.clear();
    init.mvmts_since_solved=0;
    init.available_semaphores = input.max_semaphores;

    // For station_stalled/switch_queue size should be all_cars size (which equals input.cars.size()) – okay.
    return run_solve(ctx, std::move(init));
}

SolveResult solve_flat(const std::vector<int>& board_flat,
                       const std::vector<int>& mods_flat,
                       const std::vector<int>& mod_nums_flat,
                       const std::vector<Car>& cars,
                       int H,int W,
                       int max_tracks,int max_semaphores,
                       const SolveParams& params,
                       VisualizeCallback cb,
                       std::function<bool()> should_cancel){
    LevelInput in;
    in.board.assign(H, std::vector<Track>(W));
    in.mods.assign(H, std::vector<Mod>(W));
    in.mod_nums.assign(H, std::vector<int>(W));
    for(int y=0;y<H;++y) for(int x=0;x<W;++x){
        int idx=y*W+x;
        in.board[y][x]= (Track)board_flat[idx];
        in.mods[y][x]= (Mod)mods_flat[idx];
        in.mod_nums[y][x]= mod_nums_flat[idx];
    }
    in.cars=cars;
    in.max_tracks=max_tracks;
    in.max_semaphores=max_semaphores;
    return solve_level(in, params, cb, should_cancel);
}

} // namespace railbound
