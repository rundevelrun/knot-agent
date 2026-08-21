# KnotAgent

KnotAgent is a desktop canvas for wiring terminal AI agents together.

It is built for workflows where tools like `claude`, `codex`, `agy`, `gh`, Ollama, and cloud LLM APIs need to pass work to each other without turning everything into one vendor-specific platform.

> Korean README: [README.ko.md](./README.ko.md)

## What It Does

KnotAgent lets you place AI tools on a visual canvas and connect them as a pipeline.

Example:

```text
Feature spec
  -> agy plans the architecture
  -> claude writes an initial implementation
  -> codex reviews or refactors it
  -> ollama summarizes the result locally
```

The main difference from a normal API workflow builder is that CLI agents are treated as first-class nodes. If a tool already works in your terminal, KnotAgent should be able to run it from the canvas and stream its output back into the node.

## Current Status

This repo currently has the first working app scaffold:

- React + TypeScript + Vite frontend
- React Flow canvas
- CLI agent, local LLM, cloud API, input, and markdown output nodes
- CLI presets for `claude`, `codex`, `agy`, and `gh`
- Zustand canvas store
- DAG pipeline execution
- Tauri v2 Rust command for spawning CLI agents
- Realtime `stdout` / `stderr` streaming from Rust to the canvas

The UI can run in a browser with Vite. CLI execution requires the Tauri desktop runtime.

## Stack

- Tauri v2
- React
- TypeScript
- Vite
- React Flow (`@xyflow/react`)
- Zustand
- Rust subprocess execution

## Platform Support

KnotAgent is developed primarily for Windows and macOS.

Linux support is planned as best-effort because Tauri works on Linux, but native WebView and system package requirements vary by distribution.

Mobile is not a local execution target. KnotAgent is designed around desktop CLI tools, local repositories, and terminal sessions.

## Remote Direction

A future mobile or web client may act as a remote control surface for an online Windows or macOS KnotAgent desktop host.

In that model, the desktop app runs the actual CLI agents and local tools. The mobile or web client would sign in with the same account, show available desktop hosts, edit canvases, start runs, approve actions, and stream logs remotely.

Remote access will require explicit host pairing, authentication, action approval, and audit logs before it is treated as a supported feature.

## Run Locally

Install dependencies:

```bash
npm install
```

Run the frontend only:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:1420/
```

Run the desktop app:

```bash
npm run tauri dev
```

Use the desktop app when testing CLI nodes.

## Windows Setup

For frontend-only development, Node.js and npm are enough.

For Tauri desktop development, install Rust and Microsoft C++ build tools.

```powershell
winget install Rustlang.Rustup
winget install Microsoft.VisualStudio.2022.BuildTools
```

If Build Tools is already installed, `winget` may say there is no upgrade available. That does not mean the C++ workload is installed.

Open Visual Studio Installer:

```powershell
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe"
```

Choose **Modify** for Build Tools 2022 and install:

```text
Desktop development with C++
```

Make sure these are included:

```text
MSVC v143 - VS 2022 C++ x64/x86 build tools
Windows 10 SDK or Windows 11 SDK
C++ CMake tools for Windows
```

Then open a new terminal and check:

```powershell
cargo --version
rustc --version
where link
```

If `where link` prints nothing, run the project from:

```text
x64 Native Tools Command Prompt for VS 2022
```

## CLI Nodes

CLI nodes currently expose:

- command
- arguments
- working directory
- live output

Arguments can use `{{input}}`, which is replaced with upstream node output.

Example:

```text
Command: codex
Arguments: exec {{input}}
```

Custom CLIs can be tested by editing an existing CLI node's command and arguments in the inspector.

## Roadmap

- Better custom CLI node editor
- Safer argument handling for quoted strings and JSON
- Real Ollama / LM Studio / vLLM calls
- Cloud API nodes for OpenAI, Anthropic, and Gemini
- Save and load canvas files
- Workflow templates
- Remote desktop host registration
- Mobile and web remote control clients
- Packaged desktop releases

## License

MIT License. See [LICENSE](./LICENSE).
