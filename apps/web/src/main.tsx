import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles/app.css";

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info("Game Scanner Pro is ready for offline use.");
  },
  onRegisterError(error) {
    console.error("Service worker registration failed:", error);
  }
});

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
