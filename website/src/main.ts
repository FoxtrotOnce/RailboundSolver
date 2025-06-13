import { Application, Graphics } from "pixi.js";
// import levels from "../../levels.json";
import levels from "../../solutions.json";
import { CarSprite, Car, loadTileSprite } from "./sprites";
import { CarSimulation } from "./simulation";

const LEVEL = levels["1-3"];
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

// Global simulation instance
let carSimulation: CarSimulation | null = null;
// Store initial car sprites so we can remove them when simulation starts
const initialCarSprites: CarSprite[] = [];

/**
 * Render the entire board grid with appropriate sprites
 * @param app - The PIXI Application instance
 */
async function renderBoard(app: Application): Promise<void> {
  for (let row = 0; row < BOARD_HEIGHT; row++) {
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const tileNumber = LEVEL.solution[row][col];

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
      // Store the initial car sprite so we can remove it later
      initialCarSprites.push(carSprite);
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
 * Remove initial car sprites from the stage
 * @param app - The PIXI Application instance
 */
function removeInitialCarSprites(app: Application): void {
  initialCarSprites.forEach((carSprite) => {
    if (carSprite.getContainer().parent) {
      app.stage.removeChild(carSprite.getContainer());
    }
  });
  console.log("Removed initial car sprites");
}

/**
 * Restore initial car sprites to the stage
 * @param app - The PIXI Application instance
 */
function restoreInitialCarSprites(app: Application): void {
  initialCarSprites.forEach((carSprite) => {
    if (!carSprite.getContainer().parent) {
      app.stage.addChild(carSprite.getContainer());
    }
  });
  console.log("Restored initial car sprites");
}

/**
 * Create simulation control UI
 */
function createSimulationControls(app: Application): void {
  const controlsDiv = document.createElement("div");
  controlsDiv.id = "simulation-controls";
  controlsDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 12px;
    font-family: Arial, sans-serif;
    z-index: 1000;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    min-width: 200px;
  `;

  const title = document.createElement("h3");
  title.textContent = "Car Simulation";
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: #4CAF50;
    font-size: 18px;
    text-align: center;
  `;
  controlsDiv.appendChild(title);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  const startButton = document.createElement("button");
  startButton.textContent = "Start Simulation";
  startButton.className = "simulation-button start-button";
  startButton.onclick = () => {
    if (carSimulation) {
      // Remove initial car sprites before starting simulation
      removeInitialCarSprites(app);
      carSimulation.start();
      updateControlsState("running");
    }
  };
  buttonContainer.appendChild(startButton);

  const stopButton = document.createElement("button");
  stopButton.textContent = "Stop";
  stopButton.className = "simulation-button stop-button";
  stopButton.onclick = () => {
    if (carSimulation) {
      carSimulation.stop();
      updateControlsState("stopped");
    }
  };
  buttonContainer.appendChild(stopButton);

  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset";
  resetButton.className = "simulation-button reset-button";
  resetButton.onclick = () => {
    if (carSimulation) {
      carSimulation.reset();
      restoreInitialCarSprites(app);
      updateControlsState("ready");
    }
  };
  buttonContainer.appendChild(resetButton);

  controlsDiv.appendChild(buttonContainer);

  const speedContainer = document.createElement("div");
  speedContainer.style.marginTop = "15px";

  const speedLabel = document.createElement("label");
  speedLabel.textContent = "Speed: 500ms";
  speedLabel.style.cssText = `
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #ccc;
  `;
  speedContainer.appendChild(speedLabel);

  const speedSlider = document.createElement("input");
  speedSlider.type = "range";
  speedSlider.min = "100";
  speedSlider.max = "2000";
  speedSlider.value = "500";
  speedSlider.className = "speed-slider";
  speedSlider.oninput = (e) => {
    const target = e.target as HTMLInputElement;
    if (carSimulation) {
      carSimulation.setSpeed(parseInt(target.value));
    }
    speedLabel.textContent = `Speed: ${target.value}ms`;
  };
  speedContainer.appendChild(speedSlider);
  controlsDiv.appendChild(speedContainer);

  const statusContainer = document.createElement("div");
  statusContainer.style.cssText = `
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  `;

  const statusIndicator = document.createElement("div");
  statusIndicator.id = "status-indicator";
  statusIndicator.className = "status-indicator status-ready";

  const statusText = document.createElement("span");
  statusText.id = "status-text";
  statusText.textContent = "Ready to simulate";

  const statusDiv = document.createElement("div");
  statusDiv.style.cssText = `
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #ccc;
    margin-bottom: 8px;
  `;
  statusDiv.appendChild(statusIndicator);
  statusDiv.appendChild(statusText);
  statusContainer.appendChild(statusDiv);

  const carStatusDiv = document.createElement("div");
  carStatusDiv.id = "car-status";
  carStatusDiv.style.cssText = `
    font-size: 11px;
    color: #999;
    line-height: 1.4;
  `;
  carStatusDiv.textContent = "Cars: Loading...";
  statusContainer.appendChild(carStatusDiv);

  // Add keyboard shortcuts info
  const shortcutsDiv = document.createElement("div");
  shortcutsDiv.style.cssText = `
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 10px;
    color: #666;
    line-height: 1.3;
  `;
  shortcutsDiv.innerHTML = `
    <strong>Keyboard Shortcuts:</strong><br>
    Space/Enter: Start/Stop<br>
    R: Reset<br>
    Esc: Stop
  `;
  statusContainer.appendChild(shortcutsDiv);

  controlsDiv.appendChild(statusContainer);
  document.body.appendChild(controlsDiv);

  // Function to update control states
  function updateControlsState(state: "ready" | "running" | "stopped"): void {
    const indicator = document.getElementById("status-indicator")!;
    const text = document.getElementById("status-text")!;

    indicator.className = `status-indicator status-${state}`;

    switch (state) {
      case "ready":
        text.textContent = "Ready to simulate";
        startButton.disabled = false;
        stopButton.disabled = true;
        resetButton.disabled = false;
        break;
      case "running":
        text.textContent = "Simulation running";
        startButton.disabled = true;
        stopButton.disabled = false;
        resetButton.disabled = true;
        break;
      case "stopped":
        text.textContent = "Simulation stopped";
        startButton.disabled = false;
        stopButton.disabled = true;
        resetButton.disabled = false;
        break;
    }
  }

  // Update status periodically
  setInterval(() => {
    if (carSimulation) {
      const carStatusDiv = document.getElementById("car-status")!;
      carStatusDiv.textContent = carSimulation.getStatus();
    }
  }, 500);

  // Store the update function globally for access
  (
    globalThis as { updateControlsState?: typeof updateControlsState }
  ).updateControlsState = updateControlsState;

  // Add keyboard shortcuts
  document.addEventListener("keydown", (event) => {
    if (!carSimulation) return;

    switch (event.key) {
      case " ": // Spacebar
      case "Enter":
        event.preventDefault();
        if (!carSimulation.getIsRunning()) {
          removeInitialCarSprites(app);
          carSimulation.start();
          updateControlsState("running");
        } else {
          carSimulation.stop();
          updateControlsState("stopped");
        }
        break;
      case "r":
      case "R":
        event.preventDefault();
        carSimulation.reset();
        restoreInitialCarSprites(app);
        updateControlsState("ready");
        break;
      case "Escape":
        event.preventDefault();
        carSimulation.stop();
        updateControlsState("stopped");
        break;
    }
  });
}
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

    // Create simulation controls
    createSimulationControls(app);

    // Render cars if they exist in the level
    if (LEVEL.cars && LEVEL.cars.length > 0) {
      await renderCars(app, LEVEL.cars);

      // Initialize simulation
      carSimulation = new CarSimulation(
        LEVEL.cars,
        LEVEL.solution,
        app,
        TILE_SIZE,
        GRID_OFFSET_X,
        GRID_OFFSET_Y
      );

      console.log("Successfully rendered cars and initialized simulation");
    }

    console.log("Successfully rendered the board grid with gridlines and cars");
  } catch (error) {
    console.error("Error rendering board:", error);
  }
})();
