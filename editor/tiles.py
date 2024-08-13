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

    def rotate(self, n) -> "Tile":
        """
        Create a new Tile instance with the rotated image.

        Args:
            n (int): The number of 90-degree clockwise rotations.

        Returns:
            Tile: A new Tile instance with the rotated image.
        """
        rotated_img = self.img.rotate(n * -90)
        return Tile(f"{self.name}_rotated_{n}", rotated_img)

    def flip(self, axis="vertical") -> "Tile":
        """
        Create a new Tile instance with the flipped image.

        Args:
            axis (str): The axis to flip the image. 'vertical' or 'horizontal'.

        Returns:
            Tile: A new Tile instance with the flipped image.
        """
        if axis not in ["vertical", "horizontal"]:
            raise ValueError("Invalid axis. Use 'vertical' or 'horizontal'")

        if axis == "vertical":
            flipped_img = self.img.transpose(Image.FLIP_TOP_BOTTOM)
        else:
            flipped_img = self.img.transpose(Image.FLIP_LEFT_RIGHT)

        return Tile(f"{self.name}_flipped_{axis}", flipped_img)


def create_tiles() -> list[Tile]:
    """
    Create a list of tiles with different shapes and orientations.

    Returns:
        list[Tile]: A list of tiles with different shapes and orientations
    """
    # Use the parent directory of the current file
    image_dir = Path(__file__).parent.parent / "images"

    tiles = []

    # Define tile types and their rotations/flips
    tile_types = {
        "Empty": [],
        "Curve": [1, 2, 3],
        "Straight": [1],
        "T_turn": [1, 2, 3, ("flip", 0), ("flip", 1), ("flip", 2), ("flip", 3)],
        "Rock": [],
    }

    for tile_name, variations in tile_types.items():
        base_tile = Tile(tile_name, Image.open(image_dir / f"{tile_name}.png"))
        tiles.append(base_tile)

        for variation in variations:
            if isinstance(variation, int):
                tiles.append(base_tile.rotate(variation))
            elif isinstance(variation, tuple) and variation[0] == "flip":
                flipped = base_tile.flip()
                if variation[1] > 0:
                    tiles.append(flipped.rotate(variation[1]))
                else:
                    tiles.append(flipped)

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
