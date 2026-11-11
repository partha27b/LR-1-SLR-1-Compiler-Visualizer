/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, ArrowUp } from 'lucide-react';
import { StackItem } from '../compiler/types';

interface ParseStackProps {
  stack: StackItem[];
  recentCreatedNodeId?: string | null;
}

export const ParseStack: React.FC<ParseStackProps> = ({
  stack,
  recentCreatedNodeId,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 flex flex-col h-full shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800">Parse Stack</h3>
            <p className="text-[11px] text-stone-500 font-medium">
              LR Automaton State & Symbol Stack (Bottom to Top)
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
          Depth: {stack.length}
        </span>
      </div>

      {/* Stack Items visual list */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2 min-h-[220px]">
        {/* Render from top-of-stack down to bottom */}
        {[...stack].reverse().map((item, reverseIdx) => {
          const actualIdx = stack.length - 1 - reverseIdx;
          const isTop = actualIdx === stack.length - 1;
          const isBase = actualIdx === 0;
          const isRecentlyCreated =
            recentCreatedNodeId && item.nodeId === recentCreatedNodeId;

          return (
            <div
              key={`${actualIdx}-${item.state}-${item.symbol}`}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                isTop
                  ? 'bg-sky-50/90 border-sky-300 shadow-xs ring-1 ring-sky-200'
                  : isRecentlyCreated
                  ? 'bg-pink-50/90 border-pink-300'
                  : 'bg-[#FAF7F2] border-[#E8DFD3] hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* Index / Pointer tag */}
                <span className="text-[10px] font-mono font-bold text-stone-400 w-5 text-right">
                  #{actualIdx}
                </span>

                {/* State badge */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">
                    State
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md ${
                      isTop
                        ? 'bg-sky-600 text-white'
                        : 'bg-stone-200 text-stone-800'
                    }`}
                  >
                    {item.state}
                  </span>
                </div>

                {/* Grammar Symbol */}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[10px] uppercase font-bold text-stone-500">
                    Symbol
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg border ${
                      item.symbol === '$'
                        ? 'bg-stone-100 text-stone-600 border-stone-300'
                        : ['E', 'T', 'F'].includes(item.symbol)
                        ? 'bg-pink-100 text-pink-800 border-pink-300'
                        : 'bg-sky-100 text-sky-800 border-sky-300'
                    }`}
                  >
                    {item.symbol}
                  </span>
                </div>
              </div>

              {/* Node ID indicator & Top marker */}
              <div className="flex items-center gap-2">
                {item.nodeId && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E0D7C9] text-stone-600">
                    {item.nodeId}
                  </span>
                )}
                {isTop && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-200/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <ArrowUp className="w-2.5 h-2.5" /> TOP
                  </span>
                )}
                {isBase && (
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    BASE
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
