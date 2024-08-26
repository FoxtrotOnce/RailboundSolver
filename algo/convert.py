import numpy as np
import classes as rb
from levels_cars import levels


def convert_level(old_level):
    # Unpack the level data, with default values for optional elements
    board = old_level[0]
    old_cars = old_level[1]
    move_limit = old_level[2]
    interactions = old_level[3] if len(old_level) > 3 else None
    decoys = old_level[4] if len(old_level) > 4 else None
    semaphores = old_level[5] if len(old_level) > 5 else 0
    ncars = old_level[6] if len(old_level) > 6 else None

    # Convert board and interactions to Board object
    if interactions is not None:
        board = rb.Board.from_numpy(board, interactions)
    else:
        # If interactions is None, we need to create a Board object differently
        # This will depend on how your Board class is implemented
        board = rb.Board.from_numpy(board, np.zeros_like(board))

    # Convert cars, decoys, and ncars to Car objects
    cars = []
    for i, car in enumerate(old_cars):
        cars.append(rb.Car(*car, i, rb.CarType.NORMAL))

    if decoys:
        for i, decoy in enumerate(decoys):
            cars.append(rb.Car(*decoy, 0, rb.CarType.DECOY))

    if ncars:
        for i, ncar in enumerate(ncars):
            cars.append(rb.Car(*ncar, i, rb.CarType.NUMERAL))

    return [board, tuple(cars), move_limit, semaphores]


# Convert all levels
new_levels = {}
for key, level in levels.items():
    try:
        new_levels[key] = convert_level(level)
    except Exception as e:
        print(f"Error converting level {key}: {e}")


import pprint

print("TO CHECK:")
pprint.pprint(new_levels["12-10"])


# THE TRUE DATA FROM DISCORD CHAT
board12_10 = np.asarray(
    [
        [2, 0, 1, 0, 0, 0, 2, 0],
        [0, 0, 1, 1, 0, 0, 10, 17],
        [2, 0, 0, 0, 0, 0, 2, 0],
        [2, 0, 0, 0, 1, 17, 10, 21],
        [7, 0, 0, 4, 4, 4, 2, 0],
        [5, 0, 0, 0, 6, 18, 16, 0],
        [2, 0, 0, 0, 0, 0, 2, 0],
        [0, 0, 0, 0, 6, 0, 7, 3],
        [2, 0, 20, 0, 2, 0, 0, 0],
    ]
)
interactions12_10 = np.asarray(
    [
        [0, 0, 3, 0, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0, 0, 5],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [21, 0, 0, 0, 8, 6, 18, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 6, 24, 0],
        [28, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 10, 0],
        [0, 0, 5, 0, 0, 0, 0, 0],
    ]
)
board12_10 = rb.Board.from_numpy(board12_10, interactions12_10)
cars12_10 = (
    rb.Car(0, 8, 0, -1, 0, rb.CarType.NORMAL),
    rb.Car(4, 8, 0, -1, 1, rb.CarType.NORMAL),
    rb.Car(6, 0, 0, 1, 0, rb.CarType.DECOY),
    rb.Car(0, 0, 0, 1, 0, rb.CarType.NUMERAL),
)

print("EXPECTED:")
pprint.pprint([board12_10, cars12_10, 26, 1])
