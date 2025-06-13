"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pixi_js_1 = require("pixi.js");
const levels_json_1 = __importDefault(require("../../levels.json"));
const LEVEL = levels_json_1.default["1-2"];
console.log(LEVEL);
// LEVEL.board is a 2D array of numbers. Get the width and height of the board
const BOARD_WIDTH = LEVEL.board[0].length;
const BOARD_HEIGHT = LEVEL.board.length;
// Mapping of tile numbers to image file names
const TILE_TO_IMAGE = {
    0: "0 Empty Tile.svg",
    1: "1 Horizontal Track.svg",
    2: "2 Vertical Track.svg",
    3: "3 Ending Track.svg",
    4: "4 Fence.svg",
    5: "5 Bottom-Right Turn.svg",
    6: "6 Bottom-Left Turn.svg",
    7: "7 Top-Right Turn.svg",
    8: "8 Top-Left Turn.svg",
    9: "9 Bottom-Right & Left 3-Way.svg",
    10: "10 Bottom-Right & Top 3-Way.svg",
    11: "11 Bottom-Left & Right 3-Way.svg",
    12: "12 Bottom-Left & Top 3-Way.svg",
    13: "13 Top-Right & Left 3-Way.svg",
    14: "14 Top-Right & Bottom 3-Way.svg",
    15: "15 Top-Left & Right 3-Way.svg",
    16: "16 Top-Left & Bottom 3-Way.svg",
    17: "17 Left-Facing Tunnel.svg",
    18: "18 Up-Facing Tunnel.svg",
    19: "19 Right-Facing Tunnel.svg",
    20: "20 Down-Facing Tunnel.svg",
    21: "21 Numeral Car Ending Track (Right Side).svg",
    22: "22 Numeral Car Ending Track (Left Side).svg",
};
/**
 * Load a sprite for a given tile number
 * @param tileNumber - The number representing the tile type
 * @returns Promise<Sprite> - The loaded sprite
 */
function loadTileSprite(tileNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = TILE_TO_IMAGE[tileNumber];
        if (!fileName) {
            throw new Error(`No image found for tile number: ${tileNumber}`);
        }
        const imagePath = `assets/${fileName}`;
        const texture = yield pixi_js_1.Assets.load(imagePath);
        return new pixi_js_1.Sprite(texture);
    });
}
console.log("Board Size:", BOARD_WIDTH, "x", BOARD_HEIGHT);
// Configuration for the grid display
const TILE_SIZE = 64; // Size of each tile in pixels
// Calculate grid dimensions
const GRID_WIDTH = BOARD_WIDTH * TILE_SIZE;
const GRID_HEIGHT = BOARD_HEIGHT * TILE_SIZE;
// Center the grid on screen - these will be calculated after app initialization
let GRID_OFFSET_X = 0;
let GRID_OFFSET_Y = 0;
/**
 * Render the entire board grid with appropriate sprites
 * @param app - The PIXI Application instance
 */
function renderBoard(app) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                const tileNumber = LEVEL.board[row][col];
                try {
                    const sprite = yield loadTileSprite(tileNumber);
                    // Position the sprite in the grid
                    sprite.x = GRID_OFFSET_X + col * TILE_SIZE;
                    sprite.y = GRID_OFFSET_Y + row * TILE_SIZE;
                    // Scale the sprite to fit the tile size
                    sprite.width = TILE_SIZE;
                    sprite.height = TILE_SIZE;
                    app.stage.addChild(sprite);
                    console.log(`Placed tile ${tileNumber} at position (${col}, ${row})`);
                }
                catch (error) {
                    console.error(`Error loading sprite for tile ${tileNumber} at position (${col}, ${row}):`, error);
                }
            }
        }
    });
}
/**
 * Draw gridlines to visualize the grid structure
 * @param app - The PIXI Application instance
 */
function drawGridlines(app) {
    const graphics = new pixi_js_1.Graphics();
    // Set stroke style for gridlines - smaller and less prominent
    graphics.setStrokeStyle({ width: 1, color: 0x666666, alpha: 0.4 });
    // Draw vertical lines
    for (let col = 0; col <= BOARD_WIDTH; col++) {
        const x = GRID_OFFSET_X + col * TILE_SIZE;
        graphics.moveTo(x, GRID_OFFSET_Y);
        graphics.lineTo(x, GRID_OFFSET_Y + BOARD_HEIGHT * TILE_SIZE);
    }
    // Draw horizontal lines
    for (let row = 0; row <= BOARD_HEIGHT; row++) {
        const y = GRID_OFFSET_Y + row * TILE_SIZE;
        graphics.moveTo(GRID_OFFSET_X, y);
        graphics.lineTo(GRID_OFFSET_X + BOARD_WIDTH * TILE_SIZE, y);
    }
    // Important: Call stroke() to actually draw the lines
    graphics.stroke();
    app.stage.addChild(graphics);
    console.log("Gridlines drawn with subtle gray borders");
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Create a new application
    const app = new pixi_js_1.Application();
    // Initialize the application
    yield app.init({
        background: "#1099bb",
        resizeTo: window,
    });
    // Append the application canvas to the document body
    document.getElementById("pixi-container").appendChild(app.canvas);
    // Calculate centered position after app initialization
    GRID_OFFSET_X = (app.screen.width - GRID_WIDTH) / 2;
    GRID_OFFSET_Y = (app.screen.height - GRID_HEIGHT) / 2;
    console.log(`Grid centered at: (${GRID_OFFSET_X}, ${GRID_OFFSET_Y})`);
    console.log(`Screen size: ${app.screen.width} x ${app.screen.height}`);
    console.log(`Grid size: ${GRID_WIDTH} x ${GRID_HEIGHT}`);
    // Render the entire board
    try {
        yield renderBoard(app);
        drawGridlines(app);
        console.log("Successfully rendered the board grid with gridlines");
    }
    catch (error) {
        console.error("Error rendering board:", error);
    }
}))();
