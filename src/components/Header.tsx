/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, CheckCircle, Code2, Layers, Cpu } from 'lucide-react';
import { ParserMode } from '../compiler/types';

interface HeaderProps {
  mode: ParserMode;
  onOpenJsonTrace: () => void;
  onOpenTestSuite: () => void;
  onOpenGrammarGuide: () => void;
  totalSteps: number;
  currentStepIndex: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onOpenJsonTrace,
  onOpenTestSuite,
  onOpenGrammarGuide,
  totalSteps,
  currentStepIndex,
}) => {
  return (
    <header className="bg-[#FAF7F2] border-b border-[#E8DFD3] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Titles */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BAE6FD] via-[#FCE7F3] to-[#F5EFEB] border border-[#E0D7C9] flex items-center justify-center shadow-xs text-sky-700">
            <Layers className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-stone-800 tracking-tight">
                LR(1) / SLR(1) Compiler Visualizer
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-sky-600" />
                {mode === 'LR1' ? 'Canonical LR(1)' : 'SLR(1)'} Active
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Deterministic Bottom-Up Shift-Reduce Automaton & Parse Forest Construction
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenGrammarGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-[#E5DDD2] rounded-lg shadow-xs transition-colors"
            title="View grammar rules, SLR(1) vs LR(1) theory"
          >
            <BookOpen className="w-3.5 h-3.5 text-pink-500" />
            LR Theory Guide
          </button>

          <button
            onClick={onOpenTestSuite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-[#E5DDD2] rounded-lg shadow-xs transition-colors"
            title="Run the specification unit tests on both engines"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Unit Tests
          </button>

          <button
            onClick={onOpenJsonTrace}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-[#E0F2FE] hover:bg-[#BAE6FD] border border-sky-200 rounded-lg shadow-xs transition-colors"
            title="Inspect and copy exact trace schema JSON"
          >
            <Code2 className="w-3.5 h-3.5 text-sky-600" />
            JSON Trace Data
          </button>
        </div>
      </div>
    </header>
  );
};
