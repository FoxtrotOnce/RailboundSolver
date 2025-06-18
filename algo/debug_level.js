"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const levels_json_1 = __importDefault(require("../levels.json"));
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
const no = new Set(['12-9', '12-10']);
for (const [lvl_name, data] of worlds.get('12')) {
    if (!no.has(lvl_name)) {
        continue;
    }
    console.log(lvl_name);
    (0, main_1.solve_level)(data);
}
// const lvl_name = "test-1"
// console.log(lvl_name)
// solve_level(lvls[lvl_name])
console.log(`Total Time: ${(Date.now() - start_time) / 10e2}s`);
