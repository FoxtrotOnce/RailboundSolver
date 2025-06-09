import json
import numpy as np
import algo.classes as c
import algo.levels_cars as lc


json_data = {}

for name, data in lc.levels.items():
    lvl = json_data[name] = {}
    decoys = None
    if len(data) == 4:
        board, cars, tracks, mods = data
        decoys = []
        semaphores = 0
        ncars = []
    elif len(data) == 5:
        board, cars, tracks, mods, decoys = data
        semaphores = 0
        ncars = []
    elif len(data) == 6:
        board, cars, tracks, mods, decoys, semaphores = data
        ncars = []
    else:
        board, cars, tracks, mods, decoys, semaphores, ncars = data

    if decoys is None:
        decoys = []
    if mods is None:
        mods = np.zeros(board.shape, dtype=int)
    for car in cars + decoys + ncars:
        mods[(car[1], car[0])] = 27
    for i in range(len(cars)):
        cars[i] = {
            'pos': (cars[i][1], cars[i][0]),
            'direction': c.Direction.from_vector((cars[i][3], cars[i][2])).name,
            'num': i,
            'type': 'NORMAL'
        }
    for i in range(len(decoys)):
        decoys[i] = {
            'pos': (decoys[i][1], decoys[i][0]),
            'direction': c.Direction.from_vector((decoys[i][3], decoys[i][2])).name,
            'num': i,
            'type': 'DECOY'
        }
    for i in range(len(ncars)):
        ncars[i] = {
            'pos': (ncars[i][1], ncars[i][0]),
            'direction': c.Direction.from_vector((ncars[i][3], ncars[i][2])).name,
            'num': i,
            'type': 'NUMERAL'
        }
    mod_nums = c.Mod.produce_nums(mods)
    mods = np.vectorize(lambda mod: c.Mod.from_old_type(mod).value)(mods)
    lvl['board'] = board.tolist()
    lvl['mods'] = mods.tolist()
    lvl['mod_nums'] = mod_nums.tolist()
    lvl['cars'] = cars + ncars + decoys
    lvl['tracks'] = tracks
    lvl['semaphores'] = semaphores

with open(f"levels.json", "w") as f:
    json.dump(json_data, f, indent=4)

