# KnotAgent

KnotAgent is a desktop canvas for wiring terminal AI agents together.

It is built for workflows where tools like `claude`, `codex`, `agy`, `gh`, Ollama, and cloud LLM APIs need to pass work to each other without turning everything into one vendor-specific platform.

> Korean README: [README.ko.md](./README.ko.md)

## What It Does

KnotAgent lets you place AI tools on a visual canvas and connect them as a pipeline.

Example:

```text
Feature spec
  -> agy -p plans the architecture
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
- role
- role prompt
- working directory
- live output

The workflow has shared context fields for goal and constraints. When a CLI node runs, KnotAgent combines the shared workflow context, the node role prompt, and upstream output into one prompt before replacing `{{input}}`.

Arguments are edited one per line. Each line becomes one CLI argument.

Arguments can use `{{input}}`, which is replaced with upstream node output as a single argument.

Example:

```text
Command: codex
Arguments:
exec
{{input}}
```

Custom CLIs can be tested by editing an existing CLI node's command and arguments in the inspector.

Use **New** to open a blank workflow tab.

Use **Save** to store the current workflow locally. Saved workflows appear in the sidebar and can be loaded or deleted. The example Antigravity -> Codex workflow is seeded into the list once.

Multiple workflows can be open at the same time as tabs. Run and Save operate on the active tab.

The left sidebar is a workflow tree. Open a workflow, choose **Overview** to edit its goal and constraints, or choose **Canvas** to return to the visual workflow.

Use the canvas toolbar **Add Node** button to add CLI agents or an Input node to the active workflow. If a node is selected, the button becomes **Add Next** and the new node is connected after the selected node automatically. New nodes are placed inside the current canvas viewport.

The default Antigravity node uses headless mode:

```text
Command: agy
Arguments:
-p
{{input}}
--print-timeout
90s
```

## Connecting Nodes

Drag from a node's right handle to another node's left handle to connect them.

For the easier path, select a node and use **Add Next**. KnotAgent will place the new node to the right and create the edge for you.

On `Run pipeline`, KnotAgent executes the graph in DAG order and passes each upstream output into the next node. Multiple parent outputs are joined before being passed downstream.

Select a node or edge and press `Delete` or `Backspace` to remove it.

Shortcuts:

- `Ctrl/Cmd + S`: save the active workflow
- `Ctrl/Cmd + N`: open a new blank workflow tab
- `Delete` / `Backspace`: delete selected nodes or edges

Local LLM, Cloud API, and Markdown Output nodes still exist internally for existing workflows and examples, but only Input is exposed in the Core Nodes add menu until those nodes are fully implemented. Ollama will be exposed once the node performs a real local HTTP call instead of a placeholder pass-through.

Markdown Output renders a safe subset of markdown, including headings, lists, inline code, bold text, and fenced code blocks.

Different CLI agents produce different stdout formats. KnotAgent currently preserves raw CLI output, so Antigravity and Codex may look different in the output node. Adapter-based clean output is planned.

## Roadmap

- Better custom CLI node editor
- Agent-specific clean output adapters
- Safer argument handling for quoted strings and JSON
- Real Ollama / LM Studio / vLLM calls
- Cloud API nodes for OpenAI and Anthropic
- Save and load canvas files
- Workflow templates
- Remote desktop host registration
- Mobile and web remote control clients
- Packaged desktop releases

## License

MIT License. See [LICENSE](./LICENSE).
