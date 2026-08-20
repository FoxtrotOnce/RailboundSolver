#include "railbound/solver.hpp"
#include <deque>
#include <map>
#include <memory>
#include <iostream>

namespace railbound {

namespace {

struct SmallCarVec {
    Car data[6];
    uint8_t count{0};

    void push_back(const Car& c) noexcept { data[count++] = c; }
    template<typename... Args>
    void emplace_back(Args&&... args) noexcept { data[count++] = Car(std::forward<Args>(args)...); }
    void erase(size_t index) noexcept {
        for (size_t i = index; i + 1 < static_cast<size_t>(count); ++i) {
            data[i] = data[i + 1];
        }
        if (count > 0) --count;
    }
    void clear() noexcept { count = 0; }
    bool empty() const noexcept { return count == 0; }
    size_t size() const noexcept { return count; }
    Car& operator[](size_t i) noexcept { return data[i]; }
    const Car& operator[](size_t i) const noexcept { return data[i]; }
    Car* begin() noexcept { return data; }
    Car* end() noexcept { return data + count; }
    const Car* begin() const noexcept { return data; }
    const Car* end() const noexcept { return data + count; }
};

struct SmallTrackVec {
    Track data[8];
    uint8_t count{0};

    void push_back(Track t) noexcept {
        data[count++] = t;
    }
    bool empty() const noexcept { return count == 0; }
    size_t size() const noexcept { return count; }
    Track operator[](size_t i) const noexcept { return data[i]; }
    Track& operator[](size_t i) noexcept { return data[i]; }
    Track* begin() noexcept { return data; }
    Track* end() noexcept { return data + count; }
    const Track* begin() const noexcept { return data; }
    const Track* end() const noexcept { return data + count; }
};

struct SmallIntVec {
    int data[8];
    uint8_t count{0};

    void push_back(int v) noexcept { data[count++] = v; }
    void pop_back() noexcept { if (count > 0) --count; }
    void clear() noexcept { count = 0; }
    bool empty() const noexcept { return count == 0; }
    size_t size() const noexcept { return count; }
    int back() const noexcept { return data[count - 1]; }
    int operator[](size_t i) const noexcept { return data[i]; }
    int* begin() noexcept { return data; }
    int* end() noexcept { return data + count; }
    const int* begin() const noexcept { return data; }
    const int* end() const noexcept { return data + count; }
};

struct SmallPosVec {
    Pos data[8];
    uint8_t count{0};

    void push_back(Pos p) noexcept { data[count++] = p; }
    void assign(size_t n, Pos val) noexcept {
        count = static_cast<uint8_t>(n);
        for (size_t i = 0; i < n; ++i) data[i] = val;
    }
    bool empty() const noexcept { return count == 0; }
    size_t size() const noexcept { return count; }
    Pos& operator[](size_t i) noexcept { return data[i]; }
    const Pos& operator[](size_t i) const noexcept { return data[i]; }
    Pos* begin() noexcept { return data; }
    Pos* end() noexcept { return data + count; }
    const Pos* begin() const noexcept { return data; }
    const Pos* end() const noexcept { return data + count; }
};

struct SmallTrackBoard {
    Track data[100];

    Track operator[](size_t i) const noexcept { return data[i]; }
    Track& operator[](size_t i) noexcept { return data[i]; }
};

struct SmallModBoard {
    Mod data[100];

    Mod operator[](size_t i) const noexcept { return data[i]; }
    Mod& operator[](size_t i) noexcept { return data[i]; }
};

struct SmallBoolVec {
    uint8_t mask{0};
    uint8_t count{0};

    void assign(size_t n, bool val) noexcept {
        count = static_cast<uint8_t>(n);
        mask = val ? static_cast<uint8_t>((1 << n) - 1) : 0;
    }
    void push_back(bool val) noexcept {
        if (val) mask |= static_cast<uint8_t>(1 << count);
        else mask &= static_cast<uint8_t>(~(1 << count));
        count++;
    }
    void erase(size_t index) noexcept {
        uint8_t lower = mask & static_cast<uint8_t>((1 << index) - 1);
        uint8_t upper = static_cast<uint8_t>((mask >> (index + 1)) << index);
        mask = lower | upper;
        if (count > 0) --count;
    }
    void pop_back() noexcept {
        if (count > 0) --count;
    }
    void clear() noexcept {
        count = 0;
        mask = 0;
    }
    bool empty() const noexcept { return count == 0; }
    size_t size() const noexcept { return count; }

    struct Reference {
        uint8_t& mask;
        uint8_t bit;
        operator bool() const noexcept { return (mask & (1 << bit)) != 0; }
        Reference& operator=(bool val) noexcept {
            if (val) mask |= static_cast<uint8_t>(1 << bit);
            else mask &= static_cast<uint8_t>(~(1 << bit));
            return *this;
        }
        Reference& operator=(const Reference& rhs) noexcept {
            return *this = static_cast<bool>(rhs);
        }
    };

    struct Iterator {
        const SmallBoolVec& vec;
        size_t index;
        bool operator!=(const Iterator& other) const noexcept { return index != other.index; }
        void operator++() noexcept { ++index; }
        bool operator*() const noexcept { return vec[index]; }
    };

    Iterator begin() const noexcept { return Iterator{*this, 0}; }
    Iterator end() const noexcept { return Iterator{*this, count}; }

    bool operator[](size_t i) const noexcept { return (mask & (1 << i)) != 0; }
    Reference operator[](size_t i) noexcept { return Reference{mask, static_cast<uint8_t>(i)}; }
};

struct alignas(64) SearchState {
    SmallCarVec cars_to_use;
    SmallTrackBoard board_to_use; // Inline 1D array of size H * W
    SmallModBoard mods_to_use;   // Inline 1D array of size H * W
    int available_tracks{0};
    std::shared_ptr<std::vector<int>> heatmaps; // shape [num_all_cars, 4, H, W]
    SmallIntVec solved_normal;
    SmallIntVec solved_numeral;
    SmallBoolVec stalled;
    SmallPosVec switch_queue;
    SmallBoolVec station_stalled;
    SmallCarVec crashed_decoys;
    int mvmts_since_solved{0};
    int available_semaphores{0};
    std::shared_ptr<std::vector<int>> heatmap_limits; // shape [num_all_cars, 4, H, W]
    int heuristic_score{0};
};

static constexpr uint8_t INF_DIST = 255;

void compute_distance_field(
    const std::vector<std::vector<Track>>& board,
    const std::vector<std::vector<Mod>>& mods,
    const std::vector<std::vector<int>>& mod_nums,
    const std::map<int, std::vector<Pos>>& tunnel_poses,
    const uint8_t* perm_ptr,
    int H, int W,
    CarType target_car_type,
    uint8_t* out_dist
) {
    int HW = H * W;
    std::fill(out_dist, out_dist + HW * 4, INF_DIST);

    std::deque<int> q;

    for (int r = 0; r < H; ++r) {
        for (int c = 0; c < W; ++c) {
            Track t = board[r][c];
            if (target_car_type == CarType::NORMAL) {
                if (t == Track::CAR_ENDING_TRACK_RIGHT && c > 0) {
                    int u = ((r * W + (c - 1)) * 4) + static_cast<int>(Direction::RIGHT);
                    out_dist[u] = 0;
                    q.push_back(u);
                } else if (t == Track::CAR_ENDING_TRACK_LEFT && c + 1 < W) {
                    int u = ((r * W + (c + 1)) * 4) + static_cast<int>(Direction::LEFT);
                    out_dist[u] = 0;
                    q.push_back(u);
                } else if (t == Track::CAR_ENDING_TRACK_DOWN && r > 0) {
                    int u = (((r - 1) * W + c) * 4) + static_cast<int>(Direction::DOWN);
                    out_dist[u] = 0;
                    q.push_back(u);
                } else if (t == Track::CAR_ENDING_TRACK_UP && r + 1 < H) {
                    int u = (((r + 1) * W + c) * 4) + static_cast<int>(Direction::UP);
                    out_dist[u] = 0;
                    q.push_back(u);
                }
            } else if (target_car_type == CarType::NUMERAL) {
                if ((t == Track::NCAR_ENDING_TRACK_RIGHT || t == Track::STATION_RIGHT) && c > 0) {
                    int u = ((r * W + (c - 1)) * 4) + static_cast<int>(Direction::RIGHT);
                    out_dist[u] = 0;
                    q.push_back(u);
                } else if ((t == Track::NCAR_ENDING_TRACK_LEFT || t == Track::STATION_LEFT) && c + 1 < W) {
                    int u = ((r * W + (c + 1)) * 4) + static_cast<int>(Direction::LEFT);
                    out_dist[u] = 0;
                    q.push_back(u);
                } else if ((t == Track::NCAR_ENDING_TRACK_DOWN || t == Track::STATION_DOWN) && r > 0) {
                    int u = (((r - 1) * W + c) * 4) + static_cast<int>(Direction::DOWN);
                    out_dist[u] = 0;
                    q.push_back(u);
                } else if ((t == Track::NCAR_ENDING_TRACK_UP || t == Track::STATION_UP) && r + 1 < H) {
                    int u = (((r + 1) * W + c) * 4) + static_cast<int>(Direction::UP);
                    out_dist[u] = 0;
                    q.push_back(u);
                }
            }
        }
    }

    while (!q.empty()) {
        int u = q.front();
        q.pop_front();
        uint8_t d_val = out_dist[u];

        int cell = u / 4;
        int d = u % 4;
        int r = cell / W;
        int c = cell % W;

        for (int pd = 0; pd < 4; ++pd) {
            int pr = r - DIR_VECTORS[pd].y;
            int pc = c - DIR_VECTORS[pd].x;
            if (pr < 0 || pr >= H || pc < 0 || pc >= W) continue;
            if (board[pr][pc] == Track::ROADBLOCK) continue;

            Track tr = board[r][c];
            Mod m = mods[r][c];

            if (m == Mod::TUNNEL && track_is_tunnel(tr)) {
                int num = mod_nums[r][c];
                auto tun_it = tunnel_poses.find(num);
                if (tun_it != tunnel_poses.end() && tun_it->second.size() >= 2) {
                    if (get_tunnel_exit_velo(tr) == static_cast<Direction>(d)) {
                        const Pos& tin = (tun_it->second[0].y == r && tun_it->second[0].x == c)
                                         ? tun_it->second[1]
                                         : tun_it->second[0];
                        for (int pd_in = 0; pd_in < 4; ++pd_in) {
                            int prin = tin.y - DIR_VECTORS[pd_in].y;
                            int pcin = tin.x - DIR_VECTORS[pd_in].x;
                            if (prin >= 0 && prin < H && pcin >= 0 && pcin < W && board[prin][pcin] != Track::ROADBLOCK) {
                                int pred_u = (prin * W + pcin) * 4 + pd_in;
                                if (d_val < out_dist[pred_u]) {
                                    out_dist[pred_u] = d_val;
                                    q.push_front(pred_u);
                                }
                            }
                        }
                    }
                }
            }

            bool can_pass_fixed = false;
            if (!track_is_empty(tr) && tr != Track::ROADBLOCK) {
                Direction redirected = get_track_direction(tr, static_cast<Direction>(pd));
                if (redirected == static_cast<Direction>(d)) {
                    can_pass_fixed = true;
                } else if ((m == Mod::SWAPPING_TRACK || m == Mod::SWITCH_RAIL) && track_is_3way(tr)) {
                    Track swapped = track_swap(tr);
                    if (get_track_direction(swapped, static_cast<Direction>(pd)) == static_cast<Direction>(d)) {
                        can_pass_fixed = true;
                    }
                }
            }

            if (can_pass_fixed) {
                uint8_t cost = 0;
                int pred_u = (pr * W + pc) * 4 + pd;
                if (d_val + cost < out_dist[pred_u]) {
                    out_dist[pred_u] = d_val + cost;
                    q.push_front(pred_u);
                }
            } else {
                bool can_transition = false;
                if (tr == Track::EMPTY || !perm_ptr[r * W + c] || track_is_turn(tr) || track_is_straight(tr)) {
                    if (pd == d) can_transition = true;
                    else if ((pd == 0 || pd == 1) && (d == 2 || d == 3)) can_transition = true;
                    else if ((pd == 2 || pd == 3) && (d == 0 || d == 1)) can_transition = true;
                }

                if (can_transition) {
                    uint8_t cost = (tr == Track::EMPTY ? 1 : 0);
                    int pred_u = (pr * W + pc) * 4 + pd;
                    if (d_val + cost < out_dist[pred_u]) {
                        out_dist[pred_u] = d_val + cost;
                        q.push_back(pred_u);
                    }
                }
            }
        }
    }
}

void compute_station_distance_field(
    const std::vector<std::vector<Track>>& board,
    const std::vector<std::vector<Mod>>& mods,
    const std::vector<std::vector<int>>& mod_nums,
    const std::map<int, std::vector<Pos>>& tunnel_poses,
    const uint8_t* perm_ptr,
    int H, int W,
    const std::vector<Pos>& targets,
    uint8_t* out_dist
) {
    int HW = H * W;
    std::fill(out_dist, out_dist + HW * 4, INF_DIST);

    std::deque<int> q;

    for (const Pos& target : targets) {
        int r = target.y;
        int c = target.x;
        for (int pd = 0; pd < 4; ++pd) {
            int pr = r - DIR_VECTORS[pd].y;
            int pc = c - DIR_VECTORS[pd].x;
            if (pr < 0 || pr >= H || pc < 0 || pc >= W) continue;
            if (board[pr][pc] == Track::ROADBLOCK) continue;
            int u = (pr * W + pc) * 4 + pd;
            if (out_dist[u] != 0) {
                out_dist[u] = 0;
                q.push_back(u);
            }
        }
    }

    while (!q.empty()) {
        int u = q.front();
        q.pop_front();
        uint8_t d_val = out_dist[u];

        int cell = u / 4;
        int d = u % 4;
        int r = cell / W;
        int c = cell % W;

        for (int pd = 0; pd < 4; ++pd) {
            int pr = r - DIR_VECTORS[pd].y;
            int pc = c - DIR_VECTORS[pd].x;
            if (pr < 0 || pr >= H || pc < 0 || pc >= W) continue;
            if (board[pr][pc] == Track::ROADBLOCK) continue;

            Track tr = board[r][c];
            Mod m = mods[r][c];

            if (m == Mod::TUNNEL && track_is_tunnel(tr)) {
                int num = mod_nums[r][c];
                auto tun_it = tunnel_poses.find(num);
                if (tun_it != tunnel_poses.end() && tun_it->second.size() >= 2) {
                    if (get_tunnel_exit_velo(tr) == static_cast<Direction>(d)) {
                        const Pos& tin = (tun_it->second[0].y == r && tun_it->second[0].x == c)
                                         ? tun_it->second[1]
                                         : tun_it->second[0];
                        for (int pd_in = 0; pd_in < 4; ++pd_in) {
                            int prin = tin.y - DIR_VECTORS[pd_in].y;
                            int pcin = tin.x - DIR_VECTORS[pd_in].x;
                            if (prin >= 0 && prin < H && pcin >= 0 && pcin < W && board[prin][pcin] != Track::ROADBLOCK) {
                                int pred_u = (prin * W + pcin) * 4 + pd_in;
                                if (d_val < out_dist[pred_u]) {
                                    out_dist[pred_u] = d_val;
                                    q.push_front(pred_u);
                                }
                            }
                        }
                    }
                }
            }

            bool can_pass_fixed_st = false;
            if (!track_is_empty(tr) && tr != Track::ROADBLOCK) {
                Direction redirected = get_track_direction(tr, static_cast<Direction>(pd));
                if (redirected == static_cast<Direction>(d)) {
                    can_pass_fixed_st = true;
                } else if ((m == Mod::SWAPPING_TRACK || m == Mod::SWITCH_RAIL) && track_is_3way(tr)) {
                    Track swapped = track_swap(tr);
                    if (get_track_direction(swapped, static_cast<Direction>(pd)) == static_cast<Direction>(d)) {
                        can_pass_fixed_st = true;
                    }
                }
            }

            if (can_pass_fixed_st) {
                uint8_t cost = 0;
                int pred_u = (pr * W + pc) * 4 + pd;
                if (d_val + cost < out_dist[pred_u]) {
                    out_dist[pred_u] = d_val + cost;
                    q.push_front(pred_u);
                }
            } else {
                bool can_transition = false;
                if (tr == Track::EMPTY || !perm_ptr[r * W + c] || track_is_turn(tr) || track_is_straight(tr)) {
                    if (pd == d) can_transition = true;
                    else if ((pd == 0 || pd == 1) && (d == 2 || d == 3)) can_transition = true;
                    else if ((pd == 2 || pd == 3) && (d == 0 || d == 1)) can_transition = true;
                }

                if (can_transition) {
                    uint8_t cost = (tr == Track::EMPTY ? 1 : 0);
                    int pred_u = (pr * W + pc) * 4 + pd;
                    if (d_val + cost < out_dist[pred_u]) {
                        out_dist[pred_u] = d_val + cost;
                        q.push_back(pred_u);
                    }
                }
            }
        }
    }
}

inline size_t heat_idx(size_t car_idx, Direction dir, int y, int x, int HW, int W) noexcept {
    int d = static_cast<int>(dir);
    if (d < 0 || d > 3) return 0;
    return (car_idx * 4 + static_cast<size_t>(d)) * static_cast<size_t>(HW) + static_cast<size_t>(y * W + x);
}

template <typename B>
inline Track board_at(const B& b, int y, int x, int W) noexcept {
    return b[y * W + x];
}

template <typename M>
inline Mod mod_at(const M& m, int y, int x, int W) noexcept {
    return m[y * W + x];
}

template <typename B>
inline void set_board_at(B& b, int y, int x, int W, Track val) noexcept {
    b[y * W + x] = val;
}

template <typename M>
inline void set_mod_at(M& m, int y, int x, int W, Mod val) noexcept {
    m[y * W + x] = val;
}

template <typename Board>
std::vector<std::vector<Track>> to_2d_board(const Board& flat_board, int H, int W) {
    std::vector<std::vector<Track>> res(H, std::vector<Track>(W));
    for (int r = 0; r < H; ++r) {
        for (int c = 0; c < W; ++c) {
            res[r][c] = flat_board[r * W + c];
        }
    }
    return res;
}

template <typename Mods>
std::vector<std::vector<Mod>> to_2d_mods(const Mods& flat_mods, int H, int W) {
    std::vector<std::vector<Mod>> res(H, std::vector<Mod>(W));
    for (int r = 0; r < H; ++r) {
        for (int c = 0; c < W; ++c) {
            res[r][c] = flat_mods[r * W + c];
        }
    }
    return res;
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
    int HW = H * W;

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

    std::vector<uint8_t> is_permanent_track(HW, 0);
    std::map<int, std::vector<Pos>> tunnel_poses;
    std::map<int, std::vector<Pos>> gate_poses;
    std::map<int, std::vector<Pos>> swapping_track_poses;
    std::map<Mod, std::map<int, std::vector<Pos>>> station_poses;

    bool level_has_switches = false;

    for (int i = 0; i < H; ++i) {
        for (int j = 0; j < W; ++j) {
            if (!track_is_empty(board[i][j])) {
                is_permanent_track[i * W + j] = 1;
            }
            Pos pos{i, j};
            Mod m = mods[i][j];
            int num = mod_nums[i][j];
            if (m == Mod::SWITCH || m == Mod::SWITCH_RAIL || m == Mod::SWAPPING_TRACK) {
                level_has_switches = true;
            }
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
    SmallTrackBoard best_board;
    SmallModBoard best_mods;
    uint64_t iterations = 0;

    size_t heatmap_size = total_cars_count * 4 * HW;

    SearchState initial_state;
    for (const auto& c : all_cars) {
        initial_state.cars_to_use.push_back(c);
    }

    for (int r = 0; r < H; ++r) {
        for (int c = 0; c < W; ++c) {
            initial_state.board_to_use[r * W + c] = board[r][c];
            initial_state.mods_to_use[r * W + c] = mods[r][c];
        }
    }

    initial_state.available_tracks = max_tracks;
    initial_state.heatmaps = std::make_shared<std::vector<int>>(heatmap_size, 0);
    initial_state.solved_normal.clear();
    initial_state.solved_numeral.clear();
    initial_state.stalled.assign(total_cars_count, false);
    initial_state.switch_queue.assign(total_cars_count, Pos{-1, -1});
    initial_state.station_stalled.assign(total_cars_count, false);
    initial_state.crashed_decoys.clear();
    initial_state.mvmts_since_solved = 0;
    initial_state.available_semaphores = max_semaphores;
    initial_state.heatmap_limits = std::make_shared<std::vector<int>>(heatmap_size, 0);

    const uint8_t* perm_ptr = is_permanent_track.data();

    std::vector<uint8_t> normal_dist(HW * 4, INF_DIST);
    std::vector<uint8_t> numeral_dist(HW * 4, INF_DIST);
    if (cars_count > 0) {
        compute_distance_field(board, mods, mod_nums, tunnel_poses, perm_ptr, H, W, CarType::NORMAL, normal_dist.data());
    }
    if (ncars_count > 0) {
        compute_distance_field(board, mods, mod_nums, tunnel_poses, perm_ptr, H, W, CarType::NUMERAL, numeral_dist.data());
    }
    const uint8_t* norm_dist_ptr = normal_dist.data();
    const uint8_t* num_dist_ptr = numeral_dist.data();

    std::vector<std::vector<uint8_t>> car_station_dists(total_cars_count, std::vector<uint8_t>(HW * 4, INF_DIST));
    for (size_t i = 0; i < total_cars_count; ++i) {
        const auto& car = all_cars[i];
        if (car.type == CarType::DECOY) continue;
        size_t c_idx = car.car_index(cars_count, decoys_count);
        Mod st_mod = car.get_station();
        auto st_it = station_poses.find(st_mod);
        if (st_it != station_poses.end()) {
            auto num_it = st_it->second.find(car.num);
            if (num_it != st_it->second.end() && !num_it->second.empty()) {
                compute_station_distance_field(board, mods, mod_nums, tunnel_poses, perm_ptr, H, W, num_it->second, car_station_dists[c_idx].data());
            }
        }
    }

    auto get_active_dist_map = [&](const SearchState& st, const Car& car, size_t car_idx) -> const uint8_t* {
        if (car.type != CarType::NORMAL && car.type != CarType::NUMERAL) return nullptr;
        Mod st_mod = car.get_station();
        auto st_it = station_poses.find(st_mod);
        if (st_it != station_poses.end()) {
            auto num_it = st_it->second.find(car.num);
            if (num_it != st_it->second.end() && !num_it->second.empty()) {
                bool has_unvisited = false;
                for (const Pos& st_pos : num_it->second) {
                    if (mod_at(st.mods_to_use, st_pos.y, st_pos.x, W) != Mod::DEACTIVATED_MOD) {
                        has_unvisited = true;
                        break;
                    }
                }
                if (has_unvisited) {
                    return car_station_dists[car_idx].data();
                }
            }
        }
        return (car.type == CarType::NUMERAL ? num_dist_ptr : norm_dist_ptr);
    };

    auto generate_tracks = [&](SearchState& state, std::vector<SearchState>& next_states) {
        next_states.clear();
        // Remove decoys from generation if they crashed last frame
        if (decoys_count > 0) {
            for (int i = static_cast<int>(state.cars_to_use.size()) - 1; i >= 0; --i) {
                if (state.cars_to_use[i].type == CarType::CRASHED) {
                    state.crashed_decoys.push_back(state.cars_to_use[i]);
                    state.cars_to_use.erase(static_cast<size_t>(i));
                    state.stalled.erase(static_cast<size_t>(i));
                }
            }
        }

        SmallCarVec stalled_cars;
        if (state.stalled.mask != 0) {
            for (size_t i = 0; i < state.cars_to_use.size(); ++i) {
                if (state.stalled[i]) {
                    stalled_cars.push_back(state.cars_to_use[i]);
                }
            }
        }

        // Pre-generation section 1
        if (level_has_switches) {
            for (size_t c = 0; c < state.cars_to_use.size(); ++c) {
                const Car& car = state.cars_to_use[c];
                Pos queued_gate = state.switch_queue[c];
                if (queued_gate.y != -1 && (car.pos.y != queued_gate.y || car.pos.x != queued_gate.x)) {
                    set_mod_at(state.mods_to_use, queued_gate.y, queued_gate.x, W, Mod::CLOSED_GATE);
                    state.switch_queue[c] = {-1, -1};
                }

                Mod mod = mods[car.pos.y][car.pos.x];
                int mod_num = mod_nums[car.pos.y][car.pos.x];

                if (!state.stalled[c] && mod == Mod::SWITCH) {
                    auto gate_it = gate_poses.find(mod_num);
                    if (gate_it != gate_poses.end()) {
                        for (const Pos& gate_pos : gate_it->second) {
                            Mod gate = mod_at(state.mods_to_use, gate_pos.y, gate_pos.x, W);
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
                                    set_mod_at(state.mods_to_use, gate_pos.y, gate_pos.x, W, Mod::CLOSED_GATE);
                                }
                            } else {
                                set_mod_at(state.mods_to_use, gate_pos.y, gate_pos.x, W, Mod::OPEN_GATE);
                            }
                        }
                    }

                    auto swap_it = swapping_track_poses.find(mod_num);
                    if (swap_it != swapping_track_poses.end()) {
                        for (const Pos& swap_pos : swap_it->second) {
                            Track cur_tr = board_at(state.board_to_use, swap_pos.y, swap_pos.x, W);
                            set_board_at(state.board_to_use, swap_pos.y, swap_pos.x, W, track_swap(cur_tr));
                        }
                    }
                } else if (!state.stalled[c] && mod == Mod::SWITCH_RAIL) {
                    Track cur_tr = board_at(state.board_to_use, car.pos.y, car.pos.x, W);
                    set_board_at(state.board_to_use, car.pos.y, car.pos.x, W, track_swap(cur_tr));
                }
            }
        }

        for (size_t c = 0; c < state.cars_to_use.size(); ++c) {
            const Car& car = state.cars_to_use[c];

            if (car.border_crash(H, W)) {
                continue;
            }

            size_t car_idx = car.car_index(cars_count, decoys_count);
            Mod car_pos_mod = mod_at(state.mods_to_use, car.pos.y, car.pos.x, W);
            Mod car_ahead_mod = mod_at(state.mods_to_use, car.pos_ahead.y, car.pos_ahead.x, W);

            bool on_station_condition = (car.type != CarType::DECOY && (
                car.on_correct_station(car_pos_mod, mod_nums[car.pos.y][car.pos.x]) ||
                state.station_stalled[car_idx]
            ));
            bool gate_or_sem_ahead = mod_is_gate_or_sem(car_ahead_mod);

            if (!on_station_condition && !gate_or_sem_ahead) {
                if (state.heatmaps.use_count() > 1) {
                    state.heatmaps = std::make_shared<std::vector<int>>(*state.heatmaps);
                }
                if (state.heatmap_limits.use_count() > 1) {
                    state.heatmap_limits = std::make_shared<std::vector<int>>(*state.heatmap_limits);
                }
                int* h_ptr = state.heatmaps->data();
                int* hl_ptr = state.heatmap_limits->data();

                size_t h_idx = heat_idx(car_idx, car.direction, car.pos.y, car.pos.x, HW, W);
                if (hl_ptr[h_idx] == 0) {
                    hl_ptr[h_idx]++;
                }
                h_ptr[h_idx]++;
                int heat = h_ptr[h_idx];
                if (car.type == CarType::DECOY) {
                    if (heat > options_.decoy_heatmap_limit) return;
                } else {
                    if (heat > hl_ptr[h_idx]) return;
                }
            }

            if (car_ahead_mod == Mod::SEMAPHORE) {
                Track ahead_tr = board_at(state.board_to_use, car.pos_ahead.y, car.pos_ahead.x, W);
                auto [sem_dir0, sem_dir1] = get_semaphore_pass(ahead_tr);
                Pos sem_pos0 = direction_add_vector(sem_dir0, car.pos_ahead);
                Pos sem_pos1 = direction_add_vector(sem_dir1, car.pos_ahead);

                if (state.available_tracks == lowest_tracks_remaining + 1) {
                    if (car.pos == sem_pos0) {
                        if (track_is_empty(board_at(state.board_to_use, sem_pos1.y, sem_pos1.x, W))) return;
                    } else {
                        if (track_is_empty(board_at(state.board_to_use, sem_pos0.y, sem_pos0.x, W))) return;
                    }
                }

                for (size_t pc = 0; pc < state.cars_to_use.size(); ++pc) {
                    if (pc == c) continue;
                    const auto& p_car = state.cars_to_use[pc];
                    bool pos0 = (p_car.pos == sem_pos0 && p_car.direction != direction_reverse(sem_dir0));
                    bool pos1 = (p_car.pos == sem_pos1 && p_car.direction != direction_reverse(sem_dir1));
                    if (pos0 || pos1) {
                        set_mod_at(state.mods_to_use, car.pos_ahead.y, car.pos_ahead.x, W, Mod::DEACTIVATED_MOD);
                        break;
                    }
                }
            }
        }

        size_t N = state.cars_to_use.size();
        SmallCarVec cars_generated[8];
        SmallTrackVec usable_tracks[8];
        SmallBoolVec decoy_placing;
        decoy_placing.assign(decoys_count, false);
        std::pair<int, int> just_solved = {-1, -1};

        // Post-generation
        for (size_t c = 0; c < N; ++c) {
            const Car& car = state.cars_to_use[c];
            iterations++;
            size_t car_idx = car.car_index(cars_count, decoys_count);

            int flat_car_pos = car.pos.y * W + car.pos.x;
            Track car_pos_tr = state.board_to_use[flat_car_pos];
            Mod car_pos_mod = state.mods_to_use[flat_car_pos];

            if (car.border_crash(H, W)) {
                cars_generated[c] = {car.crash()};
                usable_tracks[c] = {car_pos_tr};
                continue;
            }

            if (car.type != CarType::DECOY) {
                if (car.on_correct_station(car_pos_mod, mod_nums[car.pos.y][car.pos.x])) {
                    state.station_stalled[car_idx] = true;
                    state.mods_to_use[flat_car_pos] = Mod::DEACTIVATED_MOD;
                    cars_generated[c] = {car};
                    usable_tracks[c] = {car_pos_tr};
                    continue;
                } else if (state.station_stalled[car_idx]) {
                    state.station_stalled[car_idx] = false;
                    cars_generated[c] = {car};
                    usable_tracks[c] = {car_pos_tr};
                    continue;
                }
            }

            int flat_car_ahead = car.pos_ahead.y * W + car.pos_ahead.x;
            Mod car_ahead_mod = state.mods_to_use[flat_car_ahead];

            if (mod_is_gate_or_sem(car_ahead_mod)) {
                state.stalled[c] = true;
                cars_generated[c] = {car};
                usable_tracks[c] = {car_pos_tr};
                continue;
            }
            if (state.stalled.mask != 0 && state.stalled[c]) {
                state.stalled[c] = false;
            }

            Track tile_ahead = state.board_to_use[flat_car_ahead];
            Direction tile_ahead_redirect = get_track_direction(tile_ahead, car.direction);

            SmallTrackVec tracks_to_check;
            if (!track_is_empty(tile_ahead)) {
                if (perm_ptr[flat_car_ahead]) {
                    if (tile_ahead_redirect == Direction::CRASH) {
                        if (car.type == CarType::DECOY) {
                            cars_generated[c] = {car.crash()};
                            usable_tracks[c] = {car_pos_tr};
                            continue;
                        } else {
                            return;
                        }
                    } else {
                        tracks_to_check.push_back(tile_ahead);
                    }
                } else {
                    if (tile_ahead_redirect == Direction::CRASH) {
                        if (track_is_turn(tile_ahead) || track_is_straight(tile_ahead)) {
                            for (Track tr : car.generable_3ways(tile_ahead)) {
                                tracks_to_check.push_back(tr);
                            }
                        } else if (car.type == CarType::DECOY) {
                            cars_generated[c] = {car.crash()};
                            usable_tracks[c] = {car_pos_tr};
                            continue;
                        } else {
                            return;
                        }
                    } else if (track_is_straight(tile_ahead)) {
                        int heat = 0;
                        bool cannot_place_3way = false;
                        const int* h_ptr = state.heatmaps->data();
                        size_t base = static_cast<size_t>(car.direction) * HW + (car.pos.y * W + car.pos.x);
                        size_t stride = 4 * HW;
                        for (size_t i = 0; i < total_cars_count; ++i) {
                            heat += h_ptr[base];
                            base += stride;
                            if (heat > 1) {
                                tracks_to_check.push_back(tile_ahead);
                                cannot_place_3way = true;
                                break;
                            }
                        }
                        if (!cannot_place_3way) {
                            tracks_to_check.push_back(tile_ahead);
                            for (Track tr : car.generable_3ways(tile_ahead)) {
                                tracks_to_check.push_back(tr);
                            }
                        }
                    } else {
                        tracks_to_check.push_back(tile_ahead);
                    }
                }
            } else {
                if (car.type == CarType::DECOY) {
                    int flat_pos = car.pos.y * W + car.pos.x;
                    bool can_crash = perm_ptr[flat_pos] ||
                                     !track_is_turn(car_pos_tr);
                    if (state.available_tracks - 1 <= lowest_tracks_remaining) {
                        if (can_crash) {
                            tracks_to_check.push_back(Track::EMPTY);
                        } else {
                            return;
                        }
                    } else {
                        decoy_placing[car.num] = true;
                        if (can_crash) {
                            tracks_to_check.push_back(Track::EMPTY);
                            for (Track tr : car.generable_tracks()) {
                                tracks_to_check.push_back(tr);
                            }
                        } else {
                            for (Track tr : car.generable_tracks()) {
                                tracks_to_check.push_back(tr);
                            }
                        }
                    }
                } else {
                    if (state.available_tracks - 1 <= lowest_tracks_remaining) return;
                    state.available_tracks--;
                    for (Track tr : car.generable_tracks()) {
                        tracks_to_check.push_back(tr);
                    }
                }
            }

            if (tracks_to_check.empty()) return;

            if ((track_is_car_ending(tracks_to_check[0]) && car.type != CarType::NORMAL) ||
                (track_is_ncar_ending(tracks_to_check[0]) && car.type != CarType::NUMERAL)) {
                return;
            }

            if (state.available_tracks <= lowest_tracks_remaining) {
                return;
            }

            bool crash_detected = false;
            const bool can_head_on = static_cast<int8_t>(car.direction) >= 0;
            const Direction reverse_direction = can_head_on
                ? direction_reverse(car.direction)
                : Direction::UNKNOWN;
            for (size_t i = 0; i < N; ++i) {
                if (!cars_generated[i].empty() &&
                    car.pos_ahead == cars_generated[i][0].pos) {
                    crash_detected = true;
                    break;
                }
                if (can_head_on && car.pos_ahead == state.cars_to_use[i].pos &&
                    reverse_direction == state.cars_to_use[i].direction) {
                    crash_detected = true;
                    break;
                }
            }
            if (!crash_detected) {
                for (const auto& c_car : state.crashed_decoys) {
                    if (car.pos_ahead == c_car.pos) {
                        crash_detected = true;
                        break;
                    }
                }
            }
            if (!crash_detected) {
                for (const auto& s_car : stalled_cars) {
                    if (car.pos_ahead == s_car.pos) {
                        crash_detected = true;
                        break;
                    }
                }
            }

            if (crash_detected) {
                if (tracks_to_check[0] == Track::EMPTY) {
                    tracks_to_check = {Track::EMPTY};
                } else if (car.type == CarType::DECOY) {
                    cars_generated[c] = {car.crash()};
                    usable_tracks[c] = {car_pos_tr};
                    continue;
                } else {
                    return;
                }
            }

            for (Track possibleTrack : tracks_to_check) {
                Direction possible_redirect = Direction::UNKNOWN;
                Pos current_pos_ahead = car.pos_ahead;

                if (possibleTrack == Track::EMPTY) {
                    if (car.type == CarType::DECOY) {
                        cars_generated[c].push_back(car.crash());
                        usable_tracks[c].push_back(Track::EMPTY);
                        continue;
                    } else {
                        return;
                    }
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

                if (possible_redirect == Direction::CRASH) {
                    if (car.type == CarType::DECOY) {
                        cars_generated[c].push_back(car.crash());
                        usable_tracks[c].push_back(possibleTrack);
                        continue;
                    } else {
                        return;
                    }
                }

                if (track_is_car_ending(possibleTrack) || track_is_ncar_ending(possibleTrack)) {
                    int is_numeral = (car.type == CarType::NUMERAL ? 1 : 0);
                    const SmallIntVec& any_solved = (is_numeral == 1 ? state.solved_numeral : state.solved_normal);
                    if ((any_solved.empty() && car.num != 0) ||
                        (!any_solved.empty() && any_solved.back() != car.num - 1)) {
                        return;
                    }

                    Mod st_mod = car.get_station();
                    auto st_map_it = station_poses.find(st_mod);
                    if (st_map_it != station_poses.end()) {
                        auto num_it = st_map_it->second.find(car.num);
                        if (num_it != st_map_it->second.end()) {
                            for (const Pos& st_pos : num_it->second) {
                                if (mod_at(state.mods_to_use, st_pos.y, st_pos.x, W) != Mod::DEACTIVATED_MOD) {
                                    return;
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
                    const int* h_ptr = state.heatmaps->data();
                    for (size_t i = 0; i < total_cars_count; ++i) {
                        if (h_ptr[heat_idx(i, rev, current_pos_ahead.y, current_pos_ahead.x, HW, W)] > 0) {
                            cannot_place_3way = true;
                            break;
                        }
                    }
                    if (cannot_place_3way) continue;

                    Mod ahead_mod = mod_at(state.mods_to_use, current_pos_ahead.y, current_pos_ahead.x, W);
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

                Track end_on_tile = board_at(state.board_to_use, end_on.y, end_on.x, W);
                Direction end_on_redirect = get_track_direction(end_on_tile, possible_redirect);
                int flat_end_on = end_on.y * W + end_on.x;
                bool possible_to_place_3way = (track_is_straight(end_on_tile) || track_is_turn(end_on_tile)) &&
                                              !perm_ptr[flat_end_on];
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

                    if (state.available_semaphores > 0 &&
                        (track_is_straight(possibleTrack) || track_is_turn(possibleTrack)) &&
                        mod_at(state.mods_to_use, current_pos_ahead.y, current_pos_ahead.x, W) == Mod::EMPTY) {

                        bool semaphore_triggered = false;
                        int flat_cpa = current_pos_ahead.y * W + current_pos_ahead.x;
                        const int* h_ptr = state.heatmaps->data();
                        for (size_t i = 0; i < total_cars_count; ++i) {
                            size_t base = (i * 4) * HW + flat_cpa;
                            if (h_ptr[base] > 0 || h_ptr[base + HW] > 0 ||
                                h_ptr[base + 2 * HW] > 0 || h_ptr[base + 3 * HW] > 0) {
                                semaphore_triggered = true;
                                break;
                            }
                        }

                        if (!semaphore_triggered) {
                            auto [sem_dir0, sem_dir1] = get_semaphore_pass(possibleTrack);
                            Pos sem_pos0 = direction_add_vector(sem_dir0, current_pos_ahead);
                            Pos sem_pos1 = direction_add_vector(sem_dir1, current_pos_ahead);

                            int pos0_heat = 0;
                            int pos1_heat = 0;
                            int flat_sp0 = sem_pos0.y * W + sem_pos0.x;
                            int flat_sp1 = sem_pos1.y * W + sem_pos1.x;
                            for (size_t i = 0; i < total_cars_count; ++i) {
                                size_t b0 = (i * 4) * HW + flat_sp0;
                                size_t b1 = (i * 4) * HW + flat_sp1;
                                pos0_heat += h_ptr[b0] + h_ptr[b0 + HW] + h_ptr[b0 + 2 * HW] + h_ptr[b0 + 3 * HW];
                                pos1_heat += h_ptr[b1] + h_ptr[b1 + HW] + h_ptr[b1 + 2 * HW] + h_ptr[b1 + 3 * HW];
                            }
                            int pos0_starting = (mod_at(state.mods_to_use, sem_pos0.y, sem_pos0.x, W) == Mod::STARTING_CAR_TILE ? 1 : 0);
                            int pos1_starting = (mod_at(state.mods_to_use, sem_pos1.y, sem_pos1.x, W) == Mod::STARTING_CAR_TILE ? 1 : 0);
                            int starting_tile_heat = 0;

                            if (mod_at(state.mods_to_use, car.pos.y, car.pos.x, W) == Mod::STARTING_CAR_TILE) {
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
            }

            if (usable_tracks[c].empty()) return;

            if (usable_tracks[c].size() > 1) {
                int scores[8];
                const uint8_t* dist_map = get_active_dist_map(state, car, car_idx);
                for (size_t i = 0; i < usable_tracks[c].size(); ++i) {
                    Track tr = usable_tracks[c][i];
                    const Car& gc = cars_generated[c][i];
                    if (track_is_car_ending(tr) || track_is_ncar_ending(tr)) {
                        scores[i] = 0;
                    } else if (car.type == CarType::DECOY) {
                        scores[i] = (tr == Track::EMPTY ? 100 : 10);
                    } else {
                        scores[i] = 0;
                        if (dist_map && gc.pos.y >= 0 && gc.pos.y < H && gc.pos.x >= 0 && gc.pos.x < W) {
                            int flat_ahead = (gc.pos.y * W + gc.pos.x) * 4 + static_cast<int>(gc.direction);
                            int d = dist_map[flat_ahead];
                            if (d == INF_DIST) {
                                scores[i] = 100000;
                            } else {
                                scores[i] = d * 4;
                            }
                        }
                        if (track_is_placeholder_semaphore(tr)) scores[i] += 3;
                        else if (track_is_empty(state.board_to_use[gc.pos.y * W + gc.pos.x])) scores[i] += 2;
                    }
                }
                for (size_t i = 0; i < usable_tracks[c].size(); ++i) {
                    for (size_t j = i + 1; j < usable_tracks[c].size(); ++j) {
                        if (scores[j] < scores[i]) {
                            std::swap(scores[i], scores[j]);
                            std::swap(usable_tracks[c][i], usable_tracks[c][j]);
                            std::swap(cars_generated[c][i], cars_generated[c][j]);
                        }
                    }
                }
            }
        }

        uint8_t target_mask = static_cast<uint8_t>((1 << N) - 1);
        if (N > 0 && (state.stalled.mask & target_mask) == target_mask) {
            return;
        }

        if (state.solved_normal.count == static_cast<uint8_t>(cars_count) &&
            state.solved_numeral.count == static_cast<uint8_t>(ncars_count)) {
            bool all_non_decoy = true;
            if (decoys_count > 0) {
                for (const auto& car : state.cars_to_use) {
                    if (car.type == CarType::DECOY) {
                        all_non_decoy = false;
                        break;
                    }
                }
            }
            if (all_non_decoy || state.mvmts_since_solved == 2) {
                best_board = state.board_to_use;
                best_mods = state.mods_to_use;
                lowest_tracks_remaining = state.available_tracks;
                semaphores_remaining = state.available_semaphores;
                return;
            } else {
                state.mvmts_since_solved++;
            }
        }

        std::vector<size_t> to_remove;
        if (just_solved.first != -1) to_remove.push_back(static_cast<size_t>(just_solved.first));
        if (just_solved.second != -1) to_remove.push_back(static_cast<size_t>(just_solved.second));
        std::sort(to_remove.rbegin(), to_remove.rend());
        to_remove.erase(std::unique(to_remove.begin(), to_remove.end()), to_remove.end());

        for (size_t sc : to_remove) {
            if (sc < N) {
                for (size_t i = sc; i < N - 1; ++i) {
                    cars_generated[i] = cars_generated[i + 1];
                    usable_tracks[i] = usable_tracks[i + 1];
                    state.stalled[i] = state.stalled[i + 1];
                }
                state.stalled.pop_back();
                N--;
            }
        }

        size_t combo_cars_count = N;

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
            return;
        }

        // Cartesian product generation
        size_t indices[8] = {0};
        while (true) {
            bool same_tile_conflict = false;
            for (size_t i = 0; i < combo_cars_count && !same_tile_conflict; ++i) {
                const Car& car = cars_generated[i][indices[i]];
                for (size_t j = i + 1; j < combo_cars_count; ++j) {
                    if (car.pos == cars_generated[j][indices[j]].pos) {
                        same_tile_conflict = true;
                        break;
                    }
                }
            }

            if (same_tile_conflict) {
                int p = static_cast<int>(combo_cars_count) - 1;
                while (p >= 0) {
                    indices[p]++;
                    if (indices[p] < cars_generated[p].size()) break;
                    indices[p] = 0;
                    p--;
                }
                if (p < 0) break;
                continue;
            }

            int tracks_to_pass = state.available_tracks;
            int semaphores_to_pass = state.available_semaphores;
            auto board_to_pass = state.board_to_use;
            auto mods_to_pass = state.mods_to_use;
            auto stalled_to_pass = state.stalled;
            auto heatmap_limits_pass = state.heatmap_limits;

            bool stop_branch = false;

            for (size_t i = 0; i < combo_cars_count; ++i) {
                const Car& car = cars_generated[i][indices[i]];
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
                    set_board_at(board_to_pass, car.pos_ahead.y, car.pos_ahead.x, W, track_remove_placeholder_semaphore(track_placing));
                    set_mod_at(mods_to_pass, car.pos_ahead.y, car.pos_ahead.x, W, Mod::SEMAPHORE);
                    stalled_to_pass[i] = true;
                } else if (!track_is_empty(track_placing)) {
                    set_board_at(board_to_pass, car.pos.y, car.pos.x, W, track_placing);
                }

                Mod car_pos_mod_pass = mod_at(mods_to_pass, car.pos.y, car.pos.x, W);

                if (car.type != CarType::CRASHED && (car_pos_mod_pass == Mod::SWAPPING_TRACK ||
                                                     car_pos_mod_pass == Mod::SWITCH_RAIL)) {
                    size_t car_idx = car.car_index(cars_count, decoys_count);
                    size_t h_idx = heat_idx(car_idx, car.direction, car.pos.y, car.pos.x, HW, W);
                    if ((*heatmap_limits_pass)[h_idx] <= options_.heatmap_limit_limit) {
                        if (!state.stalled[i]) {
                            if (heatmap_limits_pass.use_count() > 1) {
                                heatmap_limits_pass = std::make_shared<std::vector<int>>(*heatmap_limits_pass);
                            }
                            size_t base = car_idx * (4 * HW);
                            size_t end = base + (4 * HW);
                            for (size_t idx = base; idx < end; ++idx) {
                                if ((*heatmap_limits_pass)[idx] > 0) {
                                    (*heatmap_limits_pass)[idx]++;
                                }
                            }
                        }
                    } else {
                        stop_branch = true;
                        break;
                    }
                }
            }

            if (!stop_branch) {
                SearchState next_state;
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

                bool unreachable = false;
                for (const auto& c : next_state.cars_to_use) {
                    if (c.type == CarType::NORMAL || c.type == CarType::NUMERAL) {
                        size_t c_idx = c.car_index(cars_count, decoys_count);
                        const uint8_t* d_map = get_active_dist_map(next_state, c, c_idx);
                        if (d_map && c.pos.y >= 0 && c.pos.y < H && c.pos.x >= 0 && c.pos.x < W) {
                            int f = (c.pos.y * W + c.pos.x) * 4 + static_cast<int>(c.direction);
                            int d_val = d_map[f];
                            if (d_val == INF_DIST) {
                                unreachable = true;
                                break;
                            }
                        }
                    }
                }

                if (!unreachable) {
                    next_states.push_back(std::move(next_state));
                }
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
    };

    if (options_.gen_type == SearchType::DFS) {
        std::vector<SearchState> stack;
        stack.push_back(std::move(initial_state));
        std::vector<SearchState> next_states_buf;

        while (!stack.empty()) {
            if (options_.max_iterations > 0 && iterations >= options_.max_iterations) {
                result.max_iterations_reached = true;
                break;
            }
            if (options_.timeout_seconds > 0.0 && (iterations & 4095) == 0) {
                auto now = std::chrono::steady_clock::now();
                double elapsed = std::chrono::duration<double>(now - start_time).count();
                if (elapsed >= options_.timeout_seconds) {
                    result.timed_out = true;
                    break;
                }
            }

            if (visualize) {
                auto now = std::chrono::steady_clock::now();
                double elapsed = std::chrono::duration<double>(now - start_time).count();
                auto b2d = to_2d_board(stack.back().board_to_use, H, W);
                auto m2d = to_2d_mods(stack.back().mods_to_use, H, W);
                std::vector<Car> cars_v(stack.back().cars_to_use.begin(), stack.back().cars_to_use.end());
                visualize(VisualizeData{b2d, m2d, cars_v, iterations, elapsed});
            }

            generate_tracks(stack.back(), next_states_buf);
            stack.pop_back();

            if (lowest_tracks_remaining != -1) {
                break;
            }

            if (next_states_buf.size() > 1) {
                for (auto& s : next_states_buf) {
                    int score = 0;
                    for (const auto& c : s.cars_to_use) {
                        if (c.type == CarType::NORMAL || c.type == CarType::NUMERAL) {
                            size_t c_idx = c.car_index(cars_count, decoys_count);
                            const uint8_t* d_map = get_active_dist_map(s, c, c_idx);
                            if (d_map && c.pos.y >= 0 && c.pos.y < H && c.pos.x >= 0 && c.pos.x < W) {
                                int f = (c.pos.y * W + c.pos.x) * 4 + static_cast<int>(c.direction);
                                int weight = (c.num < 4) ? (1 << (2 * (3 - c.num))) : 1;
                                score += d_map[f] * weight;
                            }
                        }
                    }
                    s.heuristic_score = score;
                }
                std::sort(next_states_buf.begin(), next_states_buf.end(), [](const SearchState& a, const SearchState& b) {
                    return a.heuristic_score < b.heuristic_score;
                });
            }

            for (auto it = next_states_buf.rbegin(); it != next_states_buf.rend(); ++it) {
                stack.push_back(std::move(*it));
            }
        }
    } else { // BFS
        std::vector<std::deque<SearchState>> queues(max_tracks + 1);
        queues[max_tracks].push_back(std::move(initial_state));

        std::vector<SearchState> next_states_buf;
        bool stop_all = false;
        for (int track_count = max_tracks; track_count >= 0 && !stop_all; --track_count) {
            auto& queue = queues[track_count];
            while (!queue.empty()) {
                if (options_.max_iterations > 0 && iterations >= options_.max_iterations) {
                    result.max_iterations_reached = true;
                    stop_all = true;
                    break;
                }
                if (options_.timeout_seconds > 0.0 && (iterations & 4095) == 0) {
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
                    auto b2d = to_2d_board(cur.board_to_use, H, W);
                    auto m2d = to_2d_mods(cur.mods_to_use, H, W);
                    std::vector<Car> cars_v(cur.cars_to_use.begin(), cur.cars_to_use.end());
                    visualize(VisualizeData{b2d, m2d, cars_v, iterations, elapsed});
                }

                generate_tracks(cur, next_states_buf);
                if (lowest_tracks_remaining != -1) {
                    stop_all = true;
                    break;
                }
                for (auto& s : next_states_buf) {
                    int av = s.available_tracks;
                    if (av >= 0 && static_cast<size_t>(av) < queues.size()) {
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

    if (lowest_tracks_remaining != -1) {
        result.solved = true;
        result.board = to_2d_board(best_board, H, W);
        result.mods = to_2d_mods(best_mods, H, W);

        // Restore permanent track positions
        for (int pos_index = 0; pos_index < HW; ++pos_index) {
            if (is_permanent_track[pos_index]) {
                int r = pos_index / W;
                int c = pos_index % W;
                result.board[r][c] = board[r][c];
            }
        }
    }

    return result;
}

SolveResult solve_level(const Level& level, const SolverOptions& options, VisualizeCallback visualize) {
    Solver solver(options);
    return solver.solve(level, visualize);
}

} // namespace railbound
