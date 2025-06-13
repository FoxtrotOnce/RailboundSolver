import { Assets, Sprite, Text, TextStyle, Container } from "pixi.js";

// Mapping of tile numbers to image file names
export const TILE_TO_IMAGE: { [key: number]: string } = {
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
  18: "19 Right-Facing Tunnel.svg",
  19: "20 Down-Facing Tunnel.svg",
  20: "18 Up-Facing Tunnel.svg",
  21: "21 Numeral Car Ending Track (Right Side).svg",
  22: "22 Numeral Car Ending Track (Left Side).svg",
};

/**
 * Type definitions for car data
 */
export interface Car {
  pos: number[];
  direction: string;
  num: number;
  type: string;
}

/**
 * Car sprite class that handles car display and number overlay
 */
export class CarSprite {
  private container: Container;
  private carSprite: Sprite;
  private numberText: Text;
  private targetX: number = 0;
  private targetY: number = 0;
  private isAnimating: boolean = false;

  constructor(car: Car, tileSize: number) {
    this.container = new Container();
    this.carSprite = new Sprite();
    this.numberText = new Text();

    // Initialize synchronously first
    this.initializeNumberText(car);
    // Then initialize the car sprite asynchronously
    this.initializeCarSprite(car, tileSize);
  }

  private async initializeCarSprite(car: Car, tileSize: number): Promise<void> {
    // Load the car SVG texture
    const texture = await Assets.load("assets/Car.svg");
    this.carSprite = new Sprite(texture);

    // Set size and anchor
    this.carSprite.width = tileSize;
    this.carSprite.height = tileSize;
    this.carSprite.anchor.set(0.5);

    // Set rotation based on direction
    this.setCarRotation(car.direction);

    // Add car sprite first (background)
    this.container.addChild(this.carSprite);
    // Ensure text is on top by adding/re-adding it after the car sprite
    if (this.numberText.parent) {
      this.container.removeChild(this.numberText);
    }
    this.container.addChild(this.numberText);
  }
  private initializeNumberText(car: Car): void {
    // Create text style with better visibility
    const style = new TextStyle({
      fontFamily: "Arial, sans-serif",
      fontSize: 18,
      fill: "white",
      stroke: { color: "black", width: 3 },
    });

    this.numberText = new Text(car.num.toString(), style);
    this.numberText.anchor.set(0.5, 1);
    this.container.addChild(this.numberText);
  }

  private setCarRotation(direction: string): void {
    switch (direction) {
      case "UP":
        this.carSprite.rotation = -Math.PI / 2; // -90 degrees
        this.numberText.rotation = 0; // No rotation for up-facing text
        break;
      case "DOWN":
        this.carSprite.rotation = Math.PI / 2; // 90 degrees
        this.numberText.rotation = Math.PI; // 180 degrees for down-facing text
        break;
      case "LEFT":
        this.carSprite.rotation = Math.PI; // 180 degrees
        this.numberText.rotation = -Math.PI / 2; // -90 degrees for left-facing text
        break;
      case "RIGHT":
        this.carSprite.rotation = 0; // 0 degrees
        this.numberText.rotation = Math.PI / 2;
        break;
    }
  }

  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  public setPositionImmediate(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  public animateToPosition(
    x: number,
    y: number,
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      this.targetX = x;
      this.targetY = y;
      this.isAnimating = true;

      const startX = this.container.x;
      const startY = this.container.y;
      const startTime = performance.now();

      const easeInOutQuad = (t: number): number => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      };

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutQuad(progress);

        this.container.x = startX + (this.targetX - startX) * easedProgress;
        this.container.y = startY + (this.targetY - startY) * easedProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  public animateToRotation(
    targetRotation: number,
    duration: number = 200
  ): Promise<void> {
    return new Promise((resolve) => {
      const startRotation = this.carSprite.rotation;
      const startTextRotation = this.numberText.rotation;

      // Check if we're rotating from a cardinal direction (0°, 90°, 180°, 270°) to a 45-degree angle
      const isFromCardinal = this.isCardinalDirection(startRotation);
      const isTo45Degree = this.is45DegreeAngle(targetRotation);
      const shouldDelay = isFromCardinal && isTo45Degree;

      // Add delay if rotating from cardinal to 45-degree angle
      const delayTime = shouldDelay ? 150 : 0; // 150ms delay

      const startAnimation = () => {
        const startTime = performance.now();

        // Handle rotation wrapping to take the shortest path
        let rotationDiff = targetRotation - startRotation;
        if (rotationDiff > Math.PI) {
          rotationDiff -= 2 * Math.PI;
        } else if (rotationDiff < -Math.PI) {
          rotationDiff += 2 * Math.PI;
        }

        // Calculate target text rotation to keep text readable
        const targetTextRotation =
          this.calculateTextRotationForCarAngle(targetRotation);
        let textRotationDiff = targetTextRotation - startTextRotation;
        if (textRotationDiff > Math.PI) {
          textRotationDiff -= 2 * Math.PI;
        } else if (textRotationDiff < -Math.PI) {
          textRotationDiff += 2 * Math.PI;
        }

        const easeInOutQuad = (t: number): number => {
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeInOutQuad(progress);

          this.carSprite.rotation =
            startRotation + rotationDiff * easedProgress;
          this.numberText.rotation =
            startTextRotation + textRotationDiff * easedProgress;

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(animate);
      };

      // Start animation immediately or after delay
      if (shouldDelay) {
        setTimeout(startAnimation, delayTime);
      } else {
        startAnimation();
      }
    });
  }

  public updateNumber(newNumber: number): void {
    this.numberText.text = newNumber.toString();
  }

  public updateDirection(direction: string): void {
    this.setCarRotation(direction);
  }

  public async updateDirectionSmooth(
    direction: string,
    duration: number = 200
  ): Promise<void> {
    const targetRotation = this.getRotationForDirection(direction);
    await this.animateToRotation(targetRotation, duration);
    this.updateTextRotation(direction);
  }

  private getRotationForDirection(direction: string): number {
    switch (direction) {
      case "UP":
        return -Math.PI / 2; // -90 degrees
      case "DOWN":
        return Math.PI / 2; // 90 degrees
      case "LEFT":
        return Math.PI; // 180 degrees
      case "RIGHT":
        return 0; // 0 degrees
      default:
        return 0;
    }
  }

  private updateTextRotation(direction: string): void {
    switch (direction) {
      case "UP":
        this.numberText.rotation = 0; // No rotation for up-facing text
        break;
      case "DOWN":
        this.numberText.rotation = Math.PI; // 180 degrees for down-facing text
        break;
      case "LEFT":
        this.numberText.rotation = -Math.PI / 2; // -90 degrees for left-facing text
        break;
      case "RIGHT":
        this.numberText.rotation = Math.PI / 2;
        break;
    }
  }

  private calculateTextRotationForCarAngle(carRotation: number): number {
    // Normalize car rotation to 0-2π range
    let normalizedRotation = carRotation;
    while (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
    while (normalizedRotation >= 2 * Math.PI) normalizedRotation -= 2 * Math.PI;

    // Convert to degrees for easier comparison
    const degrees = normalizedRotation * (180 / Math.PI);

    // Determine text rotation based on car rotation to keep text readable
    // The goal is to keep text as close to upright as possible
    if (degrees >= 315 || degrees < 45) {
      // Car facing right (0°) - text rotated 90° clockwise to be readable
      return Math.PI / 2;
    } else if (degrees >= 45 && degrees < 135) {
      // Car facing down (90°) - text rotated 180° to be readable
      return Math.PI;
    } else if (degrees >= 135 && degrees < 225) {
      // Car facing left (180°) - text rotated -90° (270°) to be readable
      return -Math.PI / 2;
    } else {
      // Car facing up (270°) - text upright (0°)
      return 0;
    }
  }

  public isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  public getContainer(): Container {
    return this.container;
  }

  public getCurrentDirection(): string {
    // Convert current car rotation back to direction string
    const rotation = this.carSprite.rotation;
    let normalizedRotation = rotation;
    while (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
    while (normalizedRotation >= 2 * Math.PI) normalizedRotation -= 2 * Math.PI;

    const degrees = normalizedRotation * (180 / Math.PI);

    if (degrees >= 315 || degrees < 45) {
      return "RIGHT";
    } else if (degrees >= 45 && degrees < 135) {
      return "DOWN";
    } else if (degrees >= 135 && degrees < 225) {
      return "LEFT";
    } else {
      return "UP";
    }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  private isCardinalDirection(rotation: number): boolean {
    // Normalize rotation to 0-2π range
    let normalizedRotation = rotation;
    while (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
    while (normalizedRotation >= 2 * Math.PI) normalizedRotation -= 2 * Math.PI;

    const tolerance = 0.1; // Small tolerance for floating point comparison

    // Check if rotation is close to 0°, 90°, 180°, or 270°
    return (
      Math.abs(normalizedRotation) < tolerance || // 0°
      Math.abs(normalizedRotation - Math.PI / 2) < tolerance || // 90°
      Math.abs(normalizedRotation - Math.PI) < tolerance || // 180°
      Math.abs(normalizedRotation - (3 * Math.PI) / 2) < tolerance // 270°
    );
  }

  private is45DegreeAngle(rotation: number): boolean {
    // Normalize rotation to 0-2π range
    let normalizedRotation = rotation;
    while (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
    while (normalizedRotation >= 2 * Math.PI) normalizedRotation -= 2 * Math.PI;

    const tolerance = 0.1; // Small tolerance for floating point comparison

    // Check if rotation is close to 45°, 135°, 225°, or 315°
    return (
      Math.abs(normalizedRotation - Math.PI / 4) < tolerance || // 45°
      Math.abs(normalizedRotation - (3 * Math.PI) / 4) < tolerance || // 135°
      Math.abs(normalizedRotation - (5 * Math.PI) / 4) < tolerance || // 225°
      Math.abs(normalizedRotation - (7 * Math.PI) / 4) < tolerance // 315°
    );
  }
}

/**
 * Load a sprite for a given tile number
 * @param tileNumber - The number representing the tile type
 * @returns Promise<Sprite> - The loaded sprite
 */
export async function loadTileSprite(tileNumber: number): Promise<Sprite> {
  const fileName = TILE_TO_IMAGE[tileNumber];
  if (!fileName) {
    throw new Error(`No image found for tile number: ${tileNumber}`);
  }

  const imagePath = `assets/${fileName}`;
  const texture = await Assets.load(imagePath);
  return new Sprite(texture);
}
