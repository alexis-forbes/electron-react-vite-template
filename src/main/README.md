# src/main

This folder contains the **Electron main process** code.

The main process runs in Node.js and is responsible for:

- Creating and managing BrowserWindows.
- Integrating with the OS (menu, tray, notifications, etc.).
- Managing native resources (file system, processes, environment).
- Owning long–running services such as TCP servers/clients.
- Owning access to native DB drivers (e.g. `better-sqlite3`).

In this template, Electron Forge + the Vite plugin will **bundle `src/main.ts`** as the entrypoint for the main process. The files under `src/main/**` are meant to be imported from there.

## Subfolders

- `tcp/`
  - TCP servers/clients and event handling.
  - Example responsibilities:
    - Start a TCP server on app startup.
    - Decode/encode protocol messages.
    - Emit internal events or call services when messages arrive.

- `db/`
  - Database adapters for **better-sqlite3** or other native DBs.
  - Example responsibilities:
    - Open and manage DB connections.
    - Implement repositories for tables (e.g. `userRepository`, `orderRepository`).

- `services/`
  - Domain services that orchestrate **tcp**, **db** and other infrastructure.
  - Example responsibilities:
    - Use repositories to read/write data.
    - React to TCP events and persist state.
    - Expose high–level use cases consumed via IPC.

- `config/`
  - Configuration and constants used only by the main process.
  - Example: ports, file paths, feature flags, environment–dependent values.

- `types/`
  - TypeScript types that are specific to the main process.
  - Prefer to place cross–process types in `src/shared/types/` instead.

## How it relates to Electron Forge / Vite

- Electron Forge uses `forge.config.ts` + the Vite plugin to build this folder as the **main bundle**.
- `src/main.ts` is the entrypoint referenced by Vite; it should import from `src/main/**` for actual logic.
- Nothing in `src/main/**` should import from React or browser–only APIs.

## Guidelines

- Keep UI concerns out of this folder.
- All access to TCP, DB and OS resources should happen here.
- Expose functionality to the renderer **only via IPC**, wired through the `preload` layer.
