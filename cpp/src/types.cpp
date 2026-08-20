#include "railbound/types.hpp"

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


} // namespace railbound
