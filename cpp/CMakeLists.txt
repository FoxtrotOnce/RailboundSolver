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

# WASM target (Emscripten)
option(RAILBOUND_WASM "Build WASM module" OFF)
if(RAILBOUND_WASM)
    if(NOT EMSCRIPTEN)
        message(WARNING "RAILBOUND_WASM is ON but not using emcc. Use: emcmake cmake -B build-wasm -DRAILBOUND_WASM=ON")
    endif()
    add_executable(railbound_wasm
        wasm/wasm_bindings.cpp
    )
    target_link_libraries(railbound_wasm PRIVATE railbound_core)
    set_target_properties(railbound_wasm PROPERTIES
        OUTPUT_NAME "railbound"
        SUFFIX ".js"
    )
    target_link_options(railbound_wasm PRIVATE
        "-sWASM=1"
        "-sMODULARIZE=1"
        "-sEXPORT_NAME=createRailboundModule"
        "-sALLOW_MEMORY_GROWTH=1"
        "-sINITIAL_MEMORY=16777216"
        "-sEXPORTED_FUNCTIONS=['_solve_level_json','_free_string','_wasm_is_ready','_get_solver_version','_malloc','_free']"
        "-sEXPORTED_RUNTIME_METHODS=['cwrap','ccall','UTF8ToString','stringToUTF8','lengthBytesUTF8']"
        "-sENVIRONMENT=web,worker"
        "-sWASM_ASYNC_COMPILATION=1"
    )
    # Copy output to website/public/wasm on build
    add_custom_command(TARGET railbound_wasm POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_SOURCE_DIR}/../website/public/wasm
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
            "$<TARGET_FILE_DIR:railbound_wasm>/railbound.js"
            "${CMAKE_SOURCE_DIR}/../website/public/wasm/railbound.js"
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
            "$<TARGET_FILE_DIR:railbound_wasm>/railbound.wasm"
            "${CMAKE_SOURCE_DIR}/../website/public/wasm/railbound.wasm"
        COMMENT "Copying WASM artifacts to website/public/wasm"
    )
endif()
