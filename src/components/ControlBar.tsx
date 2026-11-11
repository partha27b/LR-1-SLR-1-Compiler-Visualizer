/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { ParserMode } from '../compiler/types';

interface PresetItem {
  label: string;
  expression: string;
  tag: string;
}

const PRESETS: PresetItem[] = [
  { label: 'Standard Precedence', expression: 'id + id * id', tag: 'Test 1' },
  { label: 'Parentheses Override', expression: '( id + id ) * id', tag: 'Test 2' },
  { label: 'Syntax Error', expression: 'id + * id', tag: 'Test 3' },
  { label: 'Arithmetic Numbers', expression: '3 + 4 * 2', tag: 'Numbers' },
  { label: 'Variables', expression: 'a * ( b + c )', tag: 'Vars' },
];

interface ControlBarProps {
  inputExpression: string;
  onInputChange: (val: string) => void;
  onParse: (expr?: string, targetMode?: ParserMode) => void;
  mode: ParserMode;
  onChangeMode: (mode: ParserMode) => void;
  stateCount: number;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onFirstStep: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onLastStep: () => void;
  onSeekStep: (stepIndex: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  isAccepted: boolean;
  hasError: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  inputExpression,
  onInputChange,
  onParse,
  mode,
  onChangeMode,
  stateCount,
  currentStepIndex,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onFirstStep,
  onPrevStep,
  onNextStep,
  onLastStep,
  onSeekStep,
  playbackSpeed,
  onChangeSpeed,
  isAccepted,
  hasError,
}) => {
  const [localInput, setLocalInput] = useState(inputExpression);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localInput.trim()) {
      onInputChange(localInput.trim());
      onParse(localInput.trim(), mode);
    }
  };

  const handleSelectPreset = (preset: PresetItem) => {
    setLocalInput(preset.expression);
    onInputChange(preset.expression);
    onParse(preset.expression, mode);
  };

  return (
    <div className="bg-[#FAF7F2] border-b border-[#E8DFD3] px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Top row: Mode Selector & Expression Input */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Parser Mode Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Cpu className="w-3.5 h-3.5 text-sky-600" /> Mode:
            </span>
            <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl border border-[#E0D7C9]">
              <button
                type="button"
                onClick={() => onChangeMode('SLR1')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'SLR1'
                    ? 'bg-white text-stone-900 shadow-2xs border border-[#E0D7C9]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Simple LR(1) with LR(0) items and FOLLOW sets (12 states)"
              >
                SLR(1) <span className="text-[10px] text-stone-400 font-normal">(12 states)</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeMode('LR1')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'LR1'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Canonical LR(1) with propagated lookahead sets"
              >
                Canonical LR(1){' '}
                <span className={`text-[10px] font-normal ${mode === 'LR1' ? 'text-sky-100' : 'text-stone-400'}`}>
                  ({stateCount} states)
                </span>
              </button>
            </div>
          </div>

          {/* Expression Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex items-center gap-2 max-w-xl"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                placeholder="Enter expression (e.g. id + id * id, 3 + 4 * 2)"
                className="w-full bg-white border border-[#E0D7C9] focus:border-sky-400 focus:ring-2 focus:ring-sky-100 rounded-xl px-3.5 py-2 text-sm font-mono text-stone-800 placeholder-stone-400 shadow-2xs outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Parse & Trace
            </button>
          </form>
        </div>

        {/* Second row: Presets & Playback controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-medium text-stone-500 whitespace-nowrap mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-400" /> Presets:
            </span>
            {PRESETS.map((p) => {
              const active = inputExpression === p.expression;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono font-medium transition-all whitespace-nowrap border ${
                    active
                      ? 'bg-sky-100 border-sky-300 text-sky-800 shadow-xs'
                      : 'bg-white hover:bg-[#F5EFEB] border-[#E8DFD3] text-stone-700'
                  }`}
                >
                  <span className="text-[10px] text-pink-500 font-sans font-semibold mr-1">
                    {p.tag}
                  </span>
                  {p.expression}
                </button>
              );
            })}
          </div>

          {/* Player controls */}
          <div className="bg-white rounded-xl border border-[#E8DFD3] p-2 sm:px-3 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-1">
              <button
                onClick={onFirstStep}
                disabled={currentStepIndex === 0}
                className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-35 disabled:hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                title="First step"
                aria-label="First step"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onPrevStep}
                disabled={currentStepIndex === 0}
                className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-35 disabled:hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                title="Previous step"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onTogglePlay}
                disabled={currentStepIndex >= totalSteps - 1 && !isPlaying}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all ${
                  isPlaying
                    ? 'bg-pink-500 text-white hover:bg-pink-600'
                    : 'bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40'
                }`}
                title={isPlaying ? 'Pause trace' : 'Auto-play trace'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Play
                  </>
                )}
              </button>

              <button
                onClick={onNextStep}
                disabled={currentStepIndex >= totalSteps - 1}
                className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-35 disabled:hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                title="Next step"
                aria-label="Next step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLastStep}
                disabled={currentStepIndex >= totalSteps - 1}
                className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-35 disabled:hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                title="Last step"
                aria-label="Last step"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              {/* Speed toggle */}
              <div className="flex items-center ml-2 border-l border-stone-200 pl-2 gap-1 text-[11px] font-medium text-stone-500">
                <span>Speed:</span>
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => onChangeSpeed(s)}
                    className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                      playbackSpeed === s
                        ? 'bg-sky-100 text-sky-800 font-bold'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scrubber slider */}
            <div className="flex items-center gap-2 min-w-[170px]">
              <span className="text-[11px] font-mono font-medium text-stone-500 whitespace-nowrap">
                <span className="text-stone-900 font-bold">{currentStepIndex + 1}</span>/
                <span className="text-stone-700">{totalSteps}</span>
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(0, totalSteps - 1)}
                value={currentStepIndex}
                onChange={(e) => onSeekStep(Number(e.target.value))}
                className="flex-1 accent-sky-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
