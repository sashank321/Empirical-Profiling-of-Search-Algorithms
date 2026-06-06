import { motion } from 'framer-motion';

interface NQueensBoardProps {
  n: number;
  assignments: Record<string, number | string>;
  conflicts: Set<string>;
  mode: 'academic' | 'industry';
}

export default function NQueensBoard({ n, assignments, conflicts, mode }: NQueensBoardProps) {
  const cellSize = Math.max(28, Math.min(48, 400 / n));

  const isIndustry = mode === 'industry';
  const itemIcon = isIndustry ? '🚁' : '♛';
  const conflictColor = 'border-accent-red';
  const normalColor = isIndustry ? 'text-accent-green' : 'text-accent-blue';
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6">
      {isIndustry && (
        <div className="text-center mb-2">
          <h4 className="text-sm font-medium text-white tracking-wider">Drone Sector Mapping</h4>
          <p className="text-xs text-text-tertiary">Assigning autonomous delivery drones to grid sectors without overlapping flight paths.</p>
        </div>
      )}
      
      <div
        className="inline-grid border border-subtle rounded-xl overflow-hidden shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${n}, ${cellSize}px)`, gridTemplateRows: `repeat(${n}, ${cellSize}px)` }}
      >
        {Array.from({ length: n * n }, (_, idx) => {
          const row = Math.floor(idx / n);
          const col = idx % n;
          const varName = `Q${col}`;
          const isItemHere = varName in assignments && Number(assignments[varName]) === row;
          const isConflict = isItemHere && conflicts.has(varName);
          const isDark = (row + col) % 2 === 1;

          return (
            <motion.div
              key={idx}
              className={`flex items-center justify-center transition-colors duration-200 ${
                isDark ? 'bg-surface-2' : 'bg-surface-1'
              } ${isConflict ? `border-2 ${conflictColor} bg-accent-red/10` : ''}`}
              style={{ width: cellSize, height: cellSize }}
            >
              {isItemHere && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`select-none ${isConflict ? 'text-accent-red drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : `${normalColor} drop-shadow-[0_0_8px_currentColor]`}`}
                  style={{ fontSize: Math.max(16, cellSize * 0.55) }}
                >
                  {itemIcon}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 text-xs font-medium tracking-wide">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <span className={`w-3 h-3 rounded-full bg-accent-blue opacity-50`}></span>
          <span>{isIndustry ? 'Deployed Drone' : 'Placed Queen'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-accent-red">
          <span className={`w-3 h-3 rounded-full bg-accent-red`}></span>
          <span>{isIndustry ? 'Flight Path Collision' : 'Attack Conflict'}</span>
        </div>
      </div>
    </div>
  );
}
