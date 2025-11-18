import type { BrowserWindow } from "electron";
import net from "node:net";

import type { TcpMessage } from "../../shared/types/tcp";

const TCP_PORT = 5555;
const TCP_HOST = "127.0.0.1";

let tcpServer: net.Server | null = null;

export const startTcpDemoServer = (mainWindow: BrowserWindow): void => {
  if (tcpServer) {
    return;
  }

  tcpServer = net.createServer();

  tcpServer.on("listening", () => {
    const message: TcpMessage = {
      id: `tcp-demo-${Date.now()}`,
      type: "tcp-demo",
      payload: {
        host: TCP_HOST,
        port: TCP_PORT,
        info: "TCP demo server is listening"
      },
      timestamp: new Date().toISOString()
    };

    mainWindow.webContents.send("tcp:message", message);
  });

  tcpServer.on("error", (error) => {
    const message: TcpMessage = {
      id: `tcp-error-${Date.now()}`,
      type: "tcp-data",
      payload: {
        error: error.message
      },
      timestamp: new Date().toISOString()
    };

    mainWindow.webContents.send("tcp:message", message);
  });

  tcpServer.listen(TCP_PORT, TCP_HOST);
};
