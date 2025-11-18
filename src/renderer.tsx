import React from "react";
import { createRoot } from "react-dom/client";

import App from "./renderer/app/App";

import "bootstrap/dist/css/bootstrap.min.css";
import "./renderer/styles/index.scss";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
