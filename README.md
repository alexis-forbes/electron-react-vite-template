# Electron React Vite Template

Desktop application template built with:

- Electron + Electron Forge
- Vite + React + TypeScript
- Zustand for renderer state management
- Bootstrap + SCSS for UI
- Vitest for unit tests
- ESLint + Prettier + Husky + lint-staged
- Infrastructure ready for native DB (better-sqlite3) and TCP event handling

---

## Architecture goals

- Clearly separate **Electron processes**:
  - `main` (Node, OS/DB/TCP access)
  - `preload` (safe IPC bridge)
  - `renderer` (React UI)
- Keep **domain and business logic** outside of the UI layer.
- Make it easy to add:
  - **TCP** handling (client/server) in the `main` process.
  - Database access using **better-sqlite3**.
  - New React UI features without tight coupling to Electron.

---

## Proposed folder structure

```text
src/
  main/                  # Electron main process code
    tcp/                 # TCP connections / event handling
    db/                  # Database adapters (better-sqlite3)
    services/            # Domain/orchestration services using tcp/db
    config/              # Main-only config (constants, flags, etc.)
    types/               # Types specific to main

  preload/               # Preload code (contextBridge + IPC)
    api/                 # API exposed on window (window.api.*)
    types/               # Types used by preload

  renderer/              # React renderer
    app/
    components/
    features/
    hooks/
    store/
    styles/
    lib/

  shared/                # Cross-process domain + utilities
    types/
    utils/

index.html
```

### Current state vs proposed

Currently you have:

- `src/main.ts`
- `src/preload.ts`
- `src/renderer.tsx`
- `src/App.tsx`
- `src/store/useCounterStore.ts`
- `src/index.scss` (and `index.css`)

To avoid breaking the existing Electron Forge/Vite configuration (which points to these entrypoints), **those files have not been moved yet**. The plan is:

- Keep the entrypoints where they are in the short term.
- Gradually move logic into the proposed structure as the project grows:
  - Main logic → `src/main/**`
  - Preload logic → `src/preload/**`
  - React/UI → `src/renderer/**`
  - Shared types/utilities → `src/shared/**`

Examples of future migrations:

- `src/main.ts` can delegate to `src/main/services/*` and `src/main/tcp/*`.
- The demo store `src/store/useCounterStore.ts` could move to `src/renderer/store/`.
- `App.tsx` could move to `src/renderer/app/App.tsx`.

---

## Strategy for TCP and database

### 1. TCP in the `main` process

Socket handling (TCP server or client) should live in `main`:

- Suggested files:

  - `src/main/tcp/server.ts` – create the TCP server and listen for connections.
  - `src/main/tcp/client.ts` – if you also act as a TCP client.
  - `src/main/tcp/events.ts` – types and helpers for events/messages.

- Communication with React:

  - `main` receives/emits TCP events.
  - Use IPC to notify the renderer:
    - `main` ↔ `preload` ↔ `renderer`.
  - In `preload/api`, expose functions like `window.api.sendTcpMessage(...)` or `window.api.onTcpEvent(...)`.

### 2. Database (better-sqlite3) in `main`

`better-sqlite3` is native and should run only in `main`:

- Suggested files:

  - `src/main/db/connection.ts` – open the connection and manage the DB handle.
  - `src/main/db/repositories/*` – per-table repositories and specific queries.
  - `src/main/services/*` – orchestrate business rules using repos and TCP.

- Exposing DB operations to the renderer:

  - Never expose the raw DB client directly to the renderer.
  - Use IPC + preload to expose high-level methods:
    - `window.api.getUsers()`
    - `window.api.saveOrder(order)`

This separation keeps the UI isolated from Node/Electron and improves security.

---

## Typical flows

### 1. Renderer requests data from the DB

1. A React component (in `src/renderer/features/...`) calls `window.api.getSomething()`.
2. `preload` (in `src/preload/api/db.ts`) packages the request and sends it to `main` via IPC.
3. `main` (e.g. `src/main/services/dbService.ts`) calls repositories in `src/main/db/*`.
4. `main` sends the response back through IPC.
5. `preload` resolves the request and returns data to the renderer.

### 2. TCP event received

1. `src/main/tcp/server.ts` receives a message from a client.
2. It translates it to a domain type (e.g. `IncomingOrderEvent`).
3. Calls a service in `src/main/services/orderService.ts`.
4. The service may persist to the DB and, if relevant for the UI, emit an IPC event.
5. `preload` exposes `onOrderUpdated(callback)` in `window.api`.
6. React subscribes (for example via a hook in `src/renderer/hooks/useOrders.ts`) and updates its Zustand store.

---

## Runtime and build overview

- Electron Forge orchestrates the app lifecycle and packaging.
- The `@electron-forge/plugin-vite` plugin wires Vite into Electron:
  - Builds `src/main.ts` (main process), `src/preload.ts` (preload) and the React renderer.
  - In **development**, it starts a Vite dev server and injects globals like `MAIN_WINDOW_VITE_DEV_SERVER_URL` and `MAIN_WINDOW_VITE_NAME` that `src/main.ts` uses to decide whether to load the dev server URL or the built renderer.
- `npm start` runs `npm run check` (lint + type-check) and then `electron-forge start`, which:
  - Starts the Vite dev server(s).
  - Launches Electron and opens the main window pointing at the dev server.
- `electron-forge make` / `npm run make` build the production bundles with Vite and package the app.

For a step-by-step explanation of concepts, folder structure and the dev/build flows, see **ONBOARDING.md**.

---

## Main scripts

In `package.json`:

- `npm start` – run Electron Forge + Vite dev environment.
- `npm run lint` – run ESLint over `.ts`/`.tsx`.
- `npm run lint:fix` – apply autofixes (including import reordering).
- `npm run ts-check` – run `tsc --noEmit` (used in the pre-push hook).

Husky + lint-staged:

- `pre-commit` – runs `eslint --fix` and `prettier --write` on staged files.
- `pre-push` – runs `npm run ts-check` to ensure there are no type errors.

---

## TypeScript configuration

The project uses a **split TypeScript configuration** to keep concerns clear between Electron (Node) code and the React renderer:

- `tsconfig.base.json`
  - Shared compiler options used by all TS configs.
  - Defines strictness, module resolution, lib target, etc.

- `tsconfig.electron.json`
  - Extends `tsconfig.base.json`.
  - Targets the **Electron main + preload** code:
    - `module: "CommonJS"`
    - `lib: ["ES2022"]`
    - `types: ["node", "electron"]`
  - `include`:
    - `src/main.ts`, `src/preload.ts`
    - Everything under `src/main/**` and `src/preload/**`.
  - Used by the script:

    ```bash
    npm run ts-check:electron
    ```

- `tsconfig.json`
  - Also extends `tsconfig.base.json`.
  - Focused on the **renderer + shared** code:
    - `module: "ESNext"`
    - `lib: ["ES2022", "DOM", "DOM.Iterable"]`
    - `jsx: "react-jsx"`
    - `outDir: "dist-renderer"` (for potential future builds).
  - `include`:
    - `src/renderer/**`
    - `src/shared/**`
  - Used by the script:

    ```bash
    npm run ts-check:renderer
    ```

The combined check script is:

```bash
npm run check
```

which runs:

1. `npm run lint` – ESLint on all `.ts` / `.tsx` files.
2. `npm run ts-check:electron` – type-check Electron main + preload.
3. `npm run ts-check:renderer` – type-check React renderer + shared code.

The dev script:

```bash
npm start
```

executes `npm run check` first, then launches `electron-forge start`, giving you a tight feedback loop (lint + types + live Electron/Vite dev).

---

## How to extend the project

1. **Add a new UI feature**
   - Create a folder under `src/renderer/features/<feature>/`.
   - Place feature-specific components, hooks and stores there.

2. **Add a new domain service**
   - Create `src/main/services/<service>.ts`.
   - If it uses the DB: add repositories under `src/main/db/repositories/`.
   - If it uses TCP: reuse helpers from `src/main/tcp/`.

3. **Share types across processes**
   - Place types in `src/shared/types/`.
   - Import them from main/preload/renderer to avoid duplication.

4. **Keep boundaries clean**
   - The renderer (React) should never import from `electron` or `better-sqlite3` directly.
   - Always use the `preload/api` layer + IPC as the boundary.

---

## Suggested roadmap

Short term:

- Implement a simple TCP module in `src/main/tcp/`.
- Implement an initial repository using better-sqlite3 in `src/main/db/`.
- Expose 2–3 API methods in `preload/api`.
- Create an example feature in `src/renderer/features/` that consumes this API.

Medium term:

- Introduce a logging system (e.g. `src/shared/utils/logger.ts`).
- Add integration tests with Vitest for domain services.
- Document IPC/TCP contracts in `src/shared/types/`.

This structure should scale well as you add more business logic, additional TCP connections, and database modules.
