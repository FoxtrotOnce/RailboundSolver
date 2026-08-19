CXX ?= clang++
EMCC ?= emcc

# Native build (for testing/benchmarking)
native:
	mkdir -p build/native
	cmake -S . -B build/native -DNATIVE_TEST=ON -DWASM_BUILD=OFF -DCMAKE_BUILD_TYPE=Release
	cmake --build build/native -j

native-run: native
	./build/native/solver_test

bench: native
	./build/native/bench

# Emscripten build – requires emsdk activated (source emsdk/emsdk_env.sh)
wasm:
	@if ! which $(EMCC) >/dev/null 2>&1; then \
		echo "emcc not found. Run ./build.sh --setup-emsdk first or source emsdk/emsdk_env.sh"; exit 1; \
	fi
	mkdir -p build/wasm
	emcmake cmake -S . -B build/wasm -DWASM_BUILD=ON -DNATIVE_TEST=OFF -DCMAKE_BUILD_TYPE=Release
	cmake --build build/wasm -j
	@echo "WASM built: build/wasm/railbound_wasm.js + build/wasm/railbound_wasm.wasm"
	@mkdir -p ../website/public/wasm ../website/src/wasm
	cp build/wasm/railbound_wasm.js ../website/src/wasm/
	cp build/wasm/railbound_wasm.wasm ../website/public/wasm/
	@echo "Copied to website/"

# Standalone clang wasm (no emscripten) – minimal, no JS glue
wasm-clang:
	mkdir -p build/clang
	cmake -S . -B build/clang -DNATIVE_TEST=OFF -DWASM_BUILD=OFF -DCMAKE_BUILD_TYPE=Release
	cmake --build build/clang --target wasm_clang

clean:
	rm -rf build/

help:
	@echo "Targets:"
	@echo "  native     – build native solver + test binary"
	@echo "  wasm       – build WebAssembly via Emscripten (needs emsdk)"
	@echo "  wasm-clang – build standalone wasm via clang wasm32"
	@echo "  bench      – run benchmark"
	@echo "  clean      – remove build/"
