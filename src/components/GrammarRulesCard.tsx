/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen } from 'lucide-react';
import { GRAMMAR_RULES, FOLLOW_SETS } from '../compiler/grammar';

interface GrammarRulesCardProps {
  activeRuleIndex?: number | null;
}

export const GrammarRulesCard: React.FC<GrammarRulesCardProps> = ({
  activeRuleIndex,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 flex flex-col h-full shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800">
              Grammar & Precedence
            </h3>
            <p className="text-[11px] text-stone-500 font-medium">
              Unambiguous Arithmetic Grammar & FOLLOW Sets
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
          6 Productions
        </span>
      </div>

      {/* Rules list */}
      <div className="pt-3 space-y-1.5 flex-1 overflow-y-auto">
        {GRAMMAR_RULES.map((rule) => {
          const isActive = activeRuleIndex === rule.id;

          return (
            <div
              key={rule.id}
              className={`px-3 py-2 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                isActive
                  ? 'bg-pink-100/90 border-pink-400 text-pink-900 font-bold ring-2 ring-pink-200 shadow-2xs'
                  : 'bg-[#FAF7F2] border-[#E8DFD3] text-stone-700 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-bold w-4">
                  #{rule.id}
                </span>
                <span className="font-semibold">{rule.text}</span>
              </div>
              {isActive && (
                <span className="text-[10px] font-sans font-bold text-pink-700 bg-pink-200 px-1.5 py-0.5 rounded">
                  Current Reduction
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* FOLLOW Sets & Precedence Note */}
      <div className="pt-3 mt-2 border-t border-[#F0EAE1] space-y-2">
        <div>
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            FOLLOW Sets (SLR Reductions)
          </span>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {Object.entries(FOLLOW_SETS).map(([nt, set]) => (
              <span
                key={nt}
                className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200"
              >
                <strong>FOLLOW({nt})</strong> = {'{'}{' '}
                {set.map((s) => `'${s}'`).join(', ')} {'}'}
              </span>
            ))}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-[11px] text-stone-600">
          <strong className="text-stone-800">Precedence Hierarchy:</strong>{' '}
          <span className="text-pink-700 font-semibold">(E) & id</span> (highest) &gt;{' '}
          <span className="text-sky-700 font-semibold">T * F</span> (intermediate) &gt;{' '}
          <span className="text-stone-700 font-semibold">E + T</span> (lowest, left-associative).
        </div>
      </div>
    </div>
  );
};
