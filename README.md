# KnotAgent

**KnotAgent** is a lightweight universal visual desktop canvas for orchestrating terminal-based AI CLI agents, local LLM engines, and cloud AI APIs in one extensible node workflow.

> Korean documentation: [README.ko.md](./README.ko.md)

## Vision

KnotAgent treats AI tools as composable execution nodes. Instead of locking workflows into one vendor or one API style, it lets developers chain terminal AI agents such as `claude`, `codex`, `agy` / Gemini CLI, and `gh` together with local inference servers like Ollama, LM Studio, vLLM, and cloud providers such as Anthropic, OpenAI, and Google Gemini.

The core idea is simple: if an AI tool can run from the terminal, it should be a first-class node on a visual canvas.

## Core Goals

- Build a universal visual node canvas for multi-agent AI workflows.
- Treat terminal AI agents as first-class execution nodes.
- Support local OAuth-backed CLI sessions without forcing manual API key setup for every workflow.
- Stream `stdout` and `stderr` from long-running CLI agents in real time.
- Chain CLI agents, local LLMs, cloud APIs, and I/O utilities through a common pipeline schema.
- Avoid vendor lock-in by keeping node execution extensible and provider-neutral.

## Target Users

- Power developers
- AI agent engineers
- Multi-agent workflow builders
- Developers experimenting with local and cloud LLM orchestration
- Teams that want visual automation without giving up terminal-native tools

## Node Taxonomy

KnotAgent standardizes execution units into five major node families:

| Node Type | Examples | Purpose |
| --- | --- | --- |
| CLI Agent Node | `claude`, `codex`, `agy`, `gh`, custom binaries | Run terminal AI agents and developer CLIs through local subprocesses. |
| Local LLM Node | Ollama, LM Studio, vLLM, LocalAI | Call local inference servers through HTTP-compatible APIs. |
| Cloud API Node | Anthropic, OpenAI, Google Gemini | Use hosted AI APIs where cloud execution is preferred. |
| Input Node | Text input, file input | Provide prompts, specs, files, and raw data to workflows. |
| Output Node | Markdown preview, terminal viewer | Render final output, logs, and generated documentation. |

## Example Workflow

```text
[Input: Feature Spec]
       |
       +------------------------------+
       |                              |
       v                              v
[agy: Architecture Plan]      [claude: Initial Code]
       |                              |
       +--------------+---------------+
                      v
            [codex: Refactor & Review]
                      |
                      v
            [ollama: Local Docs Summary]
```

## Planned Technology Stack

| Layer | Technology | Reason |
| --- | --- | --- |
| Desktop Wrapper | Tauri v2 | Native subprocess execution with a small desktop footprint. |
| Frontend | React, TypeScript, Vite | Fast development and a strong UI ecosystem. |
| Canvas Engine | `@xyflow/react` | Infinite visual canvas and custom node rendering. |
| State Management | Zustand | Lightweight global state for nodes, edges, and execution state. |
| Styling | Tailwind CSS, Lucide Icons | Developer-focused dark UI with clear controls. |
| IPC Bus | Tauri IPC, Rust child processes | Non-blocking real-time streaming from terminal agents. |

## Initial Data Model

KnotAgent workflows are represented as a versioned canvas schema:

```ts
export type NodeType =
  | 'cli_agent'
  | 'local_llm'
  | 'cloud_api'
  | 'input'
  | 'markdown_output';

export type CLIAgentType = 'claude' | 'codex' | 'agy' | 'gh' | 'custom';

export interface CanvasSchema {
  version: string;
  nodes: Array<{
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}
```

## Subprocess Bus

The Rust backend will provide a universal command runner for CLI agent nodes:

- Spawn arbitrary binaries such as `claude`, `codex`, `agy`, and `gh`.
- Pass node-defined arguments and working directories.
- Substitute upstream node output into arguments using `{{input}}`.
- Stream output back to the canvas through Tauri events.
- Preserve local terminal sessions and existing CLI authentication flows.

## Roadmap

### Phase 1: Project Foundation

- Set up Tauri v2, React, TypeScript, and Vite.
- Add React Flow canvas with basic node and edge editing.
- Define shared TypeScript canvas and node schemas.
- Create initial dark developer UI shell.

### Phase 2: CLI Agent Nodes

- Add CLI presets for `claude`, `codex`, `agy`, and `gh`.
- Implement the Rust subprocess runner.
- Stream CLI output into each node in real time.
- Support working directory selection and argument templates.

### Phase 3: Multi-Agent Pipeline Engine

- Add topological execution for DAG workflows.
- Pass upstream outputs into downstream nodes.
- Support `{{input}}` substitution in CLI arguments and prompts.
- Add execution state, error state, and retry handling.

### Phase 4: Local and Cloud LLM Nodes

- Add Ollama, LM Studio, and vLLM-compatible local HTTP nodes.
- Add Anthropic, OpenAI, and Gemini API nodes.
- Provide model, temperature, system prompt, and API key configuration.

### Phase 5: Workflow Persistence

- Save and load canvas files.
- Export workflow schemas.
- Add reusable node presets and templates.

## Project Status

KnotAgent is currently in the foundation stage. The repository includes the first working desktop-app scaffold:

- React + TypeScript + Vite app shell
- React Flow visual canvas
- CLI agent, local LLM, cloud API, input, and markdown output nodes
- Zustand canvas store
- DAG pipeline execution engine
- Tauri v2 Rust command for spawning CLI agents and streaming `stdout` / `stderr`

Rust is required to build or run the Tauri desktop wrapper locally.

## Development Prerequisites

Required for all platforms:

- Node.js 22 or later
- npm 10 or later
- Git

Required for Tauri desktop development:

- Rust and Cargo through `rustup`
- Platform-specific native build dependencies

### Windows

Install Rust:

```powershell
winget install Rustlang.Rustup
```

Install Microsoft Visual Studio Build Tools:

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

When the Build Tools installer opens, select:

```text
Desktop development with C++
```

Close and reopen PowerShell, then verify:

```powershell
cargo --version
rustc --version
```

`npm install` does not install Visual C++ Build Tools. The tools are only needed for local Tauri development and builds, not for end users installing a prebuilt KnotAgent release.

## Development

Install dependencies:

```bash
npm install
```

Run the web frontend:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Run the Tauri desktop app after installing Rust and native build prerequisites:

```bash
npm run tauri dev
```

## License

MIT License. See [LICENSE](./LICENSE).
