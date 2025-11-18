# src/renderer

This folder contains the **React renderer** code running in the browser context.

The renderer is responsible for:

- Rendering the UI (components, screens, layouts).
- Managing client–side state (Zustand, React state, hooks).
- Talking to the preload API (e.g. `window.api`) to interact with Electron features, TCP and DB.

In this template, Vite bundles `src/renderer.tsx` as the renderer entry, which bootstraps `App` and imports styles.

## Subfolders

- `app/`
  - Application shell (root `App` component, layout, routing if added).
  - Ideal place for high–level providers (Zustand, theming, router).

- `components/`
  - Reusable presentational components.
  - Examples: buttons, tables, dialogs, form controls.
  - Should be UI–focused and unaware of Electron/IPC details.

- `features/`
  - Feature–oriented modules grouped by domain.
  - Example: `features/users`, `features/orders`, `features/settings`.
  - Each feature can contain its own components, hooks and state that are specific to that domain.

- `hooks/`
  - Shared React hooks used across multiple features/components.
  - Example: `useWindowApi`, `useOnlineStatus`, `useModal`.

- `store/`
  - Zustand stores for client–side state.
  - Example: `useCounterStore` (current demo), future domain stores.

- `styles/`
  - SCSS/CSS specific to the renderer.
  - Global styles, Bootstrap overrides, theme variables, etc.

- `lib/`
  - Frontend utilities that are not React components.
  - Example: formatters, small helpers, thin HTTP clients (if needed).

## How it relates to Electron Forge / Vite

- Vite handles bundling and HMR for everything under `src/renderer/**` that is imported from `src/renderer.tsx`.
- Electron Forge runs Vite dev server and loads the served HTML/JS in a BrowserWindow.
- The renderer should treat `window.api` (defined in `src/preload`) as the boundary for talking to Electron/TCP/DB.

## Guidelines

- Never import `electron`, `better-sqlite3` or other Node–only modules here.
- Keep domain logic thin; complex orchestration should live in `src/main/services` and just expose an API.
- Use feature folders to keep the UI modular and maintainable as the app grows.
