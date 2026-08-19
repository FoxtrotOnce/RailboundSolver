#include "../include/types.h"
#include <array>

namespace railbound {

Dir direction_table[38][4];
std::vector<Dir> semaphore_pass_table[38];

static int dir_to_idx(Dir d) {
    switch(d){ case Dir::LEFT: return 0; case Dir::RIGHT: return 1; case Dir::DOWN: return 2; case Dir::UP: return 3; default: return -1; }
}
static Dir idx_to_dir(int i){
    switch(i){ case 0: return Dir::LEFT; case 1: return Dir::RIGHT; case 2: return Dir::DOWN; case 3: return Dir::UP; default: return Dir::CRASH; }
}

void init_tables() {
    // Fill direction_table with defaults = CRASH then override per track.
    for (int t=0; t<38; ++t) for(int d=0; d<4; ++d) direction_table[t][d]=Dir::CRASH;

    auto set = [](Track tr, Dir from, Dir to){
        direction_table[(int)tr][dir_to_idx(from)] = to;
    };
    // EMPTY already all CRASH

    // HORIZONTAL
    set(Track::HORIZONTAL_TRACK, Dir::LEFT, Dir::LEFT);
    set(Track::HORIZONTAL_TRACK, Dir::RIGHT, Dir::RIGHT);
    // VERTICAL
    set(Track::VERTICAL_TRACK, Dir::DOWN, Dir::DOWN);
    set(Track::VERTICAL_TRACK, Dir::UP, Dir::UP);
    // Turns
    set(Track::BOTTOM_RIGHT_TURN, Dir::LEFT, Dir::DOWN);
    set(Track::BOTTOM_RIGHT_TURN, Dir::UP, Dir::RIGHT);
    set(Track::BOTTOM_LEFT_TURN, Dir::RIGHT, Dir::DOWN);
    set(Track::BOTTOM_LEFT_TURN, Dir::UP, Dir::LEFT);
    set(Track::TOP_RIGHT_TURN, Dir::LEFT, Dir::UP);
    set(Track::TOP_RIGHT_TURN, Dir::DOWN, Dir::RIGHT);
    set(Track::TOP_LEFT_TURN, Dir::RIGHT, Dir::UP);
    set(Track::TOP_LEFT_TURN, Dir::DOWN, Dir::LEFT);
    // 3-ways
    set(Track::BOTTOM_RIGHT_LEFT_3WAY, Dir::LEFT, Dir::DOWN);
    set(Track::BOTTOM_RIGHT_LEFT_3WAY, Dir::RIGHT, Dir::RIGHT);
    set(Track::BOTTOM_RIGHT_LEFT_3WAY, Dir::UP, Dir::RIGHT);

    set(Track::BOTTOM_RIGHT_TOP_3WAY, Dir::LEFT, Dir::DOWN);
    set(Track::BOTTOM_RIGHT_TOP_3WAY, Dir::DOWN, Dir::DOWN);
    set(Track::BOTTOM_RIGHT_TOP_3WAY, Dir::UP, Dir::RIGHT);

    set(Track::BOTTOM_LEFT_RIGHT_3WAY, Dir::LEFT, Dir::LEFT);
    set(Track::BOTTOM_LEFT_RIGHT_3WAY, Dir::RIGHT, Dir::DOWN);
    set(Track::BOTTOM_LEFT_RIGHT_3WAY, Dir::UP, Dir::LEFT);

    set(Track::BOTTOM_LEFT_TOP_3WAY, Dir::RIGHT, Dir::DOWN);
    set(Track::BOTTOM_LEFT_TOP_3WAY, Dir::DOWN, Dir::DOWN);
    set(Track::BOTTOM_LEFT_TOP_3WAY, Dir::UP, Dir::LEFT);

    set(Track::TOP_RIGHT_LEFT_3WAY, Dir::LEFT, Dir::UP);
    set(Track::TOP_RIGHT_LEFT_3WAY, Dir::RIGHT, Dir::RIGHT);
    set(Track::TOP_RIGHT_LEFT_3WAY, Dir::DOWN, Dir::RIGHT);

    set(Track::TOP_RIGHT_BOTTOM_3WAY, Dir::LEFT, Dir::UP);
    set(Track::TOP_RIGHT_BOTTOM_3WAY, Dir::DOWN, Dir::RIGHT);
    set(Track::TOP_RIGHT_BOTTOM_3WAY, Dir::UP, Dir::UP);

    set(Track::TOP_LEFT_RIGHT_3WAY, Dir::LEFT, Dir::LEFT);
    set(Track::TOP_LEFT_RIGHT_3WAY, Dir::RIGHT, Dir::UP);
    set(Track::TOP_LEFT_RIGHT_3WAY, Dir::DOWN, Dir::LEFT);

    set(Track::TOP_LEFT_BOTTOM_3WAY, Dir::RIGHT, Dir::UP);
    set(Track::TOP_LEFT_BOTTOM_3WAY, Dir::DOWN, Dir::LEFT);
    set(Track::TOP_LEFT_BOTTOM_3WAY, Dir::UP, Dir::UP);

    // Tunnels: UNKNOWN means can go through? In TS it's UNKNOWN – we keep mapping
    set(Track::LEFT_FACING_TUNNEL,  Dir::RIGHT, Dir::UNKNOWN);
    set(Track::RIGHT_FACING_TUNNEL, Dir::LEFT, Dir::UNKNOWN);
    set(Track::DOWN_FACING_TUNNEL,  Dir::UP, Dir::UNKNOWN);
    set(Track::UP_FACING_TUNNEL,    Dir::DOWN, Dir::UNKNOWN);
    // Endings
    set(Track::CAR_ENDING_TRACK_RIGHT, Dir::RIGHT, Dir::UNKNOWN);
    set(Track::CAR_ENDING_TRACK_LEFT,  Dir::LEFT, Dir::UNKNOWN);
    set(Track::CAR_ENDING_TRACK_DOWN,  Dir::DOWN, Dir::UNKNOWN);
    set(Track::CAR_ENDING_TRACK_UP,    Dir::UP, Dir::UNKNOWN);
    set(Track::NCAR_ENDING_TRACK_RIGHT,Dir::RIGHT, Dir::UNKNOWN);
    set(Track::NCAR_ENDING_TRACK_LEFT, Dir::LEFT, Dir::UNKNOWN);
    set(Track::NCAR_ENDING_TRACK_DOWN, Dir::DOWN, Dir::UNKNOWN);
    set(Track::NCAR_ENDING_TRACK_UP,   Dir::UP, Dir::UNKNOWN);
    // ROADBLOCK/STATION remain CRASH

    // semaphore_pass_table
    for(int i=0;i<38;++i) semaphore_pass_table[i].clear();
    semaphore_pass_table[(int)Track::HORIZONTAL_TRACK] = {Dir::LEFT, Dir::RIGHT};
    semaphore_pass_table[(int)Track::VERTICAL_TRACK]   = {Dir::DOWN, Dir::UP};
    semaphore_pass_table[(int)Track::BOTTOM_RIGHT_TURN] = {Dir::DOWN, Dir::RIGHT};
    semaphore_pass_table[(int)Track::BOTTOM_LEFT_TURN]  = {Dir::DOWN, Dir::LEFT};
    semaphore_pass_table[(int)Track::TOP_RIGHT_TURN]    = {Dir::UP, Dir::RIGHT};
    semaphore_pass_table[(int)Track::TOP_LEFT_TURN]     = {Dir::UP, Dir::LEFT};
}

// Helpers to get Dir from table quickly
inline Dir get_redirect(Track t, Dir d){
    int idx = -1;
    switch(d){ case Dir::LEFT: idx=0; break; case Dir::RIGHT: idx=1; break; case Dir::DOWN: idx=2; break; case Dir::UP: idx=3; break; default: return Dir::CRASH; }
    return direction_table[(int)t][idx];
}

// Car helpers
std::vector<Track> Car::generable_tracks() const {
    switch(dir){
        case Dir::LEFT:  return {Track::HORIZONTAL_TRACK, Track::BOTTOM_RIGHT_TURN, Track::TOP_RIGHT_TURN};
        case Dir::RIGHT: return {Track::HORIZONTAL_TRACK, Track::BOTTOM_LEFT_TURN,  Track::TOP_LEFT_TURN};
        case Dir::DOWN:  return {Track::VERTICAL_TRACK,   Track::TOP_RIGHT_TURN,    Track::TOP_LEFT_TURN};
        case Dir::UP:    return {Track::VERTICAL_TRACK,   Track::BOTTOM_RIGHT_TURN, Track::BOTTOM_LEFT_TURN};
        default: throw std::logic_error("generable_tracks: bad dir");
    }
}

std::vector<Track> Car::generable_3ways(Track cur) const {
    switch(dir){
        case Dir::LEFT:
            if(cur==Track::HORIZONTAL_TRACK) return {Track::BOTTOM_RIGHT_LEFT_3WAY, Track::TOP_RIGHT_LEFT_3WAY};
            if(cur==Track::VERTICAL_TRACK)   return {Track::BOTTOM_RIGHT_TOP_3WAY,  Track::TOP_RIGHT_BOTTOM_3WAY};
            if(cur==Track::BOTTOM_LEFT_TURN) return {Track::BOTTOM_LEFT_RIGHT_3WAY};
            if(cur==Track::TOP_LEFT_TURN)    return {Track::TOP_LEFT_RIGHT_3WAY};
            break;
        case Dir::RIGHT:
            if(cur==Track::HORIZONTAL_TRACK) return {Track::BOTTOM_LEFT_RIGHT_3WAY, Track::TOP_LEFT_RIGHT_3WAY};
            if(cur==Track::VERTICAL_TRACK)   return {Track::BOTTOM_LEFT_TOP_3WAY,   Track::TOP_LEFT_BOTTOM_3WAY};
            if(cur==Track::BOTTOM_RIGHT_TURN) return {Track::BOTTOM_RIGHT_LEFT_3WAY};
            if(cur==Track::TOP_RIGHT_TURN)    return {Track::TOP_RIGHT_LEFT_3WAY};
            break;
        case Dir::DOWN:
            if(cur==Track::HORIZONTAL_TRACK) return {Track::TOP_RIGHT_LEFT_3WAY, Track::TOP_LEFT_RIGHT_3WAY};
            if(cur==Track::VERTICAL_TRACK)   return {Track::TOP_RIGHT_BOTTOM_3WAY, Track::TOP_LEFT_BOTTOM_3WAY};
            if(cur==Track::BOTTOM_RIGHT_TURN) return {Track::BOTTOM_RIGHT_TOP_3WAY};
            if(cur==Track::BOTTOM_LEFT_TURN)  return {Track::BOTTOM_LEFT_TOP_3WAY};
            break;
        case Dir::UP:
            if(cur==Track::HORIZONTAL_TRACK) return {Track::BOTTOM_RIGHT_LEFT_3WAY, Track::BOTTOM_LEFT_RIGHT_3WAY};
            if(cur==Track::VERTICAL_TRACK)   return {Track::BOTTOM_RIGHT_TOP_3WAY,  Track::BOTTOM_LEFT_TOP_3WAY};
            if(cur==Track::TOP_RIGHT_TURN)    return {Track::TOP_RIGHT_BOTTOM_3WAY};
            if(cur==Track::TOP_LEFT_TURN)     return {Track::TOP_LEFT_BOTTOM_3WAY};
            break;
        default: throw std::logic_error("generable_3ways: bad dir");
    }
    return {};
}

template<typename T>
std::vector<std::vector<T>> make_grid(int H, int W, T fill){
    return std::vector<std::vector<T>>(H, std::vector<T>(W, fill));
}
// explicit instantiations
template std::vector<std::vector<int>> make_grid<int>(int,int,int);
template std::vector<std::vector<Track>> make_grid<Track>(int,int,Track);
template std::vector<std::vector<Mod>> make_grid<Mod>(int,int,Mod);

} // namespace railbound
