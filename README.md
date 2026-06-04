# CORTEX AI

**Interactive Search & Reasoning Intelligence Platform**

> Visualizing how intelligent systems search, reason, decide, and handle constraints.

## Architecture

CORTEX AI is built with a modern, decoupled architecture:
- **Frontend**: A highly interactive, responsive Next.js application using React and Tailwind CSS.
- **Backend**: A robust Python API powered by Flask that serves complex algorithmic computations (e.g., search, constraints, uncertainty).
- **Communication**: The Next.js frontend communicates with the Python backend via RESTful APIs to offload heavy computations, ensuring a smooth and responsive user interface.

```text
app/                    # Next.js App Router pages
  search/               # Search Intelligence Lab
  constraints/          # Constraint Intelligence Lab
  decisions/            # Decision Intelligence Lab
  uncertainty/          # Uncertainty Intelligence Lab
backend/                # Python Flask Backend
  algorithms/           # Core algorithmic implementations
  api/                  # RESTful API routes
components/             # Reusable UI and shared components
lib/                    # Shared TypeScript definitions and utilities
```

## Features

| Module | Coverage | Algorithms & Features |
|--------|----------|------------|
| **Search Intelligence Lab** | CO2 | BFS, DFS, UCS, GBFS, A*, Dijkstra, IDDFS, IDA*. Compare mode, Explainable AI panels. |
| **Constraint Intelligence Lab** | CO3 | Backtracking, Forward Checking, MRV, LCV, Arc Consistency. CSP visualizations. |
| **Decision Intelligence Lab** | CO4 | Minimax, Alpha-Beta Pruning. |
| **Uncertainty Intelligence Lab** | CO5 | Bayes Rule, Bayesian Networks, Sensor Fusion. |

## Tech Stack

- **Frontend Framework:** Next.js 14 (App Router)
- **Backend Framework:** Python Flask
- **Language:** TypeScript (Frontend) / Python (Backend)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Deployment:** Vercel (Frontend)

## Screenshots

*(Placeholders for application screenshots - to be added upon final UI polish)*
- `docs/search-lab.png` - Visualizing A* Search.
- `docs/csp-lab.png` - Constraint satisfaction visualization.

## Getting Started & Deployment Instructions

### Local Development

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```
2. **Setup Python Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```
3. **Run Frontend Development Server:**
   Open a new terminal and run:
   ```bash
   npm run dev
   ```

### Production Deployment (Vercel)

1. Ensure you have the Vercel CLI installed (`npm i -g vercel`).
2. Run the deployment command:
   ```bash
   vercel --prod
   ```
3. Follow the CLI prompts to link your repository and deploy. Ensure that environment variables (if any) pointing to the production Python backend are correctly configured in your Vercel project settings.

## License

MIT
