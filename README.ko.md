# KnotAgent

**KnotAgent**는 터미널 기반 AI CLI 에이전트, 로컬 LLM 엔진, 클라우드 AI API를 하나의 확장 가능한 노드 워크플로로 연결하는 가벼운 범용 비주얼 데스크톱 캔버스입니다.

> English documentation: [README.md](./README.md)

## 비전

KnotAgent는 AI 도구를 조합 가능한 실행 노드로 다룹니다. 특정 벤더나 특정 API 방식에 묶이지 않고, `claude`, `codex`, `agy` / Gemini CLI, `gh` 같은 터미널 AI 에이전트를 Ollama, LM Studio, vLLM 같은 로컬 추론 서버와 Anthropic, OpenAI, Google Gemini 같은 클라우드 API와 함께 체인으로 연결할 수 있게 하는 것이 목표입니다.

핵심 아이디어는 단순합니다. 터미널에서 실행할 수 있는 AI 도구라면 비주얼 캔버스의 1급 노드가 될 수 있어야 합니다.

## 핵심 목표

- 멀티 에이전트 AI 워크플로를 위한 범용 비주얼 노드 캔버스 구축
- 터미널 AI 에이전트를 1급 실행 노드로 지원
- 각 워크플로마다 수동 API 키 설정을 강제하지 않고 로컬 OAuth 기반 CLI 세션 활용
- 장시간 실행되는 CLI 에이전트의 `stdout`, `stderr` 실시간 스트리밍
- CLI 에이전트, 로컬 LLM, 클라우드 API, 입출력 유틸리티를 공통 파이프라인 스키마로 연결
- 공급자 중립적인 확장 구조로 벤더 락인 최소화

## 대상 사용자

- 파워 개발자
- AI 에이전트 엔지니어
- 멀티 에이전트 워크플로 빌더
- 로컬 및 클라우드 LLM 오케스트레이션을 실험하는 개발자
- 터미널 네이티브 도구를 유지하면서 비주얼 자동화를 원하는 팀

## 노드 분류

KnotAgent는 실행 단위를 다섯 가지 주요 노드 계열로 표준화합니다.

| 노드 타입 | 예시 | 목적 |
| --- | --- | --- |
| CLI Agent Node | `claude`, `codex`, `agy`, `gh`, custom binaries | 로컬 서브프로세스를 통해 터미널 AI 에이전트와 개발자 CLI 실행 |
| Local LLM Node | Ollama, LM Studio, vLLM, LocalAI | HTTP 호환 API로 로컬 추론 서버 호출 |
| Cloud API Node | Anthropic, OpenAI, Google Gemini | 클라우드 실행이 필요한 AI API 사용 |
| Input Node | 텍스트 입력, 파일 입력 | 프롬프트, 스펙, 파일, 원본 데이터 제공 |
| Output Node | Markdown preview, terminal viewer | 최종 출력, 로그, 생성 문서 렌더링 |

## 예시 워크플로

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

## 계획 중인 기술 스택

| 레이어 | 기술 | 이유 |
| --- | --- | --- |
| Desktop Wrapper | Tauri v2 | 작은 데스크톱 footprint와 네이티브 서브프로세스 실행 |
| Frontend | React, TypeScript, Vite | 빠른 개발과 풍부한 UI 생태계 |
| Canvas Engine | `@xyflow/react` | 무한 비주얼 캔버스와 커스텀 노드 렌더링 |
| State Management | Zustand | 노드, 엣지, 실행 상태를 위한 가벼운 전역 상태 관리 |
| Styling | Tailwind CSS, Lucide Icons | 개발자 중심의 어두운 UI와 명확한 컨트롤 |
| IPC Bus | Tauri IPC, Rust child processes | 터미널 에이전트의 비동기 실시간 스트리밍 |

## 초기 데이터 모델

KnotAgent 워크플로는 버전이 포함된 캔버스 스키마로 표현됩니다.

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

## 서브프로세스 버스

Rust 백엔드는 CLI 에이전트 노드를 위한 범용 명령 실행기를 제공합니다.

- `claude`, `codex`, `agy`, `gh` 같은 임의의 바이너리 실행
- 노드별 인자와 작업 디렉터리 전달
- 상위 노드 출력을 `{{input}}` 플레이스홀더에 치환
- Tauri 이벤트를 통해 출력을 캔버스로 스트리밍
- 로컬 터미널 세션과 기존 CLI 인증 흐름 유지

## 로드맵

### Phase 1: 프로젝트 기반

- Tauri v2, React, TypeScript, Vite 설정
- 기본 노드 및 엣지 편집이 가능한 React Flow 캔버스 추가
- 공유 TypeScript 캔버스 및 노드 스키마 정의
- 개발자용 다크 UI 셸 구성

### Phase 2: CLI 에이전트 노드

- `claude`, `codex`, `agy`, `gh`용 CLI 프리셋 추가
- Rust 서브프로세스 실행기 구현
- CLI 출력을 각 노드에 실시간 스트리밍
- 작업 디렉터리 선택과 인자 템플릿 지원

### Phase 3: 멀티 에이전트 파이프라인 엔진

- DAG 워크플로의 위상 정렬 실행
- 상위 노드 출력을 하위 노드로 전달
- CLI 인자와 프롬프트의 `{{input}}` 치환 지원
- 실행 상태, 오류 상태, 재시도 처리 추가

### Phase 4: 로컬 및 클라우드 LLM 노드

- Ollama, LM Studio, vLLM 호환 로컬 HTTP 노드 추가
- Anthropic, OpenAI, Gemini API 노드 추가
- 모델, temperature, system prompt, API key 설정 제공

### Phase 5: 워크플로 저장

- 캔버스 파일 저장 및 불러오기
- 워크플로 스키마 내보내기
- 재사용 가능한 노드 프리셋과 템플릿 추가

## 프로젝트 상태

KnotAgent는 현재 기반 구축 단계입니다. 저장소에는 첫 번째로 동작 가능한 데스크톱 앱 스캐폴드가 포함되어 있습니다.

- React + TypeScript + Vite 앱 셸
- React Flow 비주얼 캔버스
- CLI agent, local LLM, cloud API, input, markdown output 노드
- Zustand 캔버스 상태 저장소
- DAG 파이프라인 실행 엔진
- CLI 에이전트를 실행하고 `stdout` / `stderr`를 스트리밍하는 Tauri v2 Rust command

Tauri 데스크톱 래퍼를 로컬에서 빌드하거나 실행하려면 Rust가 필요합니다.

## 개발 전제 조건

모든 플랫폼에서 필요:

- Node.js 22 이상
- npm 10 이상
- Git

Tauri 데스크톱 개발에 필요:

- `rustup`으로 설치한 Rust와 Cargo
- 플랫폼별 네이티브 빌드 의존성

### Windows

Rust 설치:

```powershell
winget install Rustlang.Rustup
```

Microsoft Visual Studio Build Tools 설치:

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

Build Tools가 이미 설치되어 있으면 `winget`이 업그레이드할 항목이 없다고 표시할 수 있습니다. 이 경우 Visual Studio Installer를 열고 Build Tools 2022에서 **Modify**를 선택하세요.

```powershell
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe"
```

설치 화면에서 다음 워크로드를 선택하세요.

```text
Desktop development with C++
```

다음 컴포넌트가 포함되어 있는지도 확인하세요.

```text
MSVC v143 - VS 2022 C++ x64/x86 build tools
Windows 10 SDK 또는 Windows 11 SDK
C++ CMake tools for Windows
```

PowerShell을 닫았다가 다시 연 뒤 확인:

```powershell
cargo --version
rustc --version
where link
```

`where link`가 여전히 경로를 출력하지 않으면 다음 터미널에서 KnotAgent를 실행하세요.

```text
x64 Native Tools Command Prompt for VS 2022
```

`npm install`은 Visual C++ Build Tools를 설치하지 않습니다. 이 도구는 로컬 Tauri 개발과 빌드에만 필요하며, 미리 빌드된 KnotAgent 릴리스를 설치하는 최종 사용자에게는 필요하지 않습니다.

## 개발

의존성 설치:

```bash
npm install
```

웹 프론트엔드 실행:

```bash
npm run dev
```

프론트엔드 빌드:

```bash
npm run build
```

Rust와 네이티브 빌드 전제 조건 설치 후 Tauri 데스크톱 앱 실행:

```bash
npm run tauri dev
```

## 라이선스

MIT License. 자세한 내용은 [LICENSE](./LICENSE)를 참고하세요.
