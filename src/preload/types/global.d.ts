import type { DbDemoSyncResult } from "../../main/services/dbDemoService";
import type { DbDemoNote } from "../../shared/types/dbDemo";
import type { TcpMessage } from "../../shared/types/tcp";

export interface DbDemoApi {
  getNotes: () => Promise<DbDemoNote[]>;
  addNote: (text: string) => Promise<DbDemoNote>;
  sync: () => Promise<DbDemoSyncResult>;
}

export interface WindowApi {
  onTcpMessage: (handler: (message: TcpMessage) => void) => void;
  dbDemo: DbDemoApi;
}

declare global {
  interface Window {
    api: WindowApi;
  }
}

export {};
