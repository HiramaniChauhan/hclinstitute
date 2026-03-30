import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global Fetch Interceptor for Single-Device Login Security
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    // If we receive a 401, check if the session mathematically expired
    if (response.status === 401) {
        const clone = response.clone();
        try {
            const body = await clone.json();
            if (body.error === "SESSION_EXPIRED") {
                window.sessionStorage.removeItem("token");
                window.sessionStorage.removeItem("user");

                // Only redirect if we are not already going to the home page expired loop
                if (!window.location.search.includes("session_expired=true")) {
                    window.location.href = "/?session_expired=true";
                }
            }
        } catch (e) {
            // response was not JSON or clone failed, securely ignore
        }
    }

    return response;
};

createRoot(document.getElementById("root")!).render(<App />);
