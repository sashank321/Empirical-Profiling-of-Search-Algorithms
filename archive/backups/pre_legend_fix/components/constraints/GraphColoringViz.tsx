import { motion } from 'framer-motion';

const GRAPH_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  WA: { x: 80, y: 160 },
  NT: { x: 200, y: 60 },
  SA: { x: 220, y: 200 },
  Q: { x: 350, y: 80 },
  NSW: { x: 370, y: 200 },
  V: { x: 310, y: 300 },
  T: { x: 340, y: 380 },
};

const ACCENT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

interface GraphColoringVizProps {
  assignments: Record<string, number | string>;
  edges: [string, string][];
  nodes: string[];
  mode: 'academic' | 'industry';
}

export default function GraphColoringViz({ assignments, edges, nodes, mode }: GraphColoringVizProps) {
  const isIndustry = mode === 'industry';
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {isIndustry && (
        <div className="text-center mb-6">
          <h4 className="text-sm font-medium text-white tracking-wider">Cell Tower Frequency Allocation</h4>
          <p className="text-xs text-text-tertiary">Assigning broadcast frequencies to regional towers. Adjacent regions must use different frequencies to avoid interference.</p>
        </div>
      )}
      
      <div className="relative flex items-center justify-center bg-surface-1/50 border border-subtle rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
        <svg viewBox="0 0 460 440" className="w-full max-w-[460px] max-h-[440px]">
          {edges.map(([a, b], i) => {
            const pa = GRAPH_NODE_POSITIONS[a];
            const pb = GRAPH_NODE_POSITIONS[b];
            if (!pa || !pb) return null;
            
            // Check if there is an actual conflict
            const colorA = a in assignments ? assignments[a] : -1;
            const colorB = b in assignments ? assignments[b] : -1;
            const isConflict = colorA !== -1 && colorB !== -1 && colorA === colorB;
            
            return (
              <line
                key={i}
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={isConflict ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.08)"}
                strokeWidth={isConflict ? 3 : 1.5}
                className="transition-colors duration-300"
              />
            );
          })}
          {nodes.map(node => {
            const pos = GRAPH_NODE_POSITIONS[node];
            if (!pos) return null;
            const colorIdx = node in assignments ? Number(assignments[node]) : -1;
            const fill = colorIdx >= 0 ? ACCENT_COLORS[colorIdx % ACCENT_COLORS.length] : '#1a1a1a';
            const textColor = colorIdx >= 0 ? '#fff' : '#a1a1aa';

            return (
              <g key={node}>
                {colorIdx >= 0 && (
                  <circle 
                    cx={pos.x} cy={pos.y} r={32} 
                    fill={fill} opacity={0.15} 
                    className="animate-pulse"
                  />
                )}
                <motion.circle
                  cx={pos.x} cy={pos.y} r={24}
                  fill={fill}
                  stroke={colorIdx >= 0 ? fill : "rgba(255,255,255,0.1)"} 
                  strokeWidth={2}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ filter: colorIdx >= 0 ? `drop-shadow(0 0 10px ${fill}40)` : 'none' }}
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={textColor} fontSize={12} fontFamily="Inter, sans-serif" fontWeight={600}>
                  {isIndustry ? `TWR-${node}` : node}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex gap-6 text-xs font-medium tracking-wide mt-8">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <span className="w-3 h-3 rounded-full bg-surface-3 border border-subtle"></span>
          <span>{isIndustry ? 'Unassigned Tower' : 'Unassigned Node'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-accent-red">
          <span className="w-6 h-1 rounded bg-accent-red"></span>
          <span>{isIndustry ? 'Interference Conflict' : 'Color Conflict'}</span>
        </div>
      </div>
    </div>
  );
}
