#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <array>
#include <optional>
#include <stdexcept>
#include <functional>

namespace railbound {

struct Pos {
    int y{0};
    int x{0};

    constexpr bool operator==(const Pos& other) const noexcept {
        return y == other.y && x == other.x;
    }
    constexpr bool operator!=(const Pos& other) const noexcept {
        return !(*this == other);
    }
    constexpr bool operator<(const Pos& other) const noexcept {
        if (y != other.y) return y < other.y;
        return x < other.x;
    }
    constexpr Pos operator+(const Pos& other) const noexcept {
        return {y + other.y, x + other.x};
    }
    constexpr Pos operator-(const Pos& other) const noexcept {
        return {y - other.y, x - other.x};
    }
};

enum class Direction : int8_t {
    CRASH = -2,
    UNKNOWN = -1,
    LEFT = 0,
    RIGHT = 1,
    DOWN = 2,
    UP = 3
};

inline constexpr Pos direction_to_vector(Direction dir) {
    switch (dir) {
        case Direction::LEFT:  return {0, -1};
        case Direction::RIGHT: return {0, 1};
        case Direction::DOWN:  return {1, 0};
        case Direction::UP:    return {-1, 0};
        default: throw std::invalid_argument("Direction does not map to a vector");
    }
}

inline constexpr Direction direction_from_vector(Pos vec) {
    if (vec.y == 0 && vec.x == -1) return Direction::LEFT;
    if (vec.y == 0 && vec.x == 1)  return Direction::RIGHT;
    if (vec.y == 1 && vec.x == 0)  return Direction::DOWN;
    if (vec.y == -1 && vec.x == 0) return Direction::UP;
    throw std::invalid_argument("Vector does not map to a direction");
}

inline constexpr Direction direction_reverse(Direction dir) {
    switch (dir) {
        case Direction::LEFT:  return Direction::RIGHT;
        case Direction::RIGHT: return Direction::LEFT;
        case Direction::DOWN:  return Direction::UP;
        case Direction::UP:    return Direction::DOWN;
        default: throw std::invalid_argument("Direction cannot be reversed");
    }
}

inline constexpr Pos direction_add_vector(Direction dir, Pos p) {
    Pos d = direction_to_vector(dir);
    return {p.y + d.y, p.x + d.x};
}

inline Direction direction_from_string(const std::string& str) {
    if (str == "LEFT") return Direction::LEFT;
    if (str == "RIGHT") return Direction::RIGHT;
    if (str == "DOWN") return Direction::DOWN;
    if (str == "UP") return Direction::UP;
    if (str == "CRASH") return Direction::CRASH;
    if (str == "UNKNOWN") return Direction::UNKNOWN;
    throw std::invalid_argument("Unknown direction string: " + str);
}

inline std::string direction_to_string(Direction dir) {
    switch (dir) {
        case Direction::LEFT: return "LEFT";
        case Direction::RIGHT: return "RIGHT";
        case Direction::DOWN: return "DOWN";
        case Direction::UP: return "UP";
        case Direction::CRASH: return "CRASH";
        case Direction::UNKNOWN: return "UNKNOWN";
    }
    return "UNKNOWN";
}

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
    COUNT = 38
};

inline constexpr bool track_is_empty(Track t) noexcept {
    return t == Track::EMPTY;
}

inline constexpr bool track_is_straight(Track t) noexcept {
    return t == Track::HORIZONTAL_TRACK || t == Track::VERTICAL_TRACK;
}

inline constexpr bool track_is_car_ending(Track t) noexcept {
    return t == Track::CAR_ENDING_TRACK_LEFT ||
           t == Track::CAR_ENDING_TRACK_RIGHT ||
           t == Track::CAR_ENDING_TRACK_DOWN ||
           t == Track::CAR_ENDING_TRACK_UP;
}

inline constexpr bool track_is_turn(Track t) noexcept {
    return t == Track::BOTTOM_RIGHT_TURN ||
           t == Track::BOTTOM_LEFT_TURN ||
           t == Track::TOP_RIGHT_TURN ||
           t == Track::TOP_LEFT_TURN;
}

inline constexpr bool track_is_3way(Track t) noexcept {
    return static_cast<uint8_t>(t) >= 9 && static_cast<uint8_t>(t) <= 16;
}

inline constexpr bool track_is_tunnel(Track t) noexcept {
    return static_cast<uint8_t>(t) >= 17 && static_cast<uint8_t>(t) <= 20;
}

inline constexpr Track track_swap(Track t) {
    switch (t) {
        case Track::BOTTOM_RIGHT_LEFT_3WAY: return Track::BOTTOM_LEFT_RIGHT_3WAY;
        case Track::BOTTOM_RIGHT_TOP_3WAY:  return Track::TOP_RIGHT_BOTTOM_3WAY;
        case Track::BOTTOM_LEFT_RIGHT_3WAY: return Track::BOTTOM_RIGHT_LEFT_3WAY;
        case Track::BOTTOM_LEFT_TOP_3WAY:   return Track::TOP_LEFT_BOTTOM_3WAY;
        case Track::TOP_RIGHT_LEFT_3WAY:    return Track::TOP_LEFT_RIGHT_3WAY;
        case Track::TOP_RIGHT_BOTTOM_3WAY:  return Track::BOTTOM_RIGHT_TOP_3WAY;
        case Track::TOP_LEFT_RIGHT_3WAY:    return Track::TOP_RIGHT_LEFT_3WAY;
        case Track::TOP_LEFT_BOTTOM_3WAY:   return Track::BOTTOM_LEFT_TOP_3WAY;
        default: throw std::invalid_argument("Track cannot be swapped");
    }
}

inline constexpr bool track_is_ncar_ending(Track t) noexcept {
    return t == Track::NCAR_ENDING_TRACK_LEFT ||
           t == Track::NCAR_ENDING_TRACK_RIGHT ||
           t == Track::NCAR_ENDING_TRACK_DOWN ||
           t == Track::NCAR_ENDING_TRACK_UP;
}

inline constexpr bool track_is_station(Track t) noexcept {
    return static_cast<uint8_t>(t) >= 34 && static_cast<uint8_t>(t) <= 37;
}

inline constexpr bool track_is_placeholder_semaphore(Track t) noexcept {
    return static_cast<uint8_t>(t) >= 23 && static_cast<uint8_t>(t) <= 28;
}

inline constexpr Track track_add_placeholder_semaphore(Track t) {
    switch (t) {
        case Track::HORIZONTAL_TRACK:   return Track::SEM_HORIZONTAL_TRACK;
        case Track::VERTICAL_TRACK:     return Track::SEM_VERTICAL_TRACK;
        case Track::BOTTOM_RIGHT_TURN:  return Track::SEM_BOTTOM_RIGHT_TURN;
        case Track::BOTTOM_LEFT_TURN:   return Track::SEM_BOTTOM_LEFT_TURN;
        case Track::TOP_RIGHT_TURN:     return Track::SEM_TOP_RIGHT_TURN;
        case Track::TOP_LEFT_TURN:      return Track::SEM_TOP_LEFT_TURN;
        default: throw std::invalid_argument("Track cannot add placeholder semaphore");
    }
}

inline constexpr Track track_remove_placeholder_semaphore(Track t) {
    switch (t) {
        case Track::SEM_HORIZONTAL_TRACK:  return Track::HORIZONTAL_TRACK;
        case Track::SEM_VERTICAL_TRACK:    return Track::VERTICAL_TRACK;
        case Track::SEM_BOTTOM_RIGHT_TURN: return Track::BOTTOM_RIGHT_TURN;
        case Track::SEM_BOTTOM_LEFT_TURN:  return Track::BOTTOM_LEFT_TURN;
        case Track::SEM_TOP_RIGHT_TURN:    return Track::TOP_RIGHT_TURN;
        case Track::SEM_TOP_LEFT_TURN:     return Track::TOP_LEFT_TURN;
        default: throw std::invalid_argument("Track is not a placeholder semaphore");
    }
}

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
    COUNT = 12
};

inline constexpr bool mod_is_gate_or_sem(Mod m) noexcept {
    return m == Mod::CLOSED_GATE || m == Mod::SEMAPHORE;
}

inline constexpr bool mod_is_station(Mod m) noexcept {
    return m == Mod::STATION || m == Mod::POST_OFFICE;
}

enum class CarType : uint8_t {
    CRASHED = 0,
    NORMAL = 1,
    DECOY = 2,
    NUMERAL = 3
};

inline CarType car_type_from_string(const std::string& str) {
    if (str == "CRASHED") return CarType::CRASHED;
    if (str == "NORMAL") return CarType::NORMAL;
    if (str == "DECOY") return CarType::DECOY;
    if (str == "NUMERAL") return CarType::NUMERAL;
    throw std::invalid_argument("Unknown car type: " + str);
}

inline std::string car_type_to_string(CarType type) {
    switch (type) {
        case CarType::CRASHED: return "CRASHED";
        case CarType::NORMAL: return "NORMAL";
        case CarType::DECOY: return "DECOY";
        case CarType::NUMERAL: return "NUMERAL";
    }
    return "UNKNOWN";
}

// Direction redirect map for (Track, Direction)
Direction get_track_direction(Track track, Direction dir) noexcept;

// Semaphore pass directions
std::pair<Direction, Direction> get_semaphore_pass(Track track);

// Tunnel exit velocity direction
Direction get_tunnel_exit_velo(Track track);

// Generable tracks and 3ways
const std::vector<Track>& get_generable_tracks(Direction dir);
const std::vector<Track>& get_generable_3ways(Direction dir, Track track);

struct Car {
    Pos pos;
    Direction direction;
    int num;
    CarType type;
    Pos pos_ahead;

    Car() : pos{0, 0}, direction(Direction::RIGHT), num(0), type(CarType::NORMAL), pos_ahead{0, 1} {}

    Car(Pos p, Direction dir, int n, CarType t)
        : pos(p), direction(dir), num(n), type(t) {
        if (static_cast<int8_t>(dir) >= 0) {
            pos_ahead = direction_add_vector(dir, pos);
        } else {
            pos_ahead = pos;
        }
    }

    const std::vector<Track>& generable_tracks() const {
        if (direction == Direction::CRASH || direction == Direction::UNKNOWN) {
            throw std::invalid_argument("The direction must be cardinal for generable_tracks.");
        }
        return get_generable_tracks(direction);
    }

    const std::vector<Track>& generable_3ways(Track track) const {
        if (direction == Direction::CRASH || direction == Direction::UNKNOWN) {
            throw std::invalid_argument("The direction must be cardinal for generable_3ways.");
        }
        return get_generable_3ways(direction, track);
    }

    bool border_crash(int rows, int cols) const noexcept {
        return !(0 <= pos_ahead.y && pos_ahead.y < rows && 0 <= pos_ahead.x && pos_ahead.x < cols);
    }

    Car crash() const {
        if (type != CarType::DECOY) {
            throw std::invalid_argument("The crashed car is not a decoy.");
        }
        return Car(pos, direction, num, CarType::CRASHED);
    }

    bool same_tile_crashes(const std::vector<Car>& other_cars) const noexcept {
        for (const auto& other : other_cars) {
            if (pos_ahead == other.pos) {
                return true;
            }
        }
        return false;
    }

    bool head_on_crashes(const std::vector<Car>& other_cars) const noexcept {
        if (static_cast<int8_t>(direction) < 0) return false;
        Direction rev = direction_reverse(direction);
        for (const auto& other : other_cars) {
            if (pos_ahead == other.pos && rev == other.direction) {
                return true;
            }
        }
        return false;
    }

    Mod get_station() const {
        if (type == CarType::NORMAL) return Mod::STATION;
        if (type == CarType::NUMERAL) return Mod::POST_OFFICE;
        throw std::invalid_argument("Car must be NORMAL or NUMERAL to get station.");
    }

    bool on_correct_station(Mod mod, int mod_num) const {
        return mod_num == num && mod == get_station();
    }

    size_t car_index(size_t normal_count, size_t decoy_count) const {
        if (type == CarType::NORMAL) return static_cast<size_t>(num);
        if (type == CarType::DECOY) return static_cast<size_t>(num) + normal_count;
        if (type == CarType::NUMERAL) return static_cast<size_t>(num) + normal_count + decoy_count;
        throw std::invalid_argument("Invalid car type for car_index");
    }
};

} // namespace railbound

namespace std {
template <>
struct hash<railbound::Pos> {
    size_t operator()(const railbound::Pos& p) const noexcept {
        return (static_cast<size_t>(p.y) << 16) ^ static_cast<size_t>(p.x);
    }
};
}
