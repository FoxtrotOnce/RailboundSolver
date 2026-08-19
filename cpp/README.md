# Railbound Solver (C++ Port)

A high-performance C++ port of the Railbound solving algorithm.

## Features

- Complete port of all Railbound game mechanics:
  - Tracks, single turns, 3-way switches, swapped tracks, tunnels, roadblocks
  - Semaphores, placeholder semaphore placement, pass directions, starting tiles
  - Regular gates, queued gates (`switch_queue`), switch rails, stations, post offices
  - Normal cars, decoy cars (crashing, track placement, borders), and numeral cars
  - DFS and BFS generation modes
  - Heatmap tracking and cycle pruning
- Highly optimized: Flat 4D heatmap buffers and lookup tables deliver ~20-30x speedups over JavaScript/TypeScript.
- Supports timeout and max iteration controls to skip or limit long combinatorial levels.
- Full JSON level loading from `levels.json`.

## Directory Structure

```
cpp/
├── CMakeLists.txt
├── include/
│   └── railbound/
│       ├── types.hpp       # Enums, Track/Mod/Car/Direction definitions & lookup tables
│       ├── level.hpp       # Level representation and JSON parser
│       └── solver.hpp      # Solving algorithm header (DFS/BFS, options, callbacks)
├── src/
│   ├── types.cpp           # Lookup table implementations
│   ├── level.cpp           # Level loader and JSON serialization
│   ├── solver.cpp          # Solver engine implementation
│   └── main.cpp            # CLI tool
├── tests/
│   └── test_solver.cpp     # Unit and integration test suite
└── third_party/
    └── nlohmann/
        └── json.hpp        # JSON header library
```

## Building

### Requirements
- C++20 compliant compiler (GCC 11+, Clang 13+, or MSVC 2022)
- CMake 3.20+
- Ninja or Make

### Build Commands

```bash
cd cpp
mkdir build && cd build
cmake -G "Ninja" ..
ninja
```

## Running

### Solve a single level
```bash
./railbound_solver 1-15A
```

### Run on representative test levels
```bash
./railbound_solver --test
```

### Run with custom timeout per level
```bash
./railbound_solver --all --timeout 1.5
```

### Run with BFS mode
```bash
./railbound_solver 1-1 --bfs
```

### Run tests
```bash
./railbound_tests
```
