import { CSPStep, CSPResult } from '@/lib/types';

/* ── Types ── */

export interface CSPSetup {
  variables: string[];
  domains: Record<string, number[]>;
  isConsistent: (assignments: Record<string, number>) => { satisfied: boolean; violated?: string };
}

export interface CSPOptions {
  useForwardChecking?: boolean;
  useMRV?: boolean;
  useLCV?: boolean;
  useAC3?: boolean;
}

/* ── AC-3 Arc Consistency ── */

function ac3(
  variables: string[],
  domains: Record<string, number[]>,
  isConsistent: (assignments: Record<string, number>) => { satisfied: boolean; violated?: string },
  steps: CSPStep[],
  stepCounter: { value: number },
  currentAssignments: Record<string, number>
): boolean {
  const queue: [string, string][] = [];
  for (const xi of variables) {
    for (const xj of variables) {
      if (xi !== xj) queue.push([xi, xj]);
    }
  }

  while (queue.length > 0) {
    const [xi, xj] = queue.shift()!;
    if (revise(xi, xj, domains, isConsistent, steps, stepCounter, currentAssignments)) {
      if (domains[xi].length === 0) return false;
      for (const xk of variables) {
        if (xk !== xi && xk !== xj) {
          queue.push([xk, xi]);
        }
      }
    }
  }
  return true;
}

function revise(
  xi: string,
  xj: string,
  domains: Record<string, number[]>,
  isConsistent: (assignments: Record<string, number>) => { satisfied: boolean; violated?: string },
  steps: CSPStep[],
  stepCounter: { value: number },
  currentAssignments: Record<string, number>
): boolean {
  let revised = false;
  const toRemove: number[] = [];

  for (const vi of domains[xi]) {
    let hasSupport = false;
    for (const vj of domains[xj]) {
      const testAssign = { ...currentAssignments, [xi]: vi, [xj]: vj };
      const result = isConsistent(testAssign);
      if (result.satisfied) {
        hasSupport = true;
        break;
      }
    }
    if (!hasSupport) {
      toRemove.push(vi);
      revised = true;
    }
  }

  for (const v of toRemove) {
    domains[xi] = domains[xi].filter(d => d !== v);
    steps.push({
      step: stepCounter.value++,
      variable: xi,
      value: v,
      action: 'prune',
      reason: `AC-3: No support for ${xi}=${v} against ${xj}`,
      domains: deepCloneDomains(domains),
      assignments: { ...currentAssignments },
    });
  }

  return revised;
}

/* ── Helpers ── */

function deepCloneDomains(domains: Record<string, number[]>): Record<string, number[]> {
  const clone: Record<string, number[]> = {};
  for (const key of Object.keys(domains)) {
    clone[key] = [...domains[key]];
  }
  return clone;
}

function selectVariable(
  unassigned: string[],
  domains: Record<string, number[]>,
  useMRV: boolean
): string {
  if (!useMRV) return unassigned[0];
  let best = unassigned[0];
  let bestSize = domains[best].length;
  for (let i = 1; i < unassigned.length; i++) {
    const v = unassigned[i];
    if (domains[v].length < bestSize) {
      best = v;
      bestSize = domains[v].length;
    }
  }
  return best;
}

function orderValues(
  variable: string,
  domains: Record<string, number[]>,
  variables: string[],
  assignments: Record<string, number>,
  isConsistent: (a: Record<string, number>) => { satisfied: boolean; violated?: string },
  useLCV: boolean
): number[] {
  const values = [...domains[variable]];
  if (!useLCV) return values;

  const unassigned = variables.filter(v => !(v in assignments) && v !== variable);

  const scored = values.map(val => {
    let ruledOut = 0;
    for (const other of unassigned) {
      for (const otherVal of domains[other]) {
        const testAssign = { ...assignments, [variable]: val, [other]: otherVal };
        const result = isConsistent(testAssign);
        if (!result.satisfied) ruledOut++;
      }
    }
    return { val, ruledOut };
  });

  scored.sort((a, b) => a.ruledOut - b.ruledOut);
  return scored.map(s => s.val);
}

function forwardCheck(
  variable: string,
  value: number,
  variables: string[],
  domains: Record<string, number[]>,
  assignments: Record<string, number>,
  isConsistent: (a: Record<string, number>) => { satisfied: boolean; violated?: string },
  steps: CSPStep[],
  stepCounter: { value: number }
): Record<string, number[]> | null {
  const newDomains = deepCloneDomains(domains);
  const unassigned = variables.filter(v => !(v in assignments) && v !== variable);

  for (const other of unassigned) {
    const pruned: number[] = [];
    for (const otherVal of newDomains[other]) {
      const testAssign = { ...assignments, [variable]: value, [other]: otherVal };
      const result = isConsistent(testAssign);
      if (!result.satisfied) {
        pruned.push(otherVal);
      }
    }

    for (const p of pruned) {
      newDomains[other] = newDomains[other].filter(d => d !== p);
      steps.push({
        step: stepCounter.value++,
        variable: other,
        value: p,
        action: 'prune',
        reason: `Forward check: ${variable}=${value} eliminates ${other}=${p}`,
        domains: deepCloneDomains(newDomains),
        assignments: { ...assignments, [variable]: value },
      });
    }

    if (newDomains[other].length === 0) {
      return null;
    }
  }

  return newDomains;
}

/* ── Main Solver ── */

export function solveCSP(
  variables: string[],
  domains: Record<string, number[]>,
  isConsistent: (assignments: Record<string, number>) => { satisfied: boolean; violated?: string },
  options: CSPOptions = {}
): CSPResult {
  const { useForwardChecking = false, useMRV = false, useLCV = false, useAC3 = false } = options;
  const startTime = performance.now();
  const steps: CSPStep[] = [];
  const metrics = { backtracks: 0, nodesExplored: 0, constraintChecks: 0, executionMs: 0 };
  const stepCounter = { value: 0 };

  let workingDomains = deepCloneDomains(domains);

  if (useAC3) {
    const consistent = ac3(variables, workingDomains, isConsistent, steps, stepCounter, {});
    if (!consistent) {
      metrics.executionMs = performance.now() - startTime;
      return {
        algorithm: buildAlgorithmName(options),
        solution: null,
        steps,
        metrics,
      };
    }
  }

  const wrappedConsistent = (a: Record<string, number>) => {
    metrics.constraintChecks++;
    return isConsistent(a);
  };

  function backtrack(
    assignments: Record<string, number>,
    currentDomains: Record<string, number[]>
  ): Record<string, number> | null {
    if (Object.keys(assignments).length === variables.length) {
      return { ...assignments };
    }

    const unassigned = variables.filter(v => !(v in assignments));
    const variable = selectVariable(unassigned, currentDomains, useMRV);
    const orderedValues = orderValues(variable, currentDomains, variables, assignments, wrappedConsistent, useLCV);

    for (const value of orderedValues) {
      metrics.nodesExplored++;
      const testAssign = { ...assignments, [variable]: value };
      const result = wrappedConsistent(testAssign);

      if (result.satisfied) {
        steps.push({
          step: stepCounter.value++,
          variable,
          value,
          action: 'assign',
          reason: `Assign ${variable}=${value} — consistent`,
          domains: deepCloneDomains(currentDomains),
          assignments: { ...testAssign },
        });

        let nextDomains = currentDomains;

        if (useForwardChecking) {
          const fc = forwardCheck(variable, value, variables, currentDomains, assignments, wrappedConsistent, steps, stepCounter);
          if (fc === null) {
            steps.push({
              step: stepCounter.value++,
              variable,
              value,
              action: 'backtrack',
              reason: `Forward checking detected empty domain after ${variable}=${value}`,
              domains: deepCloneDomains(currentDomains),
              assignments: { ...assignments },
            });
            metrics.backtracks++;
            continue;
          }
          nextDomains = fc;
        }

        const solution = backtrack(testAssign, nextDomains);
        if (solution) return solution;
      }

      steps.push({
        step: stepCounter.value++,
        variable,
        value,
        action: 'backtrack',
        reason: result.violated
          ? `${variable}=${value} violates: ${result.violated}`
          : `No solution with ${variable}=${value}`,
        domains: deepCloneDomains(currentDomains),
        assignments: { ...assignments },
      });
      metrics.backtracks++;
    }

    return null;
  }

  const solution = backtrack({}, workingDomains);
  metrics.executionMs = performance.now() - startTime;

  return {
    algorithm: buildAlgorithmName(options),
    solution,
    steps,
    metrics,
  };
}

function buildAlgorithmName(options: CSPOptions): string {
  const parts = ['Backtracking'];
  if (options.useForwardChecking) parts.push('+ FC');
  if (options.useMRV) parts.push('+ MRV');
  if (options.useLCV) parts.push('+ LCV');
  if (options.useAC3) parts.push('+ AC-3');
  return parts.join(' ');
}

/* ═══════════════════════════════════════════
   Problem Generators
   ═══════════════════════════════════════════ */

/* ── N-Queens ── */

export function createNQueens(n: number): CSPSetup {
  const variables: string[] = [];
  const domains: Record<string, number[]> = {};

  for (let col = 0; col < n; col++) {
    const v = `Q${col}`;
    variables.push(v);
    domains[v] = Array.from({ length: n }, (_, i) => i);
  }

  const isConsistent = (assignments: Record<string, number>): { satisfied: boolean; violated?: string } => {
    const assigned = Object.entries(assignments);
    for (let i = 0; i < assigned.length; i++) {
      const [v1, r1] = assigned[i];
      const c1 = parseInt(v1.slice(1));
      for (let j = i + 1; j < assigned.length; j++) {
        const [v2, r2] = assigned[j];
        const c2 = parseInt(v2.slice(1));

        if (r1 === r2) {
          return { satisfied: false, violated: `${v1} and ${v2} share row ${r1}` };
        }
        if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
          return { satisfied: false, violated: `${v1} and ${v2} share diagonal` };
        }
      }
    }
    return { satisfied: true };
  };

  return { variables, domains, isConsistent };
}

/* ── Graph Coloring ── */

export function createGraphColoring(
  nodes: string[],
  edges: [string, string][],
  nColors: number
): CSPSetup {
  const variables = [...nodes];
  const domains: Record<string, number[]> = {};
  for (const node of nodes) {
    domains[node] = Array.from({ length: nColors }, (_, i) => i);
  }

  const isConsistent = (assignments: Record<string, number>): { satisfied: boolean; violated?: string } => {
    for (const [a, b] of edges) {
      if (a in assignments && b in assignments && assignments[a] === assignments[b]) {
        return {
          satisfied: false,
          violated: `${a} and ${b} share color ${assignments[a]}`,
        };
      }
    }
    return { satisfied: true };
  };

  return { variables, domains, isConsistent };
}

/* ── Timetabling ── */

export function createTimetable(): CSPSetup {
  const courses = ['CS101', 'CS201', 'MATH101', 'PHYS101', 'ENG101'];
  const rooms = ['R1', 'R2', 'R3'];
  const timeslots = ['Mon9', 'Mon11', 'Tue9', 'Tue11', 'Wed9'];

  const conflicts: [string, string][] = [
    ['CS101', 'MATH101'],
    ['CS101', 'CS201'],
    ['MATH101', 'PHYS101'],
    ['PHYS101', 'ENG101'],
  ];

  const variables = [...courses];
  const domains: Record<string, number[]> = {};

  const slotOptions: number[] = [];
  for (let r = 0; r < rooms.length; r++) {
    for (let t = 0; t < timeslots.length; t++) {
      slotOptions.push(r * timeslots.length + t);
    }
  }

  for (const course of courses) {
    domains[course] = [...slotOptions];
  }

  const isConsistent = (assignments: Record<string, number>): { satisfied: boolean; violated?: string } => {
    const assigned = Object.entries(assignments);

    for (let i = 0; i < assigned.length; i++) {
      for (let j = i + 1; j < assigned.length; j++) {
        const [c1, slot1] = assigned[i];
        const [c2, slot2] = assigned[j];

        if (slot1 === slot2) {
          return {
            satisfied: false,
            violated: `${c1} and ${c2} assigned same room+timeslot`,
          };
        }

        const t1 = slot1 % timeslots.length;
        const t2 = slot2 % timeslots.length;

        for (const [ca, cb] of conflicts) {
          if ((c1 === ca && c2 === cb) || (c1 === cb && c2 === ca)) {
            if (t1 === t2) {
              return {
                satisfied: false,
                violated: `${c1} and ${c2} conflict — same timeslot ${timeslots[t1]}`,
              };
            }
          }
        }
      }
    }

    return { satisfied: true };
  };

  return { variables, domains, isConsistent };
}

/* ── Timetable decode helpers ── */

export const TIMETABLE_ROOMS = ['R1', 'R2', 'R3'];
export const TIMETABLE_TIMESLOTS = ['Mon9', 'Mon11', 'Tue9', 'Tue11', 'Wed9'];
export const TIMETABLE_CONFLICTS: [string, string][] = [
  ['CS101', 'MATH101'],
  ['CS101', 'CS201'],
  ['MATH101', 'PHYS101'],
  ['PHYS101', 'ENG101'],
];

export function decodeTimetableSlot(slot: number): { room: string; timeslot: string } {
  const timeslotCount = TIMETABLE_TIMESLOTS.length;
  const roomIdx = Math.floor(slot / timeslotCount);
  const timeIdx = slot % timeslotCount;
  return { room: TIMETABLE_ROOMS[roomIdx], timeslot: TIMETABLE_TIMESLOTS[timeIdx] };
}

/* ── Graph Coloring Defaults ── */

export const DEFAULT_GRAPH_NODES = ['WA', 'NT', 'SA', 'Q', 'NSW', 'V', 'T'];
export const DEFAULT_GRAPH_EDGES: [string, string][] = [
  ['WA', 'NT'], ['WA', 'SA'], ['NT', 'SA'], ['NT', 'Q'],
  ['SA', 'Q'], ['SA', 'NSW'], ['SA', 'V'], ['Q', 'NSW'], ['NSW', 'V'],
];
