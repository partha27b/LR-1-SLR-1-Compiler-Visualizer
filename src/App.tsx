/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Layers,
  Table as TableIcon,
  BookOpen,
  GitFork,
  Sparkles,
  Info,
} from 'lucide-react';
import { parseExpression } from './compiler/engine';
import { ParserMode } from './compiler/types';
import { PRECOMPUTED_LR1_TABLE, PRECOMPUTED_SLR1_TABLE } from './compiler/generator';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { StepExplanation } from './components/StepExplanation';
import { ParseStack } from './components/ParseStack';
import { InputBufferTape } from './components/InputBufferTape';
import { ParseTreeVisualizer } from './components/ParseTreeVisualizer';
import { ParsingTable } from './components/ParsingTable';
import { GrammarRulesCard } from './components/GrammarRulesCard';
import { JsonTraceModal } from './components/JsonTraceModal';
import { AutomatedTestsModal } from './components/AutomatedTestsModal';
import { GrammarGuideModal } from './components/GrammarGuideModal';

export default function App() {
  const [expression, setExpression] = useState('id + id * id');
  const [parserMode, setParserMode] = useState<ParserMode>('SLR1');
  const [parseResult, setParseResult] = useState(() =>
    parseExpression('id + id * id', 'SLR1'),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Tab navigation for right panel
  const [activeTab, setActiveTab] = useState<'tree' | 'table' | 'grammar'>('tree');

  // Modals
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [isGrammarModalOpen, setIsGrammarModalOpen] = useState(false);

  // Re-run parse when expression or mode changes
  const handleParse = useCallback(
    (exprToParse?: string, targetMode?: ParserMode) => {
      const targetExpr = exprToParse ?? expression;
      const targetEngineMode = targetMode ?? parserMode;
      setIsPlaying(false);
      const result = parseExpression(targetExpr, targetEngineMode);
      setParseResult(result);
      setCurrentStepIndex(0);
    },
    [expression, parserMode],
  );

  const handleModeChange = useCallback(
    (newMode: ParserMode) => {
      setParserMode(newMode);
      handleParse(expression, newMode);
    },
    [expression, handleParse],
  );

  const trace = parseResult.trace;
  const currentStep = trace[currentStepIndex] || trace[0];

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1000 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= trace.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, trace.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentStepIndex((prev) => Math.min(trace.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentStepIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentStepIndex(trace.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trace.length]);

  // Determine current active rule for grammar highlight
  const activeRuleIndex = useMemo(() => {
    if (currentStep?.actionType === 'REDUCE' && currentStep.recentReduction) {
      const match = currentStep.actionDescription.match(/rule (\d+):/);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  }, [currentStep]);

  const topState = currentStep?.stack[currentStep.stack.length - 1]?.state ?? 0;
  const lookaheadSymbol = currentStep?.inputBuffer[0]?.symbol ?? null;

  const currentTableConfig =
    parserMode === 'LR1' ? PRECOMPUTED_LR1_TABLE : PRECOMPUTED_SLR1_TABLE;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 flex flex-col font-sans">
      {/* Header */}
      <Header
        mode={parserMode}
        onOpenJsonTrace={() => setIsJsonModalOpen(true)}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
        onOpenGrammarGuide={() => setIsGrammarModalOpen(true)}
        totalSteps={trace.length}
        currentStepIndex={currentStepIndex}
      />

      {/* Control Bar: Mode Toggle, Input, Presets, Playback */}
      <ControlBar
        inputExpression={expression}
        onInputChange={(val) => {
          setExpression(val);
        }}
        onParse={(newExpr, targetMode) => handleParse(newExpr, targetMode)}
        mode={parserMode}
        onChangeMode={handleModeChange}
        stateCount={currentTableConfig.stateCount}
        currentStepIndex={currentStepIndex}
        totalSteps={trace.length}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onFirstStep={() => setCurrentStepIndex(0)}
        onPrevStep={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
        onNextStep={() =>
          setCurrentStepIndex((p) => Math.min(trace.length - 1, p + 1))
        }
        onLastStep={() => setCurrentStepIndex(trace.length - 1)}
        onSeekStep={(idx) => setCurrentStepIndex(idx)}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        isAccepted={parseResult.success}
        hasError={!parseResult.success}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Step Explanation Banner */}
        <StepExplanation step={currentStep} totalSteps={trace.length} />

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Stack & Input Buffer (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Input Buffer Tape */}
            <InputBufferTape
              inputBuffer={currentStep.inputBuffer}
              allTokensCount={parseResult.tokens.length}
            />

            {/* Parse Stack */}
            <div className="min-h-[380px]">
              <ParseStack
                stack={currentStep.stack}
                recentCreatedNodeId={currentStep.recentReduction?.createdNodeId}
              />
            </div>
          </div>

          {/* Right Column: Interactive Tabs for Tree, Parsing Table, and Grammar (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Tab Selector */}
            <div className="flex items-center justify-between border-b border-[#E8DFD3] pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('tree')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'tree'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <GitFork className="w-3.5 h-3.5" />
                  Parse Tree / Forest
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'table'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  {parserMode === 'LR1' ? 'LR(1)' : 'SLR(1)'} Table ({currentTableConfig.stateCount} states)
                </button>
                <button
                  onClick={() => setActiveTab('grammar')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'grammar'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Grammar Rules
                </button>
              </div>

              <div className="text-[11px] text-stone-500 font-mono hidden sm:block">
                Use <kbd className="px-1 py-0.5 bg-white border border-[#E0D7C9] rounded">←</kbd>{' '}
                <kbd className="px-1 py-0.5 bg-white border border-[#E0D7C9] rounded">→</kbd> to step,{' '}
                <kbd className="px-1 py-0.5 bg-white border border-[#E0D7C9] rounded">Space</kbd> to play
              </div>
            </div>

            {/* Active Tab Panel */}
            <div className="min-h-[500px]">
              {activeTab === 'tree' && (
                <ParseTreeVisualizer
                  forest={currentStep.parseForest}
                  recentReduction={currentStep.recentReduction}
                  isAccepted={
                    currentStepIndex === trace.length - 1 && parseResult.success
                  }
                />
              )}

              {activeTab === 'table' && (
                <ParsingTable
                  tableConfig={currentTableConfig}
                  currentState={topState}
                  currentLookaheadSymbol={lookaheadSymbol}
                  activeGotoNonTerminal={
                    currentStep.recentReduction
                      ? currentStep.recentReduction.rule.split('->')[0].trim()
                      : null
                  }
                />
              )}

              {activeTab === 'grammar' && (
                <GrammarRulesCard activeRuleIndex={activeRuleIndex} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <JsonTraceModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        trace={trace}
        currentStepIndex={currentStepIndex}
      />

      <AutomatedTestsModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
        currentMode={parserMode}
        onSelectExpression={(newExpr, mode) => {
          setExpression(newExpr);
          setParserMode(mode);
          handleParse(newExpr, mode);
        }}
      />

      <GrammarGuideModal
        isOpen={isGrammarModalOpen}
        onClose={() => setIsGrammarModalOpen(false)}
      />
    </div>
  );
}
