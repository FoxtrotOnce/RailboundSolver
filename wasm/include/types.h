#pragma once
#include <array>
#include <cstdint>
#include <string>
#include <vector>
#include <unordered_map>
#include <stdexcept>

namespace railbound {

// ---------------------------------------------------------------------------
// Track – mirrors Track in algo/classes.ts
// ---------------------------------------------------------------------------
enum class Track : uint8_t {
    EMPTY = 0,
    HORIZONTAL_TRACK = 1,
    VERTICAL_TRACK = 2,
    CAR_ENDING_TRACK_RIGHT = 3,
    ROADBLOCK = 4,
    BOTTOM_RIGHT_TURN = 5,
    BOTTOM_LEFT_TURN = 6,
    TOP_RIGHT_TURN = 7,
    TOP_LEFT_TURN = 8,
    BOTTOM_RIGHT_LEFT_3WAY = 9,
    BOTTOM_RIGHT_TOP_3WAY = 10,
    BOTTOM_LEFT_RIGHT_3WAY = 11,
    BOTTOM_LEFT_TOP_3WAY = 12,
    TOP_RIGHT_LEFT_3WAY = 13,
    TOP_RIGHT_BOTTOM_3WAY = 14,
    TOP_LEFT_RIGHT_3WAY = 15,
    TOP_LEFT_BOTTOM_3WAY = 16,
    LEFT_FACING_TUNNEL = 17,
    RIGHT_FACING_TUNNEL = 18,
    DOWN_FACING_TUNNEL = 19,
    UP_FACING_TUNNEL = 20,
    NCAR_ENDING_TRACK_RIGHT = 21,
    NCAR_ENDING_TRACK_LEFT = 22,
    SEM_HORIZONTAL_TRACK = 23,
    SEM_VERTICAL_TRACK = 24,
    SEM_BOTTOM_RIGHT_TURN = 25,
    SEM_BOTTOM_LEFT_TURN = 26,
    SEM_TOP_RIGHT_TURN = 27,
    SEM_TOP_LEFT_TURN = 28,
    CAR_ENDING_TRACK_LEFT = 29,
    CAR_ENDING_TRACK_DOWN = 30,
    CAR_ENDING_TRACK_UP = 31,
    NCAR_ENDING_TRACK_DOWN = 32,
    NCAR_ENDING_TRACK_UP = 33,
    STATION_LEFT = 34,
    STATION_RIGHT = 35,
    STATION_DOWN = 36,
    STATION_UP = 37,
};

// Inline helpers – zero cost, header-only
inline bool is_empty(Track t)          { return t == Track::EMPTY; }
inline bool is_straight(Track t)       { return t == Track::HORIZONTAL_TRACK || t == Track::VERTICAL_TRACK; }
inline bool is_turn(Track t)           { return t == Track::BOTTOM_RIGHT_TURN || t == Track::BOTTOM_LEFT_TURN || t == Track::TOP_RIGHT_TURN || t == Track::TOP_LEFT_TURN; }
inline bool is_3way(Track t)           { return t >= Track::BOTTOM_RIGHT_LEFT_3WAY && t <= Track::TOP_LEFT_BOTTOM_3WAY; }
inline bool is_tunnel(Track t)         { return t >= Track::LEFT_FACING_TUNNEL && t <= Track::UP_FACING_TUNNEL; }
inline bool is_car_ending(Track t)     { return t == Track::CAR_ENDING_TRACK_LEFT || t == Track::CAR_ENDING_TRACK_RIGHT || t == Track::CAR_ENDING_TRACK_DOWN || t == Track::CAR_ENDING_TRACK_UP; }
inline bool is_ncar_ending(Track t)    { return t == Track::NCAR_ENDING_TRACK_LEFT || t == Track::NCAR_ENDING_TRACK_RIGHT || t == Track::NCAR_ENDING_TRACK_DOWN || t == Track::NCAR_ENDING_TRACK_UP; }
inline bool is_station_track(Track t)  { return t >= Track::STATION_LEFT && t <= Track::STATION_UP; }
inline bool is_placeholder_sem(Track t){ return t >= Track::SEM_HORIZONTAL_TRACK && t <= Track::SEM_TOP_LEFT_TURN; }

// Swap a 3-way / switch track (mirrors swapped_tracks map)
inline Track swap_track(Track t) {
    switch (t) {
        case Track::BOTTOM_RIGHT_LEFT_3WAY: return Track::BOTTOM_LEFT_RIGHT_3WAY;
        case Track::BOTTOM_RIGHT_TOP_3WAY:  return Track::TOP_RIGHT_BOTTOM_3WAY;
        case Track::BOTTOM_LEFT_RIGHT_3WAY: return Track::BOTTOM_RIGHT_LEFT_3WAY;
        case Track::BOTTOM_LEFT_TOP_3WAY:   return Track::TOP_LEFT_BOTTOM_3WAY;
        case Track::TOP_RIGHT_LEFT_3WAY:    return Track::TOP_LEFT_RIGHT_3WAY;
        case Track::TOP_RIGHT_BOTTOM_3WAY:  return Track::BOTTOM_RIGHT_TOP_3WAY;
        case Track::TOP_LEFT_RIGHT_3WAY:    return Track::TOP_RIGHT_LEFT_3WAY;
        case Track::TOP_LEFT_BOTTOM_3WAY:   return Track::BOTTOM_LEFT_TOP_3WAY;
        default: throw std::logic_error("swap_track: not a swapping track");
    }
}

inline Track add_placeholder_sem(Track t) {
    switch (t) {
        case Track::HORIZONTAL_TRACK:   return Track::SEM_HORIZONTAL_TRACK;
        case Track::VERTICAL_TRACK:     return Track::SEM_VERTICAL_TRACK;
        case Track::BOTTOM_RIGHT_TURN:  return Track::SEM_BOTTOM_RIGHT_TURN;
        case Track::BOTTOM_LEFT_TURN:   return Track::SEM_BOTTOM_LEFT_TURN;
        case Track::TOP_RIGHT_TURN:     return Track::SEM_TOP_RIGHT_TURN;
        case Track::TOP_LEFT_TURN:      return Track::SEM_TOP_LEFT_TURN;
        default: throw std::logic_error("add_placeholder_sem: not a sem-able track");
    }
}

inline Track remove_placeholder_sem(Track t) {
    switch (t) {
        case Track::SEM_HORIZONTAL_TRACK:   return Track::HORIZONTAL_TRACK;
        case Track::SEM_VERTICAL_TRACK:     return Track::VERTICAL_TRACK;
        case Track::SEM_BOTTOM_RIGHT_TURN:  return Track::BOTTOM_RIGHT_TURN;
        case Track::SEM_BOTTOM_LEFT_TURN:   return Track::BOTTOM_LEFT_TURN;
        case Track::SEM_TOP_RIGHT_TURN:     return Track::TOP_RIGHT_TURN;
        case Track::SEM_TOP_LEFT_TURN:      return Track::TOP_LEFT_TURN;
        default: throw std::logic_error("remove_placeholder_sem: not a placeholder");
    }
}

// ---------------------------------------------------------------------------
// Mod – mirrors Mod in algo/classes.ts
// ---------------------------------------------------------------------------
enum class Mod : uint8_t {
    EMPTY = 0,
    SWITCH = 1,
    TUNNEL = 2,
    CLOSED_GATE = 3,
    OPEN_GATE = 4,
    SWAPPING_TRACK = 5,
    STATION = 6,
    SWITCH_RAIL = 7,
    SEMAPHORE = 8,
    DEACTIVATED_MOD = 9,
    STARTING_CAR_TILE = 10,
    POST_OFFICE = 11,
};

inline bool is_gate_or_sem(Mod m) { return m == Mod::CLOSED_GATE || m == Mod::SEMAPHORE; }
inline bool is_station_mod(Mod m) { return m == Mod::STATION || m == Mod::POST_OFFICE; }

// ---------------------------------------------------------------------------
// Direction – mirrors Direction in algo/classes.ts
// ---------------------------------------------------------------------------
enum class Dir : int8_t {
    CRASH = -2,
    UNKNOWN = -1,
    LEFT = 0,
    RIGHT = 1,
    DOWN = 2,
    UP = 3,
};

struct Vec2 { int y; int x; };

inline Vec2 to_vec(Dir d) {
    switch (d) {
        case Dir::LEFT:  return {0, -1};
        case Dir::RIGHT: return {0,  1};
        case Dir::DOWN:  return {1,  0};
        case Dir::UP:    return {-1, 0};
        default: throw std::logic_error("to_vec: non-cardinal dir");
    }
}
inline Dir from_vec(Vec2 v) {
    if (v.y==0 && v.x==-1) return Dir::LEFT;
    if (v.y==0 && v.x== 1) return Dir::RIGHT;
    if (v.y==1 && v.x== 0) return Dir::DOWN;
    if (v.y==-1&& v.x== 0) return Dir::UP;
    throw std::logic_error("from_vec: invalid vector");
}
inline Dir reverse_dir(Dir d) {
    switch (d) {
        case Dir::LEFT: return Dir::RIGHT;
        case Dir::RIGHT:return Dir::LEFT;
        case Dir::DOWN: return Dir::UP;
        case Dir::UP:   return Dir::DOWN;
        default: throw std::logic_error("reverse: non-cardinal");
    }
}
inline Vec2 add_vec(Vec2 p, Dir d) {
    Vec2 v = to_vec(d);
    return {p.y+v.y, p.x+v.x};
}

// ---------------------------------------------------------------------------
// CarType
// ---------------------------------------------------------------------------
enum class CarType : uint8_t {
    CRASHED = 0,
    NORMAL = 1,
    DECOY = 2,
    NUMERAL = 3,
};

// ---------------------------------------------------------------------------
// Car
// ---------------------------------------------------------------------------
struct Car {
    Vec2 pos{0,0};
    Dir dir{Dir::UNKNOWN};
    int num{0};
    CarType type{CarType::NORMAL};
    Vec2 pos_ahead{0,0}; // pos + dir

    Car() = default;
    Car(Vec2 p, Dir d, int n, CarType t): pos(p), dir(d), num(n), type(t) {
        if ((int)d >= 0) pos_ahead = add_vec(p, d);
        else pos_ahead = p;
    }

    // helpers mirroring classes.ts
    std::vector<Track> generable_tracks() const;
    std::vector<Track> generable_3ways(Track cur) const;
    bool border_crash(int H, int W) const {
        return !(0 <= pos_ahead.y && pos_ahead.y < H && 0 <= pos_ahead.x && pos_ahead.x < W);
    }
    Car crash() const {
        if (type != CarType::DECOY) throw std::logic_error("crash: not decoy");
        return Car(pos, dir, num, CarType::CRASHED);
    }
    // returns index of car it crashes with or -1
    int same_tile_crash(const std::vector<Car>& others) const {
        for (int i=0;i<(int)others.size();++i)
            if (pos_ahead.y==others[i].pos.y && pos_ahead.x==others[i].pos.x) return i;
        return -1;
    }
    bool head_on_crash(const std::vector<Car>& others) const {
        Dir rev = reverse_dir(dir);
        for (auto &c: others)
            if (pos_ahead.y==c.pos.y && pos_ahead.x==c.pos.x && rev==c.dir) return true;
        return false;
    }
    Mod get_station() const {
        if (type==CarType::NORMAL) return Mod::STATION;
        if (type==CarType::NUMERAL) return Mod::POST_OFFICE;
        throw std::logic_error("get_station: not normal/numeral");
    }
    bool on_correct_station(Mod m, int mod_num) const {
        return mod_num==num && m==get_station();
    }
    int car_index(int num_cars, int num_decoys) const {
        if (type==CarType::NORMAL) return num;
        if (type==CarType::DECOY) return num + num_cars;
        if (type==CarType::NUMERAL) return num + num_cars + num_decoys;
        throw std::logic_error("car_index invalid");
    }
};

// ---------------------------------------------------------------------------
// Global lookup tables (directions, semaphore_pass, generable maps)
// Initialized once via init_tables().
// ---------------------------------------------------------------------------
extern Dir direction_table[38][4]; // [track][dirIdx] -> Dir  (dirIdx = 0..3 for LEFT/RIGHT/DOWN/UP, plus CRASH/UNKNOWN)
extern std::vector<Dir> semaphore_pass_table[38];
void init_tables();

// Utility
template<typename T>
std::vector<std::vector<T>> make_grid(int H, int W, T fill);

} // namespace railbound
