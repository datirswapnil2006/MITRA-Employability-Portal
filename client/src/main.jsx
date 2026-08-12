import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import "./index.css";

// The bfcache (back/forward cache) can restore a page by resuming its exact
// frozen JS state rather than remounting it — meaning ProtectedRoute's
// session-check effect would never re-run on browser back/forward. Forcing
// a reload here guarantees every back/forward navigation re-verifies the
// session from scratch instead of showing a stale, unverified snapshot.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
