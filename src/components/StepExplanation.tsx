/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TraceStep } from '../compiler/types';

interface StepExplanationProps {
  step: TraceStep;
  totalSteps: number;
}

export const StepExplanation: React.FC<StepExplanationProps> = ({
  step,
  totalSteps,
}) => {
  const currentStackTop = step.stack[step.stack.length - 1];
  const lookahead = step.inputBuffer[0];

  const getActionBadge = () => {
    switch (step.actionType) {
      case 'INIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
            <Info className="w-3.5 h-3.5" />
            INIT
          </span>
        );
      case 'SHIFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-100 text-sky-800 border border-sky-300">
            <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
            SHIFT
          </span>
        );
      case 'REDUCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-pink-100 text-pink-800 border border-pink-300">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            REDUCE
          </span>
        );
      case 'ACCEPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ACCEPT
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            ERROR
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left side: Action Type & Description */}
        <div className="flex items-start gap-3">
          <div className="pt-0.5">{getActionBadge()}</div>
          <div>
            <h2 className="text-sm font-semibold text-stone-800">
              {step.actionDescription}
            </h2>
            {step.recentReduction && (
              <p className="text-xs text-pink-700 font-mono mt-0.5 font-medium">
                Production applied: {step.recentReduction.rule}
              </p>
            )}
            {step.error && (
              <p className="text-xs text-rose-600 font-medium mt-1">
                {step.error}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Key Compiler State Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Current State indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3]">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Top State:
            </span>
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
              State {currentStackTop?.state ?? 0}
            </span>
          </div>

          {/* Current Lookahead indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3]">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Lookahead:
            </span>
            {lookahead ? (
              <span className="text-xs font-mono font-bold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                {lookahead.symbol}
                {lookahead.value && lookahead.value !== lookahead.symbol && (
                  <span className="text-stone-400 font-normal ml-1">
                    ("{lookahead.value}")
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs font-mono text-stone-400">Empty</span>
            )}
          </div>

          {/* Forest node count */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-stone-600 text-xs font-medium">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>{step.parseForest.length} nodes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
