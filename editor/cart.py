class Cart:
    def __init__(self, x, y, xvelo, yvelo):
        self.x = x
        self.y = y
        self.xvelo = xvelo
        self.yvelo = yvelo

    def rotate_velocity(self):
        self.xvelo, self.yvelo = self.yvelo, -self.xvelo

    def to_dict(self):
        return {
            "x": self.x,
            "y": self.y,
            "xvelo": self.xvelo,
            "yvelo": self.yvelo
        }

    @classmethod
    def from_dict(cls, data):
        return cls(data["x"], data["y"], data["xvelo"], data["yvelo"])