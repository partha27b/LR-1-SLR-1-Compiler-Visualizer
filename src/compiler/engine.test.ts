/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseExpression } from './engine';
import { tokenize } from './lexer';
import { PRECOMPUTED_LR1_TABLE, PRECOMPUTED_SLR1_TABLE } from './generator';

test('Lexer tokenizes identifiers, numbers, operators, and appends $', () => {
  const result = tokenize('id + id * id');
  assert.equal(result.error, null);
  assert.equal(result.tokens.length, 6);
  assert.deepEqual(
    result.tokens.map((t) => t.type),
    ['id', '+', 'id', '*', 'id', '$'],
  );

  const numResult = tokenize('3 + 4 * 2');
  assert.equal(numResult.error, null);
  assert.deepEqual(
    numResult.tokens.map((t) => t.type),
    ['id', '+', 'id', '*', 'id', '$'],
  );
  assert.deepEqual(
    numResult.tokens.map((t) => t.value),
    ['3', '+', '4', '*', '2', '$'],
  );
});

test('SLR(1) Table has exactly 12 states', () => {
  assert.equal(PRECOMPUTED_SLR1_TABLE.stateCount, 12);
  assert.equal(PRECOMPUTED_SLR1_TABLE.mode, 'SLR1');
});

test('Canonical LR(1) Table is generated with expanded states for lookahead contexts', () => {
  assert.ok(PRECOMPUTED_LR1_TABLE.stateCount >= 12, 'LR(1) should have >= 12 states due to lookahead splitting');
  assert.equal(PRECOMPUTED_LR1_TABLE.mode, 'LR1');
});

test('Specification Test 1 (SLR1 & LR1): "id + id * id" (Standard precedence test)', () => {
  for (const mode of ['SLR1', 'LR1'] as const) {
    const result = parseExpression('id + id * id', mode);
    assert.equal(result.success, true, `Parsing should succeed in ${mode}`);
    assert.equal(result.error, null);
    assert.ok(result.trace.length > 0);

    const initStep = result.trace[0];
    assert.equal(initStep.actionType, 'INIT');
    assert.equal(initStep.stepIndex, 0);

    const lastStep = result.trace[result.trace.length - 1];
    assert.equal(lastStep.actionType, 'ACCEPT');

    const rootNode = result.finalTree;
    assert.ok(rootNode, 'Final parse tree root must exist');
    assert.equal(rootNode.label, 'E');

    const reduceSteps = result.trace.filter((s) => s.actionType === 'REDUCE');
    const multReductionIndex = reduceSteps.findIndex((s) =>
      s.recentReduction?.rule.includes('T -> T * F'),
    );
    const addReductionIndex = reduceSteps.findIndex((s) =>
      s.recentReduction?.rule.includes('E -> E + T'),
    );

    assert.ok(
      multReductionIndex !== -1,
      `Multiplication reduction T -> T * F should exist in ${mode}`,
    );
    assert.ok(
      addReductionIndex !== -1,
      `Addition reduction E -> E + T should exist in ${mode}`,
    );
    assert.ok(
      multReductionIndex < addReductionIndex,
      `Multiplication reduction must precede addition reduction in ${mode}`,
    );
  }
});

test('Specification Test 2 (SLR1 & LR1): "( id + id ) * id" (Parentheses override test)', () => {
  for (const mode of ['SLR1', 'LR1'] as const) {
    const result = parseExpression('( id + id ) * id', mode);
    assert.equal(result.success, true, `Parsing with parentheses should succeed in ${mode}`);
    assert.equal(result.error, null);

    const lastStep = result.trace[result.trace.length - 1];
    assert.equal(lastStep.actionType, 'ACCEPT');

    const reduceSteps = result.trace.filter((s) => s.actionType === 'REDUCE');
    const addReductionIndex = reduceSteps.findIndex((s) =>
      s.recentReduction?.rule.includes('E -> E + T'),
    );
    const parenReductionIndex = reduceSteps.findIndex((s) =>
      s.recentReduction?.rule.includes('F -> ( E )'),
    );
    const multReductionIndex = reduceSteps.findIndex((s) =>
      s.recentReduction?.rule.includes('T -> T * F'),
    );

    assert.ok(addReductionIndex !== -1);
    assert.ok(parenReductionIndex !== -1);
    assert.ok(multReductionIndex !== -1);

    assert.ok(
      addReductionIndex < parenReductionIndex,
      `Addition must be reduced before parenthesized F in ${mode}`,
    );
    assert.ok(
      parenReductionIndex < multReductionIndex,
      `Parenthesized F must be reduced before overall multiplication in ${mode}`,
    );
  }
});

test('Specification Test 3 (SLR1 & LR1): "id + * id" (Syntax error handling test)', () => {
  for (const mode of ['SLR1', 'LR1'] as const) {
    const result = parseExpression('id + * id', mode);
    assert.equal(result.success, false, `Should fail syntax check in ${mode}`);
    assert.ok(result.error, 'Error message must be present');
    assert.match(
      result.error,
      /Syntax Error/,
      'Error message should indicate syntax error',
    );

    const lastStep = result.trace[result.trace.length - 1];
    assert.equal(lastStep.actionType, 'ERROR');
    assert.ok(lastStep.error);
    assert.ok(
      lastStep.actionDescription.includes("Unexpected token '*'"),
      'Should identify unexpected token *',
    );
  }
});

test('Both engines evaluate numbers "3 + 4 * 2" cleanly', () => {
  for (const mode of ['SLR1', 'LR1'] as const) {
    const result = parseExpression('3 + 4 * 2', mode);
    assert.equal(result.success, true);
    assert.equal(result.error, null);
    assert.equal(result.trace[result.trace.length - 1].actionType, 'ACCEPT');
  }
});
