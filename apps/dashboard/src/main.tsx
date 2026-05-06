import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div className="p-6 text-lg">
      Convorchestrate Dashboard (scaffold)
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
