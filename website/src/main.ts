import { Application, Graphics } from "pixi.js";
// import levels from "../../levels.json";
import levels from "../../solutions.json";
import { CarSprite, Car, loadTileSprite } from "./sprites";
import { CarSimulation } from "./simulation";

// Available levels
const AVAILABLE_LEVELS = Object.keys(levels);
let currentLevelKey = AVAILABLE_LEVELS[0]; // Start with the first level
let LEVEL = levels[currentLevelKey as keyof typeof levels];
console.log(LEVEL);

// Dynamic board dimensions
let BOARD_WIDTH = LEVEL.board[0].length;
let BOARD_HEIGHT = LEVEL.board.length;

console.log("Board Size:", BOARD_WIDTH, "x", BOARD_HEIGHT);

// Configuration for the grid display
const TILE_SIZE = 64; // Size of each tile in pixels

// Calculate grid dimensions - these will be updated when level changes
let GRID_WIDTH = BOARD_WIDTH * TILE_SIZE;
let GRID_HEIGHT = BOARD_HEIGHT * TILE_SIZE;

// Center the grid on screen - these will be calculated after app initialization
let GRID_OFFSET_X = 0;
let GRID_OFFSET_Y = 0;

// Global simulation instance
let carSimulation: CarSimulation | null = null;

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
 * Load a new level and update the display
 * @param app - The PIXI Application instance
 * @param levelKey - The key of the level to load
 */
async function loadLevel(app: Application, levelKey: string): Promise<void> {
  // Stop and reset any running simulation
  if (carSimulation) {
    carSimulation.stop();
    carSimulation.reset();
  }

  // Clear the stage
  app.stage.removeChildren();
  initialCarSprites.length = 0; // Clear the initial car sprites array

  // Update current level
  currentLevelKey = levelKey;
  LEVEL = levels[currentLevelKey as keyof typeof levels];

  // Update board dimensions
  BOARD_WIDTH = LEVEL.board[0].length;
  BOARD_HEIGHT = LEVEL.board.length;

  // Recalculate grid dimensions and positioning
  GRID_WIDTH = BOARD_WIDTH * TILE_SIZE;
  GRID_HEIGHT = BOARD_HEIGHT * TILE_SIZE;
  GRID_OFFSET_X = (app.screen.width - GRID_WIDTH) / 2;
  GRID_OFFSET_Y = (app.screen.height - GRID_HEIGHT) / 2;

  console.log(`Loading level ${levelKey}: ${BOARD_WIDTH}x${BOARD_HEIGHT}`);

  // Render the new level
  await renderBoard(app);
  drawGridlines(app);

  // Render cars if they exist in the level
  if (LEVEL.cars && LEVEL.cars.length > 0) {
    await renderCars(app, LEVEL.cars);

    // Initialize new simulation
    carSimulation = new CarSimulation(
      LEVEL.cars,
      LEVEL.solution,
      app,
      TILE_SIZE,
      GRID_OFFSET_X,
      GRID_OFFSET_Y
    );

    // Set up callbacks for UI updates and logging
    setupSimulationCallbacks(carSimulation);

    console.log(
      "Successfully loaded level with cars and initialized simulation"
    );
  } else {
    carSimulation = null;
    console.log("Level loaded without cars");
  }

  // Update UI state to ready after level change
  const updateControlsState = (
    globalThis as {
      updateControlsState?: (state: "ready" | "running" | "stopped") => void;
    }
  ).updateControlsState;
  if (updateControlsState) {
    updateControlsState("ready");
  }
}

/**
 * Set up callbacks for the car simulation
 * @param simulation - The CarSimulation instance
 */
function setupSimulationCallbacks(simulation: CarSimulation): void {
  // Set up state change callback to update UI when simulation finishes
  simulation.setStateChangeCallback((state) => {
    const updateControlsState = (
      globalThis as {
        updateControlsState?: (state: "ready" | "running" | "stopped") => void;
      }
    ).updateControlsState;
    if (updateControlsState) {
      updateControlsState(state);
    }
  });

  // Set up log callback to show messages in the log display
  simulation.setLogCallback((message) => {
    const logDisplay = document.getElementById("log-display");
    if (logDisplay && logDisplay.style.display !== "none") {
      const logContent = document.getElementById("log-content");
      if (logContent) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement("div");
        logEntry.style.cssText = `
          margin-bottom: 4px;
          padding: 2px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        logEntry.innerHTML = `<span style="color: #888; font-size: 10px;">[${timestamp}]</span> ${message}`;
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
      }
    }
  });
}

// Store initial car sprites so we can remove them when simulation starts
const initialCarSprites: CarSprite[] = [];

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

  // Level selection section
  const levelContainer = document.createElement("div");
  levelContainer.style.cssText = `
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  `;

  const levelLabel = document.createElement("label");
  levelLabel.textContent = `Current Level: ${currentLevelKey}`;
  levelLabel.style.cssText = `
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #ccc;
    text-align: center;
  `;
  levelContainer.appendChild(levelLabel);

  const levelSelect = document.createElement("select");
  levelSelect.id = "level-select";
  levelSelect.style.cssText = `
    width: 100%;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 14px;
    margin-bottom: 8px;
  `;

  // Populate level options
  AVAILABLE_LEVELS.forEach((levelKey) => {
    const option = document.createElement("option");
    option.value = levelKey;
    option.textContent = `Level ${levelKey}`;
    option.selected = levelKey === currentLevelKey;
    option.style.cssText = `
      background: #333;
      color: white;
    `;
    levelSelect.appendChild(option);
  });

  levelSelect.onchange = async (e) => {
    const target = e.target as HTMLSelectElement;
    const newLevelKey = target.value;
    if (newLevelKey !== currentLevelKey) {
      // Check if simulation is running and inform user
      const wasRunning = carSimulation && carSimulation.getIsRunning();
      if (wasRunning) {
        levelLabel.textContent = `Stopping simulation and loading ${newLevelKey}...`;
      } else {
        levelLabel.textContent = `Loading Level: ${newLevelKey}...`;
      }

      try {
        await loadLevel(app, newLevelKey);
        levelLabel.textContent = `Current Level: ${newLevelKey}`;
        if (wasRunning) {
          console.log(
            `Simulation stopped and switched to level ${newLevelKey}`
          );
        } else {
          console.log(`Successfully switched to level ${newLevelKey}`);
        }
      } catch (error) {
        console.error(`Error loading level ${newLevelKey}:`, error);
        levelLabel.textContent = `Error loading ${newLevelKey}`;
        // Revert selection
        levelSelect.value = currentLevelKey;
        setTimeout(() => {
          levelLabel.textContent = `Current Level: ${currentLevelKey}`;
        }, 2000);
      }
    }
  };

  levelContainer.appendChild(levelSelect);
  controlsDiv.appendChild(levelContainer);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  const startStopButton = document.createElement("button");
  startStopButton.textContent = "Start Simulation";
  startStopButton.className = "simulation-button start-stop-button";
  startStopButton.onclick = () => {
    if (carSimulation) {
      if (carSimulation.getIsRunning()) {
        // Stop simulation
        carSimulation.stop();
        updateControlsState("stopped");
      } else {
        // Start simulation
        removeInitialCarSprites(app);
        carSimulation.start();
        updateControlsState("running");
      }
    }
  };
  buttonContainer.appendChild(startStopButton);

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

  const showLogButton = document.createElement("button");
  showLogButton.textContent = "Show Log";
  showLogButton.className = "simulation-button log-button";
  showLogButton.onclick = () => {
    toggleLogDisplay();
  };
  buttonContainer.appendChild(showLogButton);

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
    const startStopButton = document.querySelector(
      ".start-stop-button"
    ) as HTMLButtonElement;
    const resetButton = document.querySelector(
      ".reset-button"
    ) as HTMLButtonElement;

    indicator.className = `status-indicator status-${state}`;

    switch (state) {
      case "ready":
        text.textContent = "Ready to simulate";
        if (startStopButton) {
          startStopButton.textContent = "Start Simulation";
          startStopButton.disabled = false;
        }
        if (resetButton) resetButton.disabled = false;
        break;
      case "running":
        text.textContent = "Simulation running";
        if (startStopButton) {
          startStopButton.textContent = "Stop Simulation";
          startStopButton.disabled = false;
        }
        if (resetButton) resetButton.disabled = true;
        break;
      case "stopped":
        text.textContent = "Simulation stopped";
        if (startStopButton) {
          startStopButton.textContent = "Start Simulation";
          startStopButton.disabled = false;
        }
        if (resetButton) resetButton.disabled = false;
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
        // Toggle simulation like the combined button
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
        if (carSimulation.getIsRunning()) {
          carSimulation.stop();
          updateControlsState("stopped");
        }
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

/**
 * Toggle the log display visibility
 */
function toggleLogDisplay(): void {
  let logDisplay = document.getElementById("log-display");

  if (!logDisplay) {
    // Create log display if it doesn't exist
    logDisplay = document.createElement("div");
    logDisplay.id = "log-display";
    logDisplay.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.95);
      color: #00ff00;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      max-width: 600px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
      border: 1px solid rgba(0, 255, 0, 0.3);
      backdrop-filter: blur(10px);
      line-height: 1.4;
    `;

    const logHeader = document.createElement("div");
    logHeader.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      color: #00ffff;
      border-bottom: 1px solid rgba(0, 255, 255, 0.3);
      padding-bottom: 5px;
    `;
    logHeader.textContent = "Simulation Log";

    const logContent = document.createElement("div");
    logContent.id = "log-content";
    logContent.style.cssText = `
      white-space: pre-wrap;
      word-wrap: break-word;
    `;

    logDisplay.appendChild(logHeader);
    logDisplay.appendChild(logContent);
    document.body.appendChild(logDisplay);

    // Capture console.log messages
    const originalLog = console.log;
    console.log = function (...args) {
      originalLog.apply(console, args);
      const logContent = document.getElementById("log-content");
      if (logContent) {
        const timestamp = new Date().toLocaleTimeString();
        const message = args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ");
        logContent.textContent += `[${timestamp}] ${message}\n`;
        logContent.scrollTop = logContent.scrollHeight;
      }
    };

    // Update button text
    const logButton = document.querySelector(
      ".log-button"
    ) as HTMLButtonElement;
    if (logButton) logButton.textContent = "Hide Log";
  } else {
    // Toggle visibility
    if (logDisplay.style.display === "none") {
      logDisplay.style.display = "block";
      const logButton = document.querySelector(
        ".log-button"
      ) as HTMLButtonElement;
      if (logButton) logButton.textContent = "Hide Log";
    } else {
      logDisplay.style.display = "none";
      const logButton = document.querySelector(
        ".log-button"
      ) as HTMLButtonElement;
      if (logButton) logButton.textContent = "Show Log";
    }
  }
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

      // Set up callbacks for UI updates and logging
      setupSimulationCallbacks(carSimulation);

      console.log("Successfully rendered cars and initialized simulation");
    }

    console.log("Successfully rendered the board grid with gridlines and cars");
  } catch (error) {
    console.error("Error rendering board:", error);
  }
})();
