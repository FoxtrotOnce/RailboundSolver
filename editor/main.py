import json
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from PIL import Image, ImageTk

from tiles import create_tiles
from utils import DIRECTION

class Cart:
    """
    Represents a cart in a railbound system.
    Attributes:
        x (int): The x-coordinate of the cart's position.
        y (int): The y-coordinate of the cart's position.
        direction (str): The direction the cart is facing.
        order (int): The order in which the cart was created.
    """

    def __init__(self, x, y, direction, order):
        self.x = x
        self.y = y
        self.direction = direction
        self.order = order


class TileGridUI:
    """
    A class representing a graphical user interface for a tile grid.
    Attributes:
        master (Tk): The master window for the UI.
        tiles (List[Tile]): The list of available tile types.
        grid_width (IntVar): The width of the grid.
        grid_height (IntVar): The height of the grid.
        grid (List[List[int]]): The grid representation.
        selected_tile_type (StringVar): The currently selected tile type.
        tile_images (Dict[Tuple[int, Tuple[int, int]], PhotoImage]]: A dictionary to store tile images.
        destination (Optional[Tuple[int, int]]): The destination coordinates.
        carts (List[Cart]): The list of cart objects.
        cart_order (int): The counter for cart order numbers.
        cart_place_mode (bool): A flag indicating whether the cart placement mode is active.
        canvas_frame (Frame): The frame containing the canvas.
        canvas (Canvas): The canvas for drawing the grid.
        set_destination_button (Button): The button for setting the destination.
        setting_destination (bool): A flag indicating whether the destination is being set.
        tile_combobox (Combobox): The combobox for selecting tile types.
        cart_mode_button (Button): The button for toggling cart placement mode.
    Methods:
        __init__(self, master): Initializes the TileGridUI object.
        setup_ui(self): Sets up the user interface elements.
        initialize_grid(self): Initializes the grid.
        update_canvas_size(self): Updates the size of the canvas based on the grid dimensions.
        draw_grid(self): Draws the grid on the canvas.
        get_tile_image(self, tile_index, size): Retrieves the image for a given tile index and size.
        toggle_set_destination(self): Toggles the set destination mode.
        toggle_cart_place_mode(self): Toggles the cart placement mode.
        on_canvas_click(self, event): Handles the click event on the canvas.
        place_or_rotate_cart(self, col, row): Places or rotates a cart on the grid.
        save_grid(self): Saves the grid, destination, and carts to a JSON file.
        load_grid(self): Loads the grid, destination, and carts from a JSON file.
    """

    def __init__(self, master):
        self.master = master
        self.master.title("Tile Grid UI")
        self.tiles = create_tiles()
        self.grid_width = tk.IntVar(value=5)
        self.grid_height = tk.IntVar(value=5)
        self.grid = []
        self.selected_tile_type = tk.StringVar()
        self.tile_images = {}  # Dictionary to store tile images
        self.destination = None
        self.carts = []  # List to store cart objects
        self.cart_order = 1  # Counter for cart order numbers
        self.cart_place_mode = False  # Flag for cart placement mode
        self.setup_ui()
        self.initialize_grid()
        self.current_tile_index = 0
        self.master.bind("<q>", self.cycle_tile_backward)
        self.master.bind("<e>", self.cycle_tile_forward)

    def setup_ui(self):
        """
        Sets up the user interface for the railbound solver editor.
        - Configures the grid size with labels and entry fields.
        - Allows the user to select a tile type from a combobox.
        - Provides buttons for setting the destination, saving and loading the grid.
        - Displays a canvas for drawing the grid.
        - Enables the user to toggle cart place mode.
        Returns:
            None
        """

        # Grid size configuration
        ttk.Label(self.master, text="Grid Width:").grid(row=0, column=0, padx=5, pady=5)
        ttk.Entry(self.master, textvariable=self.grid_width, width=5).grid(
            row=0, column=1, padx=5, pady=5
        )
        ttk.Label(self.master, text="Grid Height:").grid(
            row=0, column=2, padx=5, pady=5
        )
        ttk.Entry(self.master, textvariable=self.grid_height, width=5).grid(
            row=0, column=3, padx=5, pady=5
        )
        ttk.Button(
            self.master, text="Set Grid Size", command=self.initialize_grid
        ).grid(row=0, column=4, padx=5, pady=5)

        # Tile selection
        ttk.Label(self.master, text="Select Tile Type:").grid(
            row=1, column=0, padx=5, pady=5
        )
        tile_options = [f"{tile.name} (Index: {tile.index})" for tile in self.tiles]
        self.tile_combobox = ttk.Combobox(
            self.master,
            textvariable=self.selected_tile_type,
            values=tile_options,
            state="readonly",
        )
        self.tile_combobox.grid(
            row=1, column=1, columnspan=3, padx=5, pady=5, sticky="ew"
        )
        self.tile_combobox.bind("<<ComboboxSelected>>", self.on_tile_selected)

        # Set Destination button
        self.set_destination_button = ttk.Button(
            self.master, text="Set Destination", command=self.toggle_set_destination
        )
        self.set_destination_button.grid(row=1, column=4, padx=5, pady=5)
        self.setting_destination = False

        # Save and Load buttons
        ttk.Button(self.master, text="Save Grid", command=self.save_grid).grid(
            row=2, column=0, padx=5, pady=5
        )
        ttk.Button(self.master, text="Load Grid", command=self.load_grid).grid(
            row=2, column=1, padx=5, pady=5
        )

        # Grid canvas
        self.canvas_frame = ttk.Frame(self.master)
        self.canvas_frame.grid(row=3, column=0, columnspan=5, padx=5, pady=5)
        self.canvas = tk.Canvas(self.canvas_frame, width=400, height=400, bg="white")
        self.canvas.pack(expand=True, fill=tk.BOTH)
        self.canvas.bind("<Button-1>", self.on_canvas_click)
        # Toggle Cart Place Mode
        self.cart_mode_button = ttk.Button(
            self.master,
            text="Enter Cart Place Mode",
            command=self.toggle_cart_place_mode,
        )
        self.cart_mode_button.grid(row=2, column=2, padx=5, pady=5)
        # Add Reset button
        ttk.Button(self.master, text="Reset", command=self.reset_all).grid(
            row=2, column=3, padx=5, pady=5
        )

    def initialize_grid(self):
        """
        Initializes the grid with zeros and sets the destination to None.
        Updates the canvas size and draws the grid.
        """

        self.grid = [
            [0 for _ in range(self.grid_width.get())]
            for _ in range(self.grid_height.get())
        ]
        self.destination = None
        self.update_canvas_size()
        self.draw_grid()

    def update_canvas_size(self):
        """
        Update the size of the canvas based on the grid width and height.
        This method calculates the appropriate width and height for the canvas based on the grid width and height.
        It takes into account the maximum width and height allowed for the canvas.
        The aspect ratio of the grid is also considered to ensure the canvas maintains the correct proportions.
        Parameters:
        - None
        Returns:
        - None
        """
        max_width = 800  # Maximum width of the canvas
        max_height = 600  # Maximum height of the canvas
        aspect_ratio = self.grid_width.get() / self.grid_height.get()

        if aspect_ratio > max_width / max_height:
            canvas_width = max_width
            canvas_height = int(max_width / aspect_ratio)
        else:
            canvas_height = max_height
            canvas_width = int(max_height * aspect_ratio)

        self.canvas.config(width=canvas_width, height=canvas_height)
        self.master.update_idletasks()  # Update the window to reflect size changes

    def draw_grid(self):
        """
        Draws the grid on the canvas.
        This method clears the canvas and then draws the grid based on the current grid size and tile images.
        It also draws the destination marker and carts on the grid.
        Parameters:
        - None
        Returns:
        - None
        """
        self.canvas.delete("all")
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()
        cell_width = canvas_width // self.grid_width.get()
        cell_height = canvas_height // self.grid_height.get()

        for row in range(self.grid_height.get()):
            for col in range(self.grid_width.get()):
                x1, y1 = col * cell_width, row * cell_height
                x2, y2 = x1 + cell_width, y1 + cell_height
                tile_index = self.grid[row][col]
                tile_image = self.get_tile_image(tile_index, (cell_width, cell_height))
                self.canvas.create_image(x1, y1, anchor="nw", image=tile_image)
                self.canvas.create_rectangle(x1, y1, x2, y2, outline="gray")

                # Draw destination marker
                if self.destination and self.destination == (col, row):
                    self.canvas.create_oval(
                        x1 + 40,
                        y1 + 40,
                        x2 - 40,
                        y2 - 40,
                        fill="green",
                        outline="green",
                    )

        # Draw carts
        for cart in self.carts:
            x1, y1 = cart.x * cell_width, cart.y * cell_height
            x2, y2 = x1 + cell_width, y1 + cell_height

            # Draw cart body
            self.canvas.create_oval(
                x1 + 30, y1 + 30, x2 - 30, y2 - 30, fill="red", outline="red"
            )

            # Draw direction line
            center_x, center_y = (x1 + x2) // 2, (y1 + y2) // 2
            if cart.direction == DIRECTION.TOP:
                self.canvas.create_line(
                    center_x, center_y, center_x, y1 + 30, fill="black", width=2
                )
            elif cart.direction == DIRECTION.BOTTOM:
                self.canvas.create_line(
                    center_x, center_y, center_x, y2 - 30, fill="black", width=2
                )
            elif cart.direction == DIRECTION.LEFT:
                self.canvas.create_line(
                    center_x, center_y, x1 + 30, center_y, fill="black", width=2
                )
            elif cart.direction == DIRECTION.RIGHT:
                self.canvas.create_line(
                    center_x, center_y, x2 - 30, center_y, fill="black", width=2
                )

            # Draw order number on cart
            self.canvas.create_text(
                center_x, center_y, text=str(cart.order), fill="white"
            )

    def get_tile_image(self, tile_index, size):
        """
        Retrieves the image of a tile based on the given tile index and size.
        Parameters:
        - tile_index (int): The index of the tile.
        - size (tuple): The desired size of the image.
        Returns:
        - PhotoImage: The image of the tile at the specified index and size.
        """

        if (tile_index, size) not in self.tile_images:
            tile = self.tiles[tile_index]
            img = tile.img.copy()
            img = img.resize(size, Image.Resampling.LANCZOS)
            photo_image = ImageTk.PhotoImage(img)
            self.tile_images[(tile_index, size)] = photo_image
        return self.tile_images[(tile_index, size)]

    def toggle_set_destination(self):
        """
        Toggles the setting of the destination.
        If the setting_destination flag is False, it sets it to True and updates the text of the set_destination_button to "Cancel Set Destination".
        If the setting_destination flag is True, it sets it to False and updates the text of the set_destination_button to "Set Destination".
        """
        self.setting_destination = not self.setting_destination
        if self.setting_destination:
            self.set_destination_button.config(text="Cancel Set Destination")
        else:
            self.set_destination_button.config(text="Set Destination")

    def toggle_cart_place_mode(self):
        """
        Toggles the cart place mode.
        This method changes the state of the `cart_place_mode` attribute, which determines whether the program is in cart place mode or not. If the `cart_place_mode` is `True`, the text of the `cart_mode_button` is set to "Exit Cart Place Mode". If the `cart_place_mode` is `False`, the text of the `cart_mode_button` is set to "Enter Cart Place Mode".
        """

        self.cart_place_mode = not self.cart_place_mode
        if self.cart_place_mode:
            self.cart_mode_button.config(text="Exit Cart Place Mode")
        else:
            self.cart_mode_button.config(text="Enter Cart Place Mode")

    def on_canvas_click(self, event):
        """
        Handle the event when the canvas is clicked.
        Parameters:
        - event: The event object containing information about the click event.
        Returns:
        None
        """

        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()
        cell_width = canvas_width // self.grid_width.get()
        cell_height = canvas_height // self.grid_height.get()
        col = event.x // cell_width
        row = event.y // cell_height

        if self.setting_destination:
            self.destination = (col, row)
            self.toggle_set_destination()
        elif self.cart_place_mode:
            self.place_or_rotate_cart(col, row)
        elif hasattr(self, "selected_tile_index"):
            self.grid[row][col] = self.selected_tile_index
        else:
            messagebox.showwarning(
                "No Tile Selected",
                "Please select a tile type before clicking on the grid.",
            )

        self.draw_grid()

    def place_or_rotate_cart(self, col, row):
        """
        Places a new cart at the specified column and row if no cart exists at that location,
        otherwise rotates the existing cart.
        Parameters:
        - col (int): The column where the cart should be placed or rotated.
        - row (int): The row where the cart should be placed or rotated.
        """
        existing_cart = next(
            (cart for cart in self.carts if cart.x == col and cart.y == row), None
        )
        if existing_cart:
            # Rotate existing cart
            existing_cart.direction = (existing_cart.direction + 1) % 4
        else:
            # Place new cart
            new_cart = Cart(col, row, DIRECTION.RIGHT, self.cart_order)
            self.carts.append(new_cart)
            self.cart_order += 1

    def save_grid(self):
        """
        Saves the grid, destination, and carts to a JSON file.
        Returns:
            None
        Raises:
            None
        """

        file_path = filedialog.asksaveasfilename(
            defaultextension=".json", filetypes=[("JSON files", "*.json")]
        )
        if file_path:
            data = {
                "grid": self.grid,
                "destination": self.destination,
                "carts": [
                    {
                        "x": cart.x,
                        "y": cart.y,
                        "direction": cart.direction,
                        "order": cart.order,
                    }
                    for cart in self.carts
                ],
            }
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
            messagebox.showinfo(
                "Save Successful", "Grid, destination, and carts saved successfully!"
            )

    def load_grid(self):
        """
        Loads a grid, destination, and carts from a JSON file selected by the user.
        Returns:
            None
        Raises:
            FileNotFoundError: If the selected file does not exist.
            JSONDecodeError: If the selected file is not a valid JSON file.
        Side Effects:
            - Updates the 'grid' attribute of the object with the loaded grid.
            - Updates the 'destination' attribute of the object with the loaded destination.
            - Updates the 'carts' attribute of the object with the loaded carts.
            - Updates the 'cart_order' attribute of the object with the maximum cart order plus one.
            - Updates the 'grid_height' attribute of the object with the height of the loaded grid.
            - Updates the 'grid_width' attribute of the object with the width of the loaded grid.
            - Updates the canvas size.
            - Draws the grid on the canvas.
            - Shows a message box with a success message.
        """

        file_path = filedialog.askopenfilename(filetypes=[("JSON files", "*.json")])
        if file_path:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.grid = data["grid"]
            self.destination = (
                tuple(data["destination"]) if data["destination"] else None
            )
            self.carts = [
                Cart(cart["x"], cart["y"], cart["direction"], cart["order"])
                for cart in data["carts"]
            ]
            self.cart_order = max([cart.order for cart in self.carts], default=0) + 1
            self.grid_height.set(len(self.grid))
            self.grid_width.set(len(self.grid[0]))
            self.update_canvas_size()
            self.draw_grid()
            messagebox.showinfo(
                "Load Successful", "Grid, destination, and carts loaded successfully!"
            )

    def cycle_tile_forward(self, event):
        """
        Cycle to the next tile in the list and update the selected tile.
        Parameters:
        - event: The event that triggers the function.
        Returns:
        None
        """
        self.current_tile_index = (self.current_tile_index + 1) % len(self.tiles)
        self.update_selected_tile()

    def cycle_tile_backward(self, event):
        """
        Cycle the current tile index backward.
        Parameters:
        - event: The event object representing the trigger for the method.
        Returns:
        None
        """
        self.current_tile_index = (self.current_tile_index - 1) % len(self.tiles)
        self.update_selected_tile()

    def update_selected_tile(self):
        """
        Updates the selected tile in the editor.
        This method updates the selected tile in the editor by setting the tile combobox
        with the name and index of the selected tile. It also updates the selected_tile_index
        attribute with the index of the selected tile.
        Parameters:
        - self: The Editor object.
        Returns:
        - None
        """

        selected_tile = self.tiles[self.current_tile_index]
        self.tile_combobox.set(f"{selected_tile.name} (Index: {selected_tile.index})")
        self.selected_tile_index = selected_tile.index

    def on_tile_selected(self, event):
        """
        Event handler for when a tile is selected.
        Parameters:
        - event: The event object representing the tile selection event.
        Returns:
        None
        """

        selected_tile = self.tile_combobox.get()
        self.selected_tile_index = int(selected_tile.split("Index: ")[1].rstrip(")"))
        self.current_tile_index = next(
            i
            for i, tile in enumerate(self.tiles)
            if tile.index == self.selected_tile_index
        )

    def add_cart(self):
        """
        Adds a cart to the editor.
        If a destination is set, a new cart is created with the given destination coordinates and added to the list of carts.
        The direction of the cart is set to 'right' by default.
        The cart is then drawn on the grid.
        If no destination is set, a warning message is displayed.
        Parameters:
        - None
        Returns:
        - None
        """

        x, y = self.destination
        direction = DIRECTION.RIGHT  # Default direction
        new_cart = Cart(x, y, direction, self.cart_order)
        self.carts.append(new_cart)
        self.cart_order += 1
        self.draw_grid()

    def reset_all(self):
        """
        Resets the grid, destination, and carts to their default state.
        """
        self.grid_width.set(5)
        self.grid_height.set(5)
        self.initialize_grid()
        self.destination = None
        self.carts = []
        self.cart_order = 1
        self.cart_place_mode = False
        self.cart_mode_button.config(text="Enter Cart Place Mode")
        self.current_tile_index = 0
        self.update_selected_tile()
        self.draw_grid()
        messagebox.showinfo(
            "Reset Successful",
            "Grid, destination, and carts have been reset to default.",
        )


if __name__ == "__main__":
    root = tk.Tk()
    app = TileGridUI(root)
    root.mainloop()
