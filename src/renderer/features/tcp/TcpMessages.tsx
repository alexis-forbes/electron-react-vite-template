import React, { useEffect, useState } from "react";

import type { TcpMessage } from "../../../shared/types/tcp";

import "./tcp.scss";

export const TcpMessages: React.FC = () => {
  const [messages, setMessages] = useState<TcpMessage[]>([]);

  useEffect(() => {
    if (!globalThis.window?.api) {
      return;
    }

    const handler = (message: TcpMessage): void => {
      setMessages((prev) => [...prev, message]);
    };

    globalThis.window.api.onTcpMessage(handler);
  }, []);

  if (messages.length === 0) {
    return (
      <div className="tcp-demo-card">
        <h2 className="tcp-demo-title">TCP demo</h2>
        <p className="tcp-demo-subtitle">
          Waiting for TCP events from the Electron main process...
        </p>
      </div>
    );
  }

  return (
    <div className="tcp-demo-card">
      <h2 className="tcp-demo-title">TCP demo</h2>
      <p className="tcp-demo-subtitle">
        Messages received from the Electron TCP service:
      </p>
      <ul className="tcp-demo-list">
        {messages.map((message) => (
          <li key={message.id} className="tcp-demo-item">
            <div className="tcp-demo-item-header">
              <span className="tcp-demo-badge">{message.type}</span>
              <span className="tcp-demo-timestamp">{message.timestamp}</span>
            </div>
            <pre className="tcp-demo-payload">
              {JSON.stringify(message.payload, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
};
