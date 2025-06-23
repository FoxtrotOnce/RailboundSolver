"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const levels_json_1 = __importDefault(require("../levels.json"));
const classes_1 = require("./classes");
const start_time = Date.now();
const worlds = new Map();
for (const key in levels_json_1.default) {
    const lvl_name = key;
    const world = lvl_name.slice(0, lvl_name.indexOf('-'));
    const data = levels_json_1.default[lvl_name];
    if (!worlds.has(world)) {
        worlds.set(world, new Map());
    }
    worlds.get(world).set(lvl_name, data);
}
// const no = new Set<string>(['7-5A'])
// for (const [lvl_name, data] of worlds.get('9')!) {
// if (no.has(lvl_name)) {continue}
// console.log(lvl_name)
// solve_level(data)
// }
function visualize(input) {
    classes_1.Track.print_values(input.board);
    classes_1.Mod.print_values(input.mods);
    console.log(input.cars);
}
const lvl_name = "1-15A";
console.log(lvl_name);
(0, main_1.solve_level)(levels_json_1.default[lvl_name], visualize);
console.log(`Total Time: ${(Date.now() - start_time) / 10e2}s`);
