import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
);

const splash = document.getElementById("splash");
if (splash) {
  splash.classList.add("fade-out");
  setTimeout(() => splash.remove(), 700);
}
