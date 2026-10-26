import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import ThemeProvider from "./theme/ThemeContext.jsx";
import DeploymentGate from './components/DeploymentGate';
import "./index.css";
import { rememberInvitation } from "./context/invitationMemory";

// Remove the invitation proof before AuthProvider starts any requests or React renders assets.
if (window.location.pathname === "/accept-institution-invitation") {
  const token = new URLSearchParams(window.location.search).get("token");
  if (token) rememberInvitation(token);
  window.history.replaceState(null, "", window.location.pathname);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DeploymentGate>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
    </DeploymentGate>
  </React.StrictMode>
);
