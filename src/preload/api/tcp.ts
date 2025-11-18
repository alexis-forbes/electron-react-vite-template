import { contextBridge, ipcRenderer } from "electron";

import type { TcpMessage } from "../../shared/types/tcp";

export type TcpMessageHandler = (message: TcpMessage) => void;

const onTcpMessage = (handler: TcpMessageHandler): void => {
  ipcRenderer.on("tcp:message", (_event, message: TcpMessage) => {
    handler(message);
  });

  // Ask main process to send a demo TCP message so the UI always sees at least one.
  ipcRenderer.send("tcp:requestDemo");
};

export const exposeTcpApi = (): void => {
  contextBridge.exposeInMainWorld("api", {
    onTcpMessage
  });
};
