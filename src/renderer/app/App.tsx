import React from "react";

import { TcpMessages } from "../features/tcp/TcpMessages";
import { useCounterStore } from "../store/useCounterStore";

import "../styles/index.scss";

const App: React.FC = () => {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div className="container py-4">
      <h1 className="mb-3">💖 Hello World!</h1>
      <p className="mb-4">
        Welcome to your Electron + React + Zustand application.
      </p>
      <div className="d-flex align-items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={decrement}>
          -
        </button>
        <span className="fs-4">{count}</span>
        <button type="button" className="btn btn-primary" onClick={increment}>
          +
        </button>
      </div>

      <TcpMessages />
    </div>
  );
};

export default App;
