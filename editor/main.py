import tkinter as tk
from pathlib import Path

from grid import Grid
from cart import Cart
from ui import TileGridUI
from tiles import create_tiles


def main():
    root = tk.Tk()
    tiles = create_tiles()
    grid = Grid(5, 5)
    carts = []
    app = TileGridUI(root, grid, carts, tiles)
    root.mainloop()


if __name__ == "__main__":
    main()
