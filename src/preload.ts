// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

import type { DbDemoSyncResult } from "./main/services/dbDemoService";
import type { DbDemoNote } from "./shared/types/dbDemo";
import type { TcpMessage } from "./shared/types/tcp";

type TcpMessageHandler = (message: TcpMessage) => void;

const onTcpMessage = (handler: TcpMessageHandler): void => {
  ipcRenderer.on("tcp:message", (_event, message: TcpMessage) => {
    handler(message);
  });

  // Ask main process to send a demo TCP message so the UI always sees at least one.
  ipcRenderer.send("tcp:requestDemo");
};

const dbDemoApi = {
  getNotes: (): Promise<DbDemoNote[]> => ipcRenderer.invoke("dbDemo:getNotes"),
  addNote: (text: string): Promise<DbDemoNote> =>
    ipcRenderer.invoke("dbDemo:addNote", text),
  sync: (): Promise<DbDemoSyncResult> => ipcRenderer.invoke("dbDemo:sync")
};

contextBridge.exposeInMainWorld("api", {
  onTcpMessage,
  dbDemo: dbDemoApi
});
