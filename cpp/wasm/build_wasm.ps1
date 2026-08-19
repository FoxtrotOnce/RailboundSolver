param(
    [switch]$Debug,
    [switch]$WithEmbind
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$CppDir = Join-Path $RepoRoot "cpp"
$OutDir = Join-Path $RepoRoot "website\public\wasm"

$emxx = "em++"
if (-not (Get-Command em++ -ErrorAction SilentlyContinue)) {
    if (Get-Command emcc -ErrorAction SilentlyContinue) { $emxx = "emcc" }
    else {
        Write-Error "emcc/em++ not found. Install Emscripten SDK: https://emscripten.org/docs/getting_started/downloads.html"
        exit 1
    }
}
if (-not (Get-Command emcc -ErrorAction SilentlyContinue) -and -not (Get-Command em++ -ErrorAction SilentlyContinue)) {
    Write-Error "emcc not found. Install Emscripten SDK: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Opt = if ($Debug) { "-O0 -g" } else { "-O3" }
$Mode = if ($Debug) { "Debug" } else { "Release" }

Write-Host "Building Railbound WASM ($Mode) -> $OutDir\railbound.{js,wasm} (via $emxx)"
Write-Host "  Emscripten: $((& $emxx --version | Select-Object -First 1))"

$sources = @(
    "$CppDir\src\types.cpp",
    "$CppDir\src\level.cpp",
    "$CppDir\src\solver.cpp",
    "$CppDir\wasm\wasm_bindings.cpp"
)

$includes = @(
    "-I$CppDir\include",
    "-I$CppDir",
    "-I$CppDir\third_party"
)

$args = @()
$args += $sources
$args += $includes
$args += $Opt.Split(" ")
$args += "-std=c++20"
$args += "--bind"
$args += "-s"
$args += "WASM=1"
$args += "-s"
$args += "MODULARIZE=1"
$args += "-s"
$args += "EXPORT_NAME=createRailboundModule"
$args += "-s"
$args += "ALLOW_MEMORY_GROWTH=1"
$args += "-s"
$args += "INITIAL_MEMORY=16777216"
$args += "-s"
$args += "STACK_SIZE=1048576"
$args += "-s"
$args += "EXPORTED_FUNCTIONS=['_solve_level_json','_free_string','_wasm_is_ready','_get_solver_version','_malloc','_free']"
$args += "-s"
$args += "EXPORTED_RUNTIME_METHODS=['cwrap','ccall','UTF8ToString','stringToUTF8','lengthBytesUTF8','getValue','setValue','UTF8ArrayToString']"
$args += "-s"
$args += "ENVIRONMENT=web,worker"
$args += "-s"
$args += "WASM_ASYNC_COMPILATION=1"
$args += "-o"
$args += "$OutDir\railbound.js"

& $emxx @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Get-ChildItem "$OutDir\railbound.js", "$OutDir\railbound.wasm" | Format-Table Name, Length

if ($WithEmbind) {
    Write-Host "Building embind variant..."
    $args2 = @()
    $args2 += $sources
    $args2 += $includes
    $args2 += $Opt.Split(" ")
    $args2 += "-std=c++20"
    $args2 += "--bind"
    $args2 += "-s"
    $args2 += "WASM=1"
    $args2 += "-s"
    $args2 += "MODULARIZE=1"
    $args2 += "-s"
    $args2 += "EXPORT_NAME=createRailboundModuleEmbind"
    $args2 += "-s"
    $args2 += "ALLOW_MEMORY_GROWTH=1"
    $args2 += "-s"
    $args2 += "ENVIRONMENT=web,worker"
    $args2 += "-o"
    $args2 += "$OutDir\railbound_embind.js"
    & $emxx @args2
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Get-ChildItem "$OutDir\railbound_embind.js", "$OutDir\railbound_embind.wasm" | Format-Table Name, Length
}

Write-Host ""
Write-Host "Done. Run: npm run dev --prefix website"
