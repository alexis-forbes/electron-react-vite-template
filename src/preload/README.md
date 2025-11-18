# src/preload

This folder contains the **Electron preload process** code.

The preload script runs **in the renderer context but with limited Node.js access**, and is the safe bridge between:

- The Electron **main process** (full Node/Electron power).
- The **React renderer** (browser environment, no direct Node).

In this template, Electron Forge + Vite bundle `src/preload.ts` as the preload entry. Files under `src/preload/**` are intended to be imported from that entrypoint.

## Responsibilities

- Use `contextBridge.exposeInMainWorld` to define a **typed API** on `window` (e.g. `window.api`).
- Implement IPC calls (`ipcRenderer.invoke`, `ipcRenderer.on`, etc.) to communicate with the main process.
- Hide all Electron/Node details from the React app.

The goal is that React never calls Electron APIs directly; it only talks to the API defined here.

## Subfolders

- `api/`
  - Public API surface exposed to the renderer.
  - Example files:
    - `db.ts` – functions like `getUsers()`, `saveOrder(order)`.
    - `tcp.ts` – functions like `sendTcpMessage(...)`, `onTcpEvent(...)`.
  - Each file should:
    - Define the shape of the API (TypeScript types).
    - Wire IPC calls to the main process.

- `types/`
  - Types that describe the exposed API.
  - Example: `WindowApi`, `DbApi`, event payloads used in preload.
  - Cross–process domain types should live in `src/shared/types/` and be imported here.

## How it relates to Electron Forge / Vite

- The Vite plugin for Electron Forge builds `src/preload.ts` into a preload bundle.
- BrowserWindows created in `src/main.ts` should reference this preload script.
- Any file in `src/preload/**` is part of that bundle when imported from `src/preload.ts`.

## Guidelines

- Do **not** access UI libraries (React, DOM–heavy code) here.
- Do **not** expose raw `ipcRenderer` to the renderer; wrap it in well–defined functions.
- Keep the API small and intention–revealing (`window.api.doSomething()` instead of low–level channels everywhere).
