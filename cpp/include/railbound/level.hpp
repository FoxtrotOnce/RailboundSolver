#pragma once

#include "railbound/types.hpp"
#include <third_party/nlohmann/json.hpp>
#include <vector>
#include <string>
#include <map>

namespace railbound {

struct Level {
    std::string name;
    std::vector<std::vector<Track>> board;
    std::vector<std::vector<Mod>> mods;
    std::vector<std::vector<int>> mod_nums;
    std::vector<Car> cars;
    int max_tracks{0};
    int max_semaphores{0};

    int height() const noexcept {
        return static_cast<int>(board.size());
    }
    int width() const noexcept {
        return board.empty() ? 0 : static_cast<int>(board[0].size());
    }

    static Level from_json(const std::string& name, const nlohmann::json& j);
    nlohmann::json to_json() const;
};

std::map<std::string, Level> load_levels_from_file(const std::string& filepath);
Level load_single_level(const std::string& filepath, const std::string& level_name);

void print_board_values(const std::vector<std::vector<Track>>& board);
void print_mod_values(const std::vector<std::vector<Mod>>& mods);

} // namespace railbound
