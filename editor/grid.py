import json
from PIL import ImageTk
from PIL import Image


class Grid:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.grid = [[0 for _ in range(width)] for _ in range(height)]
        self.tile_images = {}

    def set_tile(self, row, col, tile_index):
        self.grid[row][col] = tile_index

    def get_tile(self, row, col):
        return self.grid[row][col]

    def save(self, file_path):
        data = {"grid": self.grid, "width": self.width, "height": self.height}
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

    @classmethod
    def load(cls, file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        grid = cls(data["width"], data["height"])
        grid.grid = data["grid"]
        return grid

    def reset(self, width, height):
        self.width = width
        self.height = height
        self.grid = [[0 for _ in range(width)] for _ in range(height)]

    def get_tile_image(self, tile_index, size, tiles):
        if (tile_index, size) not in self.tile_images:
            tile = tiles[tile_index]
            img = tile.img.copy()
            img = img.resize(size, Image.Resampling.LANCZOS)
            photo_image = ImageTk.PhotoImage(img)
            self.tile_images[(tile_index, size)] = photo_image
        return self.tile_images[(tile_index, size)]

    def render(self, canvas, offset_x, offset_y, cell_width, cell_height, tiles):
        for row in range(self.height):
            for col in range(self.width):
                x1 = offset_x + col * cell_width
                y1 = offset_y + row * cell_height
                x2 = x1 + cell_width
                y2 = y1 + cell_height

                tile_index = self.get_tile(row, col)
                tile_image = self.get_tile_image(
                    tile_index, (cell_width, cell_height), tiles
                )
                canvas.create_image(x1, y1, anchor="nw", image=tile_image)
                canvas.create_rectangle(x1, y1, x2, y2, outline="gray")
