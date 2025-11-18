import { ipcRenderer } from "electron";

import type { DbDemoSyncResult } from "../../main/services/dbDemoService";
import type { DbDemoNote } from "../../shared/types/dbDemo";

export const dbDemoApi = {
  getNotes: (): Promise<DbDemoNote[]> => ipcRenderer.invoke("dbDemo:getNotes"),
  addNote: (text: string): Promise<DbDemoNote> =>
    ipcRenderer.invoke("dbDemo:addNote", text),
  sync: (): Promise<DbDemoSyncResult> => ipcRenderer.invoke("dbDemo:sync")
};
