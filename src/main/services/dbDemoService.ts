import type { DbDemoNote } from "../../shared/types/dbDemo";
import { addNote, getAllNotes } from "../db/demoDb";

export const getDemoNotes = async (): Promise<DbDemoNote[]> => {
  return getAllNotes();
};

export const addDemoNote = async (text: string): Promise<DbDemoNote> => {
  return addNote(text);
};

export interface DbDemoSyncResult {
  pushed: number;
  pulled: number;
  lastSync: string;
}

export const syncDemoNotes = async (): Promise<DbDemoSyncResult> => {
  // This is a placeholder to represent talking to a remote backend.
  // In a real app you would:
  // - Read local changes from SQLite.
  // - Send them to a backend API.
  // - Apply remote changes back into SQLite.
  const now = new Date().toISOString();

  return {
    pushed: 0,
    pulled: 0,
    lastSync: now
  };
};
