/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, X, Cpu, Layers } from 'lucide-react';
import { GRAMMAR_RULES, FOLLOW_SETS } from '../compiler/grammar';
import { PRECOMPUTED_LR1_TABLE, PRECOMPUTED_SLR1_TABLE } from '../compiler/generator';

interface GrammarGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrammarGuideModal: React.FC<GrammarGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E8DFD3] shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0EAE1] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-100 border border-pink-300 flex items-center justify-center text-pink-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Compiler Theory: SLR(1) vs. Canonical LR(1) Guide
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Detailed comparison of bottom-up parsing automata and item representations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-5 text-xs text-stone-700 leading-relaxed">
          {/* Section 1: Comparison Matrix */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-600" />
              1. Comparing SLR(1) vs. Canonical LR(1)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-[#E8DFD3]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8DFD3]">
                    <th className="p-2.5 font-bold text-stone-800">Feature</th>
                    <th className="p-2.5 font-bold text-sky-800 bg-sky-50/50">SLR(1) Mode</th>
                    <th className="p-2.5 font-bold text-pink-800 bg-pink-50/50">Canonical LR(1) Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD3] font-mono text-[11px]">
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-stone-700">Item Structure</td>
                    <td className="p-2.5 text-stone-800"><code>[A -&gt; α • β]</code> (LR(0) items)</td>
                    <td className="p-2.5 text-stone-800"><code>[A -&gt; α • β, a]</code> (with lookahead terminal)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-stone-700">Reduction Trigger</td>
                    <td className="p-2.5 text-stone-800">Any lookahead terminal in global <code>FOLLOW(A)</code></td>
                    <td className="p-2.5 text-stone-800">Only the precise propagated lookahead <code>a</code></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-stone-700">Total States (This Grammar)</td>
                    <td className="p-2.5 text-sky-700 font-bold">{PRECOMPUTED_SLR1_TABLE.stateCount} States</td>
                    <td className="p-2.5 text-pink-700 font-bold">{PRECOMPUTED_LR1_TABLE.stateCount} States (Lookahead split)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-stone-700">Conflict Freedom</td>
                    <td className="p-2.5 text-stone-800">May suffer shift/reduce conflicts if FOLLOW is too broad</td>
                    <td className="p-2.5 text-stone-800">Maximum predictive power for any deterministic CFG</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Grammar Stratification */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-stone-900">
              2. Unambiguous Arithmetic Grammar Productions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
              {GRAMMAR_RULES.map((r) => (
                <div
                  key={r.id}
                  className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFD3] flex items-center justify-between"
                >
                  <span className="text-stone-400">Rule {r.id}:</span>
                  <span className="font-bold text-stone-800">{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: FOLLOW Sets */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-stone-900">
              3. FOLLOW Sets (Used for SLR(1) Reductions)
            </h4>
            <div className="flex flex-wrap gap-2 font-mono">
              {Object.entries(FOLLOW_SETS).map(([nt, set]) => (
                <div
                  key={nt}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-900"
                >
                  FOLLOW({nt}) = {'{ '}{set.map((s) => `'${s}'`).join(', ')}{' }'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#F0EAE1] bg-[#FAF7F2] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
