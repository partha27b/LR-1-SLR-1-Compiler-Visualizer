/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Table, Sparkles, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { NON_TERMINALS, TERMINALS } from '../compiler/grammar';
import { GeneratedTable } from '../compiler/generator';

interface ParsingTableProps {
  tableConfig: GeneratedTable;
  currentState: number;
  currentLookaheadSymbol: string | null;
  activeGotoNonTerminal?: string | null;
}

export const ParsingTable: React.FC<ParsingTableProps> = ({
  tableConfig,
  currentState,
  currentLookaheadSymbol,
  activeGotoNonTerminal,
}) => {
  const [showStateItems, setShowStateItems] = useState(false);
  const states = Array.from({ length: tableConfig.stateCount }, (_, i) => i);
  const isLR1 = tableConfig.mode === 'LR1';

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 flex flex-col h-full shadow-xs">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-800">
                {isLR1 ? 'Canonical LR(1)' : 'SLR(1)'} Parsing Table
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                {tableConfig.stateCount} States
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              ACTION (Terminals) & GOTO (Non-Terminals) Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowStateItems((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-[#E0D7C9] rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            {showStateItems ? 'Hide Items' : 'Show State Items'}
            {showStateItems ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            <Sparkles className="w-3 h-3 text-sky-500" />
            Active: S{currentState}
          </span>
        </div>
      </div>

      {/* Optional State Items Drawer */}
      {showStateItems && (
        <div className="my-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] max-h-48 overflow-y-auto space-y-2">
          <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
            Active State {currentState} Items:
          </div>
          <div className="space-y-1 font-mono text-xs">
            {tableConfig.stateItems[currentState]?.map((itemStr, idx) => (
              <div
                key={idx}
                className="px-2 py-1 rounded bg-white border border-[#E5DDD2] text-stone-800"
              >
                {itemStr}
              </div>
            )) || <span className="text-stone-400">No items available</span>}
          </div>
        </div>
      )}

      {/* Table grid */}
      <div className="flex-1 overflow-auto pt-3">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DFD3]">
              <th
                rowSpan={2}
                className="py-2 px-2.5 font-bold text-stone-700 border-r border-[#E8DFD3] text-left"
              >
                State
              </th>
              <th
                colSpan={TERMINALS.length}
                className="py-1 px-2 font-bold text-sky-800 border-r border-[#E8DFD3] bg-sky-50/60"
              >
                ACTION
              </th>
              <th
                colSpan={NON_TERMINALS.length}
                className="py-1 px-2 font-bold text-pink-800 bg-pink-50/60"
              >
                GOTO
              </th>
            </tr>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DFD3] text-[11px] font-mono text-stone-600">
              {TERMINALS.map((t) => (
                <th
                  key={t}
                  className={`py-1.5 px-2 border-r border-[#E8DFD3] ${
                    currentLookaheadSymbol === t
                      ? 'bg-sky-100 text-sky-900 font-bold'
                      : ''
                  }`}
                >
                  {t}
                </th>
              ))}
              {NON_TERMINALS.map((nt) => (
                <th
                  key={nt}
                  className={`py-1.5 px-2 border-r last:border-r-0 border-[#E8DFD3] ${
                    activeGotoNonTerminal === nt
                      ? 'bg-pink-100 text-pink-900 font-bold'
                      : ''
                  }`}
                >
                  {nt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE1] font-mono text-[11px]">
            {states.map((s) => {
              const isCurrentRow = currentState === s;

              return (
                <tr
                  key={s}
                  className={`transition-colors ${
                    isCurrentRow
                      ? 'bg-sky-50/40 font-semibold text-stone-900'
                      : 'hover:bg-stone-50/70 text-stone-700'
                  }`}
                >
                  {/* State column */}
                  <td
                    className={`py-1.5 px-2.5 text-left border-r border-[#E8DFD3] font-bold ${
                      isCurrentRow
                        ? 'text-sky-700 bg-sky-100/50'
                        : 'text-stone-600'
                    }`}
                  >
                    {s}
                  </td>

                  {/* Action columns */}
                  {TERMINALS.map((t) => {
                    const action = tableConfig.actionTable[s]?.[t];
                    const isCellActive =
                      isCurrentRow && currentLookaheadSymbol === t;

                    let label = '';
                    let badgeClass = 'text-stone-400';

                    if (action) {
                      if (action.type === 'shift') {
                        label = `s${action.state}`;
                        badgeClass = 'text-sky-700 font-bold';
                      } else if (action.type === 'reduce') {
                        label = `r${action.ruleIndex}`;
                        badgeClass = 'text-pink-700 font-bold';
                      } else if (action.type === 'accept') {
                        label = 'acc';
                        badgeClass = 'text-emerald-700 font-bold';
                      }
                    }

                    return (
                      <td
                        key={t}
                        className={`py-1.5 px-1 border-r border-[#E8DFD3] transition-all ${
                          isCellActive
                            ? 'bg-sky-200/90 text-sky-950 font-black ring-2 ring-sky-400 ring-inset shadow-xs'
                            : ''
                        }`}
                      >
                        <span
                          className={
                            isCellActive ? 'text-sky-950 font-bold' : badgeClass
                          }
                        >
                          {label || '—'}
                        </span>
                      </td>
                    );
                  })}

                  {/* GOTO columns */}
                  {NON_TERMINALS.map((nt) => {
                    const gotoVal = tableConfig.gotoTable[s]?.[nt];
                    const isGotoActive =
                      isCurrentRow && activeGotoNonTerminal === nt;

                    return (
                      <td
                        key={nt}
                        className={`py-1.5 px-1 border-r last:border-r-0 border-[#E8DFD3] transition-all ${
                          isGotoActive
                            ? 'bg-pink-200/90 text-pink-950 font-black ring-2 ring-pink-400 ring-inset shadow-xs'
                            : ''
                        }`}
                      >
                        <span
                          className={
                            isGotoActive
                              ? 'text-pink-950 font-bold'
                              : gotoVal !== undefined
                              ? 'text-stone-800 font-semibold'
                              : 'text-stone-400'
                          }
                        >
                          {gotoVal !== undefined ? gotoVal : '—'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer key */}
      <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[11px] text-stone-500 font-mono flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-sky-700">sN</strong>: Shift & push State N
          </span>
          <span>
            <strong className="text-pink-700">rN</strong>: Reduce by Rule N
          </span>
          <span>
            <strong className="text-emerald-700">acc</strong>: Accept
          </span>
        </div>
        <div className="text-[10px] text-stone-400">
          {isLR1
            ? 'Canonical LR(1): Lookahead-propagated items'
            : 'SLR(1): LR(0) items with FOLLOW set reductions'}
        </div>
      </div>
    </div>
  );
};
