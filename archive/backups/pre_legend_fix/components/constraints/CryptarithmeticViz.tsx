import { motion, AnimatePresence } from 'framer-motion';

interface CryptarithmeticVizProps {
  assignments: Record<string, number | string>;
  mode: 'academic' | 'industry';
  word1: string;
  word2: string;
  resultWord: string;
}

export default function CryptarithmeticViz({ assignments, mode, word1, word2, resultWord }: CryptarithmeticVizProps) {
  const isIndustry = mode === 'industry';
  
  // Create an array of letters for rendering from right to left
  const maxLen = Math.max(word1.length, word2.length, resultWord.length);
  const w1Pad = word1.padStart(maxLen, ' ');
  const w2Pad = word2.padStart(maxLen, ' ');
  const resPad = resultWord.padStart(maxLen, ' ');
  
  // For each column from right to left, determine if there's a conflict
  // We can only check fully assigned columns
  let carry = 0;
  const columnStatus: ('valid' | 'conflict' | 'pending')[] = Array(maxLen).fill('pending');
  let conflictFound = false;

  for (let i = maxLen - 1; i >= 0; i--) {
    const c1 = w1Pad[i];
    const c2 = w2Pad[i];
    const c3 = resPad[i];
    
    const isC1Assigned = c1 === ' ' || c1 in assignments;
    const isC2Assigned = c2 === ' ' || c2 in assignments;
    const isC3Assigned = c3 === ' ' || c3 in assignments;
    
    if (isC1Assigned && isC2Assigned && isC3Assigned && !conflictFound) {
      const v1 = c1 === ' ' ? 0 : Number(assignments[c1]);
      const v2 = c2 === ' ' ? 0 : Number(assignments[c2]);
      const v3 = c3 === ' ' ? 0 : Number(assignments[c3]);
      
      const sum = v1 + v2 + carry;
      if (sum % 10 !== v3) {
        columnStatus[i] = 'conflict';
        conflictFound = true;
      } else {
        columnStatus[i] = 'valid';
        carry = Math.floor(sum / 10);
      }
    } else if (conflictFound) {
      columnStatus[i] = 'conflict';
    }
  }

  // Final carry check
  if (Object.keys(assignments).length === new Set((word1 + word2 + resultWord).split('')).size && carry !== 0) {
     conflictFound = true;
     // Mark left-most column as conflict
     columnStatus[0] = 'conflict';
  }

  // Check alldiff
  const values = Object.values(assignments);
  const isAllDiffConflict = new Set(values).size !== values.length;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8">
      {isIndustry ? (
        <div className="text-center mb-2">
          <h4 className="text-sm font-medium text-white tracking-wider">Resource Allocation Reconciliation</h4>
          <p className="text-xs text-text-tertiary">Cryptographic mapping of encrypted budget lines. Each character represents a unique integer.</p>
        </div>
      ) : (
        <div className="text-center mb-2">
          <h4 className="text-sm font-medium text-white tracking-wider">Cryptarithmetic Puzzle</h4>
          <p className="text-xs text-text-tertiary">Assign unique digits (0-9) to letters such that the addition holds true.</p>
        </div>
      )}

      {/* Math Problem Grid */}
      <div className="flex gap-4">
         <div className="flex flex-col items-end gap-3 text-4xl font-mono tracking-[0.5em] font-medium p-8 bg-surface-1/50 border border-subtle rounded-3xl shadow-2xl backdrop-blur-sm relative">
           
           <div className="absolute left-6 top-24 text-text-tertiary">+</div>
           
           {/* Word 1 */}
           <div className="flex">
             {w1Pad.split('').map((char, i) => (
               <DigitBox key={`w1-${i}`} char={char} val={assignments[char]} status={columnStatus[i]} />
             ))}
           </div>
           
           {/* Word 2 */}
           <div className="flex">
             {w2Pad.split('').map((char, i) => (
               <DigitBox key={`w2-${i}`} char={char} val={assignments[char]} status={columnStatus[i]} />
             ))}
           </div>
           
           {/* Divider */}
           <div className="w-full h-1 bg-surface-3 rounded-full my-2 relative overflow-hidden">
             {conflictFound && <div className="absolute inset-0 bg-accent-red/50 shadow-[0_0_10px_red]"></div>}
           </div>
           
           {/* Result */}
           <div className="flex">
             {resPad.split('').map((char, i) => (
               <DigitBox key={`res-${i}`} char={char} val={assignments[char]} status={columnStatus[i]} />
             ))}
           </div>

         </div>
         
         {/* Live Mapping Legend */}
         <div className="flex flex-col gap-2 p-6 bg-surface-1/30 border border-subtle rounded-3xl min-w-[160px]">
           <h5 className="text-[10px] uppercase tracking-widest text-text-tertiary font-bold mb-2">Live Mapping</h5>
           <div className="grid grid-cols-2 gap-x-6 gap-y-2">
             {Array.from(new Set((word1 + word2 + resultWord).split(''))).sort().map(char => {
                const isAssigned = char in assignments;
                return (
                  <div key={char} className="flex items-center gap-2 text-sm font-mono">
                    <span className="text-text-secondary">{char}</span>
                    <span className="text-text-tertiary">=</span>
                    {isAssigned ? (
                      <motion.span 
                        initial={{ scale: 0.5, color: '#fff' }}
                        animate={{ scale: 1, color: isAllDiffConflict ? '#ef4444' : '#3b82f6' }}
                        className="font-bold drop-shadow-[0_0_8px_currentColor]"
                      >
                        {assignments[char]}
                      </motion.span>
                    ) : (
                      <span className="text-text-muted">?</span>
                    )}
                  </div>
                )
             })}
           </div>
           
           {isAllDiffConflict && (
              <div className="mt-4 text-[10px] text-accent-red bg-accent-red/10 border border-accent-red/20 rounded p-2 text-center uppercase tracking-wider font-bold">
                Alldiff Violation
              </div>
           )}
         </div>
      </div>
    </div>
  );
}

function DigitBox({ char, val, status }: { char: string, val: string | number | undefined, status: 'valid' | 'conflict' | 'pending' }) {
  if (char === ' ') return <div className="w-[1.5em] h-[1.5em]"></div>;
  
  const isAssigned = val !== undefined;
  
  let colorClass = 'text-white border-surface-3';
  if (isAssigned) {
    if (status === 'conflict') colorClass = 'text-accent-red border-accent-red/50 bg-accent-red/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    else if (status === 'valid') colorClass = 'text-accent-blue border-accent-blue/30 bg-accent-blue/5 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
    else colorClass = 'text-white border-subtle bg-surface-2';
  }

  return (
    <div className={`relative flex items-center justify-center w-[1.5em] h-[1.5em] mx-1 border-2 rounded-xl transition-all duration-300 ${colorClass}`}>
       <span className="absolute -top-6 text-[10px] text-text-tertiary tracking-normal">{char}</span>
       <AnimatePresence mode="wait">
         {isAssigned ? (
           <motion.span
             key={val}
             initial={{ opacity: 0, y: 10, scale: 0.8 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -10, scale: 0.8 }}
             className="absolute"
           >
             {val}
           </motion.span>
         ) : (
           <span className="text-surface-3 absolute">_</span>
         )}
       </AnimatePresence>
    </div>
  );
}
