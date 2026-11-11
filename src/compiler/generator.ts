/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GRAMMAR_RULES, NON_TERMINALS, TERMINALS, FOLLOW_SETS } from './grammar';
import { GrammarRule, TableAction } from './types';

export interface LR0Item {
  ruleIndex: number;
  dot: number;
}

export interface LR1Item {
  ruleIndex: number;
  dot: number;
  lookahead: string;
}

export interface GeneratedTable {
  mode: 'SLR1' | 'LR1';
  actionTable: Record<number, Record<string, TableAction>>;
  gotoTable: Record<number, Record<string, number>>;
  stateItems: Record<number, string[]>;
  stateCount: number;
}

/**
 * Computes FIRST sets for all grammar symbols.
 */
export function computeFirstSets(): Record<string, Set<string>> {
  const first: Record<string, Set<string>> = {};

  // Initialize terminals FIRST(a) = {a}
  for (const t of TERMINALS) {
    first[t] = new Set([t]);
  }
  for (const nt of NON_TERMINALS) {
    first[nt] = new Set();
  }
  first["E'"] = new Set();

  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of GRAMMAR_RULES) {
      const lhs = rule.lhs;
      const rhs = rule.rhs;
      if (rhs.length === 0) continue;

      const firstSymbol = rhs[0];
      const targetSet = first[firstSymbol] || new Set([firstSymbol]);
      for (const sym of targetSet) {
        if (!first[lhs].has(sym)) {
          first[lhs].add(sym);
          changed = true;
        }
      }
    }
  }

  return first;
}

const FIRST_SETS = computeFirstSets();

/**
 * Computes FIRST(beta a) for LR(1) lookahead propagation.
 */
export function computeFirstOfSequence(sequence: string[]): Set<string> {
  const result = new Set<string>();
  if (sequence.length === 0) return result;

  for (const sym of sequence) {
    const f = FIRST_SETS[sym] || new Set([sym]);
    for (const s of f) {
      result.add(s);
    }
    // None of our grammar rules are nullable (epsilon-free)
    break;
  }
  return result;
}

/**
 * Pretty prints an LR(0) or LR(1) item to educational text.
 */
function formatItemText(ruleIndex: number, dot: number, lookaheads?: string[]): string {
  const rule = GRAMMAR_RULES[ruleIndex];
  const rhsWithDot = [...rule.rhs];
  rhsWithDot.splice(dot, 0, '•');
  const base = `${rule.lhs} -> ${rhsWithDot.join(' ')}`;
  if (lookaheads && lookaheads.length > 0) {
    return `${base} , [ ${lookaheads.sort().join(' / ')} ]`;
  }
  return base;
}

/* =========================================================================
   CANONICAL LR(1) GENERATOR
   ========================================================================= */

function itemLR1Key(item: LR1Item): string {
  return `${item.ruleIndex}:${item.dot}:${item.lookahead}`;
}

function closureLR1(items: LR1Item[]): LR1Item[] {
  const itemMap = new Map<string, LR1Item>();
  const queue: LR1Item[] = [];

  for (const it of items) {
    const key = itemLR1Key(it);
    itemMap.set(key, it);
    queue.push(it);
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    const rule = GRAMMAR_RULES[item.ruleIndex];

    if (item.dot < rule.rhs.length) {
      const symbolAfterDot = rule.rhs[item.dot];
      // If symbolAfterDot is a non-terminal, expand productions
      if (NON_TERMINALS.includes(symbolAfterDot as any) || symbolAfterDot === "E'") {
        // beta is the sequence after symbolAfterDot
        const beta = rule.rhs.slice(item.dot + 1);
        const lookaheadsForNewItems = computeFirstOfSequence([...beta, item.lookahead]);

        for (let rIdx = 0; rIdx < GRAMMAR_RULES.length; rIdx++) {
          const r = GRAMMAR_RULES[rIdx];
          if (r.lhs === symbolAfterDot) {
            for (const la of lookaheadsForNewItems) {
              const newItem: LR1Item = { ruleIndex: rIdx, dot: 0, lookahead: la };
              const key = itemLR1Key(newItem);
              if (!itemMap.has(key)) {
                itemMap.set(key, newItem);
                queue.push(newItem);
              }
            }
          }
        }
      }
    }
  }

  return Array.from(itemMap.values());
}

function gotoLR1(items: LR1Item[], symbol: string): LR1Item[] {
  const moved: LR1Item[] = [];
  for (const item of items) {
    const rule = GRAMMAR_RULES[item.ruleIndex];
    if (item.dot < rule.rhs.length && rule.rhs[item.dot] === symbol) {
      moved.push({
        ruleIndex: item.ruleIndex,
        dot: item.dot + 1,
        lookahead: item.lookahead,
      });
    }
  }
  return closureLR1(moved);
}

function stateLR1Signature(items: LR1Item[]): string {
  return items
    .map(itemLR1Key)
    .sort()
    .join('|');
}

/**
 * Builds the complete Canonical LR(1) collection, ACTION and GOTO tables.
 */
export function generateLR1Table(): GeneratedTable {
  const initialItem: LR1Item = { ruleIndex: 0, dot: 0, lookahead: '$' };
  const initialClosure = closureLR1([initialItem]);

  const states: LR1Item[][] = [initialClosure];
  const stateSignatures = new Map<string, number>();
  stateSignatures.set(stateLR1Signature(initialClosure), 0);

  const actionTable: Record<number, Record<string, TableAction>> = {};
  const gotoTable: Record<number, Record<string, number>> = {};
  const stateItems: Record<number, string[]> = {};

  const allSymbols = [...TERMINALS, ...NON_TERMINALS];

  let stateIdx = 0;
  while (stateIdx < states.length) {
    const currentItems = states[stateIdx];
    actionTable[stateIdx] = {};
    gotoTable[stateIdx] = {};

    // Group items for display
    const itemGroup = new Map<string, string[]>();
    for (const it of currentItems) {
      const baseKey = `${it.ruleIndex}:${it.dot}`;
      if (!itemGroup.has(baseKey)) itemGroup.set(baseKey, []);
      itemGroup.get(baseKey)!.push(it.lookahead);
    }
    const formattedList: string[] = [];
    for (const [baseKey, las] of itemGroup.entries()) {
      const [rIdx, dot] = baseKey.split(':').map(Number);
      formattedList.push(formatItemText(rIdx, dot, las));
    }
    stateItems[stateIdx] = formattedList;

    // 1. Reductions & Acceptance
    for (const item of currentItems) {
      const rule = GRAMMAR_RULES[item.ruleIndex];
      if (item.dot === rule.rhs.length) {
        if (rule.id === 0) {
          // Augmented rule E' -> E . on $
          if (item.lookahead === '$') {
            actionTable[stateIdx]['$'] = { type: 'accept' };
          }
        } else {
          // Reduce on specific item lookahead
          actionTable[stateIdx][item.lookahead] = {
            type: 'reduce',
            ruleIndex: rule.id,
          };
        }
      }
    }

    // 2. Transitions (Shifts and GOTOs)
    for (const sym of allSymbols) {
      const nextItems = gotoLR1(currentItems, sym);
      if (nextItems.length === 0) continue;

      const sig = stateLR1Signature(nextItems);
      let targetState: number;

      if (stateSignatures.has(sig)) {
        targetState = stateSignatures.get(sig)!;
      } else {
        targetState = states.length;
        states.push(nextItems);
        stateSignatures.set(sig, targetState);
      }

      if (TERMINALS.includes(sym as any)) {
        actionTable[stateIdx][sym] = { type: 'shift', state: targetState };
      } else if (NON_TERMINALS.includes(sym as any)) {
        gotoTable[stateIdx][sym] = targetState;
      }
    }

    stateIdx++;
  }

  return {
    mode: 'LR1',
    actionTable,
    gotoTable,
    stateItems,
    stateCount: states.length,
  };
}

/* =========================================================================
   SLR(1) CANONICAL GENERATOR
   ========================================================================= */

function itemLR0Key(item: LR0Item): string {
  return `${item.ruleIndex}:${item.dot}`;
}

function closureLR0(items: LR0Item[]): LR0Item[] {
  const itemMap = new Map<string, LR0Item>();
  const queue: LR0Item[] = [];

  for (const it of items) {
    const key = itemLR0Key(it);
    itemMap.set(key, it);
    queue.push(it);
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    const rule = GRAMMAR_RULES[item.ruleIndex];

    if (item.dot < rule.rhs.length) {
      const symbolAfterDot = rule.rhs[item.dot];
      if (NON_TERMINALS.includes(symbolAfterDot as any) || symbolAfterDot === "E'") {
        for (let rIdx = 0; rIdx < GRAMMAR_RULES.length; rIdx++) {
          const r = GRAMMAR_RULES[rIdx];
          if (r.lhs === symbolAfterDot) {
            const newItem: LR0Item = { ruleIndex: rIdx, dot: 0 };
            const key = itemLR0Key(newItem);
            if (!itemMap.has(key)) {
              itemMap.set(key, newItem);
              queue.push(newItem);
            }
          }
        }
      }
    }
  }

  return Array.from(itemMap.values());
}

function gotoLR0(items: LR0Item[], symbol: string): LR0Item[] {
  const moved: LR0Item[] = [];
  for (const item of items) {
    const rule = GRAMMAR_RULES[item.ruleIndex];
    if (item.dot < rule.rhs.length && rule.rhs[item.dot] === symbol) {
      moved.push({ ruleIndex: item.ruleIndex, dot: item.dot + 1 });
    }
  }
  return closureLR0(moved);
}

function stateLR0Signature(items: LR0Item[]): string {
  return items
    .map(itemLR0Key)
    .sort()
    .join('|');
}

/**
 * Builds the canonical 12-state SLR(1) ACTION and GOTO tables using FOLLOW sets.
 */
export function generateSLR1Table(): GeneratedTable {
  const initialItem: LR0Item = { ruleIndex: 0, dot: 0 };
  const initialClosure = closureLR0([initialItem]);

  const states: LR0Item[][] = [initialClosure];
  const stateSignatures = new Map<string, number>();
  stateSignatures.set(stateLR0Signature(initialClosure), 0);

  const actionTable: Record<number, Record<string, TableAction>> = {};
  const gotoTable: Record<number, Record<string, number>> = {};
  const stateItems: Record<number, string[]> = {};

  const allSymbols = [...TERMINALS, ...NON_TERMINALS];

  let stateIdx = 0;
  while (stateIdx < states.length) {
    const currentItems = states[stateIdx];
    actionTable[stateIdx] = {};
    gotoTable[stateIdx] = {};

    stateItems[stateIdx] = currentItems.map((it) =>
      formatItemText(it.ruleIndex, it.dot),
    );

    // 1. Reductions & Acceptance based on FOLLOW(lhs)
    for (const item of currentItems) {
      const rule = GRAMMAR_RULES[item.ruleIndex];
      if (item.dot === rule.rhs.length) {
        if (rule.id === 0) {
          actionTable[stateIdx]['$'] = { type: 'accept' };
        } else {
          const follow = FOLLOW_SETS[rule.lhs] || [];
          for (const la of follow) {
            actionTable[stateIdx][la] = {
              type: 'reduce',
              ruleIndex: rule.id,
            };
          }
        }
      }
    }

    // 2. Transitions
    for (const sym of allSymbols) {
      const nextItems = gotoLR0(currentItems, sym);
      if (nextItems.length === 0) continue;

      const sig = stateLR0Signature(nextItems);
      let targetState: number;

      if (stateSignatures.has(sig)) {
        targetState = stateSignatures.get(sig)!;
      } else {
        targetState = states.length;
        states.push(nextItems);
        stateSignatures.set(sig, targetState);
      }

      if (TERMINALS.includes(sym as any)) {
        actionTable[stateIdx][sym] = { type: 'shift', state: targetState };
      } else if (NON_TERMINALS.includes(sym as any)) {
        gotoTable[stateIdx][sym] = targetState;
      }
    }

    stateIdx++;
  }

  return {
    mode: 'SLR1',
    actionTable,
    gotoTable,
    stateItems,
    stateCount: states.length,
  };
}

// Pre-computed tables for instant switching and zero latency
export const PRECOMPUTED_SLR1_TABLE = generateSLR1Table();
export const PRECOMPUTED_LR1_TABLE = generateLR1Table();
