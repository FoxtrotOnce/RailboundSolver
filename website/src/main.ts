import { Application, Graphics } from "pixi.js";
import levels from "../../levels.json";
import { CarSprite, Car, loadTileSprite } from "./sprites";

const LEVEL = levels["12-6B"];
console.log(LEVEL);
// LEVEL.board is a 2D array of numbers. Get the width and height of the board
const BOARD_WIDTH = LEVEL.board[0].length;
const BOARD_HEIGHT = LEVEL.board.length;

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
async function renderBoard(app: Application): Promise<void> {
  for (let row = 0; row < BOARD_HEIGHT; row++) {
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const tileNumber = LEVEL.board[row][col];

      try {
        const sprite = await loadTileSprite(tileNumber);

        // Position the sprite in the grid
        sprite.x = GRID_OFFSET_X + col * TILE_SIZE;
        sprite.y = GRID_OFFSET_Y + row * TILE_SIZE;

        // Scale the sprite to fit the tile size
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;

        app.stage.addChild(sprite);

        console.log(`Placed tile ${tileNumber} at position (${col}, ${row})`);
      } catch (error) {
        console.error(
          `Error loading sprite for tile ${tileNumber} at position (${col}, ${row}):`,
          error
        );
      }
    }
  }
}

/**
 * Render cars on the board
 * @param app - The PIXI Application instance
 * @param cars - Array of car objects to render
 */
async function renderCars(app: Application, cars: Car[]): Promise<void> {
  for (let index = 0; index < cars.length; index++) {
    const car = cars[index];
    try {
      const carSprite = new CarSprite(car, TILE_SIZE);
      // Calculate position on the grid - pos is [row, col]
      const row = car.pos[0];
      const col = car.pos[1];
      const x = GRID_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
      const y = GRID_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;

      carSprite.setPosition(x, y);
      // Update car number to use array index instead of car.num
      carSprite.updateNumber(index);

      app.stage.addChild(carSprite.getContainer());
      console.log(
        `Placed car ${index} at position (${row}, ${col}) facing ${car.direction}`
      );
    } catch (error) {
      console.error(
        `Error creating car sprite for car at position (${car.pos[0]}, ${car.pos[1]}):`,
        error
      );
    }
  }
}

/**
 * Draw gridlines to visualize the grid structure
 * @param app - The PIXI Application instance
 */
function drawGridlines(app: Application): void {
  const graphics = new Graphics();

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

(async () => {
  // Create a new application
  const app = new Application();
  // Initialize the application
  await app.init({
    background: "#1099bb",
    resizeTo: window,
  });
  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Calculate centered position after app initialization
  GRID_OFFSET_X = (app.screen.width - GRID_WIDTH) / 2;
  GRID_OFFSET_Y = (app.screen.height - GRID_HEIGHT) / 2;

  console.log(`Grid centered at: (${GRID_OFFSET_X}, ${GRID_OFFSET_Y})`);
  console.log(`Screen size: ${app.screen.width} x ${app.screen.height}`);
  console.log(`Grid size: ${GRID_WIDTH} x ${GRID_HEIGHT}`);
  // Render the entire board
  try {
    await renderBoard(app);
    drawGridlines(app);

    // Render cars if they exist in the level
    if (LEVEL.cars && LEVEL.cars.length > 0) {
      await renderCars(app, LEVEL.cars);
      console.log("Successfully rendered cars");
    }

    console.log("Successfully rendered the board grid with gridlines and cars");
  } catch (error) {
    console.error("Error rendering board:", error);
  }
})();
