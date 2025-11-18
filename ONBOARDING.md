# Onboarding: Electron + Vite + React + Electron Forge

This document is meant as a simple, straight‑to‑the‑point explanation of how this template works and where to put your code.

---

## 1. Big picture: what runs where?

- **Electron Forge**
  - CLI & tooling that runs Electron in dev and builds installers in prod.
  - Reads `forge.config.ts` to know how to start/build.
- **Electron**
  - Runs your desktop app.
  - Has three main parts in this template:
    - `main` process – Node.js environment with access to the OS, DB, TCP, etc.
    - `preload` – a small script that runs in the renderer, but with limited Node access; it exposes a safe `window.api`.
    - `renderer` – the React UI (browser-like environment, no direct Node/electron imports).
- **Vite**
  - Builds your TypeScript / React code.
  - Also runs a **dev server** in development for fast reloads.
- **@electron-forge/plugin-vite**
  - Connects Vite and Electron Forge.
  - Knows how to build:
    - `src/main.ts` (using `vite.main.config.ts`).
    - `src/preload.ts` (using `vite.preload.config.ts`).
    - React renderer (using `vite.renderer.config.ts`).
  - In dev, it starts the Vite dev server and injects some **globals** (like `MAIN_WINDOW_VITE_DEV_SERVER_URL`) so the main process knows where to load the UI from.

### Quick FAQ

- **Q: Why does `electron-forge start` also start the Vite dev server?**
  - Because `forge.config.ts` registers `@electron-forge/plugin-vite` in the `plugins` array.
  - When Forge runs `start`, it loads that plugin, which in turn starts Vite using your `vite.*.config.ts` files and wires everything into Electron.

- **Q: Where do `MAIN_WINDOW_VITE_DEV_SERVER_URL` and `MAIN_WINDOW_VITE_NAME` get their values?**
  - You *do not* set them in your code. The Vite plugin injects them when it builds/runs the main process bundle.
  - At runtime:
    - `MAIN_WINDOW_VITE_DEV_SERVER_URL` is a URL in dev (e.g. `http://localhost:<port>/main_window`) and `undefined` in prod.
    - `MAIN_WINDOW_VITE_NAME` comes from the `renderer.name` field in `forge.config.ts` (here: `"main_window"`).
  - The `declare const ...` lines you see are only TypeScript declarations (in `.d.ts`), so the compiler/IDE know these globals exist and what type they have; they do not assign any values.

---

## 2. Folder & file structure (where to put what)

At the root:

- `forge.config.ts`
  - Electron Forge config.
  - Registers the Vite plugin and defines build targets and renderer name.
- `vite.main.config.ts`
  - Vite config for **main** (Electron main process entry `src/main.ts`).
- `vite.preload.config.ts`
  - Vite config for **preload** (entry `src/preload.ts`).
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

## 3. How dev server & globals work

The main process needs to know **what to load in the BrowserWindow**:

- In **development**: load the Vite dev server URL (e.g. `http://localhost:5123`).
- In **production**: load the built `index.html` from disk.

The Electron Forge Vite plugin solves this by injecting **globals** when it runs:

- `MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined`
  - In dev: something like `http://localhost:5123/main_window`.
  - In prod: `undefined`.
- `MAIN_WINDOW_VITE_NAME: string`
  - Name of the renderer from `forge.config.ts` → here `"main_window"`.

In `forge.config.ts` you can see:

```ts
renderer: [
  {
    name: "main_window",
    config: "vite.renderer.config.ts"
  }
]
```

In `src/main.ts`, the code uses these globals:

```ts
if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
  mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
} else {
  mainWindow.loadFile(
    path.join(
      __dirname,
      `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
    )
  );
}
```

Meaning:

- **Dev**: global is set → `loadURL` with the dev server.
- **Prod**: global is not set → `loadFile` from the Vite build output at `.vite/renderer/<MAIN_WINDOW_VITE_NAME>/index.html`.

There is also a small `src/electron-vite-globals.d.ts` file that tells TypeScript these globals exist:

```ts
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
```

---

## 4. Dev workflow: what command to run and what happens

### Command to run

```bash
npm start
```

### What the command actually does

From `package.json`:

```json
"scripts": {
  "start": "npm run check && electron-forge start",
  "check": "npm run lint && npm run ts-check:electron && npm run ts-check:renderer"
}
```

So when you run `npm start`:

1. **Lint & type-check**
   - `npm run lint`
   - `npm run ts-check:electron` (TypeScript check for main + preload using `tsconfig.electron.json`).
   - `npm run ts-check:renderer` (TypeScript check for renderer + shared using `tsconfig.json`).
2. **Start Electron Forge dev**
   - `electron-forge start` reads `forge.config.ts`.
   - The Vite plugin:
     - Starts Vite dev server(s) using your Vite configs.
     - Injects the globals (`MAIN_WINDOW_VITE_DEV_SERVER_URL`, `MAIN_WINDOW_VITE_NAME`).
   - Electron is launched with the compiled main process.
   - `src/main.ts` creates a window and:
     - In dev, loads the Vite dev server URL (fast HMR, React dev tools, etc.).

From a developer experience (DX) point of view:

- You **only need** `npm start` for local dev.
- Code changes in `src/renderer.tsx`, React components, etc. trigger hot reload via Vite.
- Changes in `src/main.ts` or `src/preload.ts` typically restart the Electron process (Forge handles it).

---

## 5. Build / package workflow

### Commands

- **Quick build for packaging** (via Electron Forge):

  ```bash
  npm run make
  ```

- **Package without making installers** (if you add a `package` script, or use `electron-forge package` directly):

  ```bash
  npx electron-forge package
  ```

### What happens when building/making

1. Electron Forge runs the Vite plugin in **build mode**.
2. Vite builds:
   - Main process (`src/main.ts`) using `vite.main.config.ts`.
   - Preload (`src/preload.ts`) using `vite.preload.config.ts`.
   - Renderer (`src/renderer.tsx`) using `vite.renderer.config.ts`.
3. Outputs go under the `.vite` directory (by default), including the renderer under something like:
   - `.vite/renderer/main_window/index.html`
4. The packaged Electron app uses the **same `src/main.ts` logic**:
   - `MAIN_WINDOW_VITE_DEV_SERVER_URL` is not set.
   - It loads the built HTML with `loadFile(path.join(__dirname, "../renderer/.../index.html"))`.
5. Forge then creates platform-specific bundles (e.g. `.exe`, `.dmg`, etc.) using makers configured in `forge.config.ts`.

---

## 6. Where to add your code in practice

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

Keep this rule in mind:

- Renderer should **never** import `electron` or native modules directly.
- All Electron/OS/native access flows: **renderer → preload (window.api) → main → OS/DB/TCP**.

---

## 7. Quick mental model

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
