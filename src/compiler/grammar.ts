/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GrammarRule } from './types';

/**
 * Standard unambiguous arithmetic grammar:
 * 0: E' -> E     (Augmented rule)
 * 1: E  -> E + T
 * 2: E  -> T
 * 3: T  -> T * F
 * 4: T  -> F
 * 5: F  -> ( E )
 * 6: F  -> id
 */
export const GRAMMAR_RULES: GrammarRule[] = [
  { id: 0, lhs: "E'", rhs: ['E'], text: "E' -> E" },
  { id: 1, lhs: 'E', rhs: ['E', '+', 'T'], text: 'E -> E + T' },
  { id: 2, lhs: 'E', rhs: ['T'], text: 'E -> T' },
  { id: 3, lhs: 'T', rhs: ['T', '*', 'F'], text: 'T -> T * F' },
  { id: 4, lhs: 'T', rhs: ['F'], text: 'T -> F' },
  { id: 5, lhs: 'F', rhs: ['(', 'E', ')'], text: 'F -> ( E )' },
  { id: 6, lhs: 'F', rhs: ['id'], text: 'F -> id' },
];

export const TERMINALS = ['id', '+', '*', '(', ')', '$'] as const;
export type Terminal = (typeof TERMINALS)[number];

export const NON_TERMINALS = ['E', 'T', 'F'] as const;
export type NonTerminal = (typeof NON_TERMINALS)[number];

/**
 * FOLLOW sets for the SLR(1) parser:
 * FOLLOW(E') = { $ }
 * FOLLOW(E)  = { +, ), $ }
 * FOLLOW(T)  = { +, *, ), $ }
 * FOLLOW(F)  = { +, *, ), $ }
 */
export const FOLLOW_SETS: Record<string, string[]> = {
  "E'": ['$'],
  E: ['+', ')', '$'],
  T: ['+', '*', ')', '$'],
  F: ['+', '*', ')', '$'],
};
