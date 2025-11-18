import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import initSqlJs, { Database, SqlJsStatic } from "sql.js";

import type { DbDemoNote } from "../../shared/types/dbDemo";

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DB_FILE_NAME = "demo-notes.sqlite";

const getDbFilePath = (): string => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, DB_FILE_NAME);
};

const loadOrCreateDatabase = async (): Promise<Database> => {
  if (db && SQL) return db;

  if (!SQL) {
    SQL = await initSqlJs({});
  }

  const filePath = getDbFilePath();

  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    db = new SQL.Database(new Uint8Array(fileBuffer));
  } else {
    db = new SQL.Database();
    db.run(
      "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, createdAt TEXT NOT NULL);"
    );
  }

  return db;
};

const persistDatabase = (database: Database): void => {
  const data = database.export();
  const buffer = Buffer.from(data);
  const filePath = getDbFilePath();
  fs.writeFileSync(filePath, buffer);
};

export const getAllNotes = async (): Promise<DbDemoNote[]> => {
  const database = await loadOrCreateDatabase();
  const stmt = database.prepare(
    "SELECT id, text, createdAt FROM notes ORDER BY id ASC;"
  );

  const notes: DbDemoNote[] = [];

  while (stmt.step()) {
    const [id, text, createdAt] = stmt.get();
    notes.push({
      id: Number(id),
      text: String(text),
      createdAt: String(createdAt)
    });
  }

  stmt.free();

  return notes;
};

export const addNote = async (text: string): Promise<DbDemoNote> => {
  const database = await loadOrCreateDatabase();
  const createdAt = new Date().toISOString();

  database.run("INSERT INTO notes (text, createdAt) VALUES (?, ?);", [
    text,
    createdAt
  ]);

  const stmt = database.prepare(
    "SELECT id, text, createdAt FROM notes ORDER BY id DESC LIMIT 1;"
  );

  let note: DbDemoNote | null = null;

  if (stmt.step()) {
    const [id, rowText, rowCreatedAt] = stmt.get();
    note = {
      id: Number(id),
      text: String(rowText),
      createdAt: String(rowCreatedAt)
    };
  }

  stmt.free();

  if (note) {
    persistDatabase(database);
    return note;
  }

  throw new Error("Failed to insert note");
};
