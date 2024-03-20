import numpy as np
from timeit import timeit

board5_7A = np.asarray([[ 5,  1,  9,  1,  1,  6,  0],
                        [14,  1,  8,  0,  0,  2,  4],
                        [ 2,  0,  5,  1,  0, 14,  3],
                        [ 2,  0,  7,  1,  6,  2,  4],
                        [ 7,  1,  1,  1, 15,  8,  0]])

# enumerate is faster for flattened (1d) arrays, but np.ndenumerate is faster for 2d+ arrays

# print(timeit(lambda: np.ndenumerate(board5_7A), number=1000000))
# print(timeit(lambda: enumerate(board5_7A.flatten()), number=1000000))

interactionIndices = (
    # 0 = Empty
    # 1 = Switch 1
    # 2 = Switch 2
    # 3 = Switch 3
    # 4 = Switch 4

    # 5 = Tunnel 1
    # 6 = Tunnel 2
    # 7 = Tunnel 3

    # 8 = Closed Gate 1
    # 9 = Open Gate 1
    # 10 = Closed Gate 2
    # 11 = Open Gate 2
    # 12 = Closed Gate 3
    # 13 = Open Gate 3
    # 14 = Closed Gate 4
    # 15 = Open Gate 4

    # 16 = Swapping Track 1
    # 17 = Swapping Track 2
    # 18 = Swapping Track 3
    # 19 = Swapping Track 4

    # 20 = Station 1
    # 21 = Station 2
    # 22 = Station 3
    # 23 = Station 4

    # 24 = Switch-gate
    # 25 = Semaphore
    # 26 = Deactivated Semaphore/Station/Post Office

    # 27 = Starting Car Tile (so semaphores can't place)

    # 28 = Post Office 1
    # 29 = Post Office 2
    # 30 = Post Office 3
    # 31 = Post Office 4
)

directions = np.asarray((
    ((3, 3), (3, 3), (3, 3), (3, 3), (0, 0)),  # 0 Empty
    ((-1, 0), (1, 0), (2, 2), (2, 2), (0, 0)),  # 1 Horizontal Track
    ((2, 2), (2, 2), (0, 1), (0, -1), (0, 0)),  # 2 Vertical Track
    ((2, 2), (3, 3), (2, 2), (2, 2), (0, 0)),  # 3 Ending Track
    ((2, 2), (2, 2), (2, 2), (2, 2), (0, 0)),  # 4 Fence/Rock/Station
    ((0, 1), (2, 2), (2, 2), (1, 0), (0, 0)),  # 5 Bottom-Right Turn
    ((2, 2), (0, 1), (2, 2), (-1, 0), (0, 0)),  # 6 Bottom-Left Turn
    ((0, -1), (2, 2), (1, 0), (2, 2), (0, 0)),  # 7 Top-Right Turn
    ((2, 2), (0, -1), (-1, 0), (2, 2), (0, 0)),  # 8 Top-Left Turn
    ((0, 1), (1, 0), (2, 2), (1, 0), (0, 0)),  # 9 Bottom-Right & Left 3-Way
    ((0, 1), (2, 2), (0, 1), (1, 0), (0, 0)),  # 10 Bottom-Right & Top 3-Way
    ((-1, 0), (0, 1), (2, 2), (-1, 0), (0, 0)),  # 11 Bottom-Left & Right 3-Way
    ((2, 2), (0, 1), (0, 1), (-1, 0), (0, 0)),  # 12 Bottom-Left & Top 3-Way
    ((0, -1), (1, 0), (1, 0), (2, 2), (0, 0)),  # 13 Top-Right & Left 3-Way
    ((0, -1), (2, 2), (1, 0), (0, -1), (0, 0)),  # 14 Top-Right & Bottom 3-Way
    ((-1, 0), (0, -1), (-1, 0), (2, 2), (0, 0)),  # 15 Top-Left & Right 3-Way
    ((2, 2), (0, -1), (-1, 0), (0, -1), (0, 0)),  # 16 Top-Left & Bottom 3-Way

    ((2, 2), (0, 0), (2, 2), (2, 2), (0, 0)),  # 17 Left-Facing Tunnel
    ((2, 2), (2, 2), (0, 0), (2, 2), (0, 0)),  # 18 Up-Facing Tunnel
    ((0, 0), (2, 2), (2, 2), (2, 2), (0, 0)),  # 19 Right-Facing Tunnel
    ((2, 2), (2, 2), (2, 2), (0, 0), (0, 0)),  # 20 Down-Facing Tunnel
))

semaphorePass = np.asarray((
    ((-1, 0), (1, 0)),  # 1 Horizontal Track
    ((0, 1), (0, -1)),  # 2 Vertical Track
    ((0, 0), (0, 0)),
    ((0, 0), (0, 0)),
    ((0, 1), (1, 0)),  # 5 Bottom-Right Turn
    ((0, 1), (-1, 0)),  # 6 Bottom-Left Turn
    ((0, -1), (1, 0)),  # 7 Top-Right Turn
    ((0, -1), (-1, 0)),  # 8 Top-Left Turn
))

