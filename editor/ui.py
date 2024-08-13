import tkinter as tk
from tkinter import ttk, filedialog
from PIL import Image, ImageTk
from pathlib import Path
from grid import Grid
from cart import Cart
import json


class TileGridUI:
    def __init__(self, master, grid, carts, tiles):
        self.master = master
        self.master.title("Tile Grid UI")
        self.grid = grid
        self.carts = carts
        self.tiles = tiles
        self.selected_tile_type = tk.StringVar()
        self.tile_images = {}
        self.cart_place_mode = False
        self.grid_width = tk.IntVar(value=self.grid.width)
        self.grid_height = tk.IntVar(value=self.grid.height)
        self.current_tile_index = 0
        self.setup_ui()

        # Set default levels folder
        self.levels_folder = Path(__file__).parent.parent / "levels"
        self.load_file_tree()
        self.update_canvas_size()
        self.draw_grid()

    def setup_ui(self):
        # Create a main container frame
        container = ttk.Frame(self.master)
        container.pack(fill=tk.BOTH, expand=True)

        # Create main_frame inside the container
        main_frame = ttk.Frame(container)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        left_frame = ttk.Frame(main_frame)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Grid size configuration
        grid_frame = ttk.Frame(left_frame)
        grid_frame.pack(pady=5)

        ttk.Label(grid_frame, text="Grid Width:").grid(row=0, column=0, padx=5, pady=5)
        ttk.Entry(grid_frame, textvariable=self.grid_width, width=5).grid(
            row=0, column=1, padx=5, pady=5
        )
        ttk.Label(grid_frame, text="Grid Height:").grid(row=0, column=2, padx=5, pady=5)
        ttk.Entry(grid_frame, textvariable=self.grid_height, width=5).grid(
            row=0, column=3, padx=5, pady=5
        )
        ttk.Button(grid_frame, text="Set Grid Size", command=self.initialize_grid).grid(
            row=0, column=4, padx=5, pady=5
        )

        # Tile selection
        tile_frame = ttk.Frame(left_frame)
        tile_frame.pack(pady=5)

        ttk.Label(tile_frame, text="Select Tile Type:").grid(
            row=0, column=0, padx=5, pady=5
        )
        tile_options = [f"{tile.name} (Index: {tile.index})" for tile in self.tiles]
        self.tile_combobox = ttk.Combobox(
            tile_frame,
            textvariable=self.selected_tile_type,
            values=tile_options,
            state="readonly",
        )
        self.tile_combobox.grid(
            row=0, column=1, columnspan=3, padx=5, pady=5, sticky="ew"
        )
        self.tile_combobox.bind("<<ComboboxSelected>>", self.on_tile_selected)

        # Save and Load buttons
        button_frame = ttk.Frame(left_frame)
        button_frame.pack(pady=5)

        ttk.Button(button_frame, text="Save Grid", command=self.save_grid).grid(
            row=0, column=0, padx=5, pady=5
        )
        ttk.Button(button_frame, text="Reset", command=self.reset_all).grid(
            row=0, column=1, padx=5, pady=5
        )

        # Toggle Cart Place Mode
        self.cart_mode_button = ttk.Button(
            button_frame,
            text="Enter Cart Place Mode",
            command=self.toggle_cart_place_mode,
        )
        self.cart_mode_button.grid(row=0, column=2, padx=5, pady=5)

        # Grid canvas
        self.canvas_frame = ttk.Frame(left_frame)
        self.canvas_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        self.canvas = tk.Canvas(self.canvas_frame, width=400, height=400, bg="white")
        self.canvas.pack(fill=tk.BOTH, expand=True)
        self.canvas.bind("<Button-1>", self.on_canvas_click)

        # File TreeView
        right_frame = ttk.Frame(main_frame)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        tree_buttons_frame = ttk.Frame(right_frame)
        tree_buttons_frame.pack(fill=tk.X)

        ttk.Button(
            tree_buttons_frame, text="Refresh", command=self.load_file_tree
        ).pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Button(
            tree_buttons_frame, text="Change Folder", command=self.change_folder
        ).pack(side=tk.LEFT, padx=5, pady=5)

        self.tree = ttk.Treeview(right_frame)
        self.tree.pack(fill=tk.BOTH, expand=True)
        self.tree.heading("#0", text="Files", anchor=tk.W)
        self.tree.bind("<<TreeviewSelect>>", self.on_file_select)

    def draw_grid(self):
        self.canvas.delete("all")
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()

        # Calculate the size of each cell while maintaining aspect ratio
        cell_width = min(
            canvas_width // self.grid.width, canvas_height // self.grid.height
        )
        cell_height = cell_width

        # Calculate the total grid size
        grid_width = cell_width * self.grid.width
        grid_height = cell_height * self.grid.height

        # Calculate offset to center the grid in the canvas
        offset_x = (canvas_width - grid_width) // 2
        offset_y = (canvas_height - grid_height) // 2

        for row in range(self.grid.height):
            for col in range(self.grid.width):
                x1 = offset_x + col * cell_width
                y1 = offset_y + row * cell_height
                x2 = x1 + cell_width
                y2 = y1 + cell_height

                tile_index = self.grid.get_tile(row, col)
                tile_image = self.get_tile_image(tile_index, (cell_width, cell_height))
                self.canvas.create_image(x1, y1, anchor="nw", image=tile_image)
                self.canvas.create_rectangle(x1, y1, x2, y2, outline="gray")

        # Draw carts
        for cart in self.carts:
            x1 = offset_x + cart.x * cell_width
            y1 = offset_y + cart.y * cell_height

            # Calculate cart size (25% of cell size)
            cart_size = min(cell_width, cell_height) * 0.25
            cart_x1 = x1 + (cell_width - cart_size) / 2
            cart_y1 = y1 + (cell_height - cart_size) / 2
            cart_x2 = cart_x1 + cart_size
            cart_y2 = cart_y1 + cart_size

            # Draw cart body
            self.canvas.create_oval(
                cart_x1, cart_y1, cart_x2, cart_y2, fill="red", outline="black", width=2
            )

            # Draw velocity vector
            center_x, center_y = (cart_x1 + cart_x2) / 2, (cart_y1 + cart_y2) / 2
            vector_length = cart_size * 0.8  # 80% of cart size
            end_x = center_x + cart.xvelo * vector_length
            end_y = center_y + cart.yvelo * vector_length
            self.canvas.create_line(
                center_x, center_y, end_x, end_y, fill="black", width=2, arrow=tk.LAST
            )

    def get_tile_image(self, tile_index, size):
        if (tile_index, size) not in self.tile_images:
            tile = self.tiles[tile_index]
            img = tile.img.copy()
            img = img.resize(size, Image.Resampling.LANCZOS)
            photo_image = ImageTk.PhotoImage(img)
            self.tile_images[(tile_index, size)] = photo_image
        return self.tile_images[(tile_index, size)]

    def toggle_cart_place_mode(self):
        self.cart_place_mode = not self.cart_place_mode
        if self.cart_place_mode:
            self.cart_mode_button.config(text="Exit Cart Place Mode")
        else:
            self.cart_mode_button.config(text="Enter Cart Place Mode")

    def on_canvas_click(self, event):
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()
        cell_width = min(
            canvas_width // self.grid.width, canvas_height // self.grid.height
        )
        cell_height = cell_width

        grid_width = cell_width * self.grid.width
        grid_height = cell_height * self.grid.height
        offset_x = (canvas_width - grid_width) // 2
        offset_y = (canvas_height - grid_height) // 2

        # Adjust for offset
        adjusted_x = event.x - offset_x
        adjusted_y = event.y - offset_y

        # Check if click is within the grid
        if 0 <= adjusted_x < grid_width and 0 <= adjusted_y < grid_height:
            col = adjusted_x // cell_width
            row = adjusted_y // cell_height

            if self.cart_place_mode:
                self.place_or_update_cart(col, row)
            elif hasattr(self, "selected_tile_index"):
                self.grid.set_tile(row, col, self.selected_tile_index)
            else:
                print(
                    "No tile selected. Please select a tile type before clicking on the grid."
                )

            self.draw_grid()
        else:
            print("Click outside the grid area")

    def place_or_update_cart(self, col, row):
        existing_cart = next(
            (cart for cart in self.carts if cart.x == col and cart.y == row), None
        )
        if existing_cart:
            # Update existing cart velocity
            existing_cart.rotate_velocity()
            print(
                f"Updated cart at ({col}, {row}). New velocity: ({existing_cart.xvelo}, {existing_cart.yvelo})"
            )
        else:
            # Place new cart
            new_cart = Cart(col, row, 1, 0)  # Default velocity: moving right
            self.carts.append(new_cart)
            print(f"Placed new cart at ({col}, {row})")

    def save_grid(self):
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json", filetypes=[("JSON files", "*.json")]
        )
        if file_path:
            self.grid.save(file_path)
            cart_data = [cart.to_dict() for cart in self.carts]
            with open(file_path, "r+") as f:
                data = json.load(f)
                data["carts"] = cart_data
                f.seek(0)
                json.dump(data, f, indent=4)
            print(f"Grid and carts saved successfully to {file_path}")

    def load_grid(self, file_path):
        self.grid = Grid.load(file_path)
        with open(file_path, "r") as f:
            data = json.load(f)
        self.carts = [Cart.from_dict(cart_data) for cart_data in data.get("carts", [])]
        self.grid_height.set(self.grid.height)
        self.grid_width.set(self.grid.width)
        self.update_canvas_size()
        self.draw_grid()
        print(f"Grid and carts loaded successfully from {file_path}")

    def update_canvas_size(self):
        max_width = 800
        max_height = 600
        aspect_ratio = self.grid.width / self.grid.height

        if aspect_ratio > max_width / max_height:
            canvas_width = max_width
            canvas_height = int(max_width / aspect_ratio)
        else:
            canvas_height = max_height
            canvas_width = int(max_height * aspect_ratio)

        self.canvas.config(width=canvas_width, height=canvas_height)
        self.master.update_idletasks()

    def initialize_grid(self):
        self.grid.reset(self.grid_width.get(), self.grid_height.get())
        self.update_canvas_size()
        self.draw_grid()
        print("Grid initialized")

    def update_selected_tile(self):
        selected_tile = self.tiles[self.current_tile_index]
        self.tile_combobox.set(f"{selected_tile.name} (Index: {selected_tile.index})")
        self.selected_tile_index = selected_tile.index

    def on_tile_selected(self, event):
        selected_tile = self.tile_combobox.get()
        self.selected_tile_index = int(selected_tile.split("Index: ")[1].rstrip(")"))
        self.current_tile_index = next(
            i
            for i, tile in enumerate(self.tiles)
            if tile.index == self.selected_tile_index
        )
        print(f"Selected tile: {selected_tile}")

    def reset_all(self):
        self.grid_width.set(5)
        self.grid_height.set(5)
        self.initialize_grid()
        self.carts = []
        self.cart_place_mode = False
        self.cart_mode_button.config(text="Enter Cart Place Mode")
        self.current_tile_index = 0
        self.update_selected_tile()
        self.draw_grid()
        print("Grid and carts have been reset to default")

    def load_file_tree(self):
        self.tree.delete(*self.tree.get_children())
        self._build_tree("", self.levels_folder)

    def _build_tree(self, parent, path):
        for item in path.iterdir():
            node = self.tree.insert(parent, "end", text=item.name, open=False)
            if item.is_dir():
                self._build_tree(node, item)

    def on_file_select(self, event):
        selected_item = self.tree.selection()[0]
        file_path = self.tree.item(selected_item, "text")
        full_path = self._get_full_path(selected_item)
        if full_path.is_file() and full_path.suffix == ".json":
            self.load_grid(str(full_path))

    def _get_full_path(self, item):
        path_parts = [self.tree.item(item, "text")]
        parent = self.tree.parent(item)
        while parent:
            path_parts.insert(0, self.tree.item(parent, "text"))
            parent = self.tree.parent(parent)
        return Path(self.levels_folder, *path_parts)

    def change_folder(self):
        new_folder = filedialog.askdirectory(title="Select Folder")
        if new_folder:
            self.levels_folder = Path(new_folder)
            self.load_file_tree()
