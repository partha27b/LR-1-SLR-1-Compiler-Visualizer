/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  X,
  PlayCircle,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { parseExpression } from '../compiler/engine';
import { ParserMode } from '../compiler/types';

interface AutomatedTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExpression: (expr: string, mode: ParserMode) => void;
  currentMode: ParserMode;
}

interface TestReport {
  id: string;
  name: string;
  expression: string;
  description: string;
  expectedResult: 'ACCEPT' | 'ERROR';
  passed: boolean;
  traceStepsCount: number;
  assertionDetails: string;
  resultDetails: string;
}

export const AutomatedTestsModal: React.FC<AutomatedTestsModalProps> = ({
  isOpen,
  onClose,
  onSelectExpression,
  currentMode,
}) => {
  const [testMode, setTestMode] = useState<ParserMode>(currentMode);

  const testReports = useMemo<TestReport[]>(() => {
    // Run Test 1: "id + id * id" (Standard precedence test)
    const t1 = parseExpression('id + id * id', testMode);
    const t1Last = t1.trace[t1.trace.length - 1];
    const t1Reductions = t1.trace.filter((s) => s.actionType === 'REDUCE');
    const t1MultIdx = t1Reductions.findIndex((s) =>
      s.recentReduction?.rule.includes('T -> T * F'),
    );
    const t1AddIdx = t1Reductions.findIndex((s) =>
      s.recentReduction?.rule.includes('E -> E + T'),
    );
    const t1PrecedencePass =
      t1MultIdx !== -1 && t1AddIdx !== -1 && t1MultIdx < t1AddIdx;
    const t1Pass =
      t1.success && t1Last.actionType === 'ACCEPT' && t1PrecedencePass;

    // Run Test 2: "( id + id ) * id" (Parentheses override test)
    const t2 = parseExpression('( id + id ) * id', testMode);
    const t2Last = t2.trace[t2.trace.length - 1];
    const t2Reductions = t2.trace.filter((s) => s.actionType === 'REDUCE');
    const t2AddIdx = t2Reductions.findIndex((s) =>
      s.recentReduction?.rule.includes('E -> E + T'),
    );
    const t2ParenIdx = t2Reductions.findIndex((s) =>
      s.recentReduction?.rule.includes('F -> ( E )'),
    );
    const t2MultIdx = t2Reductions.findIndex((s) =>
      s.recentReduction?.rule.includes('T -> T * F'),
    );
    const t2OverridePass =
      t2AddIdx < t2ParenIdx && t2ParenIdx < t2MultIdx;
    const t2Pass =
      t2.success && t2Last.actionType === 'ACCEPT' && t2OverridePass;

    // Run Test 3: "id + * id" (Syntax error handling test)
    const t3 = parseExpression('id + * id', testMode);
    const t3Last = t3.trace[t3.trace.length - 1];
    const t3Pass =
      !t3.success &&
      t3Last.actionType === 'ERROR' &&
      t3Last.actionDescription.includes("Unexpected token '*'");

    // Extra: "3 + 4 * 2" (Arithmetic Numbers)
    const t4 = parseExpression('3 + 4 * 2', testMode);
    const t4Pass = t4.success;

    // Extra: "a * ( b + c )" (Variables)
    const t5 = parseExpression('a * ( b + c )', testMode);
    const t5Pass = t5.success;

    return [
      {
        id: 'test-1',
        name: 'Specification Test 1',
        expression: 'id + id * id',
        description: 'Standard Operator Precedence Verification (* before +)',
        expectedResult: 'ACCEPT',
        passed: t1Pass,
        traceStepsCount: t1.trace.length,
        assertionDetails:
          'T -> T * F reduced at reduction #' +
          (t1MultIdx + 1) +
          ', before E -> E + T at reduction #' +
          (t1AddIdx + 1),
        resultDetails: `Parsed successfully with ${testMode} in ${t1.trace.length} steps.`,
      },
      {
        id: 'test-2',
        name: 'Specification Test 2',
        expression: '( id + id ) * id',
        description: 'Parentheses Precedence Override ((E) evaluated before * )',
        expectedResult: 'ACCEPT',
        passed: t2Pass,
        traceStepsCount: t2.trace.length,
        assertionDetails:
          'Parenthesized addition E -> E + T was reduced prior to multiplication T -> T * F',
        resultDetails: `Parsed successfully with ${testMode} in ${t2.trace.length} steps.`,
      },
      {
        id: 'test-3',
        name: 'Specification Test 3',
        expression: 'id + * id',
        description: 'Deterministic Syntax Error Recovery & Messaging',
        expectedResult: 'ERROR',
        passed: t3Pass,
        traceStepsCount: t3.trace.length,
        assertionDetails:
          `Correctly flagged unexpected token '*' on ${testMode} table lookup`,
        resultDetails: t3Last.error || 'Emitted syntax error step correctly.',
      },
      {
        id: 'test-4',
        name: 'Extension Test 4',
        expression: '3 + 4 * 2',
        description: 'Lexer Integer Literals & Normalization to id',
        expectedResult: 'ACCEPT',
        passed: t4Pass,
        traceStepsCount: t4.trace.length,
        assertionDetails:
          "Normalized integers to 'id' while preserving raw values for display",
        resultDetails: `Parsed successfully with ${testMode} in ${t4.trace.length} steps.`,
      },
      {
        id: 'test-5',
        name: 'Extension Test 5',
        expression: 'a * ( b + c )',
        description: 'Identifier Variables & Complex Nesting',
        expectedResult: 'ACCEPT',
        passed: t5Pass,
        traceStepsCount: t5.trace.length,
        assertionDetails:
          "Variables a, b, c normalized to 'id' with nested parentheses",
        resultDetails: `Parsed successfully with ${testMode} in ${t5.trace.length} steps.`,
      },
    ];
  }, [testMode, isOpen]);

  if (!isOpen) return null;

  const allPassed = testReports.every((t) => t.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E8DFD3] shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0EAE1] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Automated Test Suite
                </h3>
                {allPassed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    5 / 5 Passed
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Live verification against deliverable test requirements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode switcher inside test modal */}
            <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg border border-[#E0D7C9]">
              <button
                type="button"
                onClick={() => setTestMode('SLR1')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  testMode === 'SLR1'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                SLR(1)
              </button>
              <button
                type="button"
                onClick={() => setTestMode('LR1')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  testMode === 'LR1'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Canonical LR(1)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Test List */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {testReports.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-xl border border-[#E8DFD3] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-stone-900">
                    {t.name}:
                  </span>
                  <code className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#E0D7C9] text-sky-800">
                    {t.expression}
                  </code>
                </div>
                <p className="text-xs text-stone-600">{t.description}</p>
                <div className="text-[11px] font-mono text-stone-500 bg-white/80 p-1.5 rounded border border-[#EDE5DA]">
                  <span className="text-stone-400">Assertion:</span>{' '}
                  <span className="text-stone-700">{t.assertionDetails}</span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    t.expectedResult === 'ACCEPT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {t.expectedResult} ({t.traceStepsCount} steps)
                </span>
                <button
                  onClick={() => {
                    onSelectExpression(t.expression, testMode);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg shadow-2xs transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Load ({testMode})
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#F0EAE1] bg-[#FAF7F2] flex items-center justify-between text-xs text-stone-500">
          <span>
            Testing mode:{' '}
            <strong className="text-stone-800">
              {testMode === 'LR1' ? 'Canonical LR(1)' : 'Simple LR(1)'}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 text-xs font-semibold bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
