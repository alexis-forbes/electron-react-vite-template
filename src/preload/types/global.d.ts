import type { TcpMessage } from "../../shared/types/tcp";

export interface WindowApi {
  onTcpMessage: (handler: (message: TcpMessage) => void) => void;
}

declare global {
  interface Window {
    api: WindowApi;
  }
}

export {};
