import functools
import typing

import numpy as np  # used for absolutely everything.
import time  # used for time reports on minimum solutions and final completion
import json
from timeit import timeit  # used for line testing
import itertools  # used for generating different board combinations
from collections import defaultdict, deque
from classes import Track as T
from classes import Mod as M
from classes import Direction as D
from classes import Car as C
from classes import CarType as CT

program_start_time = time.time()
# HYPERPARAMETERS
heatmap_limit_limit = 9
decoy_heatmap_limit = 15
gen_type: typing.Literal["DFS", "BFS"] = "DFS"

# generable_tracks lists each track the car can access from each direction.
generable_tracks = {
    D.LEFT: (T.HORIZONTAL_TRACK, T.BOTTOM_RIGHT_TURN, T.TOP_RIGHT_TURN),
    D.RIGHT: (T.HORIZONTAL_TRACK, T.BOTTOM_LEFT_TURN, T.TOP_LEFT_TURN),
    D.DOWN: (T.VERTICAL_TRACK, T.TOP_RIGHT_TURN, T.TOP_LEFT_TURN),
    D.UP: (T.VERTICAL_TRACK, T.BOTTOM_RIGHT_TURN, T.BOTTOM_LEFT_TURN),
}
# generable3_ways lists the possible 3-ways a car can make depending on
# what track it intersects, and what direction the car is facing.
generable3_ways = {
    D.LEFT: {
        T.HORIZONTAL_TRACK: (T.BOTTOM_RIGHT_LEFT_3WAY, T.TOP_RIGHT_LEFT_3WAY),
        T.VERTICAL_TRACK: (T.BOTTOM_RIGHT_TOP_3WAY, T.TOP_RIGHT_BOTTOM_3WAY),
        T.BOTTOM_LEFT_TURN: (T.BOTTOM_LEFT_RIGHT_3WAY,),
        T.TOP_LEFT_TURN: (T.TOP_LEFT_RIGHT_3WAY,),
    },
    D.RIGHT: {
        T.HORIZONTAL_TRACK: (T.BOTTOM_LEFT_RIGHT_3WAY, T.TOP_LEFT_RIGHT_3WAY),
        T.VERTICAL_TRACK: (T.BOTTOM_LEFT_TOP_3WAY, T.TOP_LEFT_BOTTOM_3WAY),
        T.BOTTOM_RIGHT_TURN: (T.BOTTOM_RIGHT_LEFT_3WAY,),
        T.TOP_RIGHT_TURN: (T.TOP_RIGHT_LEFT_3WAY,),
    },
    D.DOWN: {
        T.HORIZONTAL_TRACK: (T.TOP_RIGHT_LEFT_3WAY, T.TOP_LEFT_RIGHT_3WAY),
        T.VERTICAL_TRACK: (T.TOP_RIGHT_BOTTOM_3WAY, T.TOP_LEFT_BOTTOM_3WAY),
        T.BOTTOM_RIGHT_TURN: (T.BOTTOM_RIGHT_TOP_3WAY,),
        T.BOTTOM_LEFT_TURN: (T.BOTTOM_LEFT_TOP_3WAY,),
    },
    D.UP: {
        T.HORIZONTAL_TRACK: (T.BOTTOM_RIGHT_LEFT_3WAY, T.BOTTOM_LEFT_RIGHT_3WAY),
        T.VERTICAL_TRACK: (T.BOTTOM_RIGHT_TOP_3WAY, T.BOTTOM_LEFT_TOP_3WAY),
        T.TOP_RIGHT_TURN: (T.TOP_RIGHT_BOTTOM_3WAY,),
        T.TOP_LEFT_TURN: (T.TOP_LEFT_BOTTOM_3WAY,),
    },
}
# semaphore_pass lists the relative tiles where a car must be to trigger a semaphore.
# For example, a car would have to be on the tile to either the LEFT or RIGHT of a
# HORIZONTAL_TRACK with a semaphore on it to trigger the semaphore.
semaphore_pass = {
    T.HORIZONTAL_TRACK: (D.LEFT, D.RIGHT),
    T.VERTICAL_TRACK: (D.DOWN, D.UP),
    T.BOTTOM_RIGHT_TURN: (D.DOWN, D.RIGHT),
    T.BOTTOM_LEFT_TURN: (D.DOWN, D.LEFT),
    T.TOP_RIGHT_TURN: (D.UP, D.RIGHT),
    T.TOP_LEFT_TURN: (D.UP, D.LEFT),
}
# directions lists instructions on where to move a car depending on what track it's on, and what direction it's facing.
# For example, a car on a BOTTOM_RIGHT_TURN and facing UP will move to the RIGHT.
# CRASH indicates that the car will crash, and UNKNOWN indicates
# the car's movement is not yet determined, but it won't crash.
directions = {
    T.EMPTY: {D.LEFT: D.CRASH, D.RIGHT: D.CRASH, D.DOWN: D.CRASH, D.UP: D.CRASH},
    T.HORIZONTAL_TRACK: {
        D.LEFT: D.LEFT,
        D.RIGHT: D.RIGHT,
        D.DOWN: D.CRASH,
        D.UP: D.CRASH,
    },
    T.VERTICAL_TRACK: {D.LEFT: D.CRASH, D.RIGHT: D.CRASH, D.DOWN: D.DOWN, D.UP: D.UP},
    T.CAR_ENDING_TRACK: {
        D.LEFT: D.CRASH,
        D.RIGHT: D.UNKNOWN,
        D.DOWN: D.CRASH,
        D.UP: D.CRASH,
    },
    T.ROADBLOCK: {D.LEFT: D.CRASH, D.RIGHT: D.CRASH, D.DOWN: D.CRASH, D.UP: D.CRASH},
    T.BOTTOM_RIGHT_TURN: {
        D.LEFT: D.DOWN,
        D.RIGHT: D.CRASH,
        D.DOWN: D.CRASH,
        D.UP: D.RIGHT,
    },
    T.BOTTOM_LEFT_TURN: {
        D.LEFT: D.CRASH,
        D.RIGHT: D.DOWN,
        D.DOWN: D.CRASH,
        D.UP: D.LEFT,
    },
    T.TOP_RIGHT_TURN: {D.LEFT: D.UP, D.RIGHT: D.CRASH, D.DOWN: D.RIGHT, D.UP: D.CRASH},
    T.TOP_LEFT_TURN: {D.LEFT: D.CRASH, D.RIGHT: D.UP, D.DOWN: D.LEFT, D.UP: D.CRASH},
    T.BOTTOM_RIGHT_LEFT_3WAY: {
        D.LEFT: D.DOWN,
        D.RIGHT: D.RIGHT,
        D.DOWN: D.CRASH,
        D.UP: D.RIGHT,
    },
    T.BOTTOM_RIGHT_TOP_3WAY: {
        D.LEFT: D.DOWN,
        D.RIGHT: D.CRASH,
        D.DOWN: D.DOWN,
        D.UP: D.RIGHT,
    },
    T.BOTTOM_LEFT_RIGHT_3WAY: {
        D.LEFT: D.LEFT,
        D.RIGHT: D.DOWN,
        D.DOWN: D.CRASH,
        D.UP: D.LEFT,
    },
    T.BOTTOM_LEFT_TOP_3WAY: {
        D.LEFT: D.CRASH,
        D.RIGHT: D.DOWN,
        D.DOWN: D.DOWN,
        D.UP: D.LEFT,
    },
    T.TOP_RIGHT_LEFT_3WAY: {
        D.LEFT: D.UP,
        D.RIGHT: D.RIGHT,
        D.DOWN: D.RIGHT,
        D.UP: D.CRASH,
    },
    T.TOP_RIGHT_BOTTOM_3WAY: {
        D.LEFT: D.UP,
        D.RIGHT: D.CRASH,
        D.DOWN: D.RIGHT,
        D.UP: D.UP,
    },
    T.TOP_LEFT_RIGHT_3WAY: {
        D.LEFT: D.LEFT,
        D.RIGHT: D.UP,
        D.DOWN: D.LEFT,
        D.UP: D.CRASH,
    },
    T.TOP_LEFT_BOTTOM_3WAY: {
        D.LEFT: D.CRASH,
        D.RIGHT: D.UP,
        D.DOWN: D.LEFT,
        D.UP: D.UP,
    },
    T.LEFT_FACING_TUNNEL: {
        D.LEFT: D.CRASH,
        D.RIGHT: D.UNKNOWN,
        D.DOWN: D.CRASH,
        D.UP: D.CRASH,
    },
    T.RIGHT_FACING_TUNNEL: {
        D.LEFT: D.UNKNOWN,
        D.RIGHT: D.CRASH,
        D.DOWN: D.CRASH,
        D.UP: D.CRASH,
    },
    T.DOWN_FACING_TUNNEL: {
        D.LEFT: D.CRASH,
        D.RIGHT: D.CRASH,
        D.DOWN: D.CRASH,
        D.UP: D.UNKNOWN,
    },
    T.UP_FACING_TUNNEL: {
        D.LEFT: D.CRASH,
        D.RIGHT: D.CRASH,
        D.DOWN: D.UNKNOWN,
        D.UP: D.CRASH,
    },
    T.NCAR_ENDING_TRACK_RIGHT: {
        D.LEFT: D.CRASH,
        D.RIGHT: D.UNKNOWN,
        D.DOWN: D.CRASH,
        D.UP: D.CRASH,
    },
    T.NCAR_ENDING_TRACK_LEFT: {
        D.LEFT: D.UNKNOWN,
        D.RIGHT: D.CRASH,
        D.DOWN: D.CRASH,
        D.UP: D.CRASH,
    },
}


def tail_call_gen(func: typing.Callable[[...], typing.Generator]):
    """
    Decorator to implement tail call optimisation as a generator

    instead of calling itself the tail of the function should
    yield the arguments for its call. the facilitator can then
    handle the calls in a way far more lightweight than the call
    stack, and avoiding blowing the stack with really deep recursion.
    """

    @functools.wraps(func)
    def facilitator(*args):
        if gen_type == "DFS":
            argslist = deque([args])

            while argslist:
                args = [*func(*argslist.pop())]
                # for arg in args:
                #     h = hash(rb.State(*arg))
                #     hashes[h].append(iterations)
                #     if len(hashes[h]) > 1:
                #         print('hash collision found...')
                #         print(hashes)
                #         print('-' * 25)
                #         quit()
                argslist.extend(reversed(args))
        elif gen_type == "BFS":
            argslist = {
                track_count: deque() for track_count in range(available_tracks, -1, -1)
            }
            argslist[available_tracks].append(args)

            for queue in argslist.values():
                while queue:
                    for args in func(*queue.popleft()):
                        if lowest_tracks_remaining != -1:
                            return
                        # 3 is the index of available_tracks.
                        argslist[args[3]].append(args)

    return facilitator


@tail_call_gen
def generate_tracks(
    cars_to_use: list[C],
    board_to_use: dict[tuple[int, int], T],
    mods_to_use: dict[tuple[int, int], M],
    available_tracks: int,
    heatmaps: np.ndarray,
    solved: list[list[int], list[int]],
    stalled: list[bool],
    switch_queue: list[tuple[int, int]],
    station_stalled: list[bool],
    crashed_decoys: list[C],
    mvmts_since_solved: int,
    available_semaphores: int,
    heatmap_limits: np.ndarray,
):
    """Generate tracks for the given frame data.

    Parameters:
        cars_to_use: The cars in the frame.
        board_to_use: The board (tracks) in the frame.
        mods_to_use: The track mods in the frame.
        available_tracks: The remaining tracks.
        heatmaps: The heat of each possible car configuration.
            Heat is the amount of times a car has been at the same position
            with the same direction. It is used to prevent looping.
        solved: 2 lists of each NORMAL and NUMERAL car num that have reached
            their train.
        stalled: Whether each car is stalled or not. Stalled means that the car
            cannot move due to being behind a gate or semaphore.
        switch_queue: The position of a gate if it is trying to close on a car,
            for each car. The position is (-1, -1) if no gate is queued on top
            of the car.
        station_stalled: Whether each car is being stalled by a station or not.
            It is different from normal stalling such that station stalling
            always lasts 2 frames.
        crashed_decoys: The positions of each DECOY that have crashed.
        mvmts_since_solved: The frames since all cars reached their trains.
            It is used to consider a level with decoys solved after 2 frames.
        available_semaphores: The remaining semaphores.
        heatmap_limits: The upper limit for each value in heatmaps.
            It is used to prevent looping.
    """
    global \
        iterations, \
        best_board, \
        best_mods, \
        lowest_tracks_remaining, \
        board_solve_time, \
        semaphores_remaining, \
        hashes

    # Remove decoys from generation if they crashed last frame, and add the pos to crashed_decoys.
    crashed = [
        i
        for i in range(len(cars_to_use) - 1, -1, -1)
        if cars_to_use[i].type is CT.CRASHED
    ]
    for crashed_decoy in crashed:
        decoy_car = cars_to_use[crashed_decoy]
        crashed_decoys.append(decoy_car)
        cars_to_use.pop(crashed_decoy)
        stalled.pop(crashed_decoy)

    # Add stalled_cars to a list for crashing. this could likely be changing to be faster, but I did it
    # this way because of how the game treats crashes. on 7-3B, there is a false solution that could save 1 track
    # but doesn't actually work because cars crash before they move through a gate, if the gate is opened on the
    # same frame of a crash.
    stalled_cars: list[C] = [car for i, car in enumerate(cars_to_use) if stalled[i]]

    # PRE-GENERATION SECTION 1 (switches, semaphores, heatmap_limits)
    for c, car in enumerate(cars_to_use):
        # If a car is no longer under a queued gate, close it and remove it from the queue.
        queued_gate = switch_queue[c]
        if queued_gate[0] != -1 and car.pos != queued_gate:
            mods_to_use[queued_gate] = M.CLOSED_GATE
            switch_queue[c] = (-1, -1)
        mod = mods[car.pos]
        mod_num = mod_nums[car.pos]

        # If a car steps on a switch...
        if not stalled[c] and mod is M.SWITCH:
            # Close/open related gates.
            for gate_pos in gate_poses[mod_num]:
                gate = mods_to_use[gate_pos]
                if gate is M.OPEN_GATE:
                    # Do a check to see if any cars are under the gate for switch_queue. could possibly be
                    # faster by not having to iterate over every car somehow?
                    for car_under_gate in cars_to_use:
                        if car_under_gate.pos == gate_pos:
                            switch_queue[car.car_index(cars, decoys, ncars)] = gate_pos
                            break
                    else:
                        mods_to_use[gate_pos] = M.CLOSED_GATE
                else:
                    mods_to_use[gate_pos] = M.OPEN_GATE

            # Swap related swapping tracks.
            for swap_pos in swapping_track_poses[mod_num]:
                board_to_use[swap_pos] = board_to_use[swap_pos].swap_track()
        elif not stalled[c] and mod is M.SWITCH_RAIL:
            board_to_use[car.pos] = board_to_use[car.pos].swap_track()

        # Skip semaphore and heatmap checks if car (decoy) is at the border,
        # since car.pos_ahead is out of bounds otherwise and raises an error.
        if car.border_crash(board_dims):
            continue

        # If the car is moving, add to heatmap
        if (
            not (
                car.type is not CT.DECOY
                and (
                    car.on_correct_station(mods_to_use[car.pos], mod_nums[car.pos])
                    or station_stalled[car.car_index(cars, decoys, ncars)]
                )
            )
            and not mods_to_use[car.pos_ahead].is_gate_or_sem()
        ):
            # Increase heatmap limit to 1 if car is going to a new tile.
            car_index = car.car_index(cars, decoys, ncars)
            if (
                heatmap_limits[car_index, car.direction.value, car.pos[0], car.pos[1]]
                == 0
            ):
                heatmap_limits[
                    car_index, car.direction.value, car.pos[0], car.pos[1]
                ] += 1
            # Decoys have no heatmap limit since they can loop, so I set it to a soft 15 to make the program
            # run faster. Increase if the board requires it.
            heatmaps[car_index, car.direction.value, car.pos[0], car.pos[1]] += 1
            heat = heatmaps[car_index, car.direction.value, car.pos[0], car.pos[1]]
            if car.type is CT.DECOY:
                if heat > decoy_heatmap_limit:
                    return
            else:
                if (
                    heat
                    > heatmap_limits[
                        car_index, car.direction.value, car.pos[0], car.pos[1]
                    ]
                ):
                    return

        # Semaphore processing
        if mods_to_use[car.pos_ahead] is M.SEMAPHORE:
            semPos = semaphore_pass[board_to_use[car.pos_ahead]]
            # Check if any cars are passing the semaphore, and open it if they are
            for p_car in cars_to_use:
                if p_car is car:
                    continue
                sem_pos0 = semPos[0].add_vector(car.pos_ahead)
                pos0 = p_car.pos == sem_pos0 and not (
                    p_car.direction is semPos[0].reverse()
                )
                sem_pos1 = semPos[1].add_vector(car.pos_ahead)
                pos1 = p_car.pos == sem_pos1 and not (
                    p_car.direction is semPos[1].reverse()
                )
                if pos0 or pos1:
                    # heatmaps[car_index, car.direction.value, car.pos[0], car.pos[1]] -= 1
                    mods_to_use[car.pos_ahead] = M.DEACTIVATED_MOD
                    break

    # could probably use numpy lists and not use pops to make program faster, but this works for now.
    cars_generated: list[list[C]] = [[] for _ in cars_to_use]
    usable_tracks: list[list[T]] = [[] for _ in cars_to_use]
    # decoy_placing is used to list which decoys are attempting to
    # actually place a track to better calculate available_tracks.
    decoy_placing: list[bool] = [False] * len(decoys)
    just_solved: list[int | None] = [None, None]

    # POST-GENERATION CODE
    for c, car in enumerate(cars_to_use):
        iterations += 1
        # print()
        # T.print_board(board_to_use)
        # M.print_board(mods_to_use)
        # print(car)
        # print(cars_generated)
        # print(iterations)

        # Skip semaphore and heatmap checks if car (decoy) is at the border,
        # since car.pos_ahead is out of bounds otherwise and raises an error.
        if car.border_crash(board_dims):
            cars_generated[c], usable_tracks[c] = [car.crash()], [board_to_use[car.pos]]
            continue

        # Station processing
        if car.type is not CT.DECOY:
            car_index = car.car_index(cars, decoys, ncars)
            if car.on_correct_station(mods_to_use[car.pos], mod_nums[car.pos]):
                station_stalled[car_index] = True
                mods_to_use[car.pos] = M.DEACTIVATED_MOD
                cars_generated[c], usable_tracks[c] = [car], [board_to_use[car.pos]]
                continue
            elif station_stalled[car_index]:
                station_stalled[car_index] = False
                cars_generated[c], usable_tracks[c] = [car], [board_to_use[car.pos]]
                continue
        # Gate processing
        if mods_to_use[car.pos_ahead].is_gate_or_sem():
            stalled[c] = True
            cars_generated[c], usable_tracks[c] = [car], [board_to_use[car.pos]]
            continue
        if stalled[c]:
            stalled[c] = False

        tile_ahead = board_to_use[car.pos_ahead]
        tile_ahead_redirect = directions[tile_ahead][car.direction]

        # tile picking
        tracks_to_check = tuple()
        if not tile_ahead.is_empty():
            if car.pos_ahead in permanent_track_poses:
                if tile_ahead_redirect is D.CRASH:
                    if car.type is CT.DECOY:
                        cars_generated[c] = [car.crash()]
                        usable_tracks[c] = [board_to_use[car.pos]]
                        continue
                    else:
                        return
                else:
                    tracks_to_check = (tile_ahead,)
            else:
                if tile_ahead_redirect is D.CRASH:
                    if tile_ahead.is_turn() or tile_ahead.is_straight():
                        tracks_to_check = generable3_ways[car.direction][tile_ahead]
                    elif car.type is CT.DECOY:
                        cars_generated[c] = [car.crash()]
                        usable_tracks[c] = [board_to_use[car.pos]]
                        continue
                    else:
                        return
                elif (
                    tile_ahead.is_straight()
                ):  # This if statement is done like this so that more checks have to be
                    # done before the program does summation on heatmaps, making it faster.
                    if (
                        sum(heatmaps[:, car.direction.value, car.pos[0], car.pos[1]])
                        > 1
                    ):
                        tracks_to_check = (tile_ahead,)
                    else:
                        tracks_to_check = (
                            tile_ahead,
                            *generable3_ways[car.direction][tile_ahead],
                        )
                else:
                    tracks_to_check = (tile_ahead,)
        else:
            # out of tracks / not going to beat best tracks?
            if car.type is CT.DECOY:
                if available_tracks - 1 <= lowest_tracks_remaining:
                    tracks_to_check = (T.EMPTY,)
                else:
                    decoy_placing[car.num] = True
                    tracks_to_check = (T.EMPTY, *generable_tracks[car.direction])
            else:
                available_tracks -= 1
                tracks_to_check = generable_tracks[car.direction]

        # false train checks to make sure cars dont go to the wrong train
        if (tracks_to_check[0].is_car_ending_track() and car.type is not CT.NORMAL) or (
            tracks_to_check[0].is_ncar_ending_track() and car.type is not CT.NUMERAL
        ):
            return

        # out of tracks / not going to beat best tracks?
        if available_tracks <= lowest_tracks_remaining:
            return

        # same tile crashing
        crash_cars = (
            [gen_car[0] for gen_car in cars_generated if gen_car]
            + crashed_decoys
            + stalled_cars
        )
        if car.same_tile_crashes(crash_cars) or car.head_on_crashes(cars_to_use):
            if tracks_to_check[0].is_empty():
                tracks_to_check = (tracks_to_check[0],)
            elif car.type is CT.DECOY:
                cars_generated[c] = [car.crash()]
                usable_tracks[c] = [board_to_use[car.pos]]
                continue
            else:
                return

        # track confirming
        for i, possibleTrack in enumerate(tracks_to_check):
            # crash a decoy if it chooses to crash
            if possibleTrack.is_empty():
                cars_generated[c].append(car.crash())
                usable_tracks[c].append(T.EMPTY)
                continue
            elif possibleTrack.is_tunnel():
                mod_num = mod_nums[car.pos_ahead]
                tunnel_pos0, tunnel_pos1 = tunnel_poses[mod_num]
                if tunnel_pos0 == car.pos_ahead:
                    car.pos_ahead = tunnel_pos1
                else:
                    car.pos_ahead = tunnel_pos0

                possible_redirect = tunnel_exit_velos[board[car.pos_ahead]]
            else:
                possible_redirect = directions[possibleTrack][car.direction]

            # if placing a 3-way, check if it affects any cars that have come in that direction
            if (
                possibleTrack.is_car_ending_track()
                or possibleTrack.is_ncar_ending_track()
            ):
                # if the finished car isn't in order, kill it
                is_numeral = 1 if car.type is CT.NUMERAL else 0
                any_solved = solved[is_numeral]
                if (not any_solved and car.num != 0) or (
                    any_solved and solved[is_numeral][-1] != car.num - 1
                ):
                    return
                # if all stations weren't collected, kill it
                for station_pos in station_poses[car.get_station()][car.num]:
                    if mods_to_use[station_pos] is not M.DEACTIVATED_MOD:
                        return
                solved[is_numeral].append(car.num)
                just_solved[is_numeral] = c
                cars_generated[c].append(
                    C(car.pos_ahead, car.direction, car.num, car.type)
                )
                usable_tracks[c].append(possibleTrack)
                continue
            elif possibleTrack.is_3way() and not tile_ahead.is_3way():
                # if placing a 3-way will affect another car going that direction, kill it
                if np.count_nonzero(
                    heatmaps[
                        :,
                        possible_redirect.reverse().value,
                        car.pos_ahead[0],
                        car.pos_ahead[1],
                    ]
                ):
                    continue
                # if the 3-way is placed on a semaphore, kill it
                elif (
                    mods_to_use[car.pos_ahead] is M.SEMAPHORE
                    or mods_to_use[car.pos_ahead] is M.DEACTIVATED_MOD
                ):
                    continue

            end_on = possible_redirect.add_vector(car.pos_ahead)
            # kill out of bounds cars, crash decoys
            if not (0 <= end_on[0] < board_dims[0] and 0 <= end_on[1] < board_dims[1]):
                if car.type is CT.DECOY:
                    cars_generated[c].append(
                        C(car.pos_ahead, possible_redirect, car.num, car.type)
                    )
                    usable_tracks[c].append(possibleTrack)
                continue

            end_on_tile = board_to_use[end_on]
            end_on_redirect = directions[end_on_tile][possible_redirect]
            possible_to_place_3way = (
                end_on_tile.is_straight() or end_on_tile.is_turn()
            ) and end_on not in permanent_track_poses
            # checks if end_on_tile is going to crash the car and if it can't place a 3-way to fix it
            if (
                end_on_redirect is D.CRASH
                and not end_on_tile.is_empty()
                and not possible_to_place_3way
            ):
                if car.type is CT.DECOY:
                    cars_generated[c].append(
                        C(car.pos_ahead, possible_redirect, car.num, car.type)
                    )
                    usable_tracks[c].append(possibleTrack)
                continue
            cars_generated[c].append(
                C(car.pos_ahead, possible_redirect, car.num, car.type)
            )
            if possibleTrack.is_tunnel():
                usable_tracks[c].append(board[car.pos_ahead])
            else:
                usable_tracks[c].append(possibleTrack)

                # checks if the car can also place a semaphore.
                if (
                    available_semaphores > 0
                    and (possibleTrack.is_straight() or possibleTrack.is_turn())
                    and mods_to_use[car.pos_ahead] is M.EMPTY
                    and not sum(
                        heatmaps[:, :, car.pos_ahead[0], car.pos_ahead[1]].flatten()
                    )
                ):
                    semPos = semaphore_pass[possibleTrack]
                    sem_pos0 = semPos[0].add_vector(car.pos_ahead)
                    sem_pos1 = semPos[1].add_vector(car.pos_ahead)
                    pos0_heat = sum(heatmaps[:, :, sem_pos0[0], sem_pos0[1]].flatten())
                    pos1_heat = sum(heatmaps[:, :, sem_pos1[0], sem_pos1[1]].flatten())
                    pos0_starting = (
                        mods_to_use[sem_pos0[0], sem_pos0[1]] is M.STARTING_CAR_TILE
                    )
                    pos1_starting = (
                        mods_to_use[sem_pos1[0], sem_pos1[1]] is M.STARTING_CAR_TILE
                    )
                    starting_tile_heat = 0

                    if mods_to_use[car.pos] is M.STARTING_CAR_TILE:
                        if car.type is CT.NORMAL:
                            starting_tile_heat = car.pos == cars[car.num].pos
                        elif car.type is CT.DECOY:
                            starting_tile_heat = car.pos == decoys[car.num].pos
                        else:
                            starting_tile_heat = car.pos == ncars[car.num].pos

                    if (
                        pos0_heat
                        + pos1_heat
                        - pos0_starting
                        - pos1_starting
                        + starting_tile_heat
                        == 1
                    ):
                        cars_generated[c].append(car)
                        # a semaphore track is basically just track index + 22 because it's a simple way
                        # to tell the program to place a semaphore without interfering with track indices.
                        usable_tracks[c].append(
                            possibleTrack.add_placeholder_semaphore()
                        )
        # if no tracks were generated, kill it
        if len(usable_tracks[c]) == 0:
            return

    # kill branch if all cars are stalled
    if all(stalled) and len(cars_to_use) > 0:
        return
    # if board is complete, register as solution
    if len(solved[0]) == len(cars) and len(solved[1]) == len(ncars):
        if cars_to_use[0].type is not CT.DECOY or mvmts_since_solved == 2:
            best_board = board_to_use
            best_mods = mods_to_use
            lowest_tracks_remaining = available_tracks
            semaphores_remaining = available_semaphores
            print(
                f"Found a new minimum solution! ({round((time.time() - board_solve_time) * 10e3) / 10e3}s)"
            )
            board_solve_time = time.time()
            return
        else:
            mvmts_since_solved += 1
    # if a car solved this frame, remove it from generation
    if just_solved[0] is not None:
        sc = just_solved[0]
        cars_generated.pop(sc)
        usable_tracks.pop(sc)
        stalled.pop(sc)
    # if a numeral car solved this frame, remove it from generation
    if just_solved[1] is not None:
        sc = just_solved[1] - int(just_solved[0] is not None)
        cars_generated.pop(sc)
        usable_tracks.pop(sc)
        stalled.pop(sc)
    car_combos = list(itertools.product(*cars_generated))
    track_combos = list(itertools.product(*usable_tracks))

    # branch creation
    for car_combo, track_combo in zip(car_combos, track_combos):
        tracks_to_pass = available_tracks
        semaphores_to_pass = available_semaphores
        board_to_pass = board_to_use.copy()
        mods_to_pass = mods_to_use.copy()
        stalled_to_pass = list(stalled)
        heatmap_limits_pass = np.array(heatmap_limits)

        for i, car in enumerate(car_combo):
            # If 2 cars are on the same tile, kill it.
            if car.pos in [c.pos for c in car_combo[i + 1 :]]:
                break
            track_placing = track_combo[i]
            if (
                car.type is CT.DECOY
                and decoy_placing[car.num]
                and not track_placing.is_empty()
            ):
                # out of tracks / not going to beat best tracks?
                tracks_to_pass -= 1
                if tracks_to_pass <= lowest_tracks_remaining:
                    break
            # if the car is placing a semaphore, check if it has enough to do so and then do it.
            if track_placing.is_placeholder_semaphore():
                semaphores_to_pass -= 1
                if semaphores_to_pass < 0:
                    break
                board_to_pass[car.pos_ahead] = (
                    track_placing.remove_placeholder_semaphore()
                )
                mods_to_pass[car.pos_ahead] = M.SEMAPHORE
                stalled_to_pass[i] = True
            elif not track_placing.is_empty():
                board_to_pass[car.pos] = track_placing

            # if the car is on a swapping track, add 1 to all heatmap limits.
            if car.type is not CT.CRASHED and (
                mods_to_pass[car.pos] is M.SWAPPING_TRACK
                or mods_to_pass[car.pos] is M.SWITCH_RAIL
            ):
                car_index = car.car_index(cars, decoys, ncars)
                if (
                    heatmap_limits_pass[
                        car_index, car.direction.value, car.pos[0], car.pos[1]
                    ]
                    < heatmap_limit_limit
                ):
                    if not stalled[i]:
                        heatmap_limits_pass[car_index, :][
                            heatmap_limits_pass[car_index, :] > 0
                        ] += 1
                else:
                    return
        else:
            cars_to_pass = [
                C(car.pos, car.direction, car.num, car.type) for car in car_combo
            ]
            yield (
                cars_to_pass,
                board_to_pass,
                mods_to_pass,
                tracks_to_pass,
                np.array(heatmaps),
                [list(solved[0]), list(solved[1])],
                stalled_to_pass,
                switch_queue.copy(),
                list(station_stalled),
                list(crashed_decoys),
                mvmts_since_solved,
                semaphores_to_pass,
                heatmap_limits_pass,
            )


solutions = {}

# use 11-8b for visualizer
with open("../levels.json", "r") as file:
    lvls = json.load(file)
worlds = defaultdict(dict)
for lvl_name, data in lvls.items():
    worlds[lvl_name[: lvl_name.index("-")]][lvl_name] = data

# access worlds as worlds['7'], worlds['#'], etc. Levels names are such that "world_name-level_name".
# lvls = {'7-1': lvls['7-1']}
for lvl_name, data in worlds["1"].items():
    print(lvl_name)
    board, mods, mod_nums, all_cars, max_tracks, max_semaphores = data.values()
    cars, decoys, ncars = [], [], []
    for car in all_cars:
        car = C.from_json(car)
        if car.type is CT.NORMAL:
            cars.append(car)
        elif car.type is CT.DECOY:
            decoys.append(car)
        elif car.type is CT.NUMERAL:
            ncars.append(car)

    lowest_tracks_remaining = -1
    semaphores_remaining = -1
    best_board = None
    best_mods = None
    board_dims = (len(board), len(board[0]))
    iterations = 0

    board = T.convert_to_numpy(board)
    mods = M.convert_to_numpy(mods)
    mod_nums = np.asarray(mod_nums, dtype=int)
    tunnel_exit_velos = {
        T.LEFT_FACING_TUNNEL: D.LEFT,
        T.RIGHT_FACING_TUNNEL: D.RIGHT,
        T.DOWN_FACING_TUNNEL: D.DOWN,
        T.UP_FACING_TUNNEL: D.UP,
    }

    permanent_track_poses = set()
    for pos, track in np.ndenumerate(board):
        if not track.is_empty():
            permanent_track_poses.add(pos)

    tunnel_poses = defaultdict(list)
    gate_poses = defaultdict(list)
    swapping_track_poses = defaultdict(list)
    station_poses = {M.STATION: defaultdict(list), M.POST_OFFICE: defaultdict(list)}
    for pos, mod in np.ndenumerate(mods):
        mod_num = mod_nums[pos]
        if mod is M.TUNNEL:
            tunnel_poses[mod_num].append(pos)
        if mod is M.OPEN_GATE or mod is M.CLOSED_GATE:
            gate_poses[mod_num].append(pos)
        if mod is M.SWAPPING_TRACK:
            swapping_track_poses[mod_num].append(pos)
        if mod in station_poses:
            station_poses[mod][mod_num].append(pos)

    T.print_values(board)
    print("Generating...")
    board_solve_time = time.time()
    start_time = time.time()

    # Check if any of the non-decoy cars are placed so that they will immediately crash into the border.
    for car in cars + ncars:
        if car.border_crash(board_dims):
            break
    else:
        cars_to_use = list(cars + decoys + ncars)
        board_to_use = board.copy()
        mods_to_use = mods.copy()
        available_tracks = max_tracks
        heatmaps = np.zeros((len(cars + decoys + ncars), 4, *board_dims))
        solved = [[], []]
        stalled = [False] * len(cars + decoys + ncars)
        switch_queue = [
            (-1, -1),
        ] * len(cars + decoys + ncars)
        station_stalled = [False] * len(cars + decoys + ncars)
        crashed_decoys = []
        mvmts_since_solved = 0
        available_semaphores = max_semaphores
        heatmap_limits = np.zeros((len(cars + decoys + ncars), 4, *board_dims))

        generate_tracks(
            cars_to_use,
            board_to_use,
            mods_to_use,
            available_tracks,
            heatmaps,
            solved,
            stalled,
            switch_queue,
            station_stalled,
            crashed_decoys,
            mvmts_since_solved,
            available_semaphores,
            heatmap_limits,
        )

    finalTime = round((time.time() - start_time) * 10e3) / 10e3
    print(f"\nFinished in: {finalTime}s")
    print(f"Iterations Processed: {'{:,}'.format(iterations)}")
    print(f"Tracks Remaining: {lowest_tracks_remaining}")
    if lowest_tracks_remaining > 0:
        print("--- TRACK SAVED --- TRACK SAVED --- TRACK SAVED --- TRACK SAVED ---")
    if best_board is None:
        print("-!- BOARD FAILED -!-")
        break
    # Replace permanent tiles that may have been swapped during generation.
    for pos in permanent_track_poses:
        best_board[pos] = board[pos]
    T.print_values(best_board)
    # => save to json
    solutions[lvl_name] = {**data, "solution": T.convert_to_list(best_board)}

    if max_semaphores > 0:
        print(f"Semaphores Remaining: {semaphores_remaining}")
    for pos, mod in np.ndenumerate(best_mods):
        if mod is M.SEMAPHORE or (mod is M.DEACTIVATED_MOD and mods[pos] is M.EMPTY):
            print(f"~~ Semaphore at: {pos} (On a [{best_board[pos].value}] tile)")
    print("-" * 50)
print(
    f"\nFully Complete in: {round((time.time() - program_start_time) * 10e3) / 10e3}s"
)

# save to json
with open(f"../solutions.json", "w") as f:
    json.dump(solutions, f, indent=4)
