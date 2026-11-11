/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GRAMMAR_RULES } from './grammar';
import { tokenize } from './lexer';
import {
  PRECOMPUTED_LR1_TABLE,
  PRECOMPUTED_SLR1_TABLE,
  GeneratedTable,
} from './generator';
import {
  InputBufferItem,
  ParseResult,
  ParserMode,
  ParseTreeNode,
  RecentReduction,
  StackItem,
  TraceStep,
} from './types';

/**
 * Returns expected terminal symbols for a given state in the selected table.
 */
function getExpectedTokens(
  actionTable: Record<number, Record<string, any>>,
  state: number,
): string[] {
  const stateActions = actionTable[state];
  if (!stateActions) return [];
  return Object.keys(stateActions);
}

/**
 * Executes deterministic SLR(1) or Canonical LR(1) parsing on an arithmetic expression and
 * returns the full trace history conforming strictly to the TraceStep schema.
 *
 * This engine does not use timeouts or DOM references and is suitable for both
 * client-side visualizers and server-side API endpoints.
 *
 * @param input Raw arithmetic expression string (e.g., "id + id * id")
 * @param mode Parser mode: 'SLR1' (Simple LR, 12 states) or 'LR1' (Canonical LR with lookaheads)
 * @returns Complete ParseResult with trace array, token stream, mode, and parse tree
 */
export function parseExpression(
  input: string,
  mode: ParserMode = 'SLR1',
): ParseResult {
  const tableConfig: GeneratedTable =
    mode === 'LR1' ? PRECOMPUTED_LR1_TABLE : PRECOMPUTED_SLR1_TABLE;
  const actionTable = tableConfig.actionTable;
  const gotoTable = tableConfig.gotoTable;

  const lexResult = tokenize(input);

  // If lexer failed immediately, produce a single ERROR trace step
  if (lexResult.error) {
    const errorStep: TraceStep = {
      stepIndex: 0,
      actionType: 'ERROR',
      actionDescription: lexResult.error,
      stack: [{ state: 0, symbol: '$', nodeId: null }],
      inputBuffer: [],
      parseForest: [],
      recentReduction: null,
      error: lexResult.error,
    };

    return {
      mode,
      success: false,
      trace: [errorStep],
      tokens: lexResult.tokens,
      finalTree: null,
      error: lexResult.error,
      stateCount: tableConfig.stateCount,
    };
  }

  const tokens = lexResult.tokens;
  const trace: TraceStep[] = [];

  // Internal mutable parse structures
  const stack: StackItem[] = [{ state: 0, symbol: '$', nodeId: null }];
  const inputBuffer: (InputBufferItem & { value: string })[] = tokens.map(
    (t) => ({
      symbol: t.type,
      index: t.index,
      value: t.value,
    }),
  );
  const parseForest: ParseTreeNode[] = [];
  let nodeCounter = 0;
  let stepIndex = 0;

  // Helper to create an immutable snapshot of current state
  const snapshotStep = (
    actionType: TraceStep['actionType'],
    actionDescription: string,
    recentReduction: RecentReduction | null = null,
    error: string | null = null,
  ): TraceStep => ({
    stepIndex: stepIndex++,
    actionType,
    actionDescription,
    stack: stack.map((item) => ({ ...item })),
    inputBuffer: inputBuffer.map((b) => ({
      symbol: b.symbol,
      index: b.index,
      value: b.value,
    })),
    parseForest: parseForest.map((node) => ({
      id: node.id,
      label: node.label,
      children: [...node.children],
      value: node.value,
      depth: node.depth,
    })),
    recentReduction: recentReduction ? { ...recentReduction } : null,
    error,
  });

  const modeLabel = mode === 'LR1' ? 'Canonical LR(1)' : 'SLR(1)';

  // Step 0: Initial state
  trace.push(
    snapshotStep(
      'INIT',
      `${modeLabel} parser initialized at State 0 (${tableConfig.stateCount} automaton states) with end-marker '$' on stack base.`,
      null,
      null,
    ),
  );

  const MAX_STEPS = 500;
  let isAccepted = false;
  let fatalError: string | null = null;

  while (stepIndex < MAX_STEPS) {
    const currentState = stack[stack.length - 1].state;
    const lookahead = inputBuffer[0];

    if (!lookahead) {
      fatalError =
        'Internal Parser Error: Input buffer unexpectedly exhausted without reaching acceptance.';
      trace.push(snapshotStep('ERROR', fatalError, null, fatalError));
      break;
    }

    const action = actionTable[currentState]?.[lookahead.symbol];

    // Case 1: Syntax Error (no table entry)
    if (!action) {
      const expected = getExpectedTokens(actionTable, currentState);
      const expectedText =
        expected.length > 0
          ? expected.map((t) => `'${t}'`).join(', ')
          : 'None';
      fatalError = `Syntax Error at token '${lookahead.symbol}' (value: "${lookahead.value}", token index: ${lookahead.index}): In State ${currentState}, unexpected token. Expected one of: ${expectedText}.`;

      trace.push(
        snapshotStep(
          'ERROR',
          `Syntax Error: Unexpected token '${lookahead.symbol}'. Expected: ${expectedText}`,
          null,
          fatalError,
        ),
      );
      break;
    }

    // Case 2: SHIFT
    if (action.type === 'shift') {
      const targetState = action.state;
      const consumed = inputBuffer.shift()!;

      // Create a leaf node for this shifted terminal
      const leafId = `leaf_${nodeCounter++}`;
      const leafNode: ParseTreeNode = {
        id: leafId,
        label: consumed.symbol,
        children: [],
        value: consumed.value,
        depth: 0,
      };
      parseForest.push(leafNode);

      // Push shifted symbol and new state onto stack
      stack.push({
        state: targetState,
        symbol: consumed.symbol,
        nodeId: leafId,
      });

      const desc =
        consumed.symbol === 'id' && consumed.value !== 'id'
          ? `Shift token 'id' (value: "${consumed.value}") and push State ${targetState}`
          : `Shift token '${consumed.symbol}' and push State ${targetState}`;

      trace.push(snapshotStep('SHIFT', desc, null, null));
      continue;
    }

    // Case 3: REDUCE
    if (action.type === 'reduce') {
      const rule = GRAMMAR_RULES[action.ruleIndex];
      if (!rule) {
        fatalError = `Internal Parser Error: Unknown rule index ${action.ruleIndex}`;
        trace.push(snapshotStep('ERROR', fatalError, null, fatalError));
        break;
      }

      const popCount = rule.rhs.length;
      const poppedNodeIds: string[] = [];

      for (let i = 0; i < popCount; i++) {
        const popped = stack.pop();
        if (popped?.nodeId) {
          poppedNodeIds.unshift(popped.nodeId);
        }
      }

      // Compute depth for new node
      let maxChildDepth = -1;
      for (const childId of poppedNodeIds) {
        const cNode = parseForest.find((n) => n.id === childId);
        if (cNode && (cNode.depth ?? 0) > maxChildDepth) {
          maxChildDepth = cNode.depth ?? 0;
        }
      }

      const createdNodeId = `node_${nodeCounter++}`;
      const parentNode: ParseTreeNode = {
        id: createdNodeId,
        label: rule.lhs,
        children: poppedNodeIds,
        depth: maxChildDepth + 1,
      };
      parseForest.push(parentNode);

      // Top of stack is now the state before shifted RHS symbols
      const uncoveredState = stack[stack.length - 1].state;
      const gotoState = gotoTable[uncoveredState]?.[rule.lhs];

      if (gotoState === undefined) {
        fatalError = `Internal Parser Error: Missing GOTO entry for State ${uncoveredState} on non-terminal '${rule.lhs}'`;
        trace.push(snapshotStep('ERROR', fatalError, null, fatalError));
        break;
      }

      // Push non-terminal and target GOTO state onto stack
      stack.push({
        state: gotoState,
        symbol: rule.lhs,
        nodeId: createdNodeId,
      });

      const reductionMeta: RecentReduction = {
        rule: rule.text,
        poppedNodeIds,
        createdNodeId,
      };

      const desc = `Reduce by rule ${rule.id}: ${rule.text}. (Popped ${popCount} symbols, GOTO State ${gotoState})`;
      trace.push(snapshotStep('REDUCE', desc, reductionMeta, null));
      continue;
    }

    // Case 4: ACCEPT
    if (action.type === 'accept') {
      isAccepted = true;
      trace.push(
        snapshotStep(
          'ACCEPT',
          `Expression successfully parsed by ${modeLabel}! Reached start symbol E with '$' lookahead.`,
          null,
          null,
        ),
      );
      break;
    }

    // Fallback error
    fatalError = `Encountered unexpected parser state action.`;
    trace.push(snapshotStep('ERROR', fatalError, null, fatalError));
    break;
  }

  const finalTree =
    isAccepted && parseForest.length > 0
      ? parseForest[parseForest.length - 1]
      : null;

  return {
    mode,
    success: isAccepted,
    trace,
    tokens,
    finalTree,
    error: fatalError,
    stateCount: tableConfig.stateCount,
  };
}
