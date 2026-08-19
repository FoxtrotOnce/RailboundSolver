#include "railbound/types.hpp"
#include <map>

namespace railbound {

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
