cmake_minimum_required(VERSION 3.15)
project(railbound_solver LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Options
option(WASM_BUILD "Build WebAssembly via Emscripten" OFF)
option(NATIVE_TEST "Build native test executable" ON)

# Source files
set(SOLVER_SOURCES
    src/types.cpp
    src/solver.cpp
)

set(BINDINGS_SOURCES
    src/bindings.cpp
)

# Common include
include_directories(${CMAKE_SOURCE_DIR}/include)

# ---------------------------------------------------------------------------
# Native library + test executable
# ---------------------------------------------------------------------------
if(NATIVE_TEST)
    add_library(railbound_native STATIC ${SOLVER_SOURCES})
    target_include_directories(railbound_native PUBLIC include)
    if(MSVC)
        target_compile_options(railbound_native PRIVATE /W4)
        target_compile_options(railbound_native PRIVATE $<$<CONFIG:Release>:/O2>)
    else()
        target_compile_options(railbound_native PRIVATE -O3 -march=native -Wall -Wextra)
    endif()

    add_executable(solver_test src/main_native.cpp)
    target_link_libraries(solver_test PRIVATE railbound_native)
    target_include_directories(solver_test PRIVATE include)
    if(MSVC)
        target_compile_options(solver_test PRIVATE /W4)
        target_compile_options(solver_test PRIVATE $<$<CONFIG:Release>:/O2>)
    else()
        target_compile_options(solver_test PRIVATE -O3 -Wall -Wextra)
    endif()

    # Benchmark binary
    add_executable(bench src/bench.cpp)
    target_link_libraries(bench PRIVATE railbound_native)
    if(MSVC)
        target_compile_options(bench PRIVATE /W4)
        target_compile_options(bench PRIVATE $<$<CONFIG:Release>:/O2>)
    else()
        target_compile_options(bench PRIVATE -O3 -Wall -Wextra)
    endif()
endif()

# ---------------------------------------------------------------------------
# Emscripten / WASM
# ---------------------------------------------------------------------------
if(WASM_BUILD)
    if(NOT DEFINED EMSCRIPTEN)
        # Try to detect via emcc
        find_program(EMCC emcc)
        if(EMCC)
            message(STATUS "Found emcc: ${EMCC}")
        else()
            message(FATAL_ERROR "Emscripten not found. Install emsdk or set -DWASM_BUILD=OFF. See wasm/README.md")
        endif()
    endif()

    add_executable(railbound_wasm ${SOLVER_SOURCES} ${BINDINGS_SOURCES})
    target_include_directories(railbound_wasm PRIVATE include)
    # Emscripten flags
    set_target_properties(railbound_wasm PROPERTIES
        SUFFIX ".js"
    )
    target_compile_options(railbound_wasm PRIVATE -O3 -flto)
    target_link_options(railbound_wasm PRIVATE
        -O3
        -flto
        -sWASM=1
        -sALLOW_MEMORY_GROWTH=1
        -sEXPORTED_FUNCTIONS=['_wasm_set_params','_wasm_solve_flat','_wasm_get_H','_wasm_get_W','_wasm_get_tracks_left','_wasm_get_semaphores_left','_wasm_get_iterations_low','_wasm_get_iterations_high','_wasm_get_time','_wasm_is_solved','_wasm_get_board_at','_wasm_get_mods_at','_wasm_solve_with_callback','_malloc','_free']
        -sEXPORTED_RUNTIME_METHODS=['ccall','cwrap','getValue','setValue','UTF8ToString']
        -sMODULARIZE=1
        -sEXPORT_NAME=createRailboundModule
        -sEXPORT_ES6=1
        -sENVIRONMENT=web,worker
        --bind
    )
    # Worker-compatible wasm
    # For plain wasm without embind, remove --bind and use SIDE_MODULE etc.
endif()

# ---------------------------------------------------------------------------
# Clang wasm32 (no emscripten) – standalone wasm
# Requires: clang --target=wasm32 -nostdlib etc., plus wasm-ld
# This target is for users without emsdk who still want a .wasm via LLVM
# ---------------------------------------------------------------------------
add_custom_target(wasm_clang
    COMMAND ${CMAKE_CXX_COMPILER} --target=wasm32
        -O3 -flto -nostdlib -Wl,--no-entry -Wl,--export-all -Wl,--allow-undefined
        -I${CMAKE_SOURCE_DIR}/include
        ${CMAKE_SOURCE_DIR}/src/types.cpp
        ${CMAKE_SOURCE_DIR}/src/solver.cpp
        ${CMAKE_SOURCE_DIR}/src/bindings.cpp
        -o ${CMAKE_BINARY_DIR}/railbound_clang.wasm
    COMMENT "Building standalone wasm via clang wasm32 (requires wasm target)"
    VERBATIM
)
