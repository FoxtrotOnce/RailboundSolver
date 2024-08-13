class Cart:
    def __init__(self, x, y, xvelo, yvelo):
        self.x = x
        self.y = y
        self.xvelo = xvelo
        self.yvelo = yvelo

    def rotate_velocity(self):
        self.xvelo, self.yvelo = self.yvelo, -self.xvelo

    def to_dict(self):
        return {"x": self.x, "y": self.y, "xvelo": self.xvelo, "yvelo": self.yvelo}

    @classmethod
    def from_dict(cls, data):
        return cls(data["x"], data["y"], data["xvelo"], data["yvelo"])

    def render(self, canvas, x1, y1, cell_width, cell_height):
        # Calculate cart size (25% of cell size)
        cart_size = min(cell_width, cell_height) * 0.25
        cart_x1 = x1 + (cell_width - cart_size) / 2
        cart_y1 = y1 + (cell_height - cart_size) / 2
        cart_x2 = cart_x1 + cart_size
        cart_y2 = cart_y1 + cart_size

        # Draw cart body
        canvas.create_oval(
            cart_x1, cart_y1, cart_x2, cart_y2, fill="red", outline="black", width=2
        )

        # Draw velocity vector
        center_x, center_y = (cart_x1 + cart_x2) / 2, (cart_y1 + cart_y2) / 2
        vector_length = cart_size * 0.8  # 80% of cart size
        end_x = center_x + self.xvelo * vector_length
        end_y = center_y + self.yvelo * vector_length
        canvas.create_line(
            center_x, center_y, end_x, end_y, fill="black", width=2, arrow="last"
        )
