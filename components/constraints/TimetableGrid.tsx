import { motion } from 'framer-motion';

const TIMETABLE_TIMESLOTS = ['Mon 9AM', 'Mon 11AM', 'Tue 9AM', 'Tue 11AM', 'Wed 9AM'];
const TIMETABLE_ROOMS = ['Room A', 'Room B', 'Room C'];
const TIMETABLE_CONFLICTS: [string, string][] = [
  ['CS101', 'MATH101'], // Corequisites
  ['PHYS101', 'ENG101'],
];

export function decodeTimetableSlot(slot: number) {
  const roomIdx = Math.floor(slot / TIMETABLE_TIMESLOTS.length);
  const timeIdx = slot % TIMETABLE_TIMESLOTS.length;
  return {
    room: TIMETABLE_ROOMS[roomIdx % TIMETABLE_ROOMS.length],
    timeslot: TIMETABLE_TIMESLOTS[timeIdx],
  };
}

interface TimetableGridProps {
  assignments: Record<string, number | string>;
  courses: string[];
  mode: 'academic' | 'industry';
}

export default function TimetableGrid({ assignments, courses, mode }: TimetableGridProps) {
  const conflictCells = new Set<string>();
  const isIndustry = mode === 'industry';
  
  // Transform labels based on mode
  const colLabels = isIndustry 
    ? ['Gate 101', 'Gate 102', 'Gate 103', 'Gate 201', 'Gate 202'] // Using timeslots as 'Gates' for UI layout mapping
    : TIMETABLE_TIMESLOTS;
    
  const rowLabels = isIndustry
    ? ['Flight AA10', 'Flight UA42', 'Flight DL15', 'Flight SW08', 'Flight BZ22']
    : courses;

  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const c1 = courses[i];
      const c2 = courses[j];
      if (!(c1 in assignments) || !(c2 in assignments)) continue;
      const s1 = Number(assignments[c1]);
      const s2 = Number(assignments[c2]);
      
      // Same room, same time
      if (s1 === s2) {
        conflictCells.add(`${c1}-${s1}`);
        conflictCells.add(`${c2}-${s2}`);
      }
      
      // Known conflict logic
      const t1 = s1 % TIMETABLE_TIMESLOTS.length;
      const t2 = s2 % TIMETABLE_TIMESLOTS.length;
      for (const [ca, cb] of TIMETABLE_CONFLICTS) {
        if ((c1 === ca && c2 === cb) || (c1 === cb && c2 === ca)) {
          if (t1 === t2) {
            conflictCells.add(`${c1}-${s1}`);
            conflictCells.add(`${c2}-${s2}`);
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      {isIndustry && (
        <div className="text-center mb-2">
          <h4 className="text-sm font-medium text-white tracking-wider">Airport Gate Scheduling</h4>
          <p className="text-xs text-text-tertiary">Assigning incoming flights to terminals. Connecting flights cannot overlap in time.</p>
        </div>
      )}
      
      <div className="inline-block rounded-2xl overflow-hidden border border-subtle shadow-2xl bg-surface-1/50 backdrop-blur-md">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-[11px] text-text-tertiary uppercase tracking-wider border-b border-r border-subtle bg-surface-1">
                {isIndustry ? 'Flight' : 'Course'} \ {isIndustry ? 'Gate Assignment' : 'Time'}
              </th>
              {colLabels.map(ts => (
                <th key={ts} className="p-3 text-[11px] text-white uppercase tracking-wider border-b border-subtle bg-surface-1 font-medium">
                  {ts}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((course, idx) => (
              <tr key={course}>
                <td className="p-3 text-xs font-mono text-white border-r border-b border-subtle bg-surface-1 font-medium whitespace-nowrap">
                  {rowLabels[idx]}
                </td>
                {TIMETABLE_TIMESLOTS.map((_, tIdx) => {
                  const cellContent: { room: string; slot: number }[] = [];
                  if (course in assignments) {
                    const slot = Number(assignments[course]);
                    const { room, timeslot } = decodeTimetableSlot(slot);
                    if (TIMETABLE_TIMESLOTS[tIdx] === timeslot) {
                      cellContent.push({ room, slot });
                    }
                  }
                  const hasContent = cellContent.length > 0;
                  const hasConflict = hasContent && conflictCells.has(`${course}-${cellContent[0].slot}`);

                  // Transform room label if industry mode
                  const displayContent = hasContent 
                    ? (isIndustry ? cellContent[0].room.replace('Room', 'Terminal') : cellContent[0].room)
                    : '';

                  return (
                    <td
                      key={tIdx}
                      className={`p-3 text-center text-xs font-mono border-b border-l border-[rgba(255,255,255,0.02)] transition-all duration-300 min-w-[80px] ${
                        hasConflict
                          ? 'bg-accent-red/20 border-accent-red/50 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]'
                          : hasContent
                          ? 'bg-accent-blue/15 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]'
                          : 'bg-surface-0/50 hover:bg-surface-1/50'
                      }`}
                    >
                      {hasContent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={`font-semibold tracking-wide ${hasConflict ? 'text-accent-red drop-shadow-[0_0_4px_currentColor]' : 'text-accent-blue drop-shadow-[0_0_4px_currentColor]'}`}
                        >
                          {displayContent}
                        </motion.div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-6 text-xs font-medium tracking-wide mt-2">
        <div className="flex items-center gap-1.5 text-accent-blue">
          <span className="w-3 h-3 rounded bg-accent-blue/20 border border-accent-blue/50"></span>
          <span>Valid Assignment</span>
        </div>
        <div className="flex items-center gap-1.5 text-accent-red">
          <span className="w-3 h-3 rounded bg-accent-red/20 border border-accent-red/50"></span>
          <span>Scheduling Conflict</span>
        </div>
      </div>
    </div>
  );
}
