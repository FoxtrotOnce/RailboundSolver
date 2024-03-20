import sys  # used for setting recursion limit higher so program doesn't quit after a while

import numpy as np  # used for absolutely everything.
import time  # used for time reports on minimum solutions and final completion
import levels_cars as lc  # separate file with every single level setup variable
from timeit import timeit  # used for line testing
import itertools  # used for generating different board combinations
import pandas as pd
import math  # used for getting the amount of combinations (math.prod)

sys.setrecursionlimit(100000)
startstarttime = time.time()

# xyToIndex contains the index for movement in direction, but you access it here with (x, y).
# this greatly simplifies the index grabbing as you no longer need 3x3x4 values of movement for direction and only 2x4s.
xyToIndex = np.asarray(((4, 2, 3),
                        (1, 4, 4),
                        (0, 4, 4)))
# generatableTracks contains each track type the car can generate while going (left, right, down, up)
generatableTracks = (
    (1, 5, 7),  # left accessible tracks
    (1, 6, 8),  # right accessible tracks
    (2, 7, 8),  # down accessible tracks
    (2, 5, 6),  # up accessible tracks
    ()  # standstill accessible tracks
)
generatable3Ways = (
    ((9, 13), (10, 14)),  # left
    ((11, 15), (12, 16)),  # right
    ((13, 15), (14, 16)),  # down
    ((9, 11), (10, 12))  # up
)
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
# directions contains instructions on which axis to move a car if it's on the given track in (x, y) format
# the instruction for each direction is listed by index shown by xyToIndex (0=left, 1=right, 2=down, 3=up)
# directions are shown in form of "car is going (left, right, down, up)"
# e.g. car going down onto a vertical track will be 0-1-2nd index. 2nd index of vertical track instructs to go down 1.
# (2, 2) indicates a crash, (3, 3) for empty and (4, 4) for ending might be used later
directions = np.asarray((
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
    ((2, 2), (2, 2), (0, 0), (2, 2), (0, 0)),  # 18 Up-Facing Tunnel
    ((0, 0), (2, 2), (2, 2), (2, 2), (0, 0)),  # 19 Right-Facing Tunnel
    ((2, 2), (2, 2), (2, 2), (0, 0), (0, 0)),  # 20 Down-Facing Tunnel

    ((2, 2), (0, 0), (2, 2,), (2, 2), (0, 0)),  # 21 Numeral Car Ending Track (Right Side)
    ((0, 0), (2, 2), (2, 2,), (2, 2), (0, 0))  # 22 Numeral Car Ending Track (Left Side)
))


def swap_track(track_id):
    return [11, 14, 9, 16, 15, 10, 13, 12][track_id - 9]


def generate_tracks(cars_to_use, board_to_use, ints_to_use, available_tracks, heatmaps,
                    solved, stalled, switch_queue, station_stalled, crashed_decoys,
                    mvmts_since_solved, available_semaphores, heatmap_limits):
    global iterations, bestBoard, bestInts, lowestTracksRemaining, boardSolveTime, semaphoresRemaining, statistics

    crashed = [i for i in range(len(cars_to_use) - 1, -1, -1) if cars_to_use[i][4] == -1]
    for crashed_decoy in crashed:
        decoy_car = cars_to_use[crashed_decoy]
        crashed_decoys[decoy_car[4]] = decoy_car[:2]
        cars_to_use.pop(crashed_decoy)
        stalled.pop(crashed_decoy)

    if len(cars_to_use) == 0:
        mvmts_since_solved = 2

    if any(stalled):
        stalled_cars = [stalled_car[:2] for i, stalled_car in enumerate(cars_to_use) if stalled[i]]
    else:
        stalled_cars = []

    # print()
    # print(board_to_use)
    # print(cars_to_use)
    # print(iterations)
    # print(ints_to_use)
    # print(station_stalled)
    # print(stalled)
    # print(crashed_decoys)

    # switch code
    for c, car in enumerate(cars_to_use):
        queued_gate = switch_queue[c]
        if queued_gate[0] != -1 and not (car[0] == queued_gate[0] and car[1] == queued_gate[1]):
            ints_to_use[queued_gate[1], queued_gate[0]] -= 1
            switch_queue[c] = [-1, -1]
        switch_num = interactions[car[1], car[0]]

        if not stalled[c] and 1 <= switch_num <= 4:
            gate_mask = (ints_to_use == switch_num * 2 + 6) | (ints_to_use == switch_num * 2 + 7)
            gate_poses = np.argwhere(gate_mask)
            gates = ints_to_use[gate_mask]

            for i, gate_pos in enumerate(gate_poses[:, ::-1]):
                if gates[i] % 2 == 1:
                    hold_gate = False
                    for car_under_gate in cars_to_use:
                        if car_under_gate[0] == gate_pos[0] and car_under_gate[1] == gate_pos[1]:
                            car_index = car_under_gate[4] + car_under_gate[5] * len(cars)
                            if len(decoys) == 0 and car_under_gate[5] == 2:
                                car_index = car_under_gate[4] + len(cars)
                            elif car_under_gate[5] == 2:
                                car_index = car_under_gate[4] + len(cars) + len(decoys)
                            switch_queue[car_index] = gate_pos
                            hold_gate = True
                            break
                    if not hold_gate:
                        ints_to_use[gate_pos[1], gate_pos[0]] -= 1
                else:
                    ints_to_use[gate_pos[1], gate_pos[0]] += 1

            for swap_pos in swap_positions[switch_num - 1]:
                board_to_use[swap_pos[0], swap_pos[1]] = swap_track(board_to_use[swap_pos[0], swap_pos[1]])
        elif not stalled[c] and interactions[car[1], car[0]] == 24:
            board_to_use[car[1], car[0]] = swap_track(board_to_use[car[1], car[0]])

        car_direction = xyToIndex[car[2], car[3]]
        car_index = car[4] + car[5] * len(cars)
        if len(decoys) == 0 and car[5] == 2:
            car_index = car[4] + len(cars)
        elif car[5] == 2:
            car_index = car[4] + len(cars) + len(decoys)
        pos_ahead = (car[0] + car[2], car[1] + car[3])
        ncar_station_offset = car[5] // 2

        if not (0 <= pos_ahead[1] < boardDims[0] and 0 <= pos_ahead[0] < boardDims[1]):
            continue

        if not (car[5] != 1 and (ints_to_use[car[1], car[0]] == car[4] + 20 + ncar_station_offset * 8 or
                                 station_stalled[ncar_station_offset * len(cars) + car[4]])) and not\
                ints_to_use[pos_ahead[1], pos_ahead[0]] in [8, 10, 12, 14, 25]:
            if heatmap_limits[car_index, car_direction, car[1], car[0]] == 0:
                heatmap_limits[car_index, car_direction, car[1], car[0]] += 1
            if car[5] == 1:
                heatmaps[car_index, car_direction, car[1], car[0]] += 1
                decoy_heat = heatmaps[car_index, car_direction, car[1], car[0]]
                if decoy_heat > 15:
                    return False
            else:
                heatmaps[car_index, car_direction, car[1], car[0]] += 1
                car_heat = heatmaps[car_index, car_direction, car[1], car[0]]
                if car_heat > heatmap_limits[car_index, car_direction, car[1], car[0]]:
                # if car_heat > 10:
                    return False

        if ints_to_use[pos_ahead[1], pos_ahead[0]] == 25:
            semPos = semaphorePass[board_to_use[pos_ahead[1], pos_ahead[0]] - 1]
            # if the direction is left/right, car has to go up/down and vice versa
            for p_car in cars_to_use:
                if p_car[4] == car[4] and p_car[5] == car[5]:
                    continue
                pos0 = p_car[0] == pos_ahead[0] + semPos[0, 0] and p_car[1] == pos_ahead[1] + semPos[0, 1] and\
                        not (p_car[2] == semPos[0, 0] * -1 and p_car[3] == semPos[0, 1] * -1)
                pos1 = p_car[0] == pos_ahead[0] + semPos[1, 0] and p_car[1] == pos_ahead[1] + semPos[1, 1] and\
                        not (p_car[2] == semPos[1, 0] * -1 and p_car[3] == semPos[1, 1] * -1)
                # print(p_car, [pos_ahead[0] + semPos[0, 0], pos_ahead[1] + semPos[0, 1], *semPos[0]], pos0)
                # print(p_car, [pos_ahead[0] + semPos[1, 0], pos_ahead[1] + semPos[1, 1], *semPos[1]], pos1)
                if pos0 or pos1:
                    heatmaps[car_index, xyToIndex[car[2], car[3]], car[1], car[0]] -= 1
                    ints_to_use[pos_ahead[1], pos_ahead[0]] = 26
                    break
    cars_generated = [[] for _ in cars_to_use]
    usable_tracks = [[] for _ in cars_to_use]
    decoy_placing = [False] * len(cars_to_use)
    just_solved = [-1, -1]

    # generation code
    for c, car in enumerate(cars_to_use):
        iterations += 1
        car_direction = xyToIndex[car[2], car[3]]
        ncar_station_offset = car[5] // 2

        pos_ahead = [car[0] + car[2], car[1] + car[3]]
        if not (0 <= pos_ahead[1] < boardDims[0] and 0 <= pos_ahead[0] < boardDims[1]):
            cars_generated[c], usable_tracks[c] = [[*car[:4], -1, 1]], [board_to_use[car[1], car[0]]]
            continue

        if car[5] != 1:
            if ints_to_use[car[1], car[0]] == car[4] + 20 + ncar_station_offset * 8:
                station_stalled[ncar_station_offset * len(cars) + car[4]] = True
                ints_to_use[car[1], car[0]] = 26
                cars_generated[c], usable_tracks[c] = [list(car)], [board_to_use[car[1], car[0]]]
                continue
            elif station_stalled[ncar_station_offset * len(cars) + car[4]]:
                station_stalled[ncar_station_offset * len(cars) + car[4]] = False
                cars_generated[c], usable_tracks[c] = [list(car)], [board_to_use[car[1], car[0]]]
                continue
        if ints_to_use[pos_ahead[1], pos_ahead[0]] in [8, 10, 12, 14, 25]:
            stalled[c] = True
            cars_generated[c], usable_tracks[c] = [list(car)], [board_to_use[car[1], car[0]]]
            continue
        elif stalled[c]:
            stalled[c] = False

        tile_ahead = board_to_use[pos_ahead[1], pos_ahead[0]]
        tile_ahead_redirect = directions[tile_ahead][car_direction]
        car_heat = heatmap_limits

        # tile picking
        tracks_to_check = ()
        if tile_ahead != 0:
            if permanent_tiles[pos_ahead[1], pos_ahead[0]]:
                if tile_ahead_redirect[0] == 2:
                    if car[5] == 1:
                        cars_generated[c], usable_tracks[c] = [[*car[:4], -1, 1]], [board_to_use[car[1], car[0]]]
                        continue
                    else:
                        return False
                else:
                    tracks_to_check = (tile_ahead,)
            else:
                if 5 <= tile_ahead <= 8 and tile_ahead_redirect[0] == 2:
                    tracks_to_check = (tile_ahead * 2 - 1 + car_direction // 2,)
                elif 1 <= tile_ahead <= 2:
                    if tile_ahead_redirect[0] == 2:
                        tracks_to_check = generatable3Ways[car_direction][tile_ahead - 1]
                    else:
                        if sum(heatmaps[:, car_direction, car[1], car[0]]) > 1:
                            tracks_to_check = (tile_ahead,)
                        else:
                            tracks_to_check = (tile_ahead, *generatable3Ways[car_direction][tile_ahead - 1])
                elif tile_ahead_redirect[0] == 2:
                    if car[5] == 1:
                        cars_generated[c], usable_tracks[c] = [[*car[:4], -1, 1]], [board_to_use[car[1], car[0]]]
                        continue
                    else:
                        return False
                else:
                    tracks_to_check = (tile_ahead,)
        else:
            # out of tracks / not going to beat best tracks?
            if available_tracks - 1 <= lowestTracksRemaining and car[5] == 1:
                tracks_to_check = (0,)
            elif car[5] == 1:
                decoy_placing[c] = True
                tracks_to_check = (0, *generatableTracks[car_direction])
            else:
                available_tracks -= 1
                tracks_to_check = generatableTracks[car_direction]

        # pre-anything track checks
        if (tracks_to_check[0] == 3 and car[5] != 0) or (21 <= tracks_to_check[0] <= 22 and car[5] != 2):
            return False

        # out of tracks / not going to beat best tracks?
        if available_tracks <= lowestTracksRemaining:
            return False

        # same tile crashing
        poses = [gen_car[-1][:2] for gen_car in cars_generated[:c]] + crashed_decoys.tolist() + stalled_cars

        if pos_ahead in poses:
            car_num = poses.index(pos_ahead)
            # if car_num < c:
            #     if poses[car_num] == cars_to_use[car_num][:2]:
            #         if len(cars_generated[car_num]) > 1:
            #             cars_generated[car_num].pop(-1)
            #             usable_tracks[car_num].pop(-1)
            #         else:
            #             if cars_generated[car_num][5] == 1:
            #                 cars_generated[car_num] = [[*car[:4], -1, 1]]
            #                 usable_tracks[car_num] = [board_to_use[car[1], car[0]]]
            #             else:
            #                 return False
            if tracks_to_check[0] == 0:
                tracks_to_check = (tracks_to_check[0],)
            elif car[5] == 1 and (c <= car_num or cars_generated[car_num][0][5] == 1):
                cars_generated[c], usable_tracks[c] = [[*car[:4], -1, 1]], [board_to_use[car[1], car[0]]]
                continue
            else:
                # print()
                # print(board_to_use)
                # print(cars_to_use)
                # print(iterations)
                # print(cars_generated)
                # print(crashed_decoys)
                # print(car, tracks_to_check)
                return False

        # head-on crashing
        # check if any of the cars are crashing head-on by comparing if the car
        # is ramming into cars that haven't yet generated, going opposite direction (head-on)
        prev_cars = [prev_car[:4] for prev_car in cars_to_use[c + 1:]]
        if [*pos_ahead, car[2] * -1, car[3] * -1] in prev_cars:
            if tracks_to_check[0] == 0:
                tracks_to_check = (tracks_to_check[0],)
            elif car[5] == 1:
                cars_generated[c], usable_tracks[c] = [[*car[:4], -1, 1]], [board_to_use[car[1], car[0]]]
                continue
            else:
                return False

        # tunnel crashing
        if 17 <= tile_ahead <= 20:
            if c > 0:
                # check if any cars are on the tunnel the car is trying to go through
                if pos_ahead in [gen_car[0][:2] for gen_car in cars_generated[:c]]:
                    return False

            tunnel_num = interactions[pos_ahead[1], pos_ahead[0]]
            tunnel_poses = np.argwhere(interactions == tunnel_num)

            if tunnel_poses[0, 1] == pos_ahead[0] and tunnel_poses[0, 0] == pos_ahead[1]:
                pos_ahead = list(tunnel_poses[1, ::-1])
            else:
                pos_ahead = list(tunnel_poses[0, ::-1])

        # track confirming
        for i, possibleTrack in enumerate(tracks_to_check):
            # car going to incorrect train
            if possibleTrack == 0:
                if car[:2] in poses:
                    continue
                cars_generated[c].append([*car[:4], -1, 1])
                usable_tracks[c].append(0)
                continue
            elif 17 <= possibleTrack <= 20:
                possible_redirect = tunnel_exit_velos[sum(board[interactions == tunnel_num]) - tile_ahead - 17]
            else:
                possible_redirect = directions[possibleTrack, car_direction]
            end_on = pos_ahead + possible_redirect

            # if placing a 3-way, check if it affects any cars that have come in that direction
            if possibleTrack == 3 or 21 <= possibleTrack <= 22:
                # if the finished car isn't in order, kill it
                if solved[ncar_station_offset][car[4] - 1] != car[4] - 1:
                    return False
                # if all stations weren't collected, kill it
                if np.count_nonzero(ints_to_use == car[4] + 20 + ncar_station_offset * 8) != 0:
                    return False
                solved[ncar_station_offset][car[4]] = car[4]
                just_solved[ncar_station_offset] = c
            elif 9 <= possibleTrack <= 16 and not 9 <= tile_ahead <= 16:
                # if placing a 3-way will affect another car going that direction, kill it
                if np.count_nonzero(
                        heatmaps[:, xyToIndex[possible_redirect[0] * -1, possible_redirect[1] * -1], pos_ahead[1],
                        pos_ahead[0]]) and not permanent_tiles[pos_ahead[1], pos_ahead[0]]:
                    continue
                # if the 3-way is placed on a semaphore, kill it
                elif ints_to_use[pos_ahead[1], pos_ahead[0]] == 25 or ints_to_use[pos_ahead[1], pos_ahead[0]] == 26:
                    continue

            # out of bounds?
            if not (0 <= end_on[1] < boardDims[0] and 0 <= end_on[0] < boardDims[1]):
                if car[5] == 1:
                    cars_generated[c].append([*pos_ahead, *possible_redirect, car[4], 1])
                    usable_tracks[c].append(possibleTrack)
                continue

            end_on_tile = board_to_use[end_on[1], end_on[0]]
            end_on_redirect = directions[end_on_tile, xyToIndex[possible_redirect[0], possible_redirect[1]]]
            possible_to_place_3way = (1 <= end_on_tile <= 2 or 5 <= end_on_tile <= 8) and\
                not permanent_tiles[end_on[1], end_on[0]]
            # checks if end_on_tile is going to crash the car and if it can't place a 3-way to fix it
            if end_on_redirect[0] == 2 and end_on_tile != 0 and not possible_to_place_3way:
                if car[5] == 1:
                    cars_generated[c].append([*pos_ahead, *possible_redirect, car[4], 1])
                    usable_tracks[c].append(possibleTrack)
                continue
            cars_generated[c].append([*pos_ahead, *possible_redirect, car[4], car[5]])
            if 17 <= possibleTrack <= 20:
                usable_tracks[c].append(board[pos_ahead[1], pos_ahead[0]])
            else:
                usable_tracks[c].append(possibleTrack)

                if available_semaphores > 0 and (1 <= possibleTrack <= 2 or 5 <= possibleTrack <= 8) and\
                        ints_to_use[pos_ahead[1], pos_ahead[0]] == 0:
                    semPos = semaphorePass[possibleTrack - 1]
                    pos_ahead_heat = sum(heatmaps[:, :, pos_ahead[1], pos_ahead[0]].flatten())
                    pos0_heat = sum(heatmaps[:, :, pos_ahead[1] + semPos[0, 1], pos_ahead[0] + semPos[0, 0]].flatten())
                    pos1_heat = sum(heatmaps[:, :, pos_ahead[1] + semPos[1, 1], pos_ahead[0] + semPos[1, 0]].flatten())
                    pos0_starting = 27 == ints_to_use[pos_ahead[1] + semPos[0, 1], pos_ahead[0] + semPos[0, 0]]
                    pos1_starting = 27 == ints_to_use[pos_ahead[1] + semPos[1, 1], pos_ahead[0] + semPos[1, 0]]

                    # have to change so index is correct for decoys as well
                    if car[5] == 0:
                        if car[0] == cars[car[4]][0] and car[1] == cars[car[4]][1] and\
                                ints_to_use[car[1], car[0]] == 27:
                            pos0_starting -= 1
                    elif car[5] == 1:
                        if car[0] == decoys[car[4]][0] and car[1] == decoys[car[4]][1] and\
                                ints_to_use[car[1], car[0]] == 27:
                            pos0_starting -= 1
                    else:
                        if car[0] == ncars[car[4]][0] and car[1] == ncars[car[4]][1] and\
                                ints_to_use[car[1], car[0]] == 27:
                            pos0_starting -= 1

                    # print(car, possibleTrack, pos_ahead_heat, pos0_heat, pos1_heat)
                    if not pos_ahead_heat and pos0_heat + pos1_heat - 1 - pos0_starting - pos1_starting == 0:
                        cars_generated[c].append(car)
                        usable_tracks[c].append(possibleTrack + 22)
        # if no tracks were generated, kill it
        if len(usable_tracks[c]) == 0:
            return False

    # kill branch if all cars are stalled
    if all(stalled) and len(cars_to_use) > 0:
        return False

    # if board is complete, register as solution
    solved_ncars = True
    if len(ncars) > 0:
        solved_ncars = solved[1][-1] == ncars[-1][4]
    if solved[0][-1] == cars[-1][4] and solved_ncars:
        if (len(cars_to_use) == 1 and cars_to_use[0][5] == 0) or mvmts_since_solved == 2:
            bestBoard = board_to_use
            bestInts = ints_to_use
            lowestTracksRemaining = available_tracks
            semaphoresRemaining = available_semaphores
            print(f'Found a new minimum solution! ({round((time.time() - boardSolveTime) * 10e3) / 10e3}s)')
            boardSolveTime = time.time()
            # print(iterations)
            # statistics.append([board_to_use, cars_to_use])
            return
        else:
            mvmts_since_solved += 1
    if just_solved[0] != -1:
        sc = just_solved[0]
        cars_generated.pop(sc)
        usable_tracks.pop(sc)
        stalled.pop(sc)
        decoy_placing.pop(sc)
    if just_solved[1] != -1:
        sc = just_solved[1] - int(just_solved[0] > -1)
        cars_generated.pop(sc)
        usable_tracks.pop(sc)
        stalled.pop(sc)
        decoy_placing.pop(sc)
    car_combos = list(itertools.product(*cars_generated))
    track_combos = list(itertools.product(*usable_tracks))

    # print(board_to_use)
    # print()
    # print(ints_to_use)
    # print(cars_to_use)
    # print(cars_generated)
    # print(track_combos)
    # print(usable_tracks)
    # print(solved)
    # print(available_tracks)
    # print(station_stalled)
    # print(iterations)
    # print()

    for combo_num, track_combo in enumerate(track_combos):
        amt_placed_decoy = 0
        placed_semaphores = 0
        same_tile_mistake = False
        board_to_pass = np.array(board_to_use)
        ints_to_pass = np.array(ints_to_use)
        stalled_to_pass = list(stalled)
        heatmap_limits_pass = np.array(heatmap_limits)
        # car_combo = [0] * len(track_combo)
        # for i, track in enumerate(track_combo):
        #     car = cars_to_use[i]
        #     redirect = directions[track][xyToIndex[car[2], car[3]]]
        #     car_combo[i] = [car[0] + car[2], car[1] + car[3], redirect[0], redirect[1], car[4], car[5]]
        # print(car_combo)
        # print(car_combos[combo_num])
        # print(car_combo[0] == car_combos[combo_num][0])
        # print()
        for i, car in enumerate(car_combos[combo_num]):
            if car[:2] in [c[:2] for c in car_combos[combo_num][i + 1:]]:
                print(cars_generated)
                same_tile_mistake = True
                break
            track_placing = track_combo[i]
            if decoy_placing[i] and track_placing != 0:
                # out of tracks / not going to beat best tracks?
                if available_tracks - amt_placed_decoy - 1 <= lowestTracksRemaining:
                    amt_placed_decoy = -1
                    break
                amt_placed_decoy += 1
            if 22 < track_placing:
                if available_semaphores - placed_semaphores - 1 >= 0:
                    placed_semaphores += 1
                else:
                    continue
                board_to_pass[car[1] + car[3], car[0] + car[2]] = track_placing - 22
                ints_to_pass[car[1] + car[3], car[0] + car[2]] = 25
                stalled_to_pass[i] = True
            elif track_placing != 0:
                board_to_pass[car[1], car[0]] = track_placing

            if 16 <= ints_to_pass[car[1], car[0]] <= 19 or ints_to_pass[car[1], car[0]] == 24:
                car_direction = xyToIndex[car[2], car[3]]
                car_index = car[4] + car[5] * len(cars)
                if len(decoys) == 0 and car[5] == 2:
                    car_index = car[4] + len(cars)
                elif car[5] == 2:
                    car_index = car[4] + len(cars) + len(decoys)
                if heatmap_limits_pass[car_index, car_direction, car[1], car[0]] < 9 and not stalled[i]:
                    heatmap_limits_pass[car_index, :][heatmap_limits_pass[car_index, :] > 0] += 1
                elif not heatmap_limits_pass[car_index, car_direction, car[1], car[0]] < 9:
                    return False
        if same_tile_mistake:
            continue
        if amt_placed_decoy == -1:
            return
        # statistics.append([board_to_pass, list(car_combos[combo_num])])
        generate_tracks(list(car_combos[combo_num]), board_to_pass, ints_to_pass,
                        available_tracks - amt_placed_decoy, np.array(heatmaps), [list(solved[0]), list(solved[1])],
                        stalled_to_pass, np.array(switch_queue), list(station_stalled),
                        np.array(crashed_decoys), mvmts_since_solved, available_semaphores - placed_semaphores,
                        heatmap_limits_pass)


l, c, sr, mhv = [], [], [], []
statistics = []
# RE-RUN 8-3A
# use 11-8b for visualizer
# 10-7 problem needs to be fixed where semaphores only check for last generated car
for lvl in [lc.levels["10-1A"]]:
# for key in lc.world10:
#     lvl = lc.world10[key]
#     print(key)
    lowestTracksRemaining = -1
    semaphoresRemaining = -1
    # 4_3b (3m), 4_5 (5m), 4_5a (5m), 4_8b (1m), 4_9a (7m) take excessively long
    # 5_4c (23m), 5_5b (4h+??) takes ungodly long
    # 4_6b, 4_9b (3h23m) take ungodly long
    if len(lvl) == 4:
        board, cars, maxTracks, interactions = lvl
        decoys = []
        semaphores = 0
        ncars = []
    elif len(lvl) == 5:
        board, cars, maxTracks, interactions, decoys = lvl
        if decoys is None:
            decoys = []
        semaphores = 0
        ncars = []
    elif len(lvl) == 6:
        board, cars, maxTracks, interactions, decoys, semaphores = lvl
        if decoys is None:
            decoys = []
        ncars = []
    else:
        board, cars, maxTracks, interactions, decoys, semaphores, ncars = lvl
        if decoys is None:
            decoys = []

    for num, car in enumerate(cars):
        car.append(num)
        car.append(0)
    for num, car in enumerate(decoys):
        car.append(num)
        car.append(1)
    for num, car in enumerate(ncars):
        car.append(num)
        car.append(2)
    #cars = np.asarray(cars)
    #cars[:, :2] = cars[:, 1::-1]
    bestBoard = None

    if interactions is None:
        interactions = np.zeros(board.shape)
    print(board)
    for car in cars + decoys + ncars:
        interactions[car[1], car[0]] = 27

    iterations = 0
    completeBoards = []
    testlist = []

    boardDims = np.shape(board)
    permanent_tiles = board != 0
    tunnel_exit_velos = np.asarray(((-1, 0), (0, -1), (1, 0), (0, 1)))
    swap_positions = [np.argwhere(interactions == switch_num + 15) for switch_num in range(1, 5)]

    print('Generating...')
    boardSolveTime = time.time()
    startTime = time.time()

    # cars_to_use = list(cars + decoys + ncars)
    # board_to_use = np.array(board)
    # ints_to_use = np.array(interactions)
    # available_tracks = maxTracks
    # heatmaps = np.zeros((len(cars + decoys + ncars), 4, *boardDims))
    # solved = [[-1] * len(cars), [-1] * len(ncars)]
    # stalled = [False] * len(cars + decoys + ncars)
    # switch_queue = np.full((len(cars + decoys + ncars), 2), -1)
    # station_stalled = [False] * len(cars + ncars)
    # crashed_decoys = np.full((len(decoys), 2 ), -1)
    # mvmts_since_stalled = 0
    # available_semaphores = semaphores
    # heatmap_limits = np.zeros((len(cars + decoys + ncars), 4, *boardDims))
    generate_tracks(list(cars + decoys + ncars), np.array(board), np.array(interactions), maxTracks,
                    np.zeros((len(cars + decoys + ncars), 4, *boardDims)), [[-1] * len(cars), [-1] * len(ncars)],
                    [False] * len(cars + decoys + ncars), np.full((len(cars + decoys + ncars), 2), -1),
                    [False] * len(cars + ncars), np.full((len(decoys), 2), -1), 0, semaphores,
                    np.zeros((len(cars + decoys + ncars), 4, *boardDims)))

    print(f'\nFinished in: {round((time.time() - startTime) * 10e3) / 10e3}s')
    print(f'Iterations Processed: {"{:,}".format(iterations)}')
    print(f'Tracks Remaining: {lowestTracksRemaining}')
    if lowestTracksRemaining > 0:
        print('--- TRACK SAVED --- TRACK SAVED --- TRACK SAVED --- TRACK SAVED ---')
    bestBoard[permanent_tiles] = board[permanent_tiles]
    print(bestBoard)
    if semaphores > 0:
        print(f'Semaphores Remaining: {semaphoresRemaining}')
    for semaphore_pos in np.argwhere((bestInts == 25) | (bestInts == 26)):
        if interactions[semaphore_pos[0], semaphore_pos[1]] == 0:
            print(f'~~ Semaphore at: {semaphore_pos[::-1]} (On a [{bestBoard[semaphore_pos[0], semaphore_pos[1]]}] tile)')
    # if lowestTracksRemaining > 0:
        # statistics.append([key, lowestTracksRemaining])
    print('--------------------------------------------------')
    if bestBoard is None:
        break
# print(statistics)
#     l.append(key)
#     c.append(len(cars))
#     sr.append(np.count_nonzero(((16 <= interactions) & (interactions <= 19)) | (interactions == 24)))
#     mhv.append(highestHeatmap)
# data = {
#     'Level': l,
#     '# of Cars': c,
#     '# of Switch Rails': sr,
#     'Max Heatmap Value': mhv
# }
#
# df = pd.DataFrame(data)
# df.to_csv('Railbound.csv', index=False)
# print(df)
print(f'\nFully Complete in: {round((time.time() - startstarttime) * 10e3) / 10e3}s')
