# Onboarding: Electron + Vite + React + Electron Forge

This document is meant as a simple, straight‑to‑the‑point explanation of how this template works and where to put your code.

---

## 1. Big picture: what runs where?

- **Electron Forge**
  - CLI & tooling that runs Electron in dev and builds installers in prod.
  - Reads `forge.config.ts` to know how to start/build and how to package.
- **Electron**
  - Runs your desktop app.
  - Has three main parts in this template:
    - `main` process – Node.js environment with access to the OS, DB, TCP, etc.
    - `preload` – a small script that runs in the renderer, but with limited Node access; it exposes a safe `window.api`.
    - `renderer` – the React UI (browser-like environment, no direct Node/electron imports).
- **TypeScript (`tsc`) for main/preload**
  - `tsconfig.electron.json` compiles `src/main.ts` and `src/preload.ts` into `dist-electron`.
  - `package.json` points Electron’s `main` entry to `dist-electron/main.js`.
- **Vite for the renderer**
  - `vite.renderer.config.ts` builds and serves the React UI.
  - In dev, Vite runs a **dev server** (HMR, fast reload) on `http://localhost:5173`.
  - In prod, Vite builds static assets into `dist/renderer`.

Electron Forge no longer uses the Forge Vite plugin. Instead, you:

- Run Vite yourself for the renderer.
- Use `tsc` to build main/preload.
- Let Electron Forge just run/package the built main process.

---

## 2. Folder & file structure (where to put what)

At the root:

- `forge.config.ts`
  - Electron Forge config (makers, packager config, fuses).
  - Does **not** use the Forge Vite plugin anymore.
- `vite.renderer.config.ts`
  - Vite config for the **renderer** (React UI entry `src/renderer.tsx`).
- `index.html`
  - HTML entry used by the renderer.
  - Loads `/src/renderer.tsx`.

In `src/` (current state + intended organization):

- `src/main.ts`
  - Entry for the Electron main process.
  - Creates the `BrowserWindow` and decides what URL/file to load.
  - Starts backend-ish things, e.g. TCP server, DB connections.
- `src/preload.ts`
  - Entry for preload.
  - Should expose a safe `window.api` using `contextBridge`.
- `src/renderer.tsx`
  - Entry for the React renderer.
  - Bootstraps React (e.g. renders `<App />` into `#root`).
- `src/App.tsx`, `src/index.scss`, `src/store/*` etc.
  - Current React UI and state management.

Planned structure as the app grows (from README):

- `src/main/**`
  - TCP, DB, services, config, types for main process.
- `src/preload/**`
  - `api/` for things you expose to `window.api`.
- `src/renderer/**`
  - React components, features, hooks, store, styles.
- `src/shared/**`
  - Types and utilities shared between main, preload and renderer.

**Rule of thumb:**

- Anything that needs **OS access, DB, TCP, filesystem** → goes into `main`.
- Anything that needs to talk to main, but run in the browser environment → goes through `preload`.
- Anything UI/React → goes into `renderer`.

---

## 3. Dev workflow: what command to run and what happens

### Commands to run (development)

Dev is now a **single-command** flow that still uses two processes under the hood (Vite + Electron Forge), but they are started for you in parallel:

```bash
npm start
# or explicitly
npm run dev
```

This script runs:

- `dev:renderer` → Vite dev server using `vite.renderer.config.ts`.
  - Serves the React UI on `http://localhost:5173`.
- `start:electron` → `npm run check && npm run build:electron && electron-forge start`.
  - Runs lint + type-check (`check`).
  - Builds main/preload into `dist-electron`.
  - Starts Electron Forge, which launches the Electron app.

Behind the scenes, when `start:electron` runs, it:

1. **Lint & type-check** via `npm run check`:
   - `npm run lint`.
   - `npm run ts-check:electron` (TypeScript check for main + preload using `tsconfig.electron.json`).
   - `npm run ts-check:renderer` (TypeScript check for renderer + shared using `tsconfig.json`).
2. **Build Electron main/preload**
   - `npm run build:electron` → `tsc` builds to `dist-electron`.
3. **Start Electron Forge dev**
   - `electron-forge start` runs `dist-electron/main.js`.
   - `src/main.ts` checks `app.isPackaged`:
     - In dev (`!app.isPackaged`), it loads `http://localhost:5173` (the Vite dev server).

From a developer experience (DX) point of view:

- You run **one command**: `npm start` (or `npm run dev`).
- Renderer code changes get hot reload via Vite.
- Changes in `src/main.ts` or `src/preload.ts` cause `build:electron`/Forge to pick up the new code.

---

## 4. Build / package workflow

### Commands (production / packaging)

- **Full build only** (renderer + Electron, no installers):

  ```bash
  npm run build
  ```

  - Runs `build:renderer` and `build:electron`:
    - `npm run build:renderer` → Vite builds the React UI into `dist/renderer`.
    - `npm run build:electron` → `tsc` builds main + preload into `dist-electron`.

- **Make installers with Electron Forge** (build + package):

  ```bash
  npm run make
  ```

  - Internally runs `npm run build` **first**, then calls `electron-forge make`.
  - You do **not** need to run `npm run build` manually before `npm run make`.

- **Package app without installers** (build + package):

  ```bash
  npm run package
  ```

  - Internally runs `npm run build` **first**, then calls `electron-forge package`.

### What happens when building/making

1. `npm run build` runs:
   - `npm run build:renderer` → Vite builds the React UI into `dist/renderer`.
   - `npm run build:electron` → `tsc` builds main + preload into `dist-electron`.
2. `npm run make` / `npm run package` then run Electron Forge:
   - Forge uses `dist-electron/main.js` as the Electron entry (see `package.json.main`).
   - At runtime, `app.isPackaged === true`, so `src/main.ts` loads `../renderer/index.html` relative to `dist-electron/main.js`.
   - Forge creates platform-specific bundles using the makers in `forge.config.ts`.

---

## 5. Where to add your code in practice

- **New backend feature (TCP, DB, services)**
  - Add files under `src/main/` (e.g. `src/main/tcp/server.ts`, `src/main/db/connection.ts`, `src/main/services/userService.ts`).
  - Wire them into `src/main.ts` (or dedicated main bootstrap files) instead of directly into React.
- **New API from main to renderer**
  - Define IPC channels and handlers in `src/main`.
  - Expose clean functions in `src/preload` (e.g. `window.api.getUsers()`).
  - Consume them in React via hooks/stores under `src/renderer`.
- **New UI feature**
  - Add components/hooks/stores under `src/renderer/**`.
  - Use `window.api` (from preload) to talk to main.

### Example: exposing `window.api` via preload

In `src/preload.ts` (or a file it imports), use `contextBridge` to expose a small, safe API surface to the renderer:

```ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  getUsers: () => ipcRenderer.invoke("users:get"),
  onOrderUpdated: (callback: (order: unknown) => void) => {
    ipcRenderer.on("orders:updated", (_event, payload) => callback(payload));
  }
});
```

In the renderer (e.g. a React component under `src/renderer/**`), you only talk to this API, not directly to `electron` or Node APIs:

```ts
// Types for window.api are typically declared in a global.d.ts file.

window.api.getUsers().then(users => {
  // update local/Zustand state with users
});

window.api.onOrderUpdated(order => {
  // react to order updates (e.g. refresh list or update store)
});
```

This pattern matches Electron's recommended approach: keep the renderer sandboxed and use preload as the only, well-defined bridge between React and the main process.

Keep this rule in mind:

- Renderer should **never** import `electron` or native modules directly.
- All Electron/OS/native access flows: **renderer → preload (window.api) → main → OS/DB/TCP**.

---

## 6. Quick mental model

- **Electron Forge** = "Project runner + packager".
- **Vite** = "Builder + dev server".
- **Main** = "Backend for the desktop app" (Node/Electron).
- **Preload** = "Safe bridge".
- **Renderer** = "React front-end".

For day-to-day work as a developer:

- Run `npm start`.
- Put backend-ish code in `src/main/**`.
- Put UI code in `src/renderer/**`.
- Use `window.api` (from preload) as the only way for React to talk to Electron/Node.

---

## 7. Testing: unit vs e2e

- **Unit tests (Vitest)**
  - Folder: `tests/unit/**`.
  - Uses `vitest.config.ts` with `environment: "jsdom"` and globals.
  - Run locally:

    ```bash
    npm run test:unit
    ```

  - Good place for:
    - Pure functions.
    - React components/hooks that don’t need a real browser window.

- **End-to-end tests (Playwright)**
  - Folder: `tests/e2e/**`.
  - Config: `playwright.config.ts` (Chromium, headless by default).
  - Typical local flow:

    ```bash
    # one-time
    npx playwright install

    # terminal 1
    npm run dev:renderer

    # terminal 2
    npm start

    # terminal 3
    npm run test:e2e
    ```

  - The example spec assumes the renderer is reachable at `http://localhost:5173`.

- **Combined command**

  ```bash
  npm test
  ```

  - Runs both `test:unit` and `test:e2e`.

- **CI behavior**
  - GitHub Actions workflows for PRs and pushes to `main` currently run:
    - `npm run check`
    - `npm run build`
    - `npm run test:unit`
  - Playwright e2e tests are set up for local use and can be wired into CI later once the Electron + dev server lifecycle is defined.
