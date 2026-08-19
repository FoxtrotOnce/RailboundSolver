#include "railbound/level.hpp"
#include <fstream>
#include <iostream>
#include <sstream>

namespace railbound {

Level Level::from_json(const std::string& name, const nlohmann::json& j) {
    Level lvl;
    lvl.name = name;

    if (j.contains("board")) {
        for (const auto& row : j["board"]) {
            std::vector<Track> track_row;
            for (const auto& val : row) {
                track_row.push_back(static_cast<Track>(val.get<uint8_t>()));
            }
            lvl.board.push_back(track_row);
        }
    }

    if (j.contains("mods")) {
        for (const auto& row : j["mods"]) {
            std::vector<Mod> mod_row;
            for (const auto& val : row) {
                mod_row.push_back(static_cast<Mod>(val.get<uint8_t>()));
            }
            lvl.mods.push_back(mod_row);
        }
    }

    if (j.contains("mod_nums")) {
        for (const auto& row : j["mod_nums"]) {
            std::vector<int> num_row;
            for (const auto& val : row) {
                num_row.push_back(val.get<int>());
            }
            lvl.mod_nums.push_back(num_row);
        }
    }

    if (j.contains("cars")) {
        for (const auto& car_json : j["cars"]) {
            Pos pos{car_json["pos"][0].get<int>(), car_json["pos"][1].get<int>()};
            Direction dir = direction_from_string(car_json["direction"].get<std::string>());
            int num = car_json["num"].get<int>();
            CarType type = car_type_from_string(car_json["type"].get<std::string>());
            lvl.cars.emplace_back(pos, dir, num, type);
        }
    }

    if (j.contains("tracks")) {
        lvl.max_tracks = j["tracks"].get<int>();
    } else if (j.contains("max_tracks")) {
        lvl.max_tracks = j["max_tracks"].get<int>();
    }

    if (j.contains("semaphores")) {
        lvl.max_semaphores = j["semaphores"].get<int>();
    } else if (j.contains("max_semaphores")) {
        lvl.max_semaphores = j["max_semaphores"].get<int>();
    }

    return lvl;
}

nlohmann::json Level::to_json() const {
    nlohmann::json j;
    
    nlohmann::json board_json = nlohmann::json::array();
    for (const auto& row : board) {
        nlohmann::json row_json = nlohmann::json::array();
        for (Track t : row) {
            row_json.push_back(static_cast<int>(t));
        }
        board_json.push_back(row_json);
    }
    j["board"] = board_json;

    nlohmann::json mods_json = nlohmann::json::array();
    for (const auto& row : mods) {
        nlohmann::json row_json = nlohmann::json::array();
        for (Mod m : row) {
            row_json.push_back(static_cast<int>(m));
        }
        mods_json.push_back(row_json);
    }
    j["mods"] = mods_json;

    j["mod_nums"] = mod_nums;

    nlohmann::json cars_json = nlohmann::json::array();
    for (const auto& car : cars) {
        nlohmann::json c;
        c["pos"] = {car.pos.y, car.pos.x};
        c["direction"] = direction_to_string(car.direction);
        c["num"] = car.num;
        c["type"] = car_type_to_string(car.type);
        cars_json.push_back(c);
    }
    j["cars"] = cars_json;

    j["tracks"] = max_tracks;
    j["semaphores"] = max_semaphores;

    return j;
}

std::map<std::string, Level> load_levels_from_file(const std::string& filepath) {
    std::ifstream file(filepath);
    if (!file.is_open()) {
        throw std::runtime_error("Failed to open levels file: " + filepath);
    }
    nlohmann::json j;
    file >> j;

    std::map<std::string, Level> levels;
    for (auto it = j.begin(); it != j.end(); ++it) {
        levels[it.key()] = Level::from_json(it.key(), it.value());
    }
    return levels;
}

Level load_single_level(const std::string& filepath, const std::string& level_name) {
    std::ifstream file(filepath);
    if (!file.is_open()) {
        throw std::runtime_error("Failed to open levels file: " + filepath);
    }
    nlohmann::json j;
    file >> j;

    if (!j.contains(level_name)) {
        throw std::runtime_error("Level not found in file: " + level_name);
    }
    return Level::from_json(level_name, j[level_name]);
}

void print_board_values(const std::vector<std::vector<Track>>& board) {
    for (const auto& row : board) {
        std::cout << "[";
        for (size_t j = 0; j < row.size(); ++j) {
            std::cout << static_cast<int>(row[j]) << (j + 1 < row.size() ? "," : "");
        }
        std::cout << "]\n";
    }
}

void print_mod_values(const std::vector<std::vector<Mod>>& mods) {
    for (const auto& row : mods) {
        std::cout << "[";
        for (size_t j = 0; j < row.size(); ++j) {
            std::cout << static_cast<int>(row[j]) << (j + 1 < row.size() ? "," : "");
        }
        std::cout << "]\n";
    }
}

} // namespace railbound
