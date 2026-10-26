#include "railbound/types.hpp"
#include "railbound/level.hpp"
#include "railbound/solver.hpp"
#include <iostream>
#include <cassert>
#include <filesystem>

namespace fs = std::filesystem;

void test_directions() {
    using namespace railbound;
    assert(direction_to_vector(Direction::LEFT) == Pos(0, -1));
    assert(direction_to_vector(Direction::RIGHT) == Pos(0, 1));
    assert(direction_to_vector(Direction::DOWN) == Pos(1, 0));
    assert(direction_to_vector(Direction::UP) == Pos(-1, 0));

    assert(direction_reverse(Direction::LEFT) == Direction::RIGHT);
    assert(direction_reverse(Direction::RIGHT) == Direction::LEFT);
    assert(direction_reverse(Direction::DOWN) == Direction::UP);
    assert(direction_reverse(Direction::UP) == Direction::DOWN);

    std::cout << "[PASS] test_directions\n";
}

void test_track_properties() {
    using namespace railbound;
    assert(track_is_empty(Track::EMPTY));
    assert(!track_is_empty(Track::HORIZONTAL_TRACK));

    assert(track_is_straight(Track::HORIZONTAL_TRACK));
    assert(track_is_straight(Track::VERTICAL_TRACK));
    assert(!track_is_straight(Track::BOTTOM_RIGHT_TURN));

    assert(track_is_turn(Track::BOTTOM_RIGHT_TURN));
    assert(track_is_turn(Track::BOTTOM_LEFT_TURN));
    assert(track_is_turn(Track::TOP_RIGHT_TURN));
    assert(track_is_turn(Track::TOP_LEFT_TURN));
    assert(!track_is_turn(Track::HORIZONTAL_TRACK));

    assert(track_is_3way(Track::BOTTOM_RIGHT_LEFT_3WAY));
    assert(track_is_3way(Track::TOP_LEFT_BOTTOM_3WAY));
    assert(!track_is_3way(Track::BOTTOM_RIGHT_TURN));

    assert(track_is_car_ending(Track::CAR_ENDING_TRACK_RIGHT));
    assert(track_is_car_ending(Track::CAR_ENDING_TRACK_LEFT));
    assert(track_is_car_ending(Track::CAR_ENDING_TRACK_DOWN));
    assert(track_is_car_ending(Track::CAR_ENDING_TRACK_UP));

    assert(track_is_ncar_ending(Track::NCAR_ENDING_TRACK_RIGHT));
    assert(track_is_ncar_ending(Track::NCAR_ENDING_TRACK_LEFT));

    assert(track_is_placeholder_semaphore(Track::SEM_HORIZONTAL_TRACK));
    assert(track_add_placeholder_semaphore(Track::HORIZONTAL_TRACK) == Track::SEM_HORIZONTAL_TRACK);
    assert(track_remove_placeholder_semaphore(Track::SEM_HORIZONTAL_TRACK) == Track::HORIZONTAL_TRACK);

    std::cout << "[PASS] test_track_properties\n";
}

void test_track_directions() {
    using namespace railbound;
    assert(get_track_direction(Track::HORIZONTAL_TRACK, Direction::RIGHT) == Direction::RIGHT);
    assert(get_track_direction(Track::HORIZONTAL_TRACK, Direction::LEFT) == Direction::LEFT);
    assert(get_track_direction(Track::HORIZONTAL_TRACK, Direction::DOWN) == Direction::CRASH);
    assert(get_track_direction(Track::HORIZONTAL_TRACK, Direction::UP) == Direction::CRASH);

    assert(get_track_direction(Track::BOTTOM_RIGHT_TURN, Direction::LEFT) == Direction::DOWN);
    assert(get_track_direction(Track::BOTTOM_RIGHT_TURN, Direction::UP) == Direction::RIGHT);

    assert(get_track_direction(Track::BOTTOM_LEFT_TURN, Direction::RIGHT) == Direction::DOWN);
    assert(get_track_direction(Track::BOTTOM_LEFT_TURN, Direction::UP) == Direction::LEFT);

    std::cout << "[PASS] test_track_directions\n";
}

void test_solve_levels() {
    using namespace railbound;

    std::string levels_file = "levels.json";
    if (!fs::exists(levels_file) && fs::exists("../levels.json")) {
        levels_file = "../levels.json";
    }
    if (!fs::exists(levels_file) && fs::exists("../../levels.json")) {
        levels_file = "../../levels.json";
    }

    if (!fs::exists(levels_file)) {
        std::cerr << "Warning: levels.json not found, skipping level solve tests\n";
        return;
    }

    std::vector<std::string> fast_levels = {
        "1-1", "1-2", "1-3", "1-4", "1-5", "1-15A", "2-1", "2-2", "12-7A"
    };

    SolverOptions options;
    options.timeout_seconds = 2.0;

    for (const auto& lvl_name : fast_levels) {
        Level lvl = load_single_level(levels_file, lvl_name);
        SolveResult res = solve_level(lvl, options);
        assert(res.solved);
        std::cout << "[PASS] Solved level " << lvl_name
                  << " in " << res.time_elapsed_seconds << "s ("
                  << res.iterations << " iterations)\n";
    }
}

int main() {
    std::cout << "Running Railbound Solver C++ Tests...\n";
    test_directions();
    test_track_properties();
    test_track_directions();
    test_solve_levels();
    std::cout << "\nAll tests passed successfully!\n";
    return 0;
}
