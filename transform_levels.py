"""
Transforms the data in `levels_cars` to multiple JSON files for the new system.

Parameters:
- level_data (dict): A dictionary containing the level data.
- level_name (str): The name of the level.

Returns:
None

Raises:
None

Example Usage:
```python
for level_name, level_data in data.items():     
    transform_to_json(level_data, level_name)
```
"""

import numpy as np
import json

from algo.levels_cars import world1 as data


def transform_to_json(level_data, level_name):
    # Extract data from the level
    grid = level_data[0].tolist()
    carts = [
        {"x": cart[0], "y": cart[1], "xvelo": cart[2], "yvelo": cart[3]}
        for cart in level_data[1]
    ]

    # Create the JSON structure
    json_data = {
        "grid": grid,
        "width": len(grid[0]),
        "height": len(grid),
        "carts": carts,
    }

    # Save to a JSON file
    with open(f"levels/1/{level_name}.json", "w") as f:
        json.dump(json_data, f, indent=2)


if __name__ == "__main__":

    for level_name, level_data in data.items():
        transform_to_json(level_data, level_name)

    print("Transformation complete. Check the generated JSON files.")
