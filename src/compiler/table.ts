/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TableAction } from './types';

/**
 * SLR(1) ACTION Table
 * Rows: States 0 through 11
 * Columns: Terminals: 'id', '+', '*', '(', ')', '$'
 */
export const ACTION_TABLE: Record<number, Record<string, TableAction>> = {
  0: {
    id: { type: 'shift', state: 5 },
    '(': { type: 'shift', state: 4 },
  },
  1: {
    '+': { type: 'shift', state: 6 },
    $: { type: 'accept' },
  },
  2: {
    '+': { type: 'reduce', ruleIndex: 2 }, // E -> T
    '*': { type: 'shift', state: 7 },
    ')': { type: 'reduce', ruleIndex: 2 },
    $: { type: 'reduce', ruleIndex: 2 },
  },
  3: {
    '+': { type: 'reduce', ruleIndex: 4 }, // T -> F
    '*': { type: 'reduce', ruleIndex: 4 },
    ')': { type: 'reduce', ruleIndex: 4 },
    $: { type: 'reduce', ruleIndex: 4 },
  },
  4: {
    id: { type: 'shift', state: 5 },
    '(': { type: 'shift', state: 4 },
  },
  5: {
    '+': { type: 'reduce', ruleIndex: 6 }, // F -> id
    '*': { type: 'reduce', ruleIndex: 6 },
    ')': { type: 'reduce', ruleIndex: 6 },
    $: { type: 'reduce', ruleIndex: 6 },
  },
  6: {
    id: { type: 'shift', state: 5 },
    '(': { type: 'shift', state: 4 },
  },
  7: {
    id: { type: 'shift', state: 5 },
    '(': { type: 'shift', state: 4 },
  },
  8: {
    '+': { type: 'shift', state: 6 },
    ')': { type: 'shift', state: 11 },
  },
  9: {
    '+': { type: 'reduce', ruleIndex: 1 }, // E -> E + T
    '*': { type: 'shift', state: 7 },
    ')': { type: 'reduce', ruleIndex: 1 },
    $: { type: 'reduce', ruleIndex: 1 },
  },
  10: {
    '+': { type: 'reduce', ruleIndex: 3 }, // T -> T * F
    '*': { type: 'reduce', ruleIndex: 3 },
    ')': { type: 'reduce', ruleIndex: 3 },
    $: { type: 'reduce', ruleIndex: 3 },
  },
  11: {
    '+': { type: 'reduce', ruleIndex: 5 }, // F -> ( E )
    '*': { type: 'reduce', ruleIndex: 5 },
    ')': { type: 'reduce', ruleIndex: 5 },
    $: { type: 'reduce', ruleIndex: 5 },
  },
};

/**
 * SLR(1) GOTO Table
 * Rows: States 0 through 11
 * Columns: Non-terminals: 'E', 'T', 'F'
 */
export const GOTO_TABLE: Record<number, Record<string, number>> = {
  0: { E: 1, T: 2, F: 3 },
  4: { E: 8, T: 2, F: 3 },
  6: { T: 9, F: 3 },
  7: { F: 10 },
};

/**
 * Pedagogical descriptions of LR(0) item sets for each state.
 * Useful for the UI to explain what the compiler is "expecting" or "has recognized".
 */
export const STATE_ITEMS: Record<number, string[]> = {
  0: [
    "E' -> • E",
    'E -> • E + T',
    'E -> • T',
    'T -> • T * F',
    'T -> • F',
    'F -> • ( E )',
    'F -> • id',
  ],
  1: ["E' -> E •", 'E -> E • + T'],
  2: ['E -> T •', 'T -> T • * F'],
  3: ['T -> F •'],
  4: [
    'F -> ( • E )',
    'E -> • E + T',
    'E -> • T',
    'T -> • T * F',
    'T -> • F',
    'F -> • ( E )',
    'F -> • id',
  ],
  5: ['F -> id •'],
  6: ['E -> E + • T', 'T -> • T * F', 'T -> • F', 'F -> • ( E )', 'F -> • id'],
  7: ['T -> T * • F', 'F -> • ( E )', 'F -> • id'],
  8: ['F -> ( E • )', 'E -> E • + T'],
  9: ['E -> E + T •', 'T -> T • * F'],
  10: ['T -> T * F •'],
  11: ['F -> ( E ) •'],
};

/**
 * Returns expected terminal symbols for a given state when an error occurs.
 */
export function getExpectedTokensForState(state: number): string[] {
  const stateActions = ACTION_TABLE[state];
  if (!stateActions) return [];
  return Object.keys(stateActions);
}
