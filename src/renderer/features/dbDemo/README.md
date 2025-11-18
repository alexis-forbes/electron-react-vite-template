# DB demo feature: offline SQLite + optional online sync

This feature is a **small example** of how to:

- Store data **locally** in the Electron **main process** using SQLite.
- Expose a safe API to the **renderer** via `window.api`.
- Add an **optional online sync** layer that talks to a remote backend.

It uses [`sql.js`](https://github.com/sql-js/sql.js) (a pure JS/WASM version of SQLite) to avoid native build issues on Windows.

---

## 1. How it works (end to end)

### Local DB (offline)

- File: `src/main/db/demoDb.ts`
- Uses `sql.js` to create / open a SQLite file at:

  - `app.getPath("userData")/demo-notes.sqlite`

- On first run, it creates a `notes` table:

  ```sql
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  ```

- Functions:

  - `getAllNotes()` → `SELECT * FROM notes ORDER BY id ASC`.
  - `addNote(text)` → `INSERT` a new note and return it.
  - After writes, it calls `export()` on the in-memory DB and writes the bytes back to the SQLite file.

### Service layer in main

- File: `src/main/services/dbDemoService.ts`
- Wraps the DB adapter and defines the **demo use cases**:

  - `getDemoNotes()` → calls `getAllNotes()`.
  - `addDemoNote(text)` → calls `addNote(text)`.
  - `syncDemoNotes()` → fake implementation returning `{ pushed, pulled, lastSync }`.

This is where you would normally:

- Read pending local changes from SQLite.
- POST them to your backend API (Postgres/MySQL/etc.).
- Apply remote changes back into SQLite.

### IPC handlers in main

- File: `src/main.ts`
- Registers IPC handlers:

  ```ts
  ipcMain.handle("dbDemo:getNotes", async () => getDemoNotes());
  ipcMain.handle("dbDemo:addNote", async (_event, text: string) => addDemoNote(text));
  ipcMain.handle("dbDemo:sync", async () => syncDemoNotes());
  ```

The **renderer never talks directly** to SQLite or Node APIs. Everything goes through IPC and the main process.

### Preload and `window.api`

- File: `src/preload/api/dbDemo.ts`
- Creates a small API surface on top of IPC:

  ```ts
  export const dbDemoApi = {
    getNotes: () => ipcRenderer.invoke("dbDemo:getNotes"),
    addNote: (text: string) => ipcRenderer.invoke("dbDemo:addNote", text),
    sync: () => ipcRenderer.invoke("dbDemo:sync")
  };
  ```

- File: `src/preload/api/tcp.ts`
- Exposes both TCP and db demo APIs:

  ```ts
  contextBridge.exposeInMainWorld("api", {
    onTcpMessage,
    dbDemo: dbDemoApi
  });
  ```

So from the renderer you use:

```ts
window.api.dbDemo.getNotes();
window.api.dbDemo.addNote("hello");
window.api.dbDemo.sync();
```

### React UI

- File: `src/renderer/features/dbDemo/DbDemo.tsx`
- Simple UI that:

  - Loads notes on mount via `window.api.dbDemo.getNotes()`.
  - Lets you type a note and click **Add** to save it locally.
  - Has a **Sync** button that calls `window.api.dbDemo.sync()` and shows the result.

It is rendered from the main app component:

- File: `src/renderer/app/App.tsx`

---

## 2. How to work with any SQL DB in the main process

The important part is the **pattern**, not the specific library:

1. **Keep all DB access in the main process**

   - Main is the only place that talks to the DB client:
     - SQLite via `sql.js` or `better-sqlite3`.
     - Postgres via `pg`.
     - MySQL via `mysql2`.
   - Renderer code should never import DB clients or `electron` directly.

2. **Create a DB adapter module**

   - Similar to `src/main/db/demoDb.ts`, but for your real DB:
     - For Postgres: `src/main/db/postgresClient.ts` using `pg`.
     - For MySQL: `src/main/db/mysqlClient.ts` using `mysql2`.
     - For native SQLite: `src/main/db/sqliteNative.ts` using `better-sqlite3`.

3. **Expose domain-level services**

   - Use `src/main/services/**` to hide raw SQL from the rest of the app.
   - Example:

     ```ts
     // src/main/services/userService.ts
     export const getUsers = async () => userRepository.findAll();
     export const saveUser = async (user: UserInput) => userRepository.save(user);
     ```

4. **Wire services to IPC**

   - In `src/main.ts` (or a dedicated IPC module), register handlers:

     ```ts
     ipcMain.handle("users:get", () => getUsers());
     ipcMain.handle("users:save", (_event, user) => saveUser(user));
     ```

5. **Expose a preload API**

   - In `src/preload/api/users.ts`:

     ```ts
     export const usersApi = {
       getUsers: () => ipcRenderer.invoke("users:get"),
       saveUser: (user: UserInput) => ipcRenderer.invoke("users:save", user)
     };
     ```

   - And add it to `window.api` via `contextBridge.exposeInMainWorld`.

6. **Use the preload API from React**

   - In hooks/components, only call `window.api.users.getUsers()` etc.

### Native vs non-native clients

- **Non-native (like `sql.js`)**
  - Pros: no Windows build toolchain, easy onboarding.
  - Cons: slower, you manage the DB file yourself.

- **Native addons (`better-sqlite3`, `sqlite3`, etc.)**
  - Pros: faster, closer to the underlying DB.
  - Cons: require Visual Studio Build Tools, Windows SDK, and Python on Windows.

The template chooses `sql.js` by default to keep things simple and reliable on Windows, but you can swap in a native client later if you need the performance and are willing to install the toolchain.

---

## 3. How to test this feature in development

1. **Start the app**

   From the project root:

   ```bash
   npm start
   ```

   This runs both:

   - Vite dev server (renderer) on `http://localhost:5173`.
   - Electron via Electron Forge (main + preload).

2. **Use the UI demo**

   In the running app:

   - Scroll below the counter and TCP messages.
   - Find **"Offline notes demo (local SQLite via sql.js)"**.
   - Type a note and click **Add**.
   - Click **Sync** to call the fake online sync and see the timestamp.

3. **Verify the DB file**

   - The SQLite file is stored under:

     - `app.getPath("userData")/demo-notes.sqlite`

   - On Windows, `userData` is typically in:

     - `C:\Users\<you>\AppData\Roaming\electron-template` (or your app name)

   - You can open `demo-notes.sqlite` with tools like:

     - **DB Browser for SQLite**
     - **DBeaver** (with a SQLite connection)

   to see the `notes` table and verify that inserts from the UI are really being persisted.

4. **Where to plug in a real backend**

   - Replace the body of `syncDemoNotes()` in `src/main/services/dbDemoService.ts` with real HTTP calls to your backend:

     ```ts
     // pseudo-code
     const localChanges = await getPendingChangesFromLocalDb();
     await fetch("https://api.example.com/notes/sync", {
       method: "POST",
       body: JSON.stringify(localChanges)
     });

     const remoteChanges = await fetch("https://api.example.com/notes/changes").then(r => r.json());
     await applyRemoteChangesToLocalDb(remoteChanges);
     ```

   - The renderer code does **not** change; it still just calls `window.api.dbDemo.sync()`.

This feature is meant as a **reference implementation** you can copy when building your own offline-first data flows in Electron.
