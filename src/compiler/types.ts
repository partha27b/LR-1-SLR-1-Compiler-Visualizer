/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a single token emitted by the lexical analyzer.
 */
export interface Token {
  /** The normalized grammar symbol ('id', '+', '*', '(', ')', '$') */
  type: string;
  /** The raw source substring (e.g. 'a', '3', 'myVar', '+') */
  value: string;
  /** 0-based token index in the token stream */
  index: number;
  /** Character position offset in the source string */
  startOffset: number;
  endOffset: number;
}

/**
 * An item in the SLR(1) parse stack.
 */
export interface StackItem {
  /** The LR automaton state index (e.g., 0, 1, 2... 11) */
  state: number;
  /** The grammar symbol associated with this state entry ('$', 'E', 'T', 'F', 'id', '+', etc.) */
  symbol: string;
  /** Pointer to the corresponding node in the parse forest, or null for the initial base symbol */
  nodeId: string | null;
}

/**
 * An element in the remaining input buffer tape.
 */
export interface InputBufferItem {
  /** The grammar symbol of the lookahead token */
  symbol: string;
  /** The original token index */
  index: number;
  /** Original user text value (for visual fidelity) */
  value?: string;
}

/**
 * A node in the parse forest / parse tree.
 */
export interface ParseTreeNode {
  /** Unique deterministic identifier (e.g. 'node_0', 'leaf_id_1') */
  id: string;
  /** Grammar symbol label ('E', 'T', 'F', 'id', '+', '*', '(', ')') */
  label: string;
  /** Ordered array of child node IDs */
  children: string[];
  /** Optional source string value for leaf tokens */
  value?: string;
  /** Depth level in the parse tree (computed for visual layout) */
  depth?: number;
}

/**
 * Metadata about the most recent grammar reduction.
 */
export interface RecentReduction {
  /** Human-readable grammar rule string (e.g. "E -> E + T") */
  rule: string;
  /** Ordered array of node IDs that were popped to form this reduction */
  poppedNodeIds: string[];
  /** The ID of the freshly synthesized parent node */
  createdNodeId: string;
}

/**
 * Action classifications emitted during the LR parsing execution.
 */
export type TraceActionType = 'INIT' | 'SHIFT' | 'REDUCE' | 'ACCEPT' | 'ERROR';

/**
 * Complete, deterministic trace step conforming strictly to user requirements.
 */
export interface TraceStep {
  /** 0-based sequential step index */
  stepIndex: number;
  /** Action category */
  actionType: TraceActionType;
  /** Educational explanation of the operation */
  actionDescription: string;
  /** Snapshot of the parse stack at this step */
  stack: StackItem[];
  /** Remaining unconsumed input tokens */
  inputBuffer: InputBufferItem[];
  /** Full parse forest nodes accumulated up to this step */
  parseForest: ParseTreeNode[];
  /** Details on the reduction that happened in this step, or null */
  recentReduction: RecentReduction | null;
  /** Descriptive syntax or lexical error message, or null */
  error: string | null;
}

/**
 * Grammar production rule representation.
 */
export interface GrammarRule {
  id: number;
  lhs: string;
  rhs: string[];
  text: string;
}

/**
 * Parsing Table Action definitions.
 */
export type TableAction =
  | { type: 'shift'; state: number }
  | { type: 'reduce'; ruleIndex: number }
  | { type: 'accept' }
  | { type: 'error'; message?: string };

/**
 * Supported parser algorithm mode: SLR(1) (Simple LR) or LR(1) (Canonical LR with lookaheads).
 */
export type ParserMode = 'SLR1' | 'LR1';

/**
 * Overall parse execution result.
 */
export interface ParseResult {
  mode: ParserMode;
  success: boolean;
  trace: TraceStep[];
  tokens: Token[];
  finalTree: ParseTreeNode | null;
  error: string | null;
  stateCount: number;
}
