"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solve_level = solve_level;
const classes_1 = require("./classes");
// HYPERPARAMETERS (INTEGRATE WITH UI)
const heatmap_limit_limit = 9;
const decoy_heatmap_limit = 15;
const gen_type = 'DFS';
function tail_call_gen(args) {
    if (gen_type === "DFS") {
        let argslist = [args];
        while (argslist.length > 0) {
            const args = [...generate_tracks(argslist.pop())];
            argslist.push(...args.reverse());
        }
    }
    else if (gen_type === "BFS") {
        let argslist = new Map();
        for (let track_count = max_tracks; track_count > -1; track_count--) {
            argslist.set(track_count, new classes_1.deque());
        }
        argslist.get(max_tracks).append(args);
        for (const queue of argslist.values()) {
            while (queue.length > 0) {
                for (const args of generate_tracks(queue.popleft())) {
                    if (lowest_tracks_remaining !== -1) {
                        return;
                    }
                    argslist.get(args.available_tracks).append(args);
                }
            }
        }
    }
}
/**
 * Generate tracks for the given frame data.
 *
 * @param cars_to_use - The cars in the frame.
 * @param board_to_use - The board (tracks) in the frame.
 * @param mods_to_use - The track mods in the frame.
 * @param available_tracks - The remaining tracks.
 * @param heatmaps - The heat of each possible car configuration.
 *                 Heat is the amount of times a car has been at the same position
 *                 with the same direction. It is used to prevent looping.
 * @param solved - 2 lists of each NORMAL and NUMERAL car num that have reached
 *               their train.
 * @param stalled - Whether each car is stalled or not. Stalled means that the car
 *                cannot move due to being behind a gate or semaphore.
 * @param switch_queue - The position of a gate if it is trying to close on a car,
 *                     for each car. The position is (-1, -1) if no gate is queued on top
 *                     of the car.
 * @param station_stalled - Whether each car is being stalled by a station or not.
 *                        It is different from normal stalling such that station stalling
 *                        always lasts 2 frames.
 * @param crashed_decoys - The positions of each DECOY that have crashed.
 * @param mvmts_since_solved - The frames since all cars reached their trains.
 *                           It is used to consider a level with decoys solved after 2 frames.
 * @param available_semaphores - The remaining semaphores.
 * @param heatmap_limits - The upper limit for each value in heatmaps.
 *                       It is used to prevent looping.
 */
function* generate_tracks({ cars_to_use, board_to_use, mods_to_use, available_tracks, heatmaps, solved, stalled, switch_queue, station_stalled, crashed_decoys, mvmts_since_solved, available_semaphores, heatmap_limits }) {
    // Remove decoys from generation if they crashed last frame, and add the pos to crashed_decoys.
    const crashed = [];
    for (let i = cars_to_use.length - 1; i > -1; i--) {
        if (cars_to_use[i].type === classes_1.CarType.CRASHED) {
            crashed.push(i);
        }
    }
    for (const crashed_decoy of crashed) {
        const decoy_car = cars_to_use[crashed_decoy];
        crashed_decoys.push(decoy_car);
        cars_to_use.splice(crashed_decoy, 1);
        stalled.splice(crashed_decoy, 1);
    }
    /* Add stalled_cars to a list for crashing. this could likely be changing to be faster, but I did it
    this way because of how the game treats crashes. on 7-3B, there is a false solution that could save 1 track
    but doesn't actually work because cars crash before they move through a gate, if the gate is opened on the
    same frame of a crash. */
    const stalled_cars = [];
    for (let i = 0; i < cars_to_use.length; i++) {
        if (stalled[i]) {
            stalled_cars.push(cars_to_use[i]);
        }
    }
    // PRE-GENERATION SECTION 1 (switches, semaphores, heatmap_limits)
    for (let c = 0; c < cars_to_use.length; c++) {
        const car = cars_to_use[c];
        // If a car is no longer under a queued gate, close it and remove it from the queue.
        const queued_gate = switch_queue[c];
        if (queued_gate[0] !== -1 && (car.pos[0] !== queued_gate[0] || car.pos[1] !== queued_gate[1])) {
            mods_to_use[queued_gate[0]][queued_gate[1]] = classes_1.Mod.CLOSED_GATE;
            switch_queue[c] = [-1, -1];
        }
        const mod = mods[car.pos[0]][car.pos[1]];
        const mod_num = mod_nums[car.pos[0]][car.pos[1]];
        // If a car steps on a switch...
        if (!stalled[c] && mod === classes_1.Mod.SWITCH) {
            // Close/open related gates.
            if (gate_poses.has(mod_num)) {
                for (const gate_pos of gate_poses.get(mod_num)) {
                    const gate = mods_to_use[gate_pos[0]][gate_pos[1]];
                    if (gate === classes_1.Mod.OPEN_GATE) {
                        // Do a check to see if any cars are under the gate for switch_queue. could possible be
                        // faster by not having to iterate over every car somehow?
                        let gate_conflict = false;
                        for (const car_under_gate of cars_to_use) {
                            if (car_under_gate.pos[0] === gate_pos[0] && car_under_gate.pos[1] === gate_pos[1]) {
                                switch_queue[car.car_index(cars, decoys, ncars)] = gate_pos;
                                gate_conflict = true;
                                break;
                            }
                        }
                        if (!gate_conflict) {
                            mods_to_use[gate_pos[0]][gate_pos[1]] = classes_1.Mod.CLOSED_GATE;
                        }
                    }
                    else {
                        mods_to_use[gate_pos[0]][gate_pos[1]] = classes_1.Mod.OPEN_GATE;
                    }
                }
            }
            // Swap related swapping tracks.
            if (swapping_track_poses.has(mod_num)) {
                for (const swap_pos of swapping_track_poses.get(mod_num)) {
                    board_to_use[swap_pos[0]][swap_pos[1]] = board_to_use[swap_pos[0]][swap_pos[1]].swap_track();
                }
            }
        }
        else if (!stalled[c] && mod === classes_1.Mod.SWITCH_RAIL) {
            board_to_use[car.pos[0]][car.pos[1]] = board_to_use[car.pos[0]][car.pos[1]].swap_track();
        }
        // Skip semaphore and heatmap checks if car (decoy) is at the border,
        // since car.pos_ahead is out of bounds otherwise and raises an error.
        if (car.border_crash(board_dims)) {
            continue;
        }
        // If the car is moving, add to heatmap
        if (!(car.type !== classes_1.CarType.DECOY && (car.on_correct_station(mods_to_use[car.pos[0]][car.pos[1]], mod_nums[car.pos[0]][car.pos[1]]) ||
            station_stalled[car.car_index(cars, decoys, ncars)])) &&
            !mods_to_use[car.pos_ahead[0]][car.pos_ahead[1]].is_gate_or_sem()) {
            // Increase heatmap limit to 1 if the car is going to a new tile.
            const car_index = car.car_index(cars, decoys, ncars);
            if (heatmap_limits[car_index][car.direction.value][car.pos[0]][car.pos[1]] === 0) {
                heatmap_limits[car_index][car.direction.value][car.pos[0]][car.pos[1]]++;
            }
            // Decoys' heatmap limit limit is controlled by decoy_heatmap_limit.
            heatmaps[car_index][car.direction.value][car.pos[0]][car.pos[1]]++;
            const heat = heatmaps[car_index][car.direction.value][car.pos[0]][car.pos[1]];
            if (car.type === classes_1.CarType.DECOY) {
                if (heat > decoy_heatmap_limit) {
                    return;
                }
            }
            else {
                if (heat > heatmap_limits[car_index][car.direction.value][car.pos[0]][car.pos[1]]) {
                    return;
                }
            }
        }
        // Semaphore processing
        if (mods_to_use[car.pos_ahead[0]][car.pos_ahead[1]] === classes_1.Mod.SEMAPHORE) {
            const semPos = classes_1.semaphore_pass.get(board_to_use[car.pos_ahead[0]][car.pos_ahead[1]]);
            const sem_pos0 = semPos[0].add_vector(car.pos_ahead);
            const sem_pos1 = semPos[1].add_vector(car.pos_ahead);
            // Check which pos the car is at, and then kill the branch if there aren't any tracks at
            // the other pos. (The semaphore will never get triggered)
            if (available_tracks === lowest_tracks_remaining + 1) {
                if (car.pos[0] === sem_pos0[0]) {
                    if (board_to_use[sem_pos1[0]][sem_pos1[1]].is_empty()) {
                        return;
                    }
                }
                else {
                    if (board_to_use[sem_pos0[0]][sem_pos0[1]].is_empty()) {
                        return;
                    }
                }
            }
            // Check if any cars are passing the semaphore, and open it if they are
            for (const p_car of cars_to_use) {
                if (p_car === car) {
                    continue;
                }
                const pos0 = p_car.pos[0] === sem_pos0[0] && p_car.pos[1] === sem_pos0[1] && p_car.direction !== semPos[0].reverse();
                const pos1 = p_car.pos[0] === sem_pos1[0] && p_car.pos[1] === sem_pos1[1] && p_car.direction !== semPos[1].reverse();
                if (pos0 || pos1) {
                    mods_to_use[car.pos_ahead[0]][car.pos_ahead[1]] = classes_1.Mod.DEACTIVATED_MOD;
                    break;
                }
            }
        }
    }
    const cars_generated = Array.from({ length: cars_to_use.length }, () => []);
    const usable_tracks = Array.from({ length: cars_to_use.length }, () => []);
    // decoy_placing is used to list which decoys are attempting to
    // actually place a track to better calculate available_tracks.
    let decoy_placing = Array.from({ length: decoys.length }, () => false);
    let just_solved = [undefined, undefined];
    // POST-GENERATION CODE
    for (let c = 0; c < cars_to_use.length; c++) {
        const car = cars_to_use[c];
        iterations++;
        // console.log()
        // T.print_values(board_to_use)
        // console.log(car)
        // console.log(iterations)
        // Skip semaphore and heatmap checks if car (decoy) is at the border,
        // since car.pos_ahead is out of bounds otherwise and raises an error.
        if (car.border_crash(board_dims)) {
            cars_generated[c] = [car.crash()];
            usable_tracks[c] = [board_to_use[car.pos[0]][car.pos[1]]];
            continue;
        }
        // Station processing
        if (car.type !== classes_1.CarType.DECOY) {
            const car_index = car.car_index(cars, decoys, ncars);
            if (car.on_correct_station(mods_to_use[car.pos[0]][car.pos[1]], mod_nums[car.pos[0]][car.pos[1]])) {
                station_stalled[car_index] = true;
                mods_to_use[car.pos[0]][car.pos[1]] = classes_1.Mod.DEACTIVATED_MOD;
                cars_generated[c] = [car];
                usable_tracks[c] = [board_to_use[car.pos[0]][car.pos[1]]];
                continue;
            }
            else if (station_stalled[car_index]) {
                station_stalled[car_index] = false;
                cars_generated[c] = [car];
                usable_tracks[c] = [board_to_use[car.pos[0]][car.pos[1]]];
                continue;
            }
        }
        // Gate processing
        if (mods_to_use[car.pos_ahead[0]][car.pos_ahead[1]].is_gate_or_sem()) {
            stalled[c] = true;
            cars_generated[c] = [car];
            usable_tracks[c] = [board_to_use[car.pos[0]][car.pos[1]]];
            continue;
        }
        if (stalled[c]) {
            stalled[c] = false;
        }
        const tile_ahead = board_to_use[car.pos_ahead[0]][car.pos_ahead[1]];
        const tile_ahead_redirect = classes_1.directions.get(tile_ahead).get(car.direction);
        // tile picking
        let tracks_to_check = [];
        if (!tile_ahead.is_empty()) {
            if (permanent_track_poses.has(car.pos_ahead[0] * board[0].length + car.pos_ahead[1])) {
                if (tile_ahead_redirect === classes_1.Direction.CRASH) {
                    if (car.type === classes_1.CarType.DECOY) {
                        cars_generated[c] = [car.crash()];
                        usable_tracks[c] = [board_to_use[car.pos[0]][car.pos[1]]];
                        continue;
                    }
                    else {
                        return;
                    }
                }
                else {
                    tracks_to_check = [tile_ahead];
                }
            }
            else {
                if (tile_ahead_redirect === classes_1.Direction.CRASH) {
                    if (tile_ahead.is_turn() || tile_ahead.is_straight()) {
                        tracks_to_check = car.generable_3ways(tile_ahead);
                    }
                    else if (car.type === classes_1.CarType.DECOY) {
                        cars_generated[c] = [car.crash()];
                        usable_tracks[c] = [board_to_use[car.pos[0]][car.pos[1]]];
                        continue;
                    }
                    else {
                        return;
                    }
                }
                else if (tile_ahead.is_straight()) { // This if statement is done like this so that more checks have to be
                    // done before the program does summation on heatmaps, making it faster.
                    let heat = 0;
                    let cannot_place_3way = false;
                    for (let i = 0; i < heatmaps.length; i++) {
                        heat += heatmaps[i][car.direction.value][car.pos[0]][car.pos[1]];
                        if (heat > 1) {
                            tracks_to_check = [tile_ahead];
                            cannot_place_3way = true;
                            break;
                        }
                    }
                    if (!cannot_place_3way) {
                        tracks_to_check = [tile_ahead, ...car.generable_3ways(tile_ahead)];
                    }
                }
                else {
                    tracks_to_check = [tile_ahead];
                }
            }
        }
        else {
            // out of tracks / not going to beat best tracks?
            if (car.type === classes_1.CarType.DECOY) {
                // The decoy is allowed to crash if it's NOT on a non-permanent turn track.
                // This is to prevent decoys from crashing on all 3 generable tracks, which effectively creates 2 duplicate states.
                const can_crash = (permanent_track_poses.has(car.pos[0] * board[0].length + car.pos[1]) ||
                    !board_to_use[car.pos[0]][car.pos[1]].is_turn());
                if (available_tracks - 1 <= lowest_tracks_remaining) {
                    if (can_crash) {
                        tracks_to_check = [classes_1.Track.EMPTY];
                    }
                    else {
                        return;
                    }
                }
                else {
                    decoy_placing[car.num] = true;
                    if (can_crash) {
                        tracks_to_check = [classes_1.Track.EMPTY, ...car.generable_tracks()];
                    }
                    else {
                        tracks_to_check = car.generable_tracks();
                    }
                }
            }
            else {
                available_tracks--;
                tracks_to_check = car.generable_tracks();
            }
        }
        // false train checks to make sure cars dont go to the wrong train
        if ((tracks_to_check[0].is_car_ending_track() && car.type !== classes_1.CarType.NORMAL) ||
            (tracks_to_check[0].is_ncar_ending_track() && car.type !== classes_1.CarType.NUMERAL)) {
            return;
        }
        // out of tracks / not going to beat best tracks?
        if (available_tracks <= lowest_tracks_remaining) {
            return;
        }
        // same tile crashing
        const crash_cars = [];
        for (const gen_car of cars_generated) {
            if (gen_car.length > 0) {
                crash_cars.push(gen_car[0]);
            }
        }
        crash_cars.push(...crashed_decoys);
        crash_cars.push(...stalled_cars);
        if (car.same_tile_crashes(crash_cars) || car.head_on_crashes(cars_to_use)) {
            if (tracks_to_check[0].is_empty()) {
                tracks_to_check = [tracks_to_check[0]];
            }
            else if (car.type === classes_1.CarType.DECOY) {
                cars_generated[c] = [car.crash()];
                usable_tracks[c] = [board_to_use[car.pos[0]][car.pos[1]]];
                continue;
            }
            else {
                return;
            }
        }
        // track confirming
        for (let i = 0; i < tracks_to_check.length; i++) {
            const possibleTrack = tracks_to_check[i];
            // crash a decoy if it chooses to crash
            let possible_redirect = classes_1.Direction.UNKNOWN;
            if (possibleTrack.is_empty()) {
                cars_generated[c].push(car.crash());
                usable_tracks[c].push(classes_1.Track.EMPTY);
                continue;
            }
            else if (possibleTrack.is_tunnel()) {
                const mod_num = mod_nums[car.pos_ahead[0]][car.pos_ahead[1]];
                if (tunnel_poses.has(mod_num)) {
                    const tunnel_pos0 = tunnel_poses.get(mod_num)[0];
                    const tunnel_pos1 = tunnel_poses.get(mod_num)[1];
                    if (tunnel_pos0[0] === car.pos_ahead[0] && tunnel_pos0[1] === car.pos_ahead[1]) {
                        car.pos_ahead = tunnel_pos1;
                    }
                    else {
                        car.pos_ahead = tunnel_pos0;
                    }
                }
                possible_redirect = tunnel_exit_velos.get(board[car.pos_ahead[0]][car.pos_ahead[1]]);
            }
            else {
                possible_redirect = classes_1.directions.get(possibleTrack).get(car.direction);
            }
            // if placing a 3-way, check if it affects any cars that have come in that direction
            if (possibleTrack.is_car_ending_track() || possibleTrack.is_ncar_ending_track()) {
                // if the finished car isn't in order, kill it
                let is_numeral = +(car.type === classes_1.CarType.NUMERAL);
                const any_solved = solved[is_numeral];
                if ((any_solved.length === 0 && car.num !== 0) ||
                    (any_solved.length > 0 && solved[is_numeral][solved[is_numeral].length - 1] !== car.num - 1)) {
                    return;
                }
                // if all stations weren't collected, kill it
                const st_poses = station_poses.get(car.get_station());
                if (st_poses.has(car.num)) {
                    for (const station_pos of st_poses.get(car.num)) {
                        if (mods_to_use[station_pos[0]][station_pos[1]] !== classes_1.Mod.DEACTIVATED_MOD) {
                            return;
                        }
                    }
                }
                solved[is_numeral].push(car.num);
                just_solved[is_numeral] = c;
                cars_generated[c].push(new classes_1.Car(car.pos_ahead, car.direction, car.num, car.type));
                usable_tracks[c].push(possibleTrack);
                continue;
            }
            else if (possibleTrack.is_3way() && !tile_ahead.is_3way()) {
                // if placing a 3-way will affect another car going that direction, kill it
                let cannot_place_3way = false;
                for (let i = 0; i < heatmaps.length; i++) {
                    if (heatmaps[i][possible_redirect.reverse().value][car.pos_ahead[0]][car.pos_ahead[1]] > 0) {
                        cannot_place_3way = true;
                        break;
                    }
                }
                if (cannot_place_3way) {
                    continue;
                } // if the 3-way is placed on a semaphore, kill it
                else if (mods_to_use[car.pos_ahead[0]][car.pos_ahead[1]] === classes_1.Mod.SEMAPHORE ||
                    mods_to_use[car.pos_ahead[0]][car.pos_ahead[1]] === classes_1.Mod.DEACTIVATED_MOD) {
                    continue;
                }
            }
            const end_on = possible_redirect.add_vector(car.pos_ahead);
            // kill out of bounds cars, crash decoys
            if (!(0 <= end_on[0] && end_on[0] < board_dims[0] &&
                0 <= end_on[1] && end_on[1] < board_dims[1])) {
                if (car.type === classes_1.CarType.DECOY) {
                    cars_generated[c].push(new classes_1.Car(car.pos_ahead, possible_redirect, car.num, car.type));
                    usable_tracks[c].push(possibleTrack);
                }
                continue;
            }
            const end_on_tile = board_to_use[end_on[0]][end_on[1]];
            const end_on_redirect = classes_1.directions.get(end_on_tile).get(possible_redirect);
            const possible_to_place_3way = (end_on_tile.is_straight() || end_on_tile.is_turn()) &&
                !permanent_track_poses.has(end_on[0] * board[0].length + end_on[1]);
            // checks if end_on_tile is going to crash the car and if it can't place a 3-way to fix it
            if (end_on_redirect === classes_1.Direction.CRASH && !end_on_tile.is_empty() && !possible_to_place_3way) {
                if (car.type === classes_1.CarType.DECOY) {
                    cars_generated[c].push(new classes_1.Car(car.pos_ahead, possible_redirect, car.num, car.type));
                    usable_tracks[c].push(possibleTrack);
                }
                continue;
            }
            cars_generated[c].push(new classes_1.Car(car.pos_ahead, possible_redirect, car.num, car.type));
            if (possibleTrack.is_tunnel()) {
                usable_tracks[c].push(board[car.pos_ahead[0]][car.pos_ahead[1]]);
            }
            else {
                usable_tracks[c].push(possibleTrack);
                // checks if the car can also place a semaphore.
                let semaphore_triggered = false;
                for (let i = 0; i < heatmaps.length; i++) {
                    for (let j = 0; j < heatmaps[0].length; j++) {
                        if (heatmaps[i][j][car.pos_ahead[0]][car.pos_ahead[1]]) {
                            semaphore_triggered = true;
                            break;
                        }
                    }
                    if (semaphore_triggered) {
                        break;
                    }
                }
                if (!semaphore_triggered && available_semaphores > 0 && (possibleTrack.is_straight() || possibleTrack.is_turn()) &&
                    mods_to_use[car.pos_ahead[0]][car.pos_ahead[1]] == classes_1.Mod.EMPTY) {
                    const semPos = classes_1.semaphore_pass.get(possibleTrack);
                    const sem_pos0 = semPos[0].add_vector(car.pos_ahead);
                    const sem_pos1 = semPos[1].add_vector(car.pos_ahead);
                    let pos0_heat = 0;
                    let pos1_heat = 0;
                    for (let i = 0; i < heatmaps.length; i++) {
                        for (let j = 0; j < heatmaps[0].length; j++) {
                            pos0_heat += heatmaps[i][j][sem_pos0[0]][sem_pos0[1]];
                            pos1_heat += heatmaps[i][j][sem_pos1[0]][sem_pos1[1]];
                        }
                    }
                    const pos0_starting = +(mods_to_use[sem_pos0[0]][sem_pos0[1]] === classes_1.Mod.STARTING_CAR_TILE);
                    const pos1_starting = +(mods_to_use[sem_pos1[0]][sem_pos1[1]] === classes_1.Mod.STARTING_CAR_TILE);
                    let starting_tile_heat = 0;
                    if (mods_to_use[car.pos[0]][car.pos[1]] === classes_1.Mod.STARTING_CAR_TILE) {
                        let starting_car_pos = [];
                        if (car.type === classes_1.CarType.NORMAL) {
                            starting_car_pos = cars[car.num].pos;
                        }
                        else if (car.type === classes_1.CarType.DECOY) {
                            starting_car_pos = decoys[car.num].pos;
                        }
                        else {
                            starting_car_pos = ncars[car.num].pos;
                        }
                        starting_tile_heat = +(car.pos[0] === starting_car_pos[0] && car.pos[1] === starting_car_pos[1]);
                    }
                    if (pos0_heat + pos1_heat - pos0_starting - pos1_starting + starting_tile_heat === 1) {
                        cars_generated[c].push(car);
                        // a semaphore track is basically just track index + 22 because it's a simple way
                        // to tell the program to place a semaphore without interfering with track indices.
                        usable_tracks[c].push(possibleTrack.add_placeholder_semaphore());
                    }
                }
            }
        }
        // if no tracks were generated, kill it
        if (usable_tracks[c].length === 0) {
            return;
        }
    }
    // kill branch if all cars are stalled
    if (stalled.every(bool => bool) && cars_to_use.length > 0) {
        return;
    }
    // if board is complete, register as solution
    if (solved[0].length === cars.length && solved[1].length === ncars.length) {
        if (cars_to_use.every(car => car.type !== classes_1.CarType.DECOY) || mvmts_since_solved === 2) {
            best_board = board_to_use;
            best_mods = mods_to_use;
            lowest_tracks_remaining = available_tracks;
            semaphores_remaining = available_semaphores;
            console.log(`Found a new minimum solution! (${(Date.now() - board_solve_time) / 10e2}s)`);
            board_solve_time = Date.now();
            return;
        }
        else {
            mvmts_since_solved++;
        }
    }
    // if a car solved this frame, remove it from generation
    if (just_solved[0] !== undefined) {
        const sc = just_solved[0];
        cars_generated.splice(sc, 1);
        usable_tracks.splice(sc, 1);
        stalled.splice(sc, 1);
    }
    // if a numeral car solved this frame, remove it from generation
    if (just_solved[1] !== undefined) {
        const sc = just_solved[1] - +(just_solved[0] !== undefined);
        cars_generated.splice(sc, 1);
        usable_tracks.splice(sc, 1);
        stalled.splice(sc, 1);
    }
    const car_combos = (0, classes_1.product)(...cars_generated);
    const track_combos = (0, classes_1.product)(...usable_tracks);
    // branch creation
    for (let combo_num = 0; combo_num < car_combos.length; combo_num++) {
        const car_combo = car_combos[combo_num];
        const track_combo = track_combos[combo_num];
        let tracks_to_pass = available_tracks;
        let semaphores_to_pass = available_semaphores;
        let board_to_pass = (0, classes_1.copy_arr)(board_to_use);
        let mods_to_pass = (0, classes_1.copy_arr)(mods_to_use);
        let stalled_to_pass = [...stalled];
        let heatmap_limits_pass = (0, classes_1.copy_arr)(heatmap_limits);
        let stop_branch = false;
        for (let i = 0; i < car_combo.length; i++) {
            const car = car_combo[i];
            // If 2 cars are on the same tile, kill it.
            for (const other_car of car_combo.slice(i + 1)) {
                if (car.pos[0] === other_car.pos[0] && car.pos[1] === other_car.pos[1]) {
                    stop_branch = true;
                    break;
                }
            }
            const track_placing = track_combo[i];
            if (car.type === classes_1.CarType.DECOY && decoy_placing[car.num] && !track_placing.is_empty()) {
                // out of tracks / not going to beat best tracks?
                tracks_to_pass--;
                if (tracks_to_pass <= lowest_tracks_remaining) {
                    stop_branch = true;
                    break;
                }
            }
            // if the car is placing a semaphore, check if it has enough to do so and then do it.
            if (track_placing.is_placeholder_semaphore()) {
                semaphores_to_pass--;
                if (semaphores_to_pass < 0) {
                    stop_branch = true;
                    break;
                }
                board_to_pass[car.pos_ahead[0]][car.pos_ahead[1]] = track_placing.remove_placeholder_semaphore();
                mods_to_pass[car.pos_ahead[0]][car.pos_ahead[1]] = classes_1.Mod.SEMAPHORE;
                stalled_to_pass[i] = true;
            }
            else if (!track_placing.is_empty()) {
                board_to_pass[car.pos[0]][car.pos[1]] = track_placing;
            }
            // if the car is on a swapping track, add 1 to all heatmap limits above 0.
            if (car.type !== classes_1.CarType.CRASHED && (mods_to_pass[car.pos[0]][car.pos[1]] === classes_1.Mod.SWAPPING_TRACK ||
                mods_to_pass[car.pos[0]][car.pos[1]] === classes_1.Mod.SWITCH_RAIL)) {
                const car_index = car.car_index(cars, decoys, ncars);
                if (heatmap_limits_pass[car_index][car.direction.value][car.pos[0]][car.pos[1]] < heatmap_limit_limit) {
                    if (!stalled[i]) {
                        for (let j = 0; j < heatmap_limits_pass[0].length; j++) {
                            for (let k = 0; k < heatmap_limits_pass[0][0].length; k++) {
                                for (let l = 0; l < heatmap_limits_pass[0][0][0].length; l++) {
                                    if (heatmap_limits_pass[car_index][j][k][l] > 0) {
                                        heatmap_limits_pass[car_index][j][k][l]++;
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    return;
                }
            }
        }
        if (!stop_branch) {
            const cars_to_pass = car_combo.map(car => new classes_1.Car(car.pos, car.direction, car.num, car.type));
            yield {
                cars_to_use: cars_to_pass,
                board_to_use: board_to_pass,
                mods_to_use: mods_to_pass,
                available_tracks: tracks_to_pass,
                heatmaps: (0, classes_1.copy_arr)(heatmaps),
                solved: (0, classes_1.copy_arr)(solved),
                stalled: stalled_to_pass,
                switch_queue: (0, classes_1.copy_arr)(switch_queue),
                station_stalled: (0, classes_1.copy_arr)(station_stalled),
                crashed_decoys: (0, classes_1.copy_arr)(crashed_decoys),
                mvmts_since_solved: mvmts_since_solved,
                available_semaphores: semaphores_to_pass,
                heatmap_limits: heatmap_limits_pass
            };
        }
    }
}
var board;
var mods;
var mod_nums;
var all_cars;
var max_tracks;
var max_semaphores;
var cars;
var decoys;
var ncars;
var lowest_tracks_remaining;
var semaphores_remaining;
var best_board;
var best_mods;
var board_dims;
var iterations;
var tunnel_exit_velos = new Map([
    [classes_1.Track.LEFT_FACING_TUNNEL, classes_1.Direction.LEFT],
    [classes_1.Track.RIGHT_FACING_TUNNEL, classes_1.Direction.RIGHT],
    [classes_1.Track.DOWN_FACING_TUNNEL, classes_1.Direction.DOWN],
    [classes_1.Track.UP_FACING_TUNNEL, classes_1.Direction.UP]
]);
var permanent_track_poses;
var tunnel_poses;
var gate_poses;
var swapping_track_poses;
var station_poses;
var board_solve_time;
function solve_level(data) {
    // if (lvl_name !== "1-11A") {continue}
    // console.log(lvl_name)
    board = classes_1.Track.convert_to_tracks(data.board);
    mods = classes_1.Mod.convert_to_mods(data.mods);
    mod_nums = data.mod_nums;
    all_cars = data.cars.map(classes_1.Car.from_json);
    max_tracks = data.tracks;
    max_semaphores = data.semaphores;
    cars = [];
    decoys = [];
    ncars = [];
    for (const car of all_cars) {
        if (car.type === classes_1.CarType.NORMAL) {
            cars.push(car);
        }
        else if (car.type === classes_1.CarType.DECOY) {
            decoys.push(car);
        }
        else if (car.type === classes_1.CarType.NUMERAL) {
            ncars.push(car);
        }
    }
    lowest_tracks_remaining = -1;
    semaphores_remaining = -1;
    board_dims = [board.length, board[0].length];
    iterations = 0;
    /**
     * For TypeScript, permanent_track_poses are stored as a single number instead of [number, number], since that way
     * permanent_track_poses.has() can be successfully performed (arrays dont share memory even if they look identical)
     * the [i, j] array is converted via i * board.length + j.
     */
    permanent_track_poses = new Set();
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            const track = board[i][j];
            if (!track.is_empty()) {
                permanent_track_poses.add(i * board[0].length + j);
            }
        }
    }
    tunnel_poses = new Map();
    gate_poses = new Map();
    swapping_track_poses = new Map();
    station_poses = new Map([
        [classes_1.Mod.STATION, new Map()],
        [classes_1.Mod.POST_OFFICE, new Map()]
    ]);
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            const pos = [i, j];
            const mod = mods[i][j];
            const mod_num = mod_nums[i][j];
            if (mod === classes_1.Mod.TUNNEL) {
                if (!tunnel_poses.has(mod_num)) {
                    tunnel_poses.set(mod_num, []);
                }
                tunnel_poses.get(mod_num).push(pos);
            }
            else if (mod === classes_1.Mod.OPEN_GATE || mod === classes_1.Mod.CLOSED_GATE) {
                if (!gate_poses.has(mod_num)) {
                    gate_poses.set(mod_num, []);
                }
                gate_poses.get(mod_num).push(pos);
            }
            else if (mod === classes_1.Mod.SWAPPING_TRACK) {
                if (!swapping_track_poses.has(mod_num)) {
                    swapping_track_poses.set(mod_num, []);
                }
                swapping_track_poses.get(mod_num).push(pos);
            }
            else if (station_poses.has(mod)) {
                if (!station_poses.get(mod).has(mod_num)) {
                    station_poses.get(mod).set(mod_num, []);
                }
                station_poses.get(mod).get(mod_num).push(pos);
            }
        }
    }
    classes_1.Track.print_values(board);
    console.log('Generating...');
    board_solve_time = Date.now();
    const start_time = Date.now();
    // Check if any of the non-decoy cars are placed so that they will immediately crash into the border.
    let cancel_generation = false;
    for (const car of cars.concat(ncars)) {
        if (car.border_crash(board_dims)) {
            cancel_generation = true;
            break;
        }
    }
    if (!cancel_generation) {
        const cars_to_use = [...all_cars];
        const board_to_use = (0, classes_1.copy_arr)(board);
        const mods_to_use = (0, classes_1.copy_arr)(mods);
        const available_tracks = max_tracks;
        const heatmaps = (0, classes_1.zeros)([all_cars.length, 4, board.length, board[0].length]);
        const solved = [[], []];
        const stalled = Array.from({ length: all_cars.length }, () => false);
        const switch_queue = Array.from({ length: all_cars.length }, () => [-1, -1]);
        const station_stalled = Array.from({ length: all_cars.length }, () => false);
        const crashed_decoys = [];
        const mvmts_since_solved = 0;
        const available_semaphores = max_semaphores;
        const heatmap_limits = (0, classes_1.zeros)([all_cars.length, 4, board.length, board[0].length]);
        tail_call_gen({
            cars_to_use, board_to_use, mods_to_use, available_tracks, heatmaps,
            solved, stalled, switch_queue, station_stalled, crashed_decoys, mvmts_since_solved,
            available_semaphores, heatmap_limits
        });
    }
    const finalTime = (Date.now() - start_time) / 10e2;
    console.log(`\nFinished in: ${finalTime}s`);
    console.log(`Iterations Processed: ${iterations.toLocaleString()}`);
    console.log(`Tracks Remaining: ${lowest_tracks_remaining}`);
    if (lowest_tracks_remaining > 0) {
        console.log('thinh you can do whatever you want here. put an alert that a track was saved, or do nothing, etc.');
    }
    if (best_board === undefined || best_mods === undefined) {
        console.log('thinh you can do whatever you want here. put an alert that the board failed, etc.');
        console.log("------------------------------");
        return undefined;
    }
    // Replace permanent tiles that may have been swapped during generation.
    for (const pos_index of permanent_track_poses) {
        const pos = [Math.floor(pos_index / board[0].length), pos_index % board[0].length];
        best_board[pos[0]][pos[1]] = board[pos[0]][pos[1]];
    }
    classes_1.Track.print_values(best_board);
    if (max_semaphores > 0) {
        console.log('thinh you can do whatever you want here. list how many semaphores there are left, etc.');
    }
    console.log("thinh feel free to delete this, or do whatever. it is only used for printing semaphore positions.");
    for (let i = 0; i < best_mods.length; i++) {
        for (let j = 0; j < best_mods[0].length; j++) {
            const mod = best_mods[i][j];
            if (mod === classes_1.Mod.SEMAPHORE || (mod === classes_1.Mod.DEACTIVATED_MOD && mods[i][j] === classes_1.Mod.EMPTY)) {
                console.log(`~~ Semaphore at: (${i}, ${j})`);
            }
        }
    }
    console.log("------------------------------");
    const return_data = {
        board: best_board,
        mods: best_mods,
        tracks_left: lowest_tracks_remaining,
        semaphores_left: semaphores_remaining
    };
    best_board = undefined;
    best_mods = undefined;
    return return_data;
}
