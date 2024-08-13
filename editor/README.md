# Railbound Solver Editor

## Description

The Railbound Solver Editor, located in the `editor` folder, is a graphical user interface (GUI) application for creating and editing grid-based puzzles similar to the game Railbound.

## Features

- Create and edit grid-based puzzles
- Place various tile types (Empty, Curve, Straight, T-turn, Rock)
- Set grid dimensions
- Place and rotate carts
- Set destination points
- Save and load puzzle configurations

## Usage

Navigate to the `editor` folder and run:

```
python main.py
```

Use the GUI to create and edit puzzles. Place tiles by selecting a tile type and clicking on the grid. Set destinations and place carts using the respective buttons.

## Files

In the `editor` folder:

- `main.py`: Main application and GUI
- `tiles.py`: Tile class and tile creation functions
- `utils.py`: Utility classes (e.g., DIRECTION enumeration)

## Dependencies

- Python 3.x
- Tkinter
- Pillow (PIL)
- OpenCV (cv2)
- NumPy
