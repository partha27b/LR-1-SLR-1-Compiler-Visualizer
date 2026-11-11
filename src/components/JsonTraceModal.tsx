/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Copy, Download, X, Code2 } from 'lucide-react';
import { TraceStep } from '../compiler/types';

interface JsonTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace: TraceStep[];
  currentStepIndex: number;
}

export const JsonTraceModal: React.FC<JsonTraceModalProps> = ({
  isOpen,
  onClose,
  trace,
  currentStepIndex,
}) => {
  const [viewMode, setViewMode] = useState<'current' | 'all'>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const dataToDisplay =
    viewMode === 'current' ? trace[currentStepIndex] ?? {} : trace;
  const jsonString = JSON.stringify(dataToDisplay, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compiler-trace-${viewMode === 'current' ? `step-${currentStepIndex}` : 'full'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E8DFD3] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#F0EAE1] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                JSON Trace Contract Inspector
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Conforms strictly to TraceStep JSON schema specifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg bg-stone-200/70 p-0.5 text-xs font-medium">
              <button
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-stone-900 font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Steps ({trace.length})
              </button>
              <button
                onClick={() => setViewMode('current')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'current'
                    ? 'bg-white text-stone-900 font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Current Step (#{currentStepIndex})
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-[#E0D7C9] rounded-lg shadow-2xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  Copy JSON
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors ml-2"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal JSON Body */}
        <div className="flex-1 overflow-auto p-4 bg-[#1E1E24] text-stone-200 font-mono text-xs leading-relaxed selection:bg-sky-900">
          <pre>{jsonString}</pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#F0EAE1] bg-[#FAF7F2] flex items-center justify-between text-xs text-stone-500">
          <span>
            Schema keys: <code className="text-sky-700 font-bold">stepIndex</code>,{' '}
            <code className="text-sky-700 font-bold">actionType</code>,{' '}
            <code className="text-sky-700 font-bold">stack</code>,{' '}
            <code className="text-sky-700 font-bold">inputBuffer</code>,{' '}
            <code className="text-sky-700 font-bold">parseForest</code>,{' '}
            <code className="text-sky-700 font-bold">recentReduction</code>
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
