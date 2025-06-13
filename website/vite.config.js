"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
// https://vite.dev/config/
exports.default = (0, vite_1.defineConfig)({
    server: {
        port: 8080,
        open: true,
    },
});
