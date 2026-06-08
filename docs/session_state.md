# Session State Management

Cortex AI leverages an ephemeral, localized state management strategy tailored to the interactive nature of the educational labs.

## 1. Frontend State (React / Next.js)
Each lab manages its own interactive state locally within its React component (e.g., `app/search/page.tsx`).
- **Graph/Board Configuration**: The layout of nodes, edges, or game board states are maintained in local state (`useState`).
- **Animation Playback**: Execution traces returned from algorithms are stored in state, and `framer-motion` alongside `useEffect` timers animate through these steps sequentially.
- **Edit Modes**: Flags for edit modes, compare modes, and UI toggles are kept strictly local to prevent unnecessary re-renders across the app.

## 2. Backend State (Stateless Execution)
The Python Flask backend is entirely **stateless**. 
- It does not maintain user sessions or persist graph configurations.
- Every API request (`POST`) contains the complete problem configuration required for the algorithm to execute from scratch.
- **Benefit**: This guarantees idempotency, easy scalability, and prevents synchronization bugs between the client and the server.

## 3. Persistent Storage
Currently, Cortex AI does not use a persistent database (e.g., PostgreSQL or MongoDB). All configurations (e.g., custom graphs, CSP definitions) are volatile and reset upon a hard page reload, though default datasets (`lib/graphs.ts`) are provided for immediate usability.
