import json
from classes import TrackName, ModName, Tile, Board, Car, CarType
from frozendict import frozendict


def dict_to_tile(tile_dict):
    return Tile(TrackName(tile_dict["track"]), ModName(tile_dict["mod"]))


def dict_to_board(board_dict):
    tiles = frozendict(
        {
            tuple(map(int, k.strip("()").split(","))): dict_to_tile(v)
            for k, v in board_dict["tiles"].items()
        }
    )
    return Board(tuple(board_dict["shape"]), tiles)


def dict_to_car(car_dict):
    return Car(
        car_dict["x"],
        car_dict["y"],
        car_dict["xvelo"],
        car_dict["yvelo"],
        car_dict["num"],
        CarType(car_dict["type"]),
    )


def dict_to_level(level_dict):
    board = dict_to_board(level_dict["board"])
    cars = tuple(dict_to_car(car) for car in level_dict["cars"])
    move_limit = level_dict["move_limit"]
    semaphores = level_dict["semaphores"]
    return [board, cars, move_limit, semaphores]


def load_levels_from_json(filename):
    with open(filename, "r") as f:
        serialized_levels = json.load(f)

    levels = {}
    for key, level_data in serialized_levels.items():
        levels[key] = dict_to_level(level_data)

    return levels


def tile_to_dict(tile):
    return {"track": tile.track.value, "mod": tile.mod.value}


def board_to_dict(board):
    return {
        "shape": board.shape,
        "tiles": {str(k): tile_to_dict(v) for k, v in board._tiles.items()},
    }


def car_to_dict(car):
    return {
        "x": car.x,
        "y": car.y,
        "xvelo": car.xvelo,
        "yvelo": car.yvelo,
        "num": car.num,
        "type": car.type.value,
    }


def level_to_dict(level):
    board, cars, move_limit, semaphores = level
    return {
        "board": board_to_dict(board),
        "cars": [car_to_dict(car) for car in cars],
        "move_limit": move_limit,
        "semaphores": semaphores,
    }


def save_levels_to_json(levels, filename):
    serializable_levels = {}
    for key, level in levels.items():
        serializable_levels[key] = level_to_dict(level)

    with open(filename, "w") as f:
        json.dump(serializable_levels, f)
