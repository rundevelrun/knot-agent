# KnotAgent

KnotAgent는 터미널 AI 에이전트들을 선으로 연결해서 실행하는 데스크톱 캔버스입니다.

`claude`, `codex`, `agy`, `gh`, Ollama, 클라우드 LLM API 같은 도구들이 서로 작업을 넘겨야 할 때, 특정 벤더 플랫폼에 묶이지 않고 로컬 도구 중심으로 연결하는 것을 목표로 합니다.

> English README: [README.md](./README.md)

## 무엇을 하는가

KnotAgent에서는 AI 도구를 캔버스 위 노드로 올리고, 노드끼리 연결해서 파이프라인처럼 실행할 수 있습니다.

예시:

```text
기능 스펙
  -> agy가 아키텍처 계획
  -> claude가 초기 구현 작성
  -> codex가 리뷰 또는 리팩터링
  -> ollama가 결과를 로컬에서 요약
```

일반적인 API 워크플로 빌더와 다른 점은 CLI 에이전트를 1급 노드로 다룬다는 점입니다. 터미널에서 이미 동작하는 도구라면 KnotAgent 캔버스에서 실행하고, 출력도 해당 노드로 스트리밍하는 방향입니다.

## 현재 상태

현재 저장소에는 첫 번째로 동작 가능한 앱 스캐폴드가 들어 있습니다.

- React + TypeScript + Vite 프론트엔드
- React Flow 캔버스
- CLI agent, local LLM, cloud API, input, markdown output 노드
- `claude`, `codex`, `agy`, `gh` CLI 프리셋
- Zustand 캔버스 상태 저장소
- DAG 파이프라인 실행
- CLI 에이전트를 실행하는 Tauri v2 Rust command
- Rust에서 캔버스로 `stdout` / `stderr` 실시간 스트리밍

UI는 Vite 브라우저 모드로 실행할 수 있습니다. CLI 실행은 Tauri 데스크톱 런타임이 필요합니다.

## 스택

- Tauri v2
- React
- TypeScript
- Vite
- React Flow (`@xyflow/react`)
- Zustand
- Rust subprocess execution

## 지원 플랫폼

KnotAgent는 우선 Windows와 macOS를 주요 지원 대상으로 개발합니다.

Linux는 Tauri가 지원하므로 추후 best-effort로 지원할 계획입니다. 다만 배포판별 WebView와 시스템 패키지 요구사항 차이가 있어 초기 주요 지원 대상에서는 제외합니다.

모바일은 로컬 실행 대상이 아닙니다. KnotAgent는 데스크톱 CLI 도구, 로컬 저장소, 터미널 세션을 중심으로 설계된 앱입니다.

## 원격 방향성

향후 모바일 또는 웹 클라이언트는 온라인 상태의 Windows 또는 macOS KnotAgent 데스크톱 호스트를 원격으로 조작하는 화면이 될 수 있습니다.

이 구조에서는 실제 CLI 에이전트와 로컬 도구 실행은 데스크톱 앱이 담당합니다. 모바일 또는 웹 클라이언트는 같은 계정으로 로그인해 접근 가능한 데스크톱 호스트 목록을 보고, 캔버스 수정, 실행 시작, 액션 승인, 로그 스트리밍을 원격으로 처리합니다.

원격 접근은 명시적인 호스트 페어링, 인증, 액션 승인, 감사 로그가 갖춰진 뒤 지원 기능으로 다룰 예정입니다.

## 로컬 실행

의존성 설치:

```bash
npm install
```

프론트엔드만 실행:

```bash
npm run dev
```

열기:

```text
http://127.0.0.1:1420/
```

데스크톱 앱 실행:

```bash
npm run tauri dev
```

CLI 노드를 테스트할 때는 데스크톱 앱으로 실행해야 합니다.

## Windows 설정

프론트엔드만 개발할 때는 Node.js와 npm이면 충분합니다.

Tauri 데스크톱 개발에는 Rust와 Microsoft C++ build tools가 필요합니다.

```powershell
winget install Rustlang.Rustup
winget install Microsoft.VisualStudio.2022.BuildTools
```

Build Tools가 이미 설치되어 있으면 `winget`이 업그레이드할 항목이 없다고 표시할 수 있습니다. 하지만 이것이 C++ 워크로드가 설치되어 있다는 뜻은 아닙니다.

Visual Studio Installer 열기:

```powershell
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe"
```

Build Tools 2022에서 **Modify**를 선택하고 다음 워크로드를 설치하세요.

```text
Desktop development with C++
```

다음 항목이 포함되어 있는지 확인하세요.

```text
MSVC v143 - VS 2022 C++ x64/x86 build tools
Windows 10 SDK 또는 Windows 11 SDK
C++ CMake tools for Windows
```

새 터미널을 열고 확인:

```powershell
cargo --version
rustc --version
where link
```

`where link`가 아무것도 출력하지 않으면 다음 터미널에서 프로젝트를 실행하세요.

```text
x64 Native Tools Command Prompt for VS 2022
```

## CLI 노드

CLI 노드는 현재 다음 값을 편집할 수 있습니다.

- command
- arguments
- working directory
- live output

arguments에는 `{{input}}`을 사용할 수 있고, 이 값은 상위 노드 출력으로 치환됩니다.

예:

```text
Command: codex
Arguments: exec {{input}}
```

Custom CLI는 기존 CLI 노드의 command와 arguments를 inspector에서 바꿔서 테스트할 수 있습니다.

## 로드맵

- 더 나은 custom CLI 노드 편집기
- 따옴표 문자열과 JSON 인자를 안전하게 다루는 arguments 처리
- Ollama / LM Studio / vLLM 실제 호출
- OpenAI, Anthropic, Gemini용 Cloud API 노드
- 캔버스 파일 저장 및 불러오기
- 워크플로 템플릿
- 원격 데스크톱 호스트 등록
- 모바일 및 웹 원격 조작 클라이언트
- 패키징된 데스크톱 릴리스

## 라이선스

MIT License. 자세한 내용은 [LICENSE](./LICENSE)를 참고하세요.
