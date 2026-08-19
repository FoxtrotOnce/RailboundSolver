cmake_minimum_required(VERSION 3.20)
project(RailboundSolver VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimization flags
if(MSVC)
    add_compile_options(/O2 /W4 /permissive-)
else()
    add_compile_options(-O3 -Wall -Wextra -Wpedantic)
endif()

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}
)

# Core library
add_library(railbound_core
    src/types.cpp
    src/level.cpp
    src/solver.cpp
)

target_include_directories(railbound_core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}
)

# CLI executable
add_executable(railbound_solver
    src/main.cpp
)

target_link_libraries(railbound_solver PRIVATE railbound_core)

# Tests executable
add_executable(railbound_tests
    tests/test_solver.cpp
)

target_link_libraries(railbound_tests PRIVATE railbound_core)

enable_testing()
add_test(NAME SolverTest COMMAND railbound_tests)
