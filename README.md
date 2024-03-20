# A solver for every level in Railbound.
I made this project over 7 months during my sophomore year of high school.


To solve a level or world, scroll down in the main project file until you reach the bottom for loop.
To solve a single level, only run the top line and change the key to the level you'd like to run.
```
for lvl in [lc.levels["9-1"]]:
# for key in lc.world9:
#     lvl = lc.world9[key]
#     print(key)
```

To solve a world, run the 3 lines below it, and simply change the world number. Sandbox (world #) is world0.
```
# for lvl in [lc.levels["9-1"]]:
for key in lc.world9:
    lvl = lc.world9[key]
    print(key)
```

Depending on which level is being run, it may take anywhere from less than a second to multiple minutes or hours.

# Creating custom levels
If you want to create a custom level, navigate to levels_cars and there is a template level at the top.
```
board1 = np.asarray([[1, 0, 0, 2, 5,21],
                     [0, 0, 0,13,12, 0],
                     [1, 0, 0, 0, 7, 3],
                     [0, 0, 0, 0, 1, 0]])
cars1 = [[0, 2, 1, 0]]
decoys1 = [[4, 3, -1, 0]]
ncars1 = [[0, 0, 1, 0]]
interactions1 = np.asarray([[0, 0, 0, 1, 0, 0],
                            [0, 0, 0,24,16, 0],
                            [0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0]])

worldt = {
    "1": [board1, cars1, 7, interactions1, decoys1, 0, ncars1]
}
```
You can add create new levels by adding new keys, and adding in boards, cars, tracks, and interactions.
If you don't use something in your level, replace it with `None`.
The parameters are: `[board, cars, tracks, interactions, decoys, semaphores, ncars]`.
- Interactions is a board with mechanic details like tunnels, gates, switches, stations, and so on.
- Decoys are the cars from world 7, and ncars are the Numeral Cars from worlds 11 & 12.

To create a board, simply make a numpy array with numbers for the board. You can find the track numbers in the reference.py file.
Cars are formatted as `[x, y, xvelo, yvelo]`. For example, on the sample board up top, the car is at 0x, 2y, and is facing right (xvelo of 1).
Make sure cars are added in numerical order. For example, `cars1 = [[car 1 data], [car 2 data], [car 3 data]]`.
Interactions is also a numpy array with numbers. You can find interaction indices in the reference.py file.

