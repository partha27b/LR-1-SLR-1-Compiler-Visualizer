/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDown, Disc } from 'lucide-react';
import { InputBufferItem } from '../compiler/types';

interface InputBufferTapeProps {
  inputBuffer: InputBufferItem[];
  allTokensCount: number;
}

export const InputBufferTape: React.FC<InputBufferTapeProps> = ({
  inputBuffer,
  allTokensCount,
}) => {
  const lookahead = inputBuffer[0];
  const consumedCount = Math.max(0, allTokensCount - inputBuffer.length);

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
            <Disc className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800">Input Buffer Tape</h3>
            <p className="text-[11px] text-stone-500 font-medium">
              Lookahead Token (Head) & Remaining Unconsumed Input
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-400">Consumed: {consumedCount}</span>
          <span className="font-semibold text-stone-700">
            Remaining: {inputBuffer.length}
          </span>
        </div>
      </div>

      {/* Token Tape Ribbon */}
      <div className="pt-3">
        {inputBuffer.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-400 italic bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8DFD3]">
            Input stream empty (All tokens consumed)
          </div>
        ) : (
          <div className="flex items-start gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {inputBuffer.map((item, idx) => {
              const isLookahead = idx === 0;

              return (
                <div key={`${item.index}-${item.symbol}`} className="flex flex-col items-center">
                  {/* Lookahead pointer arrow */}
                  <div className="h-4 flex items-center justify-center mb-1">
                    {isLookahead && (
                      <span className="flex items-center text-[10px] font-bold text-sky-600 animate-bounce">
                        <ArrowDown className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Token Box */}
                  <div
                    className={`min-w-[56px] px-3 py-2 rounded-xl text-center border transition-all ${
                      isLookahead
                        ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200 shadow-xs'
                        : 'bg-[#FAF7F2] border-[#E8DFD3] hover:border-stone-300'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-stone-400">
                      idx:{item.index}
                    </div>
                    <div
                      className={`text-sm font-mono font-bold mt-0.5 ${
                        isLookahead ? 'text-sky-800' : 'text-stone-700'
                      }`}
                    >
                      {item.symbol}
                    </div>
                    {item.value && item.value !== item.symbol && (
                      <div className="text-[10px] font-mono text-stone-500 truncate max-w-[60px]" title={item.value}>
                        "{item.value}"
                      </div>
                    )}
                  </div>

                  {/* Lookahead Label */}
                  <div className="h-4 flex items-center justify-center mt-1">
                    {isLookahead && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-1 rounded">
                        Lookahead
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
