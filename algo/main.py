from collections import deque
import functools
import typing

import numpy as np  # used for absolutely everything.
import time  # used for time reports on minimum solutions and final completion
import levels_cars as lc  # separate file with every single level setup variable
from timeit import timeit  # used for line testing
import itertools  # used for generating different board combinations
from PIL import Image  # used for generation visualization (optional)
import classes as rb

T = rb.TrackName
M = rb.ModName

ti = rb.Tile(T.FENCE_OR_STATION, M.DEACTIVATED_MOD)

program_start_time = time.time()

img_arrays = np.zeros((40, 90, 90, 4), dtype=np.int8)
img_fps = 120
capture_img = False
if capture_img:
    img_arrays[0] = np.asarray(Image.open("../images/#0 Empty Tile.png"))
    img_arrays[1] = np.asarray(Image.open("../images/#1 Horizontal Track.png"))
    img_arrays[2] = np.asarray(Image.open("../images/#2 Vertical Track.png"))
    img_arrays[3] = np.asarray(Image.open("../images/#3 Ending Track.png"))
    img_arrays[4] = np.asarray(Image.open("../images/#4 Fence.png"))
    img_arrays[5] = np.asarray(Image.open("../images/#5 Bottom-Right Turn.png"))
    img_arrays[6] = np.asarray(Image.open("../images/#6 Bottom-Left Turn.png"))
    img_arrays[7] = np.asarray(Image.open("../images/#7 Top-Right Turn.png"))
    img_arrays[8] = np.asarray(Image.open("../images/#8 Top-Left Turn.png"))
    img_arrays[9] = np.asarray(Image.open("../images/#9 Bottom-Right & Left 3-Way.png"))
    img_arrays[10] = np.asarray(Image.open("../images/#10 Bottom-Right & Top 3-Way.png"))
    img_arrays[11] = np.asarray(Image.open("../images/#11 Bottom-Left & Right 3-Way.png"))
    img_arrays[12] = np.asarray(Image.open("../images/#12 Bottom-Left & Top 3-Way.png"))
    img_arrays[13] = np.asarray(Image.open("../images/#13 Top-Right & Left 3-Way.png"))
    img_arrays[14] = np.asarray(Image.open("../images/#14 Top-Right & Bottom 3-Way.png"))
    img_arrays[15] = np.asarray(Image.open("../images/#15 Top-Left & Right 3-Way.png"))
    img_arrays[16] = np.asarray(Image.open("../images/#16 Top-Left & Bottom 3-Way.png"))
    img_arrays[17] = np.asarray(Image.open("../images/#17 Left-Facing Tunnel.png"))
    img_arrays[18] = np.asarray(Image.open("../images/#18 Right-Facing Tunnel.png"))
    img_arrays[19] = np.asarray(Image.open("../images/#19 Down-Facing Tunnel.png"))
    img_arrays[20] = np.asarray(Image.open("../images/#20 Up-Facing Tunnel.png"))
    img_arrays[21] = np.asarray(Image.open("../images/Car 1.png"))
    img_arrays[22] = np.asarray(Image.open("../images/Car 2.png"))
    img_arrays[23] = np.asarray(Image.open("../images/Car 3.png"))
    img_arrays[24] = np.asarray(Image.open("../images/Perm #1.png"))
    img_arrays[25] = np.asarray(Image.open("../images/Perm #2.png"))
    img_arrays[28] = np.asarray(Image.open("../images/Perm #5.png"))
    img_arrays[29] = np.asarray(Image.open("../images/Perm #6.png"))
    img_arrays[30] = np.asarray(Image.open("../images/Perm #7.png"))
    img_arrays[31] = np.asarray(Image.open("../images/Perm #8.png"))
    img_arrays[32] = np.asarray(Image.open("../images/Perm #9.png"))
    img_arrays[33] = np.asarray(Image.open("../images/Perm #10.png"))
    img_arrays[34] = np.asarray(Image.open("../images/Perm #11.png"))
    img_arrays[35] = np.asarray(Image.open("../images/Perm #12.png"))
    img_arrays[36] = np.asarray(Image.open("../images/Perm #13.png"))
    img_arrays[37] = np.asarray(Image.open("../images/Perm #14.png"))
    img_arrays[38] = np.asarray(Image.open("../images/Perm #15.png"))
    img_arrays[39] = np.asarray(Image.open("../images/Perm #16.png"))

# generatableTracks contains each track type the car can generate while going (left, right, down, up)
generatableTracks = (
    (T.HORIZONTAL_TRACK, T.BOTTOM_RIGHT_TURN, T.TOP_RIGHT_TURN),  # left accessible tracks
    (T.HORIZONTAL_TRACK, T.BOTTOM_LEFT_TURN, T.TOP_LEFT_TURN),  # right accessible tracks
    (T.VERTICAL_TRACK, T.TOP_RIGHT_TURN, T.TOP_LEFT_TURN),  # down accessible tracks
    (T.VERTICAL_TRACK, T.BOTTOM_RIGHT_TURN, T.BOTTOM_LEFT_TURN),  # up accessible tracks
    ()  # standstill accessible tracks
)
# the 3-ways a car can generate for each direction.
# the first list is 3-ways for horizontal tracks, and the second list is for vertical tracks
generatable3Ways = (
    ((T.BOTTOM_RIGHT_LEFT_3WAY, T.TOP_RIGHT_LEFT_3WAY), (T.BOTTOM_RIGHT_TOP_3WAY, T.TOP_RIGHT_BOTTOM_3WAY)),  # left
    ((T.BOTTOM_LEFT_RIGHT_3WAY, T.TOP_LEFT_RIGHT_3WAY), (T.BOTTOM_LEFT_TOP_3WAY, T.TOP_LEFT_BOTTOM_3WAY)),  # right
    ((T.TOP_RIGHT_LEFT_3WAY, T.TOP_LEFT_RIGHT_3WAY), (T.TOP_RIGHT_BOTTOM_3WAY, T.TOP_LEFT_BOTTOM_3WAY)),  # down
    ((T.BOTTOM_RIGHT_LEFT_3WAY, T.BOTTOM_LEFT_RIGHT_3WAY), (T.BOTTOM_RIGHT_TOP_3WAY, T.BOTTOM_LEFT_TOP_3WAY))  # up
)
# the positions adjacent to a tile where a car can trigger a semaphore
# aka tile entry/exit positions
semaphorePass = np.asarray((
    ((-1, 0), (1, 0)),  # 1 Horizontal Track
    ((0, 1), (0, -1)),  # 2 Vertical Track
    ((0, 0), (0, 0)),
    ((0, 0), (0, 0)),
    ((0, 1), (1, 0)),  # 5 Bottom-Right Turn
    ((0, 1), (-1, 0)),  # 6 Bottom-Left Turn
    ((0, -1), (1, 0)),  # 7 Top-Right Turn
    ((0, -1), (-1, 0)),  # 8 Top-Left Turn
))
# directions contains instructions on where to move a car if it's on the given track in (xvelo, yvelo) format
# the instruction for each direction is listed by (0=left, 1=right, 2=down, 3=up, 4=standstill)
# directions are shown in form of "car is going (left, right, down, up)"
# e.g. car going down onto a vertical track will be 0-1-2nd index. 2nd index of vertical track instructs to go down 1.
# (2, 2) indicates a crash, (0, 0) represents no movement
directions = (
    ((2, 2), (2, 2), (2, 2), (2, 2), (0, 0)),  # 0 Empty
    ((-1, 0), (1, 0), (2, 2), (2, 2), (0, 0)),  # 1 Horizontal Track
    ((2, 2), (2, 2), (0, 1), (0, -1), (0, 0)),  # 2 Vertical Track
    ((2, 2), (0, 0), (2, 2), (2, 2), (0, 0)),  # 3 Ending Track
    ((2, 2), (2, 2), (2, 2), (2, 2), (0, 0)),  # 4 Fence/Rock/Station
    ((0, 1), (2, 2), (2, 2), (1, 0), (0, 0)),  # 5 Bottom-Right Turn
    ((2, 2), (0, 1), (2, 2), (-1, 0), (0, 0)),  # 6 Bottom-Left Turn
    ((0, -1), (2, 2), (1, 0), (2, 2), (0, 0)),  # 7 Top-Right Turn
    ((2, 2), (0, -1), (-1, 0), (2, 2), (0, 0)),  # 8 Top-Left Turn
    ((0, 1), (1, 0), (2, 2), (1, 0), (0, 0)),  # 9 Bottom-Right & Left 3-Way
    ((0, 1), (2, 2), (0, 1), (1, 0), (0, 0)),  # 10 Bottom-Right & Top 3-Way
    ((-1, 0), (0, 1), (2, 2), (-1, 0), (0, 0)),  # 11 Bottom-Left & Right 3-Way
    ((2, 2), (0, 1), (0, 1), (-1, 0), (0, 0)),  # 12 Bottom-Left & Top 3-Way
    ((0, -1), (1, 0), (1, 0), (2, 2), (0, 0)),  # 13 Top-Right & Left 3-Way
    ((0, -1), (2, 2), (1, 0), (0, -1), (0, 0)),  # 14 Top-Right & Bottom 3-Way
    ((-1, 0), (0, -1), (-1, 0), (2, 2), (0, 0)),  # 15 Top-Left & Right 3-Way
    ((2, 2), (0, -1), (-1, 0), (0, -1), (0, 0)),  # 16 Top-Left & Bottom 3-Way

    ((2, 2), (0, 0), (2, 2), (2, 2), (0, 0)),  # 17 Left-Facing Tunnel
    ((0, 0), (2, 2), (2, 2), (2, 2), (0, 0)),  # 18 Right-Facing Tunnel
    ((2, 2), (2, 2), (2, 2), (0, 0), (0, 0)),  # 19 Down-Facing Tunnel
    ((2, 2), (2, 2), (0, 0), (2, 2), (0, 0)),  # 20 Up-Facing Tunnel

    ((2, 2), (0, 0), (2, 2,), (2, 2), (0, 0)),  # 21 Numeral Car Ending Track (Right Side)
    ((0, 0), (2, 2), (2, 2,), (2, 2), (0, 0))  # 22 Numeral Car Ending Track (Left Side)
)


def board_to_img(cars_to_use, board_to_use):
    full_img = np.zeros((board.shape[0] * 90, board.shape[1] * 90, 4), dtype=np.int8)
    for i, track in np.ndenumerate(board_to_use):
        if board[i[0], i[1]] == board_to_use[i[0], i[1]] and (0 < track <= 2 or 4 < track <= 16):
            track += 23
        full_img[i[0] * 90:(i[0] + 1) * 90, i[1] * 90:(i[1] + 1) * 90] = img_arrays[track]
    for car in cars_to_use:
        x, y = car.y, car.x
        img_to_use = Image.fromarray(img_arrays[21 + car.num], "RGBA")
        match car.getdir():
            case 0:
                img_to_use = img_to_use.rotate(180)
            case 2:
                img_to_use = img_to_use.rotate(270)
            case 3:
                img_to_use = img_to_use.rotate(90)
        img_below_car = Image.fromarray(full_img[x * 90:(x + 1) * 90, y * 90:(y + 1) * 90], "RGBA")
        full_img[x * 90:(x + 1) * 90, y * 90:(y + 1) * 90] = np.asarray(
            Image.alpha_composite(img_below_car, img_to_use), dtype=np.int8)
    return Image.fromarray(full_img[:, :, :3], "RGB")


def tail_call_gen(func: typing.Callable[[...], typing.Generator]):
    """
    Decorator to implement tail call optimisation as a generator

    instead of calling itself the tail of the function should
    yield the arguments for its call. the facilitator can then
    handle the calls in a way far more lightweight than the call
    stack, and avoiding blowing the stack with really deep recursion.
    """

    @functools.wraps(func)
    def facilitator(first_state):
        init_tracks = first_state.available_tracks
        states = {k: deque() for k in range(init_tracks, -1, -1)}
        states[init_tracks].append(first_state)

        for queue in states.values():
            while queue:
                for new_state in func(queue.popleft()):
                    if new_state.solved:
                        return
                    states[new_state.available_tracks].append(new_state)

    return facilitator


@tail_call_gen
def generate_tracks(state_to_use):
    """
    Main generation function. Uses the given board and variables to
    generate tracks every game movement.

    VERY condensed: it first looks if cars are on switches and does
    some modifier shenanigans, then generates tracks for every
    car BASED ON ITS VELOCITY. It then does checks for the generated
    tracks to determine which ones are valid, and adds those as well
    as the generated car for each track to a list.

    After every car is generated, it gets every possible track
    combination between every car, and calls the function again with
    every new game movement.
    """
    global iterations, bestBoard, lowestTracksRemaining, boardSolveTime, semaphoresRemaining, \
        frame_arrays, hashes

    cars_to_use, board_to_use, available_tracks, heatmaps,\
    stalled, switch_queue, station_stalled, crashed_decoys,\
    mvmts_since_solved, available_semaphores, heatmap_limits, solved = state_to_use.params()

    hashed_state = hash(rb.State(tuple(cars_to_use), board_to_use))

    if hashed_state in hashes:
        # print(cars_to_use)
        # print(board_to_use)
        # print(hashed_state)
        # print()
        return False
    hashes.add(hashed_state)

    # remove decoys if they crashed last frame and do all the proper removal things
    crashed = [i for i in range(len(cars_to_use) - 1, -1, -1) if cars_to_use[i].num == -1]
    for crashed_decoy in crashed:
        decoy_car = cars_to_use[crashed_decoy]
        crashed_decoys[decoy_car.num] = decoy_car[:2]
        cars_to_use.pop(crashed_decoy)
        stalled.pop(crashed_decoy)

    # add stalled_cars to a list for crashing. this could likely be changing to be faster, but I did it
    # this way because of how the game treats crashes. on 7-3B, there is a false solution that could save 1 track
    # but doesn't actually work because cars crash before they move through a gate, if the gate is opened on the
    # same frame of a crash.
    # if any(stalled):
    if False:
        stalled_cars = [stalled_car[:2] for i, stalled_car in enumerate(cars_to_use) if stalled[i]]
    else:
        stalled_cars = []

    # some debug variables to check before generation
    # print()
    # print(board_to_use)
    # print(cars_to_use)
    # print(iterations)
    # print(mods_to_use)
    # print(station_stalled)
    # print(stalled)
    # print(crashed_decoys)

    # switch code
    # TODO: see if board doesn't need to be copied when opening/closing gates
    for c, car in enumerate(cars_to_use):
        # if a car is no longer under a queued gate, close it and remove it from the queue
        # TODO: make queued_gate not a numpy array
        queued_gate = switch_queue[c]
        if queued_gate[0] != -1 and not (car.x == queued_gate[0] and car.y == queued_gate[1]):
            board_to_use = board_to_use.closegate((queued_gate[0], queued_gate[1]))
            switch_queue[c] = [-1, -1]
        switch_num = board[car.x, car.y].mod

        # if a car steps on a switch...
        if not stalled[c] and 1 <= switch_num.value <= 4:
            # close/open related gates to switch
            for gate_pos in gate_poses[switch_num]:
                if board_to_use[gate_pos].mod.value % 2 == 1:
                    hold_gate = False
                    # do a check to see if any cars are under the gate for switch_queue. could possibly be
                    # faster by not having to iterate over every car.
                    for car_under_gate in cars_to_use:
                        if car_under_gate.x == gate_pos[0] and car_under_gate.y == gate_pos[1]:
                            car_index = car_under_gate.num + car_under_gate.type.value * len(cars)
                            if len(decoys) == 0 and car_under_gate[5] == 2:
                                car_index = car_under_gate.num + len(cars)
                            elif car_under_gate.type == rb.CarType.NUMERAL:
                                car_index = car_under_gate.num + len(cars) + len(decoys)
                            switch_queue[car_index] = gate_pos
                            hold_gate = True
                            break
                    if not hold_gate:
                        board_to_use = board_to_use.closegate(gate_pos)
                else:
                    board_to_use = board_to_use.opengate(gate_pos)

            # swap related swapping tracks to a switch
            for swap_pos in swap_positions[switch_num]:
                board_to_use = board_to_use.swap_track(swap_pos)
        elif not stalled[c] and modifiers[car.y, car.x] == 24:
            board_to_use = board_to_use.swap_track((car.x, car.y))

        car_direction = car.getdir()
        car_index = car.num + car.type.value * len(cars)
        if len(decoys) == 0 and car.type == rb.CarType.NUMERAL:
            car_index = car.num + len(cars)
        elif car.type == rb.CarType.NUMERAL:
            car_index = car.num + len(cars) + len(decoys)
        pos_ahead = (car.x + car.xvelo, car.y + car.yvelo)
        ncar_station_offset = car.type.value // 2

        # skip semaphore and heatmap checks if car is out of bounds
        if not (0 <= pos_ahead[1] < board.shape[0] and 0 <= pos_ahead[0] < board.shape[1]):
            continue

        # if the car is moving, add to heatmap
        if not (car.type != rb.CarType.DECOY and (board_to_use[car.x, car.y].mod.value == car.num + 20 + ncar_station_offset * 8 or
                                 station_stalled[ncar_station_offset * len(cars) + car.num])) and not \
                board_to_use[pos_ahead[0], pos_ahead[1]].mod.value in {8, 10, 12, 14, 25}:
            # increase heatmap limit to 1 if car is placing a tile
            if heatmap_limits[car_index, car_direction, car.y, car.x] == 0:
                heatmap_limits[car_index, car_direction, car.y, car.x] += 1
            # decoys have no heatmap limit due to how they work, so I set it to a soft 15 to make the program
            # run faster. increase if the board requires it.
            if car.type.value == 1:
                heatmaps[car_index, car_direction, car.y, car.x] += 1
                decoy_heat = heatmaps[car_index, car_direction, car.y, car.x]
                if decoy_heat > 15:
                    return
            else:
                heatmaps[car_index, car_direction, car.y, car.x] += 1
                car_heat = heatmaps[car_index, car_direction, car.y, car.x]
                if car_heat > heatmap_limits[car_index, car_direction, car.y, car.x]:
                    return

        # semaphore processing
        if board_to_use[pos_ahead[0], pos_ahead[1]].mod.value == 25:
            semPos = semaphorePass[board_to_use[pos_ahead[0], pos_ahead[1]] - 1]
            # check if any cars are passing the semaphore, and open it if they are
            for p_car in cars_to_use:
                if p_car.num == car.num and p_car.type.value == car.type.value:
                    continue
                pos0 = p_car.x == pos_ahead[0] + semPos[0, 0] and p_car.y == pos_ahead[1] + semPos[0, 1] and \
                       not (p_car.xvelo == semPos[0, 0] * -1 and p_car.yvelo == semPos[0, 1] * -1)
                pos1 = p_car.x == pos_ahead[0] + semPos[1, 0] and p_car.y == pos_ahead[1] + semPos[1, 1] and \
                       not (p_car.xvelo == semPos[1, 0] * -1 and p_car.yvelo == semPos[1, 1] * -1)
                if pos0 or pos1:
                    heatmaps[car_index, car.getdir(), car.y, car.x] -= 1
                    board_to_use[pos_ahead[0], pos_ahead[1]].mod.value = 26
                    break
    # could probably use numpy lists and not use pops to make program faster, but this works for now.
    cars_generated = [[] for _ in cars_to_use]
    usable_tracks = [[] for _ in cars_to_use]
    decoy_placing = [False] * len(cars_to_use)
    just_solved = [-1, -1]
    shortened_cars = [[scar.x, scar.y, scar.xvelo, scar.yvelo] for scar in cars_to_use]
    # generation code
    for c, car in enumerate(cars_to_use):
        iterations += 1
        car_direction = car.getdir()
        ncar_station_offset = car.type.value // 2

        pos_ahead = (car.x + car.xvelo, car.y + car.yvelo)
        # crash decoys if they hit the board border
        if not (0 <= pos_ahead[1] < board.shape[0] and 0 <= pos_ahead[0] < board.shape[1]):
            cars_generated[c] = [rb.Car(car.x, car.y, car.xvelo, car.yvelo, -1, rb.CarType.DECOY)]
            usable_tracks[c] = [board_to_use[car.x, car.y].track]
            continue

        # station processing
        if car.type.value != 1:
            if board_to_use[car.x, car.y].mod.value == car.num + 20 + ncar_station_offset * 8:
                station_stalled[ncar_station_offset * len(cars) + car.num] = True
                board_to_use[car.x, car.y].mod.value = 26
                cars_generated[c], usable_tracks[c] = [car], [board_to_use[car.x, car.y].track]
                continue
            elif station_stalled[ncar_station_offset * len(cars) + car.num]:
                station_stalled[ncar_station_offset * len(cars) + car.num] = False
                cars_generated[c], usable_tracks[c] = [car], [board_to_use[car.x, car.y].track]
                continue
        # gate processing
        if board_to_use[pos_ahead[0], pos_ahead[1]].mod.value in [8, 10, 12, 14, 25]:
            stalled[c] = True
            cars_generated[c], usable_tracks[c] = [car], [board_to_use[car.x, car.y].track]
            continue
        elif stalled[c]:
            stalled[c] = False

        tile_ahead = board_to_use[pos_ahead[0], pos_ahead[1]].track
        tile_ahead_redirect = directions[tile_ahead.value][car_direction]

        # tile picking
        tracks_to_check = ()
        if tile_ahead != T.EMPTY:
            if pos_ahead in permanent_tiles:
                if tile_ahead_redirect[0] == 2:
                    if car.type == rb.CarType.DECOY:
                        cars_generated[c] = [rb.Car(car.x, car.y, car.xvelo, car.yvelo, -1, rb.CarType.DECOY)]
                        usable_tracks[c] = [board_to_use[car.x, car.y].track]
                        continue
                    else:
                        return
                else:
                    tracks_to_check = (tile_ahead,)
            else:
                if T.is_turn(tile_ahead) and tile_ahead_redirect[0] == 2:
                    tracks_to_check = (T(tile_ahead.value * 2 - 1 + car_direction // 2),)
                elif T.is_straight(tile_ahead):
                    if tile_ahead_redirect[0] == 2:
                        tracks_to_check = generatable3Ways[car_direction][tile_ahead.value - 1]
                    else:
                        if sum(heatmaps[:, car_direction, car.y, car.x]) > 1:
                            tracks_to_check = (tile_ahead,)
                        else:
                            tracks_to_check = (tile_ahead, *generatable3Ways[car_direction][tile_ahead.value - 1])
                elif tile_ahead_redirect[0] == 2:
                    if car.type == rb.CarType.DECOY:
                        cars_generated[c] = [rb.Car(car.x, car.y, car.xvelo, car.yvelo, -1, rb.CarType.DECOY)]
                        usable_tracks[c] = [board_to_use[car.x, car.y].track]
                        continue
                    else:
                        return
                else:
                    tracks_to_check = (tile_ahead,)
        else:
            # out of tracks / not going to beat best tracks?
            if available_tracks - 1 <= lowestTracksRemaining and car.type == rb.CarType.DECOY:
                tracks_to_check = (T.EMPTY,)
            elif car.type == rb.CarType.DECOY:
                decoy_placing[c] = True
                tracks_to_check = (T.EMPTY, *generatableTracks[car_direction])
            else:
                available_tracks -= 1
                tracks_to_check = generatableTracks[car_direction]

        # false train checks to make sure cars dont go to the wrong train
        if (tracks_to_check[0] == T.ENDING_TRACK and car.type != rb.CarType.NORMAL) or (T.is_ncar_end(tracks_to_check[0]) and car.type != rb.CarType.NUMERAL):
            return

        # out of tracks / not going to beat best tracks?
        if available_tracks <= lowestTracksRemaining:
            return

        # same tile crashing
        # print(timeit(lambda: [gen_car[0][:2] for gen_car in cars_generated[:c]] + crashed_decoys.tolist() + stalled_cars, number=1000000))
        poses = [gen_car[0][:2] for gen_car in cars_generated[:c]] + crashed_decoys.tolist() + stalled_cars

        if pos_ahead in poses:
            car_num = poses.index(pos_ahead)
            # this is a solve I made for the 10-7 issue. I commented it out until I make something faster
            # because it's extremely slow, and doesn't hinder the program too much currently.

            # if car_num < c:
            #     if poses[car_num][0] == cars_to_use[car_num][0] and poses[car_num][1] == cars_to_use[car_num][1]:
            #         if len(cars_generated[car_num]) > 1:
            #             cars_generated[car_num].pop(-1)
            #             usable_tracks[car_num].pop(-1)
            #         elif cars_generated[car_num][5] == 1:
            #             cars_generated[car_num] = [[car.x, car.y, car.xvelo, car.yvelo, -1, 1]]
            #             usable_tracks[car_num] = [board_to_use[car.x, car.y]]
            #         else:
            #             return False
            if tracks_to_check[0] == 0:
                tracks_to_check = (tracks_to_check[0],)
            elif car.type == rb.CarType.DECOY and (c <= car_num or cars_generated[car_num][0].num == 1):
                cars_generated[c] = [rb.Car(car.x, car.y, car.xvelo, car.yvelo, -1, rb.CarType.DECOY)]
                usable_tracks[c] = [board_to_use[car.x, car.y].track]
                continue
            else:
                return

        # head-on crashing
        # check if any of the cars are crashing head-on by comparing if the car
        # is ramming into cars that haven't yet generated, going opposite direction (head-on)
        if [*pos_ahead, car.xvelo * -1, car.yvelo * -1] in shortened_cars:
            if tracks_to_check[0] == 0:
                tracks_to_check = (tracks_to_check[0],)
            elif car.type == rb.CarType.DECOY:
                cars_generated[c] = [rb.Car(car.x, car.y, car.xvelo, car.yvelo, -1, rb.CarType.DECOY)]
                usable_tracks[c] = [board_to_use[car.x, car.y].track]
                continue
            else:
                return

        # tunnel crashing
        if T.is_tunnel(tile_ahead):
            if c > 0:
                # check if any cars are on the tunnel the car is trying to go through
                if pos_ahead in [gen_car[0][:2] for gen_car in cars_generated[:c]]:
                    return

            tunnel_num = board_to_use[pos_ahead].mod

            if tunnel_poses[tunnel_num][0] == pos_ahead:
                pos_ahead = tunnel_poses[tunnel_num][1]
            else:
                pos_ahead = tunnel_poses[tunnel_num][0]

        # track confirming
        for i, possibleTrack in enumerate(tracks_to_check):
            # crash a decoy if it chooses to crash
            if possibleTrack == T.EMPTY:
                if car[:2] in poses:
                    continue
                cars_generated[c].append(rb.Car(car.x, car.y, car.xvelo, car.yvelo, -1, rb.CarType.DECOY))
                usable_tracks[c].append(T.EMPTY)
                continue
            elif T.is_tunnel(possibleTrack):
                possible_redirect = tunnel_exit_velos[board_to_use[pos_ahead].track]
            else:
                possible_redirect = directions[possibleTrack.value][car_direction]
            end_on = (pos_ahead[0] + possible_redirect[0], pos_ahead[1] + possible_redirect[1])

            # check if a car meets requirements for solving
            if possibleTrack == T.ENDING_TRACK or T.is_ncar_end(possibleTrack):
                # print('trying to solve')
                # if the finished car isn't in order, kill it
                if cars_to_use[ncar_station_offset * len(cars)].num != car.num:
                    return
                # if all stations weren't collected, kill it
                # TODO: make this work with post offices
                if len(station_poses.values()) == [] * 4:
                    return
                # print('car complete')
                just_solved[ncar_station_offset] = car.num
            # if placing a 3-way, check if it affects any cars that have come in that direction
            elif T.is_3way(possibleTrack) and not T.is_3way(tile_ahead):
                # if placing a 3-way will affect another car going that direction, kill it
                if np.count_nonzero(
                        heatmaps[:, car.getdir(possible_redirect[0] * -1, possible_redirect[1] * -1), pos_ahead[1],
                        pos_ahead[0]]) and pos_ahead not in permanent_tiles:
                    continue
                # if the 3-way is placed on a semaphore, kill it
                elif board_to_use[pos_ahead[0], pos_ahead[1]].mod.value == 25 or board_to_use[pos_ahead[0], pos_ahead[1]].mod.value == 26:
                    continue

            # kill out of bounds cars, crash decoys
            if not (0 <= end_on[1] < board.shape[0] and 0 <= end_on[0] < board.shape[1]):
                if car.type == rb.CarType.DECOY:
                    cars_generated[c].append(rb.Car(pos_ahead[0], pos_ahead[1], possible_redirect[0], possible_redirect[1], car.num, rb.CarType.DECOY))
                    usable_tracks[c].append(possibleTrack)
                continue

            end_on_tile = board_to_use[end_on[0], end_on[1]].track
            end_on_redirect = directions[end_on_tile.value][car.getdir(possible_redirect[0], possible_redirect[1])]
            possible_to_place_3way = (T.is_straight(end_on_tile) or T.is_turn(end_on_tile)) and \
                                     end_on not in permanent_tiles
            # checks if end_on_tile is going to crash the car and if it can't place a 3-way to fix it
            if end_on_redirect[0] == 2 and end_on_tile != T.EMPTY and not possible_to_place_3way:
                if car.type == rb.CarType.DECOY:
                    cars_generated[c].append(rb.Car(pos_ahead[0], pos_ahead[1], possible_redirect[0], possible_redirect[1], car.num, rb.CarType.DECOY))
                    usable_tracks[c].append(possibleTrack)
                continue
            cars_generated[c].append(rb.Car(pos_ahead[0], pos_ahead[1], possible_redirect[0], possible_redirect[1], car.num, car.type))
            if T.is_tunnel(possibleTrack):
                usable_tracks[c].append(board[pos_ahead[0], pos_ahead[1]].track)
            else:
                usable_tracks[c].append(possibleTrack)

                # checks if the car can also place a semaphore.
                if available_semaphores > 0 and (1 <= possibleTrack <= 2 or 5 <= possibleTrack <= 8) and \
                        board_to_use[pos_ahead[0], pos_ahead[1]].mod.value == 0:
                    semPos = semaphorePass[possibleTrack - 1]
                    pos_ahead_heat = sum(heatmaps[:, :, pos_ahead[1], pos_ahead[0]].flatten())
                    pos0_heat = sum(heatmaps[:, :, pos_ahead[1] + semPos[0, 1], pos_ahead[0] + semPos[0, 0]].flatten())
                    pos1_heat = sum(heatmaps[:, :, pos_ahead[1] + semPos[1, 1], pos_ahead[0] + semPos[1, 0]].flatten())
                    pos0_starting = 27 == board_to_use[pos_ahead[0] + semPos[0, 0], pos_ahead[1] + semPos[0, 1]].mod.value
                    pos1_starting = 27 == board_to_use[pos_ahead[0] + semPos[1, 0], pos_ahead[1] + semPos[1, 1]].mod.value

                    if car.type.value == 0:
                        if car.x == cars[car.num][0] and car.y == cars[car.num][1] and \
                                board_to_use[car.x, car.y].mod.value == 27:
                            pos0_starting -= 1
                    elif car.type.value == 1:
                        if car.x == decoys[car.num][0] and car.y == decoys[car.num][1] and \
                                board_to_use[car.x, car.y].mod.value == 27:
                            pos0_starting -= 1
                    else:
                        if car.x == ncars[car.num][0] and car.y == ncars[car.num][1] and \
                                board_to_use[car.x, car.y].mod.value == 27:
                            pos0_starting -= 1

                    if not pos_ahead_heat and pos0_heat + pos1_heat - 1 - pos0_starting - pos1_starting == 0:
                        cars_generated[c].append(car)
                        # a semaphore track is basically just track index + 22 because it's a simple way
                        # to tell the program to place a semaphore without interfering with track indices.
                        # TODO: fix for new object system
                        usable_tracks[c].append(possibleTrack + 22)
        # if no tracks were generated, kill it
        if len(usable_tracks[c]) == 0:
            return

    # kill branch if all cars are stalled
    if all(stalled) and len(cars_to_use) > 0:
        return

    # if board is complete, register as solution
    solved_ncars = True
    if len(ncars) > 0:
        solved_ncars = just_solved[1] == ncars[-1].num
    if just_solved[0] == cars[-1].num and solved_ncars:
        if (len(cars_to_use) == 1 and cars_to_use[0][5] != 1) or mvmts_since_solved == 2:
            bestBoard = board_to_use
            lowestTracksRemaining = available_tracks
            semaphoresRemaining = available_semaphores
            print(f'Found a new minimum solution! ({round((time.time() - boardSolveTime) * 10e3) / 10e3}s)')
            boardSolveTime = time.time()
            yield rb.State(cars_to_use, board_to_use, available_tracks, heatmaps, stalled, switch_queue, station_stalled,
                           crashed_decoys, mvmts_since_solved, available_semaphores, heatmap_limits, True)
        else:
            mvmts_since_solved += 1
    # if a car solved this frame, remove it from generation
    if just_solved[0] != -1:
        cars_generated.pop(0)
        usable_tracks.pop(0)
        stalled.pop(0)
        decoy_placing.pop(0)
    # if a numeral car solved this frame, remove it from generation
    # TODO: fix new system for numeral cars
    if just_solved[1] != -1:
        sc = just_solved[1] - int(just_solved[0] > -1)
        cars_generated.pop(sc)
        usable_tracks.pop(sc)
        stalled.pop(sc)
        decoy_placing.pop(sc)
    car_combos = list(itertools.product(*cars_generated))
    track_combos = list(itertools.product(*usable_tracks))

    # some debug variables to check after generation
    # print(board_to_use)
    # print()
    # print(mods_to_use)
    # print(cars_to_use)
    # print(cars_generated)
    # print(track_combos)
    # print(usable_tracks)
    # print(solved)
    # print(available_tracks)
    # print(station_stalled)
    # print(iterations)
    # print()

    # branch creation
    for combo_num, track_combo in enumerate(track_combos):
        amt_placed_decoy = 0
        placed_semaphores = 0
        same_tile_mistake = False
        board_to_pass = board_to_use
        stalled_to_pass = list(stalled)
        heatmap_limits_pass = np.array(heatmap_limits)

        for i, car in enumerate(car_combos[combo_num]):
            # if 2 cars are on the same tile, kill it.
            # there's likely something in the program I can change to make this not happen because it shouldn't
            # and it wastes resources killing it here, but this works for now.
            if car[:2] in [c[:2] for c in car_combos[combo_num][i + 1:]]:
                same_tile_mistake = True
                break
            track_placing = track_combo[i]
            if decoy_placing[i] and track_placing != 0:
                # out of tracks / not going to beat best tracks?
                if available_tracks - amt_placed_decoy - 1 <= lowestTracksRemaining:
                    amt_placed_decoy = -1
                    break
                amt_placed_decoy += 1
            # if the car is placing a semaphore, check if it has enough to do so and then do it.
            # TODO: make this work with the new object system
            if 22 < track_placing.value:
                if available_semaphores - placed_semaphores - 1 >= 0:
                    placed_semaphores += 1
                else:
                    continue
                board_to_pass = board_to_pass.changetile(car.x + car.xvelo, car.y + car.yvelo, track_placing - 22)
                mods_to_pass[car.y + car.yvelo, car.x + car.xvelo] = 25
                stalled_to_pass[i] = True
            elif track_placing != 0:
                # print(car, track_placing)
                board_to_pass.queue_changes((car.x, car.y), track_placing)
                # print(board_to_pass)

            # if the car is on a swapping track, add 1 to all heatmap limits because of something, something
            # game logic. read the discord thread to learn more.
            # the heatmap limit will never go above 9.
            if M.is_swapping(board_to_use[car.x, car.y].mod) or M.is_switch(board_to_use[car.x, car.y].mod):
                car_direction = car.getdir()
                car_index = car.num + car.type.value * len(cars)
                if len(decoys) == 0 and car.type == rb.CarType.NUMERAL:
                    car_index = car.num + len(cars)
                elif car.type == rb.CarType.NUMERAL:
                    car_index = car.num + len(cars) + len(decoys)
                if heatmap_limits_pass[car_index, car_direction, car.y, car.x] < 9 and not stalled[i]:
                    heatmap_limits_pass[car_index, :][heatmap_limits_pass[car_index, :] > 0] += 1
                elif not heatmap_limits_pass[car_index, car_direction, car.y, car.x] < 9:
                    return
        if same_tile_mistake:
            continue
        if amt_placed_decoy == -1:
            return
        available_tracks -= amt_placed_decoy
        available_semaphores -= placed_semaphores
        board_to_pass = board_to_pass.do_changes()
        cars_to_pass = list(car_combos[combo_num])
        if (time.time() - startTime) // (round(1 / img_fps * 1000) / 1000) > len(frame_arrays) and capture_img:
            frame_arrays.append([cars_to_pass, board_to_pass])
        # print(board_to_pass, '\n', cars_to_pass)
        # recursive call helps with debugging
        # generate_tracks(
        #     cars_to_pass, board_to_pass,
        #     available_tracks, np.array(heatmaps),
        #     stalled_to_pass, np.array(switch_queue), list(station_stalled),
        #     np.array(crashed_decoys), mvmts_since_solved, available_semaphores,
        #     heatmap_limits_pass
        # )
        yield rb.State(cars_to_pass, board_to_pass, available_tracks, np.array(heatmaps),
                       stalled_to_pass, np.array(switch_queue), list(station_stalled),
                       np.array(crashed_decoys), mvmts_since_solved, available_semaphores,
                       heatmap_limits_pass)


# use 11-8b for visualizer
# 10-7 problem needs to be fixed where semaphores only check for last generated car
# TODO: fix 4-9
for lvl in [lc.levels["4-9"]]:
# for key in lc.world4:
#     lvl = lc.world4[key]
#     print(key)
    lowestTracksRemaining = -1
    semaphoresRemaining = -1
    # check how many parameters are in the level before doing it to load it properly
    # I will change this eventually because it's more consistent that way, and I'll have to redo every single
    # level setup, but this works for now.
    if len(lvl) == 4:
        board, cars, maxTracks, modifiers = lvl
        decoys = []
        semaphores = 0
        ncars = []
    elif len(lvl) == 5:
        board, cars, maxTracks, modifiers, decoys = lvl
        if decoys is None:
            decoys = []
        semaphores = 0
        ncars = []
    elif len(lvl) == 6:
        board, cars, maxTracks, modifiers, decoys, semaphores = lvl
        if decoys is None:
            decoys = []
        ncars = []
    else:
        board, cars, maxTracks, modifiers, decoys, semaphores, ncars = lvl
        if decoys is None:
            decoys = []

    # change car data to new object version
    # I will remove this once I redo level setup. again, I have to do it for every single one.
    for num, car in enumerate(cars):
        cars[num] = rb.Car(*car[:4], num, rb.CarType.NORMAL)
    for num, car in enumerate(decoys):
        cars[num] = rb.Car(*car[:4], num, rb.CarType.DECOY)
    for num, car in enumerate(ncars):
        cars[num] = rb.Car(*car[:4], num, rb.CarType.NUMERAL)

    bestBoard = None
    bestMods = None

    if modifiers is None:
        modifiers = np.zeros(board.shape)

    # add an modifier index of 27 to the starting positions of cars so semaphore can refer to them for
    # something, something semaphores are weird for starting positions. read the discord thread to learn more.
    for car in cars + decoys + ncars:
        modifiers[car.y, car.x] = 27

    iterations = 0
    board = rb.Board.from_numpy(board, modifiers)
    permanent_tiles = set()
    tunnel_exit_velos = {
        T.LEFT_FACING_TUNNEL: (-1, 0),
        T.RIGHT_FACING_TUNNEL: (1, 0),
        T.DOWN_FACING_TUNNEL: (0, 1),
        T.UP_FACING_TUNNEL: (0, -1)
    }
    tunnel_poses = {
        M.TUNNEL_1: [],
        M.TUNNEL_2: [],
        M.TUNNEL_3: []
    }
    gate_poses = {
        M.SWITCH_1: [],
        M.SWITCH_2: [],
        M.SWITCH_3: [],
        M.SWITCH_4: []
    }
    swap_positions = {
        M.SWITCH_1: [],
        M.SWITCH_2: [],
        M.SWITCH_3: [],
        M.SWITCH_4: [],
    }
    # TODO: make this work with post offices
    station_poses = {
        M.STATION_1: [],
        M.STATION_2: [],
        M.STATION_3: [],
        M.STATION_4: []
    }
    # set mod positions
    for key, item in board.getitems():
        mod = item.mod
        track = item.track
        if track != T.EMPTY:
            permanent_tiles.add(key)
        if M.TUNNEL_1.value <= mod.value <= M.TUNNEL_3.value:
            tunnel_poses[mod].append(key)
        elif M.CLOSED_GATE_1.value <= mod.value <= M.OPEN_GATE_4.value:
            gate_poses[M(mod.value // 2 - 3)].append(key)
        elif M.SWAPPING_TRACK_1.value <= mod.value <= M.SWAPPING_TRACK_4.value:
            swap_positions[M(mod.value - 15)].append(key)
        elif M.STATION_1.value <= mod.value <= M.STATION_4.value:
            station_poses[mod].append(key)

    frame_arrays = [[cars, board]]
    hashes = set()
    print(board)
    print('Generating...')
    boardSolveTime = time.time()
    startTime = time.time()

    sparams = [cars, board, maxTracks, np.zeros((len(cars + decoys + ncars), 4, *board.shape)),
               [False] * len(cars + decoys + ncars), np.full((len(cars + decoys + ncars), 2), -1),
               [False] * len(cars + ncars), np.full((len(decoys), 2), -1), 0, semaphores,
               np.zeros((len(cars + decoys + ncars), 4, *board.shape))]

    # print(hash(rb.State(*sparams)))
    # x = collections.deque()
    # y = rb.State(tuple(rb.Car(*c[:5], rb.CarType(c[5])) for c in list(cars + decoys + ncars)), rb.Board(board, modifiers))
    # print(timeit(lambda: x.append(y), number=10000000))
    # print(timeit(lambda: list().append(y), number=10000000))
    # quit(0)

    generate_tracks(rb.State(*sparams))

    finalTime = round((time.time() - startTime) * 10e3) / 10e3
    print(f'\nFinished in: {finalTime}s')
    print(f'Iterations Processed: {"{:,}".format(iterations)}')
    print(f'Tracks Remaining: {lowestTracksRemaining}')
    if lowestTracksRemaining > 0:
        print('--- TRACK SAVED --- TRACK SAVED --- TRACK SAVED --- TRACK SAVED ---')
    if bestBoard is None:
        print("-!- BOARD FAILED -!-")
        break
    for pos in permanent_tiles:
        bestBoard = bestBoard.changetile(pos[0], pos[1], track=board[pos].track)
    print(bestBoard)
    if semaphores > 0:
        print(f'Semaphores Remaining: {semaphoresRemaining}')
    # for semaphore_pos in np.argwhere((bestMods == 25) | (bestMods == 26)):
    #     if modifiers[semaphore_pos[0], semaphore_pos[1]] == 0:
    #         print(
    #             f'~~ Semaphore at: {semaphore_pos[::-1]} (On a [{bestBoard[semaphore_pos[0], semaphore_pos[1]]}] tile)')
    print('--------------------------------------------------')
    if capture_img:
        print(f'Captured frames: {len(frame_arrays)}')
        frame_arrays.append([[], bestBoard])
        final_imgs = []
        for frame in frame_arrays:
            final_imgs.append(board_to_img(frame[0], frame[1]))
        # final_imgs[0].save(f'{key}.gif', save_all=True, append_images=final_imgs[1:], duration=1)
        final_imgs[0].save(f'out.gif', save_all=True, append_images=final_imgs[1:], duration=1)
print(f'\nFully Complete in: {round((time.time() - program_start_time) * 10e3) / 10e3}s')
