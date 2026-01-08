import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/wallet-widget/AuthContext";

// Initialize app
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
