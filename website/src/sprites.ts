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
  18: "18 Up-Facing Tunnel.svg",
  19: "19 Right-Facing Tunnel.svg",
  20: "20 Down-Facing Tunnel.svg",
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
  }

  public updateNumber(newNumber: number): void {
    this.numberText.text = newNumber.toString();
  }

  public updateDirection(direction: string): void {
    this.setCarRotation(direction);
  }

  public getContainer(): Container {
    return this.container;
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
