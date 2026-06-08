# Cortex AI Architecture

## Overview
Cortex AI is structured as a decoupled application with a **Next.js frontend** and a **Python Flask backend**. This architecture allows the heavy algorithmic computations to be offloaded to the backend while keeping the user interface highly responsive.

## Frontend (Next.js 14)
- **App Router**: Organizes pages logically by lab (`/search`, `/constraints`, `/decisions`, `/uncertainty`).
- **State Management**: Uses React state and context to manage interactive graph states, board configurations, and algorithm execution playback.
- **Styling**: Tailwind CSS and Framer Motion provide an immersive and highly responsive visual experience.
- **TypeScript Fallbacks**: Implements core algorithms (`lib/algorithms`) to serve as a local offline fallback if the Python backend is unavailable, ensuring a seamless user experience.

## Backend (Python Flask)
- **RESTful API**: Exposes endpoints (`/api/search/execute`, `/api/csp/execute`, etc.) for complex computations.
- **Algorithm Implementations**: Deep implementations of search, constraint satisfaction, minimax, and Bayesian algorithms that are optimized and decoupled from the frontend.
- **Stateless Execution**: The backend receives full problem state (e.g., graph adjacency, start/goal nodes) in the request body, executes the algorithm, and returns the full execution trace and result.

## Communication Protocol
1. User configures the problem on the frontend.
2. Frontend dispatches a `POST` request with the configuration to the backend.
3. Backend computes the full trace and returns it.
4. Frontend animates the trace interactively.
5. *Fallback Mechanism*: If the backend `fetch` fails, the frontend automatically falls back to `lib/algorithms` and executes the algorithm locally in the browser.
