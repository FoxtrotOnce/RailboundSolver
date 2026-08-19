#include "railbound/types.hpp"
#include <map>

namespace railbound {

static constexpr Direction DIR_CRASH = Direction::CRASH;
static constexpr Direction DIR_UNKNOWN = Direction::UNKNOWN;
static constexpr Direction DIR_LEFT = Direction::LEFT;
static constexpr Direction DIR_RIGHT = Direction::RIGHT;
static constexpr Direction DIR_DOWN = Direction::DOWN;
static constexpr Direction DIR_UP = Direction::UP;

// Lookup table: [track][direction_index] where direction_index: LEFT=0, RIGHT=1, DOWN=2, UP=3
static const Direction TRACK_DIRECTIONS[static_cast<size_t>(Track::COUNT)][4] = {
    // 0: EMPTY
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 1: HORIZONTAL_TRACK
    {DIR_LEFT, DIR_RIGHT, DIR_CRASH, DIR_CRASH},
    // 2: VERTICAL_TRACK
    {DIR_CRASH, DIR_CRASH, DIR_DOWN, DIR_UP},
    // 3: CAR_ENDING_TRACK_RIGHT
    {DIR_CRASH, DIR_UNKNOWN, DIR_CRASH, DIR_CRASH},
    // 4: ROADBLOCK
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 5: BOTTOM_RIGHT_TURN
    {DIR_DOWN, DIR_CRASH, DIR_CRASH, DIR_RIGHT},
    // 6: BOTTOM_LEFT_TURN
    {DIR_CRASH, DIR_DOWN, DIR_CRASH, DIR_LEFT},
    // 7: TOP_RIGHT_TURN
    {DIR_UP, DIR_CRASH, DIR_RIGHT, DIR_CRASH},
    // 8: TOP_LEFT_TURN
    {DIR_CRASH, DIR_UP, DIR_LEFT, DIR_CRASH},
    // 9: BOTTOM_RIGHT_LEFT_3WAY
    {DIR_DOWN, DIR_RIGHT, DIR_CRASH, DIR_RIGHT},
    // 10: BOTTOM_RIGHT_TOP_3WAY
    {DIR_DOWN, DIR_CRASH, DIR_DOWN, DIR_RIGHT},
    // 11: BOTTOM_LEFT_RIGHT_3WAY
    {DIR_LEFT, DIR_DOWN, DIR_CRASH, DIR_LEFT},
    // 12: BOTTOM_LEFT_TOP_3WAY
    {DIR_CRASH, DIR_DOWN, DIR_DOWN, DIR_LEFT},
    // 13: TOP_RIGHT_LEFT_3WAY
    {DIR_UP, DIR_RIGHT, DIR_RIGHT, DIR_CRASH},
    // 14: TOP_RIGHT_BOTTOM_3WAY
    {DIR_UP, DIR_CRASH, DIR_RIGHT, DIR_UP},
    // 15: TOP_LEFT_RIGHT_3WAY
    {DIR_LEFT, DIR_UP, DIR_LEFT, DIR_CRASH},
    // 16: TOP_LEFT_BOTTOM_3WAY
    {DIR_CRASH, DIR_UP, DIR_LEFT, DIR_UP},
    // 17: LEFT_FACING_TUNNEL
    {DIR_CRASH, DIR_UNKNOWN, DIR_CRASH, DIR_CRASH},
    // 18: RIGHT_FACING_TUNNEL
    {DIR_UNKNOWN, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 19: DOWN_FACING_TUNNEL
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_UNKNOWN},
    // 20: UP_FACING_TUNNEL
    {DIR_CRASH, DIR_CRASH, DIR_UNKNOWN, DIR_CRASH},
    // 21: NCAR_ENDING_TRACK_RIGHT
    {DIR_CRASH, DIR_UNKNOWN, DIR_CRASH, DIR_CRASH},
    // 22: NCAR_ENDING_TRACK_LEFT
    {DIR_UNKNOWN, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 23..28: SEM placeholder tracks (all CRASH if accessed)
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 29: CAR_ENDING_TRACK_LEFT
    {DIR_UNKNOWN, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 30: CAR_ENDING_TRACK_DOWN
    {DIR_CRASH, DIR_CRASH, DIR_UNKNOWN, DIR_CRASH},
    // 31: CAR_ENDING_TRACK_UP
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_UNKNOWN},
    // 32: NCAR_ENDING_TRACK_DOWN
    {DIR_CRASH, DIR_CRASH, DIR_UNKNOWN, DIR_CRASH},
    // 33: NCAR_ENDING_TRACK_UP
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_UNKNOWN},
    // 34: STATION_LEFT
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 35: STATION_RIGHT
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 36: STATION_DOWN
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH},
    // 37: STATION_UP
    {DIR_CRASH, DIR_CRASH, DIR_CRASH, DIR_CRASH}
};

Direction get_track_direction(Track track, Direction dir) noexcept {
    int d = static_cast<int8_t>(dir);
    if (d < 0 || d > 3) return Direction::CRASH;
    size_t t = static_cast<size_t>(track);
    if (t >= static_cast<size_t>(Track::COUNT)) return Direction::CRASH;
    return TRACK_DIRECTIONS[t][d];
}

std::pair<Direction, Direction> get_semaphore_pass(Track track) {
    switch (track) {
        case Track::HORIZONTAL_TRACK:  return {Direction::LEFT, Direction::RIGHT};
        case Track::VERTICAL_TRACK:    return {Direction::DOWN, Direction::UP};
        case Track::BOTTOM_RIGHT_TURN: return {Direction::DOWN, Direction::RIGHT};
        case Track::BOTTOM_LEFT_TURN:  return {Direction::DOWN, Direction::LEFT};
        case Track::TOP_RIGHT_TURN:    return {Direction::UP, Direction::RIGHT};
        case Track::TOP_LEFT_TURN:     return {Direction::UP, Direction::LEFT};
        default: throw std::invalid_argument("Track is not valid for semaphore pass");
    }
}

Direction get_tunnel_exit_velo(Track track) {
    switch (track) {
        case Track::LEFT_FACING_TUNNEL:  return Direction::LEFT;
        case Track::RIGHT_FACING_TUNNEL: return Direction::RIGHT;
        case Track::DOWN_FACING_TUNNEL:  return Direction::DOWN;
        case Track::UP_FACING_TUNNEL:    return Direction::UP;
        default: throw std::invalid_argument("Track is not a tunnel");
    }
}

static const std::vector<Track> GENERABLE_TRACKS_LEFT = {
    Track::HORIZONTAL_TRACK, Track::BOTTOM_RIGHT_TURN, Track::TOP_RIGHT_TURN
};
static const std::vector<Track> GENERABLE_TRACKS_RIGHT = {
    Track::HORIZONTAL_TRACK, Track::BOTTOM_LEFT_TURN, Track::TOP_LEFT_TURN
};
static const std::vector<Track> GENERABLE_TRACKS_DOWN = {
    Track::VERTICAL_TRACK, Track::TOP_RIGHT_TURN, Track::TOP_LEFT_TURN
};
static const std::vector<Track> GENERABLE_TRACKS_UP = {
    Track::VERTICAL_TRACK, Track::BOTTOM_RIGHT_TURN, Track::BOTTOM_LEFT_TURN
};
static const std::vector<Track> EMPTY_TRACK_VEC = {};

const std::vector<Track>& get_generable_tracks(Direction dir) {
    switch (dir) {
        case Direction::LEFT:  return GENERABLE_TRACKS_LEFT;
        case Direction::RIGHT: return GENERABLE_TRACKS_RIGHT;
        case Direction::DOWN:  return GENERABLE_TRACKS_DOWN;
        case Direction::UP:    return GENERABLE_TRACKS_UP;
        default: return EMPTY_TRACK_VEC;
    }
}

// 3ways vectors
static const std::vector<Track> G3_L_HORIZ = {Track::BOTTOM_RIGHT_LEFT_3WAY, Track::TOP_RIGHT_LEFT_3WAY};
static const std::vector<Track> G3_L_VERT  = {Track::BOTTOM_RIGHT_TOP_3WAY, Track::TOP_RIGHT_BOTTOM_3WAY};
static const std::vector<Track> G3_L_BL    = {Track::BOTTOM_LEFT_RIGHT_3WAY};
static const std::vector<Track> G3_L_TL    = {Track::TOP_LEFT_RIGHT_3WAY};

static const std::vector<Track> G3_R_HORIZ = {Track::BOTTOM_LEFT_RIGHT_3WAY, Track::TOP_LEFT_RIGHT_3WAY};
static const std::vector<Track> G3_R_VERT  = {Track::BOTTOM_LEFT_TOP_3WAY, Track::TOP_LEFT_BOTTOM_3WAY};
static const std::vector<Track> G3_R_BR    = {Track::BOTTOM_RIGHT_LEFT_3WAY};
static const std::vector<Track> G3_R_TR    = {Track::TOP_RIGHT_LEFT_3WAY};

static const std::vector<Track> G3_D_HORIZ = {Track::TOP_RIGHT_LEFT_3WAY, Track::TOP_LEFT_RIGHT_3WAY};
static const std::vector<Track> G3_D_VERT  = {Track::TOP_RIGHT_BOTTOM_3WAY, Track::TOP_LEFT_BOTTOM_3WAY};
static const std::vector<Track> G3_D_BR    = {Track::BOTTOM_RIGHT_TOP_3WAY};
static const std::vector<Track> G3_D_BL    = {Track::BOTTOM_LEFT_TOP_3WAY};

static const std::vector<Track> G3_U_HORIZ = {Track::BOTTOM_RIGHT_LEFT_3WAY, Track::BOTTOM_LEFT_RIGHT_3WAY};
static const std::vector<Track> G3_U_VERT  = {Track::BOTTOM_RIGHT_TOP_3WAY, Track::BOTTOM_LEFT_TOP_3WAY};
static const std::vector<Track> G3_U_TR    = {Track::TOP_RIGHT_BOTTOM_3WAY};
static const std::vector<Track> G3_U_TL    = {Track::TOP_LEFT_BOTTOM_3WAY};

const std::vector<Track>& get_generable_3ways(Direction dir, Track track) {
    switch (dir) {
        case Direction::LEFT:
            switch (track) {
                case Track::HORIZONTAL_TRACK: return G3_L_HORIZ;
                case Track::VERTICAL_TRACK:   return G3_L_VERT;
                case Track::BOTTOM_LEFT_TURN: return G3_L_BL;
                case Track::TOP_LEFT_TURN:    return G3_L_TL;
                default: return EMPTY_TRACK_VEC;
            }
        case Direction::RIGHT:
            switch (track) {
                case Track::HORIZONTAL_TRACK:  return G3_R_HORIZ;
                case Track::VERTICAL_TRACK:    return G3_R_VERT;
                case Track::BOTTOM_RIGHT_TURN: return G3_R_BR;
                case Track::TOP_RIGHT_TURN:    return G3_R_TR;
                default: return EMPTY_TRACK_VEC;
            }
        case Direction::DOWN:
            switch (track) {
                case Track::HORIZONTAL_TRACK:  return G3_D_HORIZ;
                case Track::VERTICAL_TRACK:    return G3_D_VERT;
                case Track::BOTTOM_RIGHT_TURN: return G3_D_BR;
                case Track::BOTTOM_LEFT_TURN:  return G3_D_BL;
                default: return EMPTY_TRACK_VEC;
            }
        case Direction::UP:
            switch (track) {
                case Track::HORIZONTAL_TRACK: return G3_U_HORIZ;
                case Track::VERTICAL_TRACK:   return G3_U_VERT;
                case Track::TOP_RIGHT_TURN:   return G3_U_TR;
                case Track::TOP_LEFT_TURN:    return G3_U_TL;
                default: return EMPTY_TRACK_VEC;
            }
        default:
            return EMPTY_TRACK_VEC;
    }
}

} // namespace railbound
