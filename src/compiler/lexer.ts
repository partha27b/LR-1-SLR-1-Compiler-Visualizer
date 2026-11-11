/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Token } from './types';

export interface LexerResult {
  tokens: Token[];
  error: string | null;
}

/**
 * Tokenizes an arithmetic expression string into grammar tokens.
 * Identifiers and numbers are normalized to the 'id' token type while preserving
 * their raw lexical value for UI display.
 * Automatically appends the '$' end-of-input terminal.
 *
 * @param input Raw arithmetic expression string
 * @returns Array of Token objects and any lexical error encountered
 */
export function tokenize(input: string): LexerResult {
  const tokens: Token[] = [];
  let pos = 0;
  const len = input.length;

  while (pos < len) {
    const ch = input[pos];

    // Skip whitespace
    if (/\s/.test(ch)) {
      pos++;
      continue;
    }

    // Single character operators and grouping punctuation
    if (ch === '+' || ch === '*' || ch === '(' || ch === ')') {
      tokens.push({
        type: ch,
        value: ch,
        index: tokens.length,
        startOffset: pos,
        endOffset: pos + 1,
      });
      pos++;
      continue;
    }

    // End marker '$' if explicitly typed by user
    if (ch === '$') {
      tokens.push({
        type: '$',
        value: '$',
        index: tokens.length,
        startOffset: pos,
        endOffset: pos + 1,
      });
      pos++;
      continue;
    }

    // Number literal: e.g. 3, 42, 3.14
    if (/[0-9]/.test(ch)) {
      const start = pos;
      while (pos < len && /[0-9.]/.test(input[pos])) {
        pos++;
      }
      const rawVal = input.slice(start, pos);
      tokens.push({
        type: 'id',
        value: rawVal,
        index: tokens.length,
        startOffset: start,
        endOffset: pos,
      });
      continue;
    }

    // Identifier: e.g. id, a, b, var1, x_val
    if (/[a-zA-Z_]/.test(ch)) {
      const start = pos;
      while (pos < len && /[a-zA-Z0-9_]/.test(input[pos])) {
        pos++;
      }
      const rawVal = input.slice(start, pos);
      tokens.push({
        type: 'id',
        value: rawVal,
        index: tokens.length,
        startOffset: start,
        endOffset: pos,
      });
      continue;
    }

    // Unrecognized character
    return {
      tokens,
      error: `Lexical Error at position ${pos}: Unexpected character '${ch}'`,
    };
  }

  // Ensure end-marker '$' is appended if not already present
  const lastToken = tokens[tokens.length - 1];
  if (!lastToken || lastToken.type !== '$') {
    tokens.push({
      type: '$',
      value: '$',
      index: tokens.length,
      startOffset: len,
      endOffset: len,
    });
  }

  return { tokens, error: null };
}
