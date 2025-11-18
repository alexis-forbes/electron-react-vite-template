import React, { useEffect, useState } from "react";

import type { DbDemoNote } from "../../../shared/types/dbDemo";

const DbDemo: React.FC = () => {
  const [notes, setNotes] = useState<DbDemoNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [syncInfo, setSyncInfo] = useState<string | null>(null);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const result = await window.api.dbDemo.getNotes();
      setNotes(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  const handleAdd = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const note = await window.api.dbDemo.addNote(text.trim());
      setNotes((prev) => [...prev, note]);
      setText("");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await window.api.dbDemo.sync();
      setSyncInfo(
        `Last sync at ${result.lastSync} (pushed ${result.pushed}, pulled ${result.pulled})`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="h5 mb-3">Offline notes demo (local SQLite via sql.js)</h2>
      <p className="text-muted mb-2">
        Notes are stored locally in a SQLite file using sql.js. The Sync button
        calls a fake online sync endpoint to illustrate the pattern.
      </p>

      <div className="d-flex gap-2 mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Add a note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={loading || !text.trim()}
        >
          Add
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleSync}
          disabled={loading}
        >
          Sync
        </button>
      </div>

      {syncInfo && <div className="alert alert-info py-2">{syncInfo}</div>}

      {loading && <div className="text-muted">Loading...</div>}

      <ul className="list-group mt-2">
        {notes.map((note) => (
          <li key={note.id} className="list-group-item d-flex flex-column">
            <span>{note.text}</span>
            <small className="text-muted">{note.createdAt}</small>
          </li>
        ))}
        {notes.length === 0 && !loading && (
          <li className="list-group-item text-muted">No notes yet.</li>
        )}
      </ul>
    </div>
  );
};

export default DbDemo;
