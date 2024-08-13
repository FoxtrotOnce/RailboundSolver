"""
This module contains the Tile class that represents a tile in the game.
"""

import itertools
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


class Tile:
    """
    A class to represent a tile in the game.
    """

    index_counter = itertools.count()

    def __init__(self, name, img):
        self.name = name
        self.img = img
        self.index = next(Tile.index_counter)


def create_tiles() -> list[Tile]:
    """
    Create a list of tiles with different shapes and orientations.

    Returns:
        list[Tile]: A list of tiles with different shapes and orientations
    """
    # Use the parent directory of the current file
    image_dir = Path(__file__).parent.parent / "images"

    tiles = []

    # Define tile types and their image filenames in the correct order
    tile_types = {
        "Empty": "#0 Empty Tile.png",
        "Horizontal": "#1 Horizontal Track.png",
        "Vertical": "#2 Vertical Track.png",
        "Ending": "#3 Ending Track.png",
        "Fence": "#4 Fence.png",
        "Bottom_Right_Turn": "#5 Bottom-Right Turn.png",
        "Bottom_Left_Turn": "#6 Bottom-Left Turn.png",
        "Top_Right_Turn": "#7 Top-Right Turn.png",
        "Top_Left_Turn": "#8 Top-Left Turn.png",
        "Bottom_Right_Left_3Way": "#9 Bottom-Right & Left 3-Way.png",
        "Bottom_Right_Top_3Way": "#10 Bottom-Right & Top 3-Way.png",
        "Bottom_Left_Right_3Way": "#11 Bottom-Left & Right 3-Way.png",
        "Bottom_Left_Top_3Way": "#12 Bottom-Left & Top 3-Way.png",
        "Top_Right_Left_3Way": "#13 Top-Right & Left 3-Way.png",
        "Top_Right_Bottom_3Way": "#14 Top-Right & Bottom 3-Way.png",
        "Top_Left_Right_3Way": "#15 Top-Left & Right 3-Way.png",
        "Top_Left_Bottom_3Way": "#16 Top-Left & Bottom 3-Way.png",
    }

    for tile_name, filename in tile_types.items():
        image_path = image_dir / filename
        if not image_path.exists():
            print(f"Warning: Image file {image_path} not found. Skipping this tile.")
            continue

        tile = Tile(tile_name, Image.open(image_path))
        tiles.append(tile)

    return tiles


if __name__ == "__main__":
    # Preview the tiles
    tiles = create_tiles()
    print(f"Total tiles: {len(tiles)}")

    for tile in tiles:
        print(f"Displaying: {tile.name}")
        # Show the image in a window, scale the image 4 times
        cv2.imshow(
            "Tile",
            np.array(tile.img.resize((tile.img.width * 4, tile.img.height * 4))),
        )
        cv2.waitKey(0)

    cv2.destroyAllWindows()
