import json


class Grid:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.grid = [[0 for _ in range(width)] for _ in range(height)]

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
