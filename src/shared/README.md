# src/shared

This folder contains **shared, framework–agnostic code** that can be used by:

- The Electron main process (`src/main/**`).
- The preload layer (`src/preload/**`).
- The React renderer (`src/renderer/**`).

The goal is to centralize **types and pure utilities** that represent your domain and cross–process contracts, without depending directly on Electron, React, or browser APIs.

## Subfolders

- `types/`
  - Shared TypeScript types and interfaces.
  - Examples:
    - DTOs returned by your APIs (e.g. `UserDto`, `OrderDto`).
    - Message shapes for TCP or IPC (e.g. `TcpMessage`, `IpcRequest`, `IpcResponse`).
    - Enums/constants that describe domain concepts.

- `utils/`
  - Pure utility functions without side effects.
  - Examples:
    - Date/number formatters.
    - Parsing/validation helpers.
    - Mappers between DB entities and DTOs.

## How it relates to Electron / Electron Forge

- Code here should be importable from any of the other `src` layers.
- Since it must run in both Node and browser contexts, **avoid**:
  - Direct `fs`, `net`, `process`, etc. (those go in `src/main`).
  - Direct DOM access or React hooks (those go in `src/renderer`).

Instead, keep this layer as **clean domain + pure helpers**. This makes it easy to:

- Reuse validation/mapping logic across main, preload and renderer.
- Test the core logic with Vitest without needing Electron.

## Guidelines

- If a type or helper is used by more than one process, it probably belongs here.
- If something requires Electron/Node APIs, it belongs in `main`.
- If something requires React/DOM, it belongs in `renderer`.
