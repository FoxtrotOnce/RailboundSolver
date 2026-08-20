# RailboundSolver

RailboundSolver is a logic-based solving algorithm designed to find the "best" solution for any level configuration from the game _Railbound_.

This project was made primarily by [myself](https://github.com/FoxtrotOnce), with contributions from [Thinh](https://github.com/Th1nhNg0) on the website front-end, [Al](https://github.com/alistair-broomhead) on coding advice, and [Nakuya](https://github.com/nack098) on website design advice. Their input has greatly improved RailboundSolver.

# Installation

Run the following in a terminal or command prompt to copy the repository. It will install to the directory specified in the terminal/command prompt.
```
git clone https://github.com/FoxtrotOnce/RailboundSolver.git
```

# Usage

### Website (dual solver)

```bash
npm install --prefix website
npm run dev --prefix website   # choose TypeScript or C++ WASM in the Solver Engine sidebar
```

To use the C++ solver, which is 20–30× faster through WebAssembly:

```bash
./cpp/wasm/build_wasm.sh        # Linux/macOS/Git Bash (requires emcc)
# or
.\cpp\wasm\build_wasm.ps1      # Windows PowerShell
npm run build:wasm --prefix website
```

See `website/WASM_GUIDE.md` and `cpp/wasm/README.md` for details.

### CLI C++

```bash
cmake -B cpp/build -S cpp && cmake --build cpp/build
./cpp/build/railbound_solver 1-15A
```

# To-do

- [x] Integrate RailboundSolver into a website for easier use
- [x] Dual solver selection (TypeScript vs C++ WASM)
  - [x] WebAssembly build pipeline (Emscripten) + JS/WASM loader + Worker

# Documentation

### [Afterburn Discord Thread](https://discord.com/channels/441217491612598272/1142318326136180796)

### Program Flowchart
<img width="2181" height="6532" alt="RailboundSolver drawio" src="https://github.com/user-attachments/assets/8a47abf5-ab86-4e5c-b3a2-595699ad8862" />

# License

RailboundSolver is an open-sourced software licensed under the [MIT license](https://opensource.org/license/MIT "MIT license").
