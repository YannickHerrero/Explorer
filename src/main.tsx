import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/newsreader/600.css";
import "@fontsource/newsreader/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import App from "./App";
import "./styles/global.css";

// Show the Tauri window as soon as React is ready to paint
if ("__TAURI_INTERNALS__" in window) {
  import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
    getCurrentWindow().show();
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
