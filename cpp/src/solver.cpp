#include "railbound/solver.hpp"
#include <iostream>
#include <unordered_set>
#include <deque>
#include <map>
#include <chrono>

namespace railbound {

namespace {

struct SearchState {
    std::vector<Car> cars_to_use;
    std::vector<std::vector<Track>> board_to_use;
    std::vector<std::vector<Mod>> mods_to_use;
    int available_tracks{0};
    std::vector<int> heatmaps; // shape [num_all_cars, 4, H, W]
    std::vector<int> solved_normal;
    std::vector<int> solved_numeral;
    std::vector<bool> stalled;
    std::vector<Pos> switch_queue;
    std::vector<bool> station_stalled;
    std::vector<Car> crashed_decoys;
    int mvmts_since_solved{0};
    int available_semaphores{0};
    std::vector<int> heatmap_limits; // shape [num_all_cars, 4, H, W]
};

inline size_t heat_idx(size_t car_idx, Direction dir, int y, int x, int H, int W) noexcept {
    int d = static_cast<int>(dir);
    if (d < 0 || d > 3) return 0;
    return (car_idx * 4 + static_cast<size_t>(d)) * static_cast<size_t>(H * W) + static_cast<size_t>(y * W + x);
}

} // namespace

Solver::Solver(SolverOptions options) : options_(std::move(options)) {}

SolveResult Solver::solve(const Level& level, VisualizeCallback visualize) {
    SolveResult result;
    auto start_time = std::chrono::steady_clock::now();

    const auto& board = level.board;
    const auto& mods = level.mods;
    const auto& mod_nums = level.mod_nums;
    const auto& all_cars = level.cars;
    int max_tracks = level.max_tracks;
    int max_semaphores = level.max_semaphores;

    if (board.empty() || board[0].empty()) {
        result.time_elapsed_seconds = 0.0;
        return result;
    }

    int H = static_cast<int>(board.size());
    int W = static_cast<int>(board[0].size());

    std::vector<Car> cars;
    std::vector<Car> decoys;
    std::vector<Car> ncars;
    for (const auto& car : all_cars) {
        if (car.type == CarType::NORMAL) {
            cars.push_back(car);
        } else if (car.type == CarType::DECOY) {
            decoys.push_back(car);
        } else if (car.type == CarType::NUMERAL) {
            ncars.push_back(car);
        }
    }

    size_t cars_count = cars.size();
    size_t decoys_count = decoys.size();
    size_t ncars_count = ncars.size();
    size_t total_cars_count = all_cars.size();

    // Check if non-decoy cars immediately crash into border
    for (const auto& car : cars) {
        if (car.border_crash(H, W)) {
            result.time_elapsed_seconds = 0.0;
            return result;
        }
    }
    for (const auto& car : ncars) {
        if (car.border_crash(H, W)) {
            result.time_elapsed_seconds = 0.0;
            return result;
        }
    }
    if (cars_count + ncars_count == 0) {
        result.time_elapsed_seconds = 0.0;
        return result;
    }

    std::unordered_set<int> permanent_track_poses;
    std::map<int, std::vector<Pos>> tunnel_poses;
    std::map<int, std::vector<Pos>> gate_poses;
    std::map<int, std::vector<Pos>> swapping_track_poses;
    std::map<Mod, std::map<int, std::vector<Pos>>> station_poses;

    for (int i = 0; i < H; ++i) {
        for (int j = 0; j < W; ++j) {
            if (!track_is_empty(board[i][j])) {
                permanent_track_poses.insert(i * W + j);
            }
            Pos pos{i, j};
            Mod m = mods[i][j];
            int num = mod_nums[i][j];
            if (m == Mod::TUNNEL) {
                tunnel_poses[num].push_back(pos);
            } else if (m == Mod::OPEN_GATE || m == Mod::CLOSED_GATE) {
                gate_poses[num].push_back(pos);
            } else if (m == Mod::SWAPPING_TRACK) {
                swapping_track_poses[num].push_back(pos);
            } else if (m == Mod::STATION || m == Mod::POST_OFFICE) {
                station_poses[m][num].push_back(pos);
            }
        }
    }

    int lowest_tracks_remaining = -1;
    int semaphores_remaining = -1;
    std::vector<std::vector<Track>> best_board;
    std::vector<std::vector<Mod>> best_mods;
    uint64_t iterations = 0;

    size_t heatmap_size = total_cars_count * 4 * H * W;

    SearchState initial_state;
    initial_state.cars_to_use = all_cars;
    initial_state.board_to_use = board;
    initial_state.mods_to_use = mods;
    initial_state.available_tracks = max_tracks;
    initial_state.heatmaps.assign(heatmap_size, 0);
    initial_state.solved_normal.clear();
    initial_state.solved_numeral.clear();
    initial_state.stalled.assign(total_cars_count, false);
    initial_state.switch_queue.assign(total_cars_count, Pos{-1, -1});
    initial_state.station_stalled.assign(total_cars_count, false);
    initial_state.crashed_decoys.clear();
    initial_state.mvmts_since_solved = 0;
    initial_state.available_semaphores = max_semaphores;
    initial_state.heatmap_limits.assign(heatmap_size, 0);

    auto generate_tracks = [&](SearchState& state) -> std::vector<SearchState> {
        // Remove decoys from generation if they crashed last frame
        for (int i = static_cast<int>(state.cars_to_use.size()) - 1; i >= 0; --i) {
            if (state.cars_to_use[i].type == CarType::CRASHED) {
                state.crashed_decoys.push_back(state.cars_to_use[i]);
                state.cars_to_use.erase(state.cars_to_use.begin() + i);
                state.stalled.erase(state.stalled.begin() + i);
            }
        }

        std::vector<Car> stalled_cars;
        for (size_t i = 0; i < state.cars_to_use.size(); ++i) {
            if (state.stalled[i]) {
                stalled_cars.push_back(state.cars_to_use[i]);
            }
        }

        // Pre-generation section 1
        for (size_t c = 0; c < state.cars_to_use.size(); ++c) {
            const Car& car = state.cars_to_use[c];
            Pos queued_gate = state.switch_queue[c];
            if (queued_gate.y != -1 && (car.pos.y != queued_gate.y || car.pos.x != queued_gate.x)) {
                state.mods_to_use[queued_gate.y][queued_gate.x] = Mod::CLOSED_GATE;
                state.switch_queue[c] = {-1, -1};
            }

            Mod mod = mods[car.pos.y][car.pos.x];
            int mod_num = mod_nums[car.pos.y][car.pos.x];

            if (!state.stalled[c] && mod == Mod::SWITCH) {
                auto gate_it = gate_poses.find(mod_num);
                if (gate_it != gate_poses.end()) {
                    for (const Pos& gate_pos : gate_it->second) {
                        Mod gate = state.mods_to_use[gate_pos.y][gate_pos.x];
                        if (gate == Mod::OPEN_GATE) {
                            bool gate_conflict = false;
                            for (const auto& car_under_gate : state.cars_to_use) {
                                if (car_under_gate.pos == gate_pos) {
                                    state.switch_queue[car.car_index(cars_count, decoys_count)] = gate_pos;
                                    gate_conflict = true;
                                    break;
                                }
                            }
                            if (!gate_conflict) {
                                state.mods_to_use[gate_pos.y][gate_pos.x] = Mod::CLOSED_GATE;
                            }
                        } else {
                            state.mods_to_use[gate_pos.y][gate_pos.x] = Mod::OPEN_GATE;
                        }
                    }
                }

                auto swap_it = swapping_track_poses.find(mod_num);
                if (swap_it != swapping_track_poses.end()) {
                    for (const Pos& swap_pos : swap_it->second) {
                        state.board_to_use[swap_pos.y][swap_pos.x] = track_swap(state.board_to_use[swap_pos.y][swap_pos.x]);
                    }
                }
            } else if (!state.stalled[c] && mod == Mod::SWITCH_RAIL) {
                state.board_to_use[car.pos.y][car.pos.x] = track_swap(state.board_to_use[car.pos.y][car.pos.x]);
            }

            if (car.border_crash(H, W)) {
                continue;
            }

            size_t car_idx = car.car_index(cars_count, decoys_count);
            bool on_station_condition = (car.type != CarType::DECOY && (
                car.on_correct_station(state.mods_to_use[car.pos.y][car.pos.x], mod_nums[car.pos.y][car.pos.x]) ||
                state.station_stalled[car_idx]
            ));
            bool gate_or_sem_ahead = mod_is_gate_or_sem(state.mods_to_use[car.pos_ahead.y][car.pos_ahead.x]);

            if (!on_station_condition && !gate_or_sem_ahead) {
                size_t h_idx = heat_idx(car_idx, car.direction, car.pos.y, car.pos.x, H, W);
                if (state.heatmap_limits[h_idx] == 0) {
                    state.heatmap_limits[h_idx]++;
                }
                state.heatmaps[h_idx]++;
                int heat = state.heatmaps[h_idx];
                if (car.type == CarType::DECOY) {
                    if (heat > options_.decoy_heatmap_limit) return {};
                } else {
                    if (heat > state.heatmap_limits[h_idx]) return {};
                }
            }

            if (state.mods_to_use[car.pos_ahead.y][car.pos_ahead.x] == Mod::SEMAPHORE) {
                auto [sem_dir0, sem_dir1] = get_semaphore_pass(state.board_to_use[car.pos_ahead.y][car.pos_ahead.x]);
                Pos sem_pos0 = direction_add_vector(sem_dir0, car.pos_ahead);
                Pos sem_pos1 = direction_add_vector(sem_dir1, car.pos_ahead);

                if (state.available_tracks == lowest_tracks_remaining + 1) {
                    if (car.pos == sem_pos0) {
                        if (track_is_empty(state.board_to_use[sem_pos1.y][sem_pos1.x])) return {};
                    } else {
                        if (track_is_empty(state.board_to_use[sem_pos0.y][sem_pos0.x])) return {};
                    }
                }

                for (size_t pc = 0; pc < state.cars_to_use.size(); ++pc) {
                    if (pc == c) continue;
                    const auto& p_car = state.cars_to_use[pc];
                    bool pos0 = (p_car.pos == sem_pos0 && p_car.direction != direction_reverse(sem_dir0));
                    bool pos1 = (p_car.pos == sem_pos1 && p_car.direction != direction_reverse(sem_dir1));
                    if (pos0 || pos1) {
                        state.mods_to_use[car.pos_ahead.y][car.pos_ahead.x] = Mod::DEACTIVATED_MOD;
                        break;
                    }
                }
            }
        }

        size_t N = state.cars_to_use.size();
        std::vector<std::vector<Car>> cars_generated(N);
        std::vector<std::vector<Track>> usable_tracks(N);
        std::vector<bool> decoy_placing(decoys_count, false);
        std::pair<int, int> just_solved = {-1, -1};

        // Post-generation
        for (size_t c = 0; c < N; ++c) {
            const Car& car = state.cars_to_use[c];
            iterations++;

            if (car.border_crash(H, W)) {
                cars_generated[c] = {car.crash()};
                usable_tracks[c] = {state.board_to_use[car.pos.y][car.pos.x]};
                continue;
            }

            if (car.type != CarType::DECOY) {
                size_t car_idx = car.car_index(cars_count, decoys_count);
                if (car.on_correct_station(state.mods_to_use[car.pos.y][car.pos.x], mod_nums[car.pos.y][car.pos.x])) {
                    state.station_stalled[car_idx] = true;
                    state.mods_to_use[car.pos.y][car.pos.x] = Mod::DEACTIVATED_MOD;
                    cars_generated[c] = {car};
                    usable_tracks[c] = {state.board_to_use[car.pos.y][car.pos.x]};
                    continue;
                } else if (state.station_stalled[car_idx]) {
                    state.station_stalled[car_idx] = false;
                    cars_generated[c] = {car};
                    usable_tracks[c] = {state.board_to_use[car.pos.y][car.pos.x]};
                    continue;
                }
            }

            if (mod_is_gate_or_sem(state.mods_to_use[car.pos_ahead.y][car.pos_ahead.x])) {
                state.stalled[c] = true;
                cars_generated[c] = {car};
                usable_tracks[c] = {state.board_to_use[car.pos.y][car.pos.x]};
                continue;
            }
            if (state.stalled[c]) {
                state.stalled[c] = false;
            }

            Track tile_ahead = state.board_to_use[car.pos_ahead.y][car.pos_ahead.x];
            Direction tile_ahead_redirect = get_track_direction(tile_ahead, car.direction);

            std::vector<Track> tracks_to_check;
            if (!track_is_empty(tile_ahead)) {
                int flat_ahead = car.pos_ahead.y * W + car.pos_ahead.x;
                if (permanent_track_poses.count(flat_ahead)) {
                    if (tile_ahead_redirect == Direction::CRASH) {
                        if (car.type == CarType::DECOY) {
                            cars_generated[c] = {car.crash()};
                            usable_tracks[c] = {state.board_to_use[car.pos.y][car.pos.x]};
                            continue;
                        } else {
                            return {};
                        }
                    } else {
                        tracks_to_check = {tile_ahead};
                    }
                } else {
                    if (tile_ahead_redirect == Direction::CRASH) {
                        if (track_is_turn(tile_ahead) || track_is_straight(tile_ahead)) {
                            tracks_to_check = car.generable_3ways(tile_ahead);
                        } else if (car.type == CarType::DECOY) {
                            cars_generated[c] = {car.crash()};
                            usable_tracks[c] = {state.board_to_use[car.pos.y][car.pos.x]};
                            continue;
                        } else {
                            return {};
                        }
                    } else if (track_is_straight(tile_ahead)) {
                        int heat = 0;
                        bool cannot_place_3way = false;
                        for (size_t i = 0; i < total_cars_count; ++i) {
                            heat += state.heatmaps[heat_idx(i, car.direction, car.pos.y, car.pos.x, H, W)];
                            if (heat > 1) {
                                tracks_to_check = {tile_ahead};
                                cannot_place_3way = true;
                                break;
                            }
                        }
                        if (!cannot_place_3way) {
                            tracks_to_check = {tile_ahead};
                            const auto& g3 = car.generable_3ways(tile_ahead);
                            tracks_to_check.insert(tracks_to_check.end(), g3.begin(), g3.end());
                        }
                    } else {
                        tracks_to_check = {tile_ahead};
                    }
                }
            } else {
                if (car.type == CarType::DECOY) {
                    int flat_pos = car.pos.y * W + car.pos.x;
                    bool can_crash = permanent_track_poses.count(flat_pos) ||
                                     !track_is_turn(state.board_to_use[car.pos.y][car.pos.x]);
                    if (state.available_tracks - 1 <= lowest_tracks_remaining) {
                        if (can_crash) {
                            tracks_to_check = {Track::EMPTY};
                        } else {
                            return {};
                        }
                    } else {
                        decoy_placing[car.num] = true;
                        if (can_crash) {
                            tracks_to_check = {Track::EMPTY};
                            const auto& gt = car.generable_tracks();
                            tracks_to_check.insert(tracks_to_check.end(), gt.begin(), gt.end());
                        } else {
                            tracks_to_check = car.generable_tracks();
                        }
                    }
                } else {
                    state.available_tracks--;
                    tracks_to_check = car.generable_tracks();
                }
            }

            if (tracks_to_check.empty()) return {};

            if ((track_is_car_ending(tracks_to_check[0]) && car.type != CarType::NORMAL) ||
                (track_is_ncar_ending(tracks_to_check[0]) && car.type != CarType::NUMERAL)) {
                return {};
            }

            if (state.available_tracks <= lowest_tracks_remaining) {
                return {};
            }

            std::vector<Car> crash_cars;
            for (const auto& gen_car : cars_generated) {
                if (!gen_car.empty()) crash_cars.push_back(gen_car[0]);
            }
            crash_cars.insert(crash_cars.end(), state.crashed_decoys.begin(), state.crashed_decoys.end());
            crash_cars.insert(crash_cars.end(), stalled_cars.begin(), stalled_cars.end());

            if (car.same_tile_crashes(crash_cars) || car.head_on_crashes(state.cars_to_use)) {
                if (tracks_to_check[0] == Track::EMPTY) {
                    tracks_to_check = {Track::EMPTY};
                } else if (car.type == CarType::DECOY) {
                    cars_generated[c] = {car.crash()};
                    usable_tracks[c] = {state.board_to_use[car.pos.y][car.pos.x]};
                    continue;
                } else {
                    return {};
                }
            }

            for (Track possibleTrack : tracks_to_check) {
                Direction possible_redirect = Direction::UNKNOWN;
                Pos current_pos_ahead = car.pos_ahead;

                if (possibleTrack == Track::EMPTY) {
                    cars_generated[c].push_back(car.crash());
                    usable_tracks[c].push_back(Track::EMPTY);
                    continue;
                } else if (track_is_tunnel(possibleTrack)) {
                    int num = mod_nums[car.pos_ahead.y][car.pos_ahead.x];
                    auto tun_it = tunnel_poses.find(num);
                    if (tun_it != tunnel_poses.end() && tun_it->second.size() >= 2) {
                        const Pos& t0 = tun_it->second[0];
                        const Pos& t1 = tun_it->second[1];
                        if (t0 == car.pos_ahead) {
                            current_pos_ahead = t1;
                        } else {
                            current_pos_ahead = t0;
                        }
                    }
                    possible_redirect = get_tunnel_exit_velo(board[current_pos_ahead.y][current_pos_ahead.x]);
                } else {
                    possible_redirect = get_track_direction(possibleTrack, car.direction);
                }

                if (track_is_car_ending(possibleTrack) || track_is_ncar_ending(possibleTrack)) {
                    int is_numeral = (car.type == CarType::NUMERAL ? 1 : 0);
                    const std::vector<int>& any_solved = (is_numeral == 1 ? state.solved_numeral : state.solved_normal);
                    if ((any_solved.empty() && car.num != 0) ||
                        (!any_solved.empty() && any_solved.back() != car.num - 1)) {
                        return {};
                    }

                    Mod st_mod = car.get_station();
                    auto st_map_it = station_poses.find(st_mod);
                    if (st_map_it != station_poses.end()) {
                        auto num_it = st_map_it->second.find(car.num);
                        if (num_it != st_map_it->second.end()) {
                            for (const Pos& st_pos : num_it->second) {
                                if (state.mods_to_use[st_pos.y][st_pos.x] != Mod::DEACTIVATED_MOD) {
                                    return {};
                                }
                            }
                        }
                    }

                    if (is_numeral == 1) {
                        state.solved_numeral.push_back(car.num);
                        just_solved.second = static_cast<int>(c);
                    } else {
                        state.solved_normal.push_back(car.num);
                        just_solved.first = static_cast<int>(c);
                    }
                    cars_generated[c].emplace_back(current_pos_ahead, car.direction, car.num, car.type);
                    usable_tracks[c].push_back(possibleTrack);
                    continue;
                } else if (track_is_3way(possibleTrack) && !track_is_3way(tile_ahead)) {
                    bool cannot_place_3way = false;
                    Direction rev = direction_reverse(possible_redirect);
                    for (size_t i = 0; i < total_cars_count; ++i) {
                        if (state.heatmaps[heat_idx(i, rev, current_pos_ahead.y, current_pos_ahead.x, H, W)] > 0) {
                            cannot_place_3way = true;
                            break;
                        }
                    }
                    if (cannot_place_3way) continue;

                    Mod ahead_mod = state.mods_to_use[current_pos_ahead.y][current_pos_ahead.x];
                    if (ahead_mod == Mod::SEMAPHORE || ahead_mod == Mod::DEACTIVATED_MOD) {
                        continue;
                    }
                }

                Pos end_on = direction_add_vector(possible_redirect, current_pos_ahead);
                if (!(0 <= end_on.y && end_on.y < H && 0 <= end_on.x && end_on.x < W)) {
                    if (car.type == CarType::DECOY) {
                        cars_generated[c].emplace_back(current_pos_ahead, possible_redirect, car.num, car.type);
                        usable_tracks[c].push_back(possibleTrack);
                    }
                    continue;
                }

                Track end_on_tile = state.board_to_use[end_on.y][end_on.x];
                Direction end_on_redirect = get_track_direction(end_on_tile, possible_redirect);
                int flat_end_on = end_on.y * W + end_on.x;
                bool possible_to_place_3way = (track_is_straight(end_on_tile) || track_is_turn(end_on_tile)) &&
                                              !permanent_track_poses.count(flat_end_on);
                if (end_on_redirect == Direction::CRASH && !track_is_empty(end_on_tile) && !possible_to_place_3way) {
                    if (car.type == CarType::DECOY) {
                        cars_generated[c].emplace_back(current_pos_ahead, possible_redirect, car.num, car.type);
                        usable_tracks[c].push_back(possibleTrack);
                    }
                    continue;
                }

                cars_generated[c].emplace_back(current_pos_ahead, possible_redirect, car.num, car.type);
                if (track_is_tunnel(possibleTrack)) {
                    usable_tracks[c].push_back(board[current_pos_ahead.y][current_pos_ahead.x]);
                } else {
                    usable_tracks[c].push_back(possibleTrack);

                    bool semaphore_triggered = false;
                    for (size_t i = 0; i < total_cars_count; ++i) {
                        for (int d = 0; d < 4; ++d) {
                            if (state.heatmaps[heat_idx(i, static_cast<Direction>(d), current_pos_ahead.y, current_pos_ahead.x, H, W)] > 0) {
                                semaphore_triggered = true;
                                break;
                            }
                        }
                        if (semaphore_triggered) break;
                    }

                    if (!semaphore_triggered && state.available_semaphores > 0 &&
                        (track_is_straight(possibleTrack) || track_is_turn(possibleTrack)) &&
                        state.mods_to_use[current_pos_ahead.y][current_pos_ahead.x] == Mod::EMPTY) {
                        auto [sem_dir0, sem_dir1] = get_semaphore_pass(possibleTrack);
                        Pos sem_pos0 = direction_add_vector(sem_dir0, current_pos_ahead);
                        Pos sem_pos1 = direction_add_vector(sem_dir1, current_pos_ahead);

                        int pos0_heat = 0;
                        int pos1_heat = 0;
                        for (size_t i = 0; i < total_cars_count; ++i) {
                            for (int d = 0; d < 4; ++d) {
                                pos0_heat += state.heatmaps[heat_idx(i, static_cast<Direction>(d), sem_pos0.y, sem_pos0.x, H, W)];
                                pos1_heat += state.heatmaps[heat_idx(i, static_cast<Direction>(d), sem_pos1.y, sem_pos1.x, H, W)];
                            }
                        }
                        int pos0_starting = (state.mods_to_use[sem_pos0.y][sem_pos0.x] == Mod::STARTING_CAR_TILE ? 1 : 0);
                        int pos1_starting = (state.mods_to_use[sem_pos1.y][sem_pos1.x] == Mod::STARTING_CAR_TILE ? 1 : 0);
                        int starting_tile_heat = 0;

                        if (state.mods_to_use[car.pos.y][car.pos.x] == Mod::STARTING_CAR_TILE) {
                            Pos starting_car_pos;
                            if (car.type == CarType::NORMAL) starting_car_pos = cars[car.num].pos;
                            else if (car.type == CarType::DECOY) starting_car_pos = decoys[car.num].pos;
                            else starting_car_pos = ncars[car.num].pos;

                            starting_tile_heat = (car.pos == starting_car_pos ? 1 : 0);
                        }

                        if (pos0_heat + pos1_heat - pos0_starting - pos1_starting + starting_tile_heat == 1) {
                            cars_generated[c].push_back(car);
                            usable_tracks[c].push_back(track_add_placeholder_semaphore(possibleTrack));
                        }
                    }
                }
            }

            if (usable_tracks[c].empty()) return {};
        }

        bool all_stalled = true;
        for (bool s : state.stalled) {
            if (!s) {
                all_stalled = false;
                break;
            }
        }
        if (all_stalled && !state.cars_to_use.empty()) {
            return {};
        }

        if (state.solved_normal.size() == cars_count && state.solved_numeral.size() == ncars_count) {
            bool all_non_decoy = true;
            for (const auto& car : state.cars_to_use) {
                if (car.type == CarType::DECOY) {
                    all_non_decoy = false;
                    break;
                }
            }
            if (all_non_decoy || state.mvmts_since_solved == 2) {
                best_board = state.board_to_use;
                best_mods = state.mods_to_use;
                lowest_tracks_remaining = state.available_tracks;
                semaphores_remaining = state.available_semaphores;
                return {};
            } else {
                state.mvmts_since_solved++;
            }
        }

        if (just_solved.first != -1) {
            int sc = just_solved.first;
            cars_generated.erase(cars_generated.begin() + sc);
            usable_tracks.erase(usable_tracks.begin() + sc);
            state.stalled.erase(state.stalled.begin() + sc);
        }
        if (just_solved.second != -1) {
            int sc = just_solved.second - (just_solved.first != -1 ? 1 : 0);
            cars_generated.erase(cars_generated.begin() + sc);
            usable_tracks.erase(usable_tracks.begin() + sc);
            state.stalled.erase(state.stalled.begin() + sc);
        }

        size_t combo_cars_count = cars_generated.size();
        std::vector<SearchState> next_states;

        if (combo_cars_count == 0) {
            SearchState next_state;
            next_state.cars_to_use.clear();
            next_state.board_to_use = state.board_to_use;
            next_state.mods_to_use = state.mods_to_use;
            next_state.available_tracks = state.available_tracks;
            next_state.heatmaps = state.heatmaps;
            next_state.solved_normal = state.solved_normal;
            next_state.solved_numeral = state.solved_numeral;
            next_state.stalled.clear();
            next_state.switch_queue = state.switch_queue;
            next_state.station_stalled = state.station_stalled;
            next_state.crashed_decoys = state.crashed_decoys;
            next_state.mvmts_since_solved = state.mvmts_since_solved;
            next_state.available_semaphores = state.available_semaphores;
            next_state.heatmap_limits = state.heatmap_limits;
            next_states.push_back(std::move(next_state));
            return next_states;
        }

        // Cartesian product generation
        std::vector<size_t> indices(combo_cars_count, 0);
        while (true) {
            int tracks_to_pass = state.available_tracks;
            int semaphores_to_pass = state.available_semaphores;
            auto board_to_pass = state.board_to_use;
            auto mods_to_pass = state.mods_to_use;
            auto stalled_to_pass = state.stalled;
            auto heatmap_limits_pass = state.heatmap_limits;

            bool stop_branch = false;

            for (size_t i = 0; i < combo_cars_count; ++i) {
                const Car& car = cars_generated[i][indices[i]];
                for (size_t j = i + 1; j < combo_cars_count; ++j) {
                    if (car.pos == cars_generated[j][indices[j]].pos) {
                        stop_branch = true;
                        break;
                    }
                }
                if (stop_branch) break;

                Track track_placing = usable_tracks[i][indices[i]];
                if (car.type == CarType::DECOY && decoy_placing[car.num] && !track_is_empty(track_placing)) {
                    tracks_to_pass--;
                    if (tracks_to_pass <= lowest_tracks_remaining) {
                        stop_branch = true;
                        break;
                    }
                }

                if (track_is_placeholder_semaphore(track_placing)) {
                    semaphores_to_pass--;
                    if (semaphores_to_pass < 0) {
                        stop_branch = true;
                        break;
                    }
                    board_to_pass[car.pos_ahead.y][car.pos_ahead.x] = track_remove_placeholder_semaphore(track_placing);
                    mods_to_pass[car.pos_ahead.y][car.pos_ahead.x] = Mod::SEMAPHORE;
                    stalled_to_pass[i] = true;
                } else if (!track_is_empty(track_placing)) {
                    board_to_pass[car.pos.y][car.pos.x] = track_placing;
                }

                if (car.type != CarType::CRASHED && (mods_to_pass[car.pos.y][car.pos.x] == Mod::SWAPPING_TRACK ||
                                                     mods_to_pass[car.pos.y][car.pos.x] == Mod::SWITCH_RAIL)) {
                    size_t car_idx = car.car_index(cars_count, decoys_count);
                    size_t h_idx = heat_idx(car_idx, car.direction, car.pos.y, car.pos.x, H, W);
                    if (heatmap_limits_pass[h_idx] <= options_.heatmap_limit_limit) {
                        if (!state.stalled[i]) {
                            size_t base = car_idx * (4 * H * W);
                            size_t end = base + (4 * H * W);
                            for (size_t idx = base; idx < end; ++idx) {
                                if (heatmap_limits_pass[idx] > 0) {
                                    heatmap_limits_pass[idx]++;
                                }
                            }
                        }
                    } else {
                        return next_states;
                    }
                }
            }

            if (!stop_branch) {
                SearchState next_state;
                next_state.cars_to_use.reserve(combo_cars_count);
                for (size_t i = 0; i < combo_cars_count; ++i) {
                    next_state.cars_to_use.push_back(cars_generated[i][indices[i]]);
                }
                next_state.board_to_use = std::move(board_to_pass);
                next_state.mods_to_use = std::move(mods_to_pass);
                next_state.available_tracks = tracks_to_pass;
                next_state.heatmaps = state.heatmaps;
                next_state.solved_normal = state.solved_normal;
                next_state.solved_numeral = state.solved_numeral;
                next_state.stalled = std::move(stalled_to_pass);
                next_state.switch_queue = state.switch_queue;
                next_state.station_stalled = state.station_stalled;
                next_state.crashed_decoys = state.crashed_decoys;
                next_state.mvmts_since_solved = state.mvmts_since_solved;
                next_state.available_semaphores = semaphores_to_pass;
                next_state.heatmap_limits = std::move(heatmap_limits_pass);

                next_states.push_back(std::move(next_state));
            }

            // Increment indices
            int p = static_cast<int>(combo_cars_count) - 1;
            while (p >= 0) {
                indices[p]++;
                if (indices[p] < cars_generated[p].size()) {
                    break;
                }
                indices[p] = 0;
                p--;
            }
            if (p < 0) {
                break;
            }
        }

        return next_states;
    };

    if (options_.gen_type == SearchType::DFS) {
        std::vector<SearchState> stack;
        stack.push_back(std::move(initial_state));

        while (!stack.empty()) {
            if (options_.max_iterations > 0 && iterations >= options_.max_iterations) {
                result.max_iterations_reached = true;
                break;
            }
            if (options_.timeout_seconds > 0.0) {
                auto now = std::chrono::steady_clock::now();
                double elapsed = std::chrono::duration<double>(now - start_time).count();
                if (elapsed >= options_.timeout_seconds) {
                    result.timed_out = true;
                    break;
                }
            }

            SearchState cur = std::move(stack.back());
            stack.pop_back();

            if (visualize) {
                auto now = std::chrono::steady_clock::now();
                double elapsed = std::chrono::duration<double>(now - start_time).count();
                visualize(VisualizeData{cur.board_to_use, cur.mods_to_use, cur.cars_to_use, iterations, elapsed});
            }

            auto next_states = generate_tracks(cur);
            for (auto it = next_states.rbegin(); it != next_states.rend(); ++it) {
                stack.push_back(std::move(*it));
            }
        }
    } else { // BFS
        std::map<int, std::deque<SearchState>> queues;
        for (int track_count = max_tracks; track_count >= 0; --track_count) {
            queues[track_count] = std::deque<SearchState>{};
        }
        queues[max_tracks].push_back(std::move(initial_state));

        bool stop_all = false;
        for (int track_count = max_tracks; track_count >= 0 && !stop_all; --track_count) {
            auto& queue = queues[track_count];
            while (!queue.empty()) {
                if (options_.max_iterations > 0 && iterations >= options_.max_iterations) {
                    result.max_iterations_reached = true;
                    stop_all = true;
                    break;
                }
                if (options_.timeout_seconds > 0.0) {
                    auto now = std::chrono::steady_clock::now();
                    double elapsed = std::chrono::duration<double>(now - start_time).count();
                    if (elapsed >= options_.timeout_seconds) {
                        result.timed_out = true;
                        stop_all = true;
                        break;
                    }
                }

                SearchState cur = std::move(queue.front());
                queue.pop_front();

                if (visualize) {
                    auto now = std::chrono::steady_clock::now();
                    double elapsed = std::chrono::duration<double>(now - start_time).count();
                    visualize(VisualizeData{cur.board_to_use, cur.mods_to_use, cur.cars_to_use, iterations, elapsed});
                }

                auto next_states = generate_tracks(cur);
                if (lowest_tracks_remaining != -1) {
                    stop_all = true;
                    break;
                }
                for (auto& s : next_states) {
                    int av = s.available_tracks;
                    if (queues.find(av) != queues.end()) {
                        queues[av].push_back(std::move(s));
                    }
                }
            }
        }
    }

    auto end_time = std::chrono::steady_clock::now();
    result.time_elapsed_seconds = std::chrono::duration<double>(end_time - start_time).count();
    result.iterations = iterations;
    result.tracks_left = lowest_tracks_remaining;
    result.semaphores_left = semaphores_remaining;

    if (lowest_tracks_remaining != -1 && !best_board.empty()) {
        result.solved = true;
        // Restore permanent track positions
        for (int pos_index : permanent_track_poses) {
            int r = pos_index / W;
            int c = pos_index % W;
            best_board[r][c] = board[r][c];
            best_mods[r][c] = mods[r][c];
        }
        result.board = std::move(best_board);
        result.mods = std::move(best_mods);
    }

    return result;
}

SolveResult solve_level(const Level& level, const SolverOptions& options, VisualizeCallback visualize) {
    Solver solver(options);
    return solver.solve(level, std::move(visualize));
}

} // namespace railbound
