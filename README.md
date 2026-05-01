# CORTEX AI

**Interactive Search & Reasoning Intelligence Platform**

> Visualizing how intelligent systems search, reason, decide, and handle constraints.

## Modules

| Module | Coverage | Algorithms |
|--------|----------|------------|
| Search Intelligence Lab | CO2 | BFS, DFS, UCS, GBFS, A*, Dijkstra, IDDFS, IDA* |
| Constraint Intelligence Lab | CO3 | Backtracking, Forward Checking, MRV, LCV, Arc Consistency |
| Decision Intelligence Lab | CO4 | Minimax, Alpha-Beta Pruning |
| Uncertainty Intelligence Lab | CO5 | Bayes Rule, Bayesian Networks, Sensor Fusion |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

## Architecture

```
app/                    # Next.js App Router pages
  search/               # Search Intelligence Lab
  constraints/          # Constraint Intelligence Lab
  decisions/            # Decision Intelligence Lab
  uncertainty/          # Uncertainty Intelligence Lab
components/             # Reusable UI and shared components
lib/
  algorithms/           # Pure TypeScript algorithm implementations
  types.ts              # Shared type definitions
  graphs.ts             # Predefined graph datasets
```

## License

MIT
